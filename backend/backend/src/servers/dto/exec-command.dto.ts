import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ExecCommandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  command: string;
}
