import { Injectable, Logger } from '@nestjs/common';
import * as Docker from 'dockerode';
import * as tar from 'tar-stream';

export interface CreateMinecraftContainerParams {
  containerName: string;
  minecraftVersion: string;
  edition: string; // vanilla | paper | forge | fabric
  gamePort: number;
  rconPort: number;
  rconPassword: string;
  maxRamMb: number;
  maxPlayers: number;
  difficulty: string;
  gameMode: string;
  whitelistEnabled: boolean;
  extraProperties: Record<string, string | number | boolean>;
}

const MINECRAFT_IMAGE = 'itzg/minecraft-server:latest';

@Injectable()
export class DockerService {
  private readonly logger = new Logger(DockerService.name);
  private readonly docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  async createAndStartServer(
    params: CreateMinecraftContainerParams,
  ): Promise<string> {
    const env = this.buildEnvVars(params);
    const volumeName = this.getVolumeName(params.containerName);

    await this.docker.createVolume({ Name: volumeName });

    const container = await this.docker.createContainer({
      name: params.containerName,
      Image: MINECRAFT_IMAGE,
      Env: env,
      ExposedPorts: {
        '25565/tcp': {},
        '25575/tcp': {},
      },
      HostConfig: {
        PortBindings: {
          '25565/tcp': [{ HostPort: String(params.gamePort) }],
          '25575/tcp': [{ HostPort: String(params.rconPort) }],
        },
        Binds: [`${volumeName}:/data`],
        Memory: params.maxRamMb * 1024 * 1024,
        RestartPolicy: { Name: 'unless-stopped' },
      },
    });

    await container.start();

    this.logger.log(
      `Đã tạo và khởi động container ${container.id} (volume: ${volumeName})`,
    );

    return container.id;
  }

  async stopServer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.stop();
  }

  async startServer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.start();
  }

  async restartServer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.restart();
  }

  async removeServer(
    containerId: string,
    containerName: string,
  ): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.remove({ force: true });

    try {
      const volume = this.docker.getVolume(
        this.getVolumeName(containerName),
      );

      await volume.remove();
    } catch (err) {
      this.logger.warn(
        `Không xoá được volume cho ${containerName}: ${
          (err as Error).message
        }`,
      );
    }
  }

  async getStats(containerId: string) {
    const container = this.docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });

    return this.parseStats(stats);
  }

  async getLogStream(containerId: string) {
    const container = this.docker.getContainer(containerId);

    return container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      tail: 100,
    });
  }

  // Đọc file bên trong container bằng Docker Archive API
  async readFileFromContainer(
    containerId: string,
    filePath: string,
  ): Promise<string> {
    const container = this.docker.getContainer(containerId);

    const stream = await container.getArchive({
      path: filePath,
    });

    return new Promise((resolve, reject) => {
      const extract = tar.extract();
      let content = '';

      // Không tự khai báo kiểu cho entryStream (trước đây gán NodeJS.ReadableStream gây lỗi
      // type vì tar-stream dùng kiểu Source riêng, thiếu vài thuộc tính so với
      // NodeJS.ReadableStream) — để TypeScript tự suy ra đúng kiểu từ chính tar-stream.
      extract.on('entry', (header, entryStream, next) => {
        entryStream.on('data', (chunk: Buffer) => {
          content += chunk.toString('utf8');
        });
        entryStream.on('end', next);
        entryStream.resume();
      });

      extract.on('finish', () => resolve(content));
      extract.on('error', reject);
      stream.on('error', reject);

      stream.pipe(extract);
    });
  }

  // Ghi file vào container bằng Docker Archive API.
  // File được tạo với uid/gid 1000 để Minecraft user có quyền ghi.
  // Gộp hết stream thành 1 Buffer trước khi gửi (thay vì gửi thẳng stream cho putArchive) để
  // có Content-Length rõ ràng — tránh lỗi chunked transfer hay gặp khi giao tiếp qua named pipe
  // của Docker Desktop trên Windows.
  async writeFileToContainer(
    containerId: string,
    dirPath: string,
    fileName: string,
    content: string,
  ): Promise<void> {
    const container = this.docker.getContainer(containerId);

    const pack = tar.pack();

    pack.entry(
      {
        name: fileName,
        uid: 1000,
        gid: 1000,
        mode: 0o644,
      },
      content,
    );

    pack.finalize();

    const chunks: Buffer[] = [];

    for await (const chunk of pack) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any));
    }

    const archive = Buffer.concat(chunks);

    await container.putArchive(archive, {
      path: dirPath,
    });
  }

  private getVolumeName(containerName: string): string {
    return `${containerName}-data`;
  }

  private buildEnvVars(
    params: CreateMinecraftContainerParams,
  ): string[] {
    const env = [
      'EULA=TRUE',
      `TYPE=${params.edition.toUpperCase()}`,
      `VERSION=${params.minecraftVersion}`,
      `MEMORY=${params.maxRamMb}M`,
      `MAX_PLAYERS=${params.maxPlayers}`,
      `DIFFICULTY=${params.difficulty}`,
      `MODE=${params.gameMode}`,
      `ENABLE_WHITELIST=${params.whitelistEnabled}`,
      'ENABLE_RCON=true',
      `RCON_PASSWORD=${params.rconPassword}`,
      'RCON_PORT=25575',
    ];

    for (const [key, value] of Object.entries(
      params.extraProperties || {},
    )) {
      env.push(`${key.toUpperCase()}=${value}`);
    }

    return env;
  }

  private parseStats(raw: any) {
    const cpuDelta =
      raw.cpu_stats.cpu_usage.total_usage -
      raw.precpu_stats.cpu_usage.total_usage;

    const systemDelta =
      raw.cpu_stats.system_cpu_usage -
      raw.precpu_stats.system_cpu_usage;

    const cpuCount = raw.cpu_stats.online_cpus || 1;

    const cpuPercent =
      systemDelta > 0 && cpuDelta > 0
        ? (cpuDelta / systemDelta) * cpuCount * 100
        : 0;

    const memoryUsageBytes = raw.memory_stats.usage || 0;
    const memoryLimitBytes = raw.memory_stats.limit || 1;

    return {
      cpuPercent: Number(cpuPercent.toFixed(2)),
      memoryUsageMb: Math.round(memoryUsageBytes / 1024 / 1024),
      memoryLimitMb: Math.round(memoryLimitBytes / 1024 / 1024),
    };
  }
}
