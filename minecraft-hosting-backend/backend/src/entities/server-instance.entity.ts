import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ServerConfig } from './server-config.entity';
import { ServerLogMeta } from './server-log-meta.entity';

export enum ServerStatus {
  CREATING = 'creating',
  RUNNING = 'running',
  STOPPED = 'stopped',
  RESTARTING = 'restarting',
  ERROR = 'error',
  DELETING = 'deleting',
}

@Entity('server_instances')
export class ServerInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.servers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column()
  name: string;

  // ID container Docker thật, null nếu chưa được tạo (trạng thái CREATING)
  @Column({ name: 'container_id', type: 'varchar', nullable: true })
  containerId: string | null;

  @Column({ name: 'minecraft_version' })
  minecraftVersion: string;

  // Loại server: vanilla, paper, forge, fabric...
  @Column({ default: 'vanilla' })
  edition: string;

  // Cổng game (25565...) và cổng RCON được cấp phát tự động, không trùng nhau
  @Column({ name: 'game_port' })
  gamePort: number;

  @Column({ name: 'rcon_port' })
  rconPort: number;

  @Column({ name: 'rcon_password' })
  rconPassword: string;

  @Column({
    type: 'enum',
    enum: ServerStatus,
    default: ServerStatus.CREATING,
  })
  status: ServerStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => ServerConfig, (config) => config.server, { cascade: true })
  config: ServerConfig;

  @OneToMany(() => ServerLogMeta, (log) => log.server)
  logs: ServerLogMeta[];
}
