import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ServerInstance } from './server-instance.entity';

// Cấu hình chi tiết cho từng server: giới hạn tài nguyên + nội dung server.properties
@Entity('server_configs')
export class ServerConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => ServerInstance, (server) => server.config, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'server_id' })
  server: ServerInstance;

  @Column({ name: 'server_id' })
  serverId: string;

  @Column({ name: 'max_ram_mb', default: 1024 })
  maxRamMb: number;

  @Column({ name: 'max_players', default: 20 })
  maxPlayers: number;

  @Column({ name: 'difficulty', default: 'normal' })
  difficulty: string;

  @Column({ name: 'game_mode', default: 'survival' })
  gameMode: string;

  @Column({ name: 'whitelist_enabled', default: false })
  whitelistEnabled: boolean;

  // Lưu toàn bộ server.properties dạng JSON để ghi đè linh hoạt khi tạo container
  @Column({ type: 'jsonb', name: 'extra_properties', default: {} })
  extraProperties: Record<string, string | number | boolean>;
}
