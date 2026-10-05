import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ServerInstance } from './server-instance.entity';

export enum LogEventType {
  START = 'start',
  STOP = 'stop',
  CRASH = 'crash',
  RESTART = 'restart',
  ERROR = 'error',
  COMMAND = 'command',
}

// Không lưu toàn bộ log console vào DB (quá lớn) — chỉ lưu metadata các sự kiện quan trọng.
// Log console đầy đủ đọc trực tiếp qua Docker logs API / streaming qua WebSocket.
@Entity('server_logs_meta')
export class ServerLogMeta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ServerInstance, (server) => server.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'server_id' })
  server: ServerInstance;

  @Column({ name: 'server_id' })
  serverId: string;

  @Column({ type: 'enum', enum: LogEventType })
  eventType: LogEventType;

  @Column({ type: 'text', nullable: true })
  message: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
