import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ServersModule } from './servers/servers.module';
import { DockerModule } from './docker/docker.module';
import { RconModule } from './rcon/rcon.module';
import { WebsocketModule } from './websocket/websocket.module';
import { FilesModule } from './files/files.module';
import { User } from './entities/user.entity';
import { ServerInstance } from './entities/server-instance.entity';
import { ServerConfig } from './entities/server-config.entity';
import { ServerLogMeta } from './entities/server-log-meta.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_DATABASE', 'minecraft_hosting'),
        entities: [User, ServerInstance, ServerConfig, ServerLogMeta],
        // Chỉ dùng synchronize=true khi phát triển; khi lên production nên chuyển sang migration
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule,
    ServersModule,
    DockerModule,
    RconModule,
    WebsocketModule,
    FilesModule,
  ],
})
export class AppModule {}
