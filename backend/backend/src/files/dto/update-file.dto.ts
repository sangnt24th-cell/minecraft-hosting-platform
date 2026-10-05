import { IsString, MaxLength } from 'class-validator';

export class UpdateFileDto {
  @IsString()
  @MaxLength(200_000) // giới hạn ~200KB, đủ cho 3 file cấu hình, tránh ghi đè file khổng lồ do lỗi client
  content: string;
}
