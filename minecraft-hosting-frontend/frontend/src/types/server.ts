export type ServerStatus =
  | 'creating'
  | 'running'
  | 'stopped'
  | 'restarting'
  | 'error'
  | 'deleting';

export interface ServerConfig {
  id: string;
  maxRamMb: number;
  maxPlayers: number;
  difficulty: string;
  gameMode: string;
  whitelistEnabled: boolean;
  extraProperties: Record<string, string | number | boolean>;
}

export interface ServerInstance {
  id: string;
  ownerId: string;
  name: string;
  containerId: string | null;
  minecraftVersion: string;
  edition: string;
  gamePort: number;
  rconPort: number;
  status: ServerStatus;
  createdAt: string;
  updatedAt: string;
  config: ServerConfig;
}

export interface ServerStats {
  cpuPercent: number;
  memoryUsageMb: number;
  memoryLimitMb: number;
}

export interface CreateServerPayload {
  name: string;
  minecraftVersion: string;
  edition: string;
  maxRamMb: number;
  maxPlayers: number;
  difficulty: string;
  gameMode: string;
  whitelistEnabled: boolean;
}
