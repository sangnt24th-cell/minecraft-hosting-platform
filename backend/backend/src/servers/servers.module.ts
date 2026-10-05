import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { ServerInstance } from '../entities/server-instance.entity';
import { ServerConfig } from '../entities/server-config.entity';
import { ServerLogMeta } from '../entities/server-log-meta.entity';
import { DockerModule } from '../docker/docker.module';
import { RconModule } from '../rcon/rcon.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServerInstance, ServerConfig, ServerLogMeta]),
    DockerModule,
    RconModule,
  ],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}
