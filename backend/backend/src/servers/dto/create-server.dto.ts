import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
} from 'class-validator';

const SUPPORTED_EDITIONS = ['vanilla', 'paper', 'forge', 'fabric'];
const SUPPORTED_DIFFICULTIES = ['peaceful', 'easy', 'normal', 'hard'];
const SUPPORTED_GAME_MODES = ['survival', 'creative', 'adventure', 'spectator'];

export class CreateServerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  minecraftVersion: string; // ví dụ: "1.20.4" — validate khớp version thật ở service layer

  @IsIn(SUPPORTED_EDITIONS)
  edition: string;

  @IsInt()
  @Min(512)
  @Max(8192)
  maxRamMb: number;

  @IsInt()
  @Min(1)
  @Max(100)
  maxPlayers: number;

  @IsIn(SUPPORTED_DIFFICULTIES)
  @IsOptional()
  difficulty?: string = 'normal';

  @IsIn(SUPPORTED_GAME_MODES)
  @IsOptional()
  gameMode?: string = 'survival';

  @IsBoolean()
  @IsOptional()
  whitelistEnabled?: boolean = false;
}
