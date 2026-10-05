import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerInstance } from '../entities/server-instance.entity';
import { ServerConfig } from '../entities/server-config.entity';
import { DockerService } from '../docker/docker.service';
import { RconService } from '../rcon/rcon.service';

// Chỉ cho phép đọc/ghi đúng 3 file này — đây chính là cơ chế chống path traversal:
// vì API không bao giờ nhận đường dẫn tuỳ ý từ người dùng, chỉ nhận 1 trong 3 tên cố định
// bên dưới rồi tự ghép đường dẫn tuyệt đối phía backend, nên không có cách nào để client
// truyền vào path dạng "../../etc/passwd" hay tương tự.
export const ALLOWED_FILES = ['server.properties', 'whitelist.json', 'ops.json'] as const;
export type AllowedFile = (typeof ALLOWED_FILES)[number];

const DATA_DIR = '/data'; // thư mục dữ liệu cố định bên trong container itzg/minecraft-server

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(ServerInstance)
    private readonly serverRepo: Repository<ServerInstance>,
    @InjectRepository(ServerConfig)
    private readonly configRepo: Repository<ServerConfig>,
    private readonly dockerService: DockerService,
    private readonly rconService: RconService,
  ) {}

  listAllowedFiles(): readonly string[] {
    return ALLOWED_FILES;
  }

  async getFileContent(
    serverId: string,
    ownerId: string,
    filename: string,
  ): Promise<string> {
    const server = await this.findOwnedServerWithContainer(serverId, ownerId);
    this.assertAllowedFile(filename);

    try {
      return await this.dockerService.readFileFromContainer(
        server.containerId!,
        `${DATA_DIR}/${filename}`,
      );
    } catch (err) {
      // whitelist.json/ops.json có thể chưa tồn tại nếu chưa từng bật whitelist/chưa có op nào —
      // trả về nội dung rỗng hợp lệ (mảng JSON rỗng) thay vì lỗi, để UI vẫn hiển thị được form sửa
      if (filename !== 'server.properties') {
        return '[]';
      }
      throw new BadRequestException(
        `Không đọc được file ${filename}: ${(err as Error).message}`,
      );
    }
  }

  async updateFileContent(
    serverId: string,
    ownerId: string,
    filename: string,
    content: string,
  ): Promise<void> {
    const server = await this.findOwnedServerWithContainer(serverId, ownerId);
    this.assertAllowedFile(filename);
    this.validateContentFormat(filename, content);

    await this.dockerService.writeFileToContainer(
      server.containerId!,
      DATA_DIR,
      filename,
      content,
    );

    // whitelist.json có thể áp dụng ngay mà không cần restart server, thông qua lệnh RCON có sẵn
    // của Minecraft. ops.json và server.properties Minecraft chỉ đọc lại lúc khởi động server,
    // nên cần người dùng tự restart server sau khi sửa 2 file đó (báo rõ ở response cho FE hiển thị).
    if (filename === 'whitelist.json' && server.status === 'running') {
      try {
        await this.rconService.sendCommand(
          'localhost',
          server.rconPort,
          server.rconPassword,
          'whitelist reload',
        );
      } catch {
        // Không chặn việc lưu file nếu riêng lệnh reload thất bại — file trên container vẫn đã được cập nhật đúng
      }
    }

    // File Browser cho phép sửa server.properties trực tiếp, tách biệt hoàn toàn khỏi DB —
    // nếu không đồng bộ lại, tab Tổng quan (đọc từ bảng server_configs) sẽ hiển thị sai lệch
    // so với cấu hình thật đang chạy trong container. Đọc lại các trường quan trọng và ghi đè DB.
    if (filename === 'server.properties') {
      await this.syncConfigFromProperties(server.id, content);
    }
  }

  private async syncConfigFromProperties(serverId: string, content: string): Promise<void> {
    const props = this.parseProperties(content);
    const config = await this.configRepo.findOne({ where: { serverId } });
    if (!config) return; // không có config tương ứng (trường hợp hiếm) — bỏ qua, không chặn việc lưu file

    if (props['difficulty']) config.difficulty = props['difficulty'];
    if (props['gamemode']) config.gameMode = props['gamemode'];
    if (props['max-players'] && !Number.isNaN(Number(props['max-players']))) {
      config.maxPlayers = Number(props['max-players']);
    }
    if (props['white-list'] === 'true' || props['white-list'] === 'false') {
      config.whitelistEnabled = props['white-list'] === 'true';
    }

    await this.configRepo.save(config);
  }

  // server.properties là định dạng key=value đơn giản (chuẩn Java .properties), mỗi dòng 1 cặp,
  // dòng bắt đầu bằng "#" là comment nên bỏ qua
  private parseProperties(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      result[key] = value;
    }
    return result;
  }

  needsRestartToApply(filename: string): boolean {
    return filename === 'server.properties' || filename === 'ops.json';
  }

  private async findOwnedServerWithContainer(
    serverId: string,
    ownerId: string,
  ): Promise<ServerInstance> {
    const server = await this.serverRepo.findOne({ where: { id: serverId } });
    if (!server) throw new NotFoundException('Không tìm thấy server');
    if (server.ownerId !== ownerId) {
      throw new ForbiddenException('Bạn không có quyền với server này');
    }
    if (!server.containerId) {
      throw new BadRequestException('Server chưa có container (đang tạo hoặc bị lỗi)');
    }
    return server;
  }

  private assertAllowedFile(filename: string): asserts filename is AllowedFile {
    if (!ALLOWED_FILES.includes(filename as AllowedFile)) {
      throw new BadRequestException(
        `Chỉ được phép truy cập: ${ALLOWED_FILES.join(', ')}`,
      );
    }
  }

  // Kiểm tra sơ bộ định dạng trước khi ghi — tránh ghi 1 file JSON hỏng làm Minecraft server crash lúc khởi động lại
  private validateContentFormat(filename: string, content: string): void {
    if (filename === 'whitelist.json' || filename === 'ops.json') {
      try {
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          throw new Error('Phải là một mảng JSON (kể cả khi rỗng: [])');
        }
      } catch (err) {
        throw new BadRequestException(
          `Nội dung ${filename} không phải JSON hợp lệ: ${(err as Error).message}`,
        );
      }
    }
    // server.properties là dạng key=value tự do, không có schema cố định để validate chặt hơn
  }
}
