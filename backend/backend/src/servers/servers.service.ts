import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  ServerInstance,
  ServerStatus,
} from '../entities/server-instance.entity';
import { ServerConfig } from '../entities/server-config.entity';
import {
  ServerLogMeta,
  LogEventType,
} from '../entities/server-log-meta.entity';
import { DockerService } from '../docker/docker.service';
import { RconService } from '../rcon/rcon.service';
import { CreateServerDto } from './dto/create-server.dto';

// Dải cổng dành riêng cho các server Minecraft, tránh đụng cổng hệ thống khác trên máy chủ
const GAME_PORT_RANGE = { min: 25565, max: 25664 };
const RCON_PORT_RANGE = { min: 25765, max: 25864 };

@Injectable()
export class ServersService {
  constructor(
    @InjectRepository(ServerInstance)
    private readonly serverRepo: Repository<ServerInstance>,
    @InjectRepository(ServerConfig)
    private readonly configRepo: Repository<ServerConfig>,
    @InjectRepository(ServerLogMeta)
    private readonly logRepo: Repository<ServerLogMeta>,
    private readonly dockerService: DockerService,
    private readonly rconService: RconService,
  ) {}

  async create(ownerId: string, dto: CreateServerDto): Promise<ServerInstance> {
    const gamePort = await this.allocatePort(GAME_PORT_RANGE, 'gamePort');
    const rconPort = await this.allocatePort(RCON_PORT_RANGE, 'rconPort');
    const rconPassword = crypto.randomBytes(12).toString('hex');

    const server = this.serverRepo.create({
      ownerId,
      name: dto.name,
      minecraftVersion: dto.minecraftVersion,
      edition: dto.edition,
      gamePort,
      rconPort,
      rconPassword,
      status: ServerStatus.CREATING,
      containerId: null,
    });
    await this.serverRepo.save(server);

    const config = this.configRepo.create({
      serverId: server.id,
      maxRamMb: dto.maxRamMb,
      maxPlayers: dto.maxPlayers,
      difficulty: dto.difficulty,
      gameMode: dto.gameMode,
      whitelistEnabled: dto.whitelistEnabled,
      extraProperties: {},
    });
    await this.configRepo.save(config);

    // Tạo container bất đồng bộ để không block request HTTP — trạng thái cập nhật qua polling/WebSocket
    this.provisionContainer(server, config).catch(async (err) => {
      server.status = ServerStatus.ERROR;
      await this.serverRepo.save(server);
      await this.addLog(server.id, LogEventType.ERROR, err.message);
    });

    return server;
  }

  private async provisionContainer(
    server: ServerInstance,
    config: ServerConfig,
  ) {
    const containerId = await this.dockerService.createAndStartServer({
      containerName: `mc-${server.id}`,
      minecraftVersion: server.minecraftVersion,
      edition: server.edition,
      gamePort: server.gamePort,
      rconPort: server.rconPort,
      rconPassword: server.rconPassword,
      maxRamMb: config.maxRamMb,
      maxPlayers: config.maxPlayers,
      difficulty: config.difficulty,
      gameMode: config.gameMode,
      whitelistEnabled: config.whitelistEnabled,
      extraProperties: config.extraProperties,
    });

    server.containerId = containerId;
    server.status = ServerStatus.RUNNING;
    await this.serverRepo.save(server);
    await this.addLog(server.id, LogEventType.START, 'Server đã được tạo và khởi động');
  }

  async findAllByOwner(ownerId: string): Promise<ServerInstance[]> {
    return this.serverRepo.find({
      where: { ownerId },
      relations: ['config'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneOwned(id: string, ownerId: string): Promise<ServerInstance> {
    const server = await this.serverRepo.findOne({
      where: { id },
      relations: ['config'],
    });
    if (!server) throw new NotFoundException('Không tìm thấy server');
    if (server.ownerId !== ownerId) {
      throw new ForbiddenException('Bạn không có quyền với server này');
    }
    return server;
  }

  async stop(id: string, ownerId: string): Promise<void> {
    const server = await this.findOneOwned(id, ownerId);
    this.assertHasContainer(server);
    await this.dockerService.stopServer(server.containerId!);
    server.status = ServerStatus.STOPPED;
    await this.serverRepo.save(server);
    await this.addLog(server.id, LogEventType.STOP, 'Server đã dừng');
  }

  async start(id: string, ownerId: string): Promise<void> {
    const server = await this.findOneOwned(id, ownerId);
    this.assertHasContainer(server);
    await this.dockerService.startServer(server.containerId!);
    server.status = ServerStatus.RUNNING;
    await this.serverRepo.save(server);
    await this.addLog(server.id, LogEventType.START, 'Server đã khởi động lại');
  }

  async restart(id: string, ownerId: string): Promise<void> {
    const server = await this.findOneOwned(id, ownerId);
    this.assertHasContainer(server);
    server.status = ServerStatus.RESTARTING;
    await this.serverRepo.save(server);
    await this.dockerService.restartServer(server.containerId!);
    server.status = ServerStatus.RUNNING;
    await this.serverRepo.save(server);
    await this.addLog(server.id, LogEventType.RESTART, 'Server đã restart');
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const server = await this.findOneOwned(id, ownerId);
    server.status = ServerStatus.DELETING;
    await this.serverRepo.save(server);
    if (server.containerId) {
      await this.dockerService.removeServer(server.containerId, `mc-${server.id}`);
    }
    await this.serverRepo.remove(server);
  }

  async getStats(id: string, ownerId: string) {
    const server = await this.findOneOwned(id, ownerId);
    this.assertHasContainer(server);
    return this.dockerService.getStats(server.containerId!);
  }

  // Gửi lệnh console qua RCON — dùng cho các lệnh như /whitelist, /op, /say...
  async execCommand(
    id: string,
    ownerId: string,
    command: string,
  ): Promise<string> {
    const server = await this.findOneOwned(id, ownerId);
    if (server.status !== ServerStatus.RUNNING) {
      throw new BadRequestException('Server phải đang chạy để gửi lệnh');
    }
    let response: string;
    try {
      response = await this.rconService.sendCommand(
        'localhost', // cùng máy chủ Docker host với backend (kiến trúc single-node)
        server.rconPort,
        server.rconPassword,
        command,
      );
    } catch (err) {
      // Không để lỗi RCON (mất kết nối, timeout, sai mật khẩu...) lọt ra thành lỗi 500 chung
      // chung không rõ nghĩa — bọc lại thành lỗi 400 kèm thông điệp cụ thể để FE hiển thị đúng
      // nguyên nhân, đồng thời vẫn ghi log lại để dễ truy vết sau này.
      await this.addLog(
        server.id,
        LogEventType.ERROR,
        `Gửi lệnh RCON thất bại: ${(err as Error).message}`,
      );
      throw new BadRequestException(
        `Không gửi được lệnh tới server (RCON): ${(err as Error).message}`,
      );
    }
    await this.addLog(server.id, LogEventType.COMMAND, `> ${command}\n${response}`);
    return response;
  }

  private async addLog(
    serverId: string,
    eventType: LogEventType,
    message: string,
  ) {
    const log = this.logRepo.create({ serverId, eventType, message });
    await this.logRepo.save(log);
  }

  private assertHasContainer(server: ServerInstance) {
    if (!server.containerId) {
      throw new BadRequestException('Server chưa được tạo xong (đang ở trạng thái creating/error)');
    }
  }

  // Dò cổng trống trong dải cho phép, tránh cấp trùng cổng giữa các server đang tồn tại
  private async allocatePort(
    range: { min: number; max: number },
    column: 'gamePort' | 'rconPort',
  ): Promise<number> {
    const dbColumn = column === 'gamePort' ? 'game_port' : 'rcon_port';
    const used = await this.serverRepo
      .createQueryBuilder('s')
      .select(`s.${dbColumn}`, 'port')
      .getRawMany();
    const usedPorts = new Set(used.map((u) => u.port));

    for (let port = range.min; port <= range.max; port++) {
      if (!usedPorts.has(port)) return port;
    }
    throw new BadRequestException('Đã hết cổng trống, không thể tạo thêm server');
  }
}
