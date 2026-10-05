import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesService } from './files.service';
import { UpdateFileDto } from './dto/update-file.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('servers/:serverId/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  listAllowed() {
    return { files: this.filesService.listAllowedFiles() };
  }

  @Get(':filename')
  async getContent(
    @Req() req,
    @Param('serverId') serverId: string,
    @Param('filename') filename: string,
  ) {
    const content = await this.filesService.getFileContent(
      serverId,
      req.user.id,
      filename,
    );
    return { filename, content };
  }

  @Put(':filename')
  async updateContent(
    @Req() req,
    @Param('serverId') serverId: string,
    @Param('filename') filename: string,
    @Body() dto: UpdateFileDto,
  ) {
    await this.filesService.updateFileContent(
      serverId,
      req.user.id,
      filename,
      dto.content,
    );
    return {
      success: true,
      needsRestart: this.filesService.needsRestartToApply(filename),
    };
  }
}
