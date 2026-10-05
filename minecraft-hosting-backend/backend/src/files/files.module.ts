import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { ServerInstance } from '../entities/server-instance.entity';
import { ServerConfig } from '../entities/server-config.entity';
import { DockerModule } from '../docker/docker.module';
import { RconModule } from '../rcon/rcon.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServerInstance, ServerConfig]),
    DockerModule,
    RconModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
