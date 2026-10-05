import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServersService } from './servers.service';
import { CreateServerDto } from './dto/create-server.dto';
import { ExecCommandDto } from './dto/exec-command.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateServerDto) {
    return this.serversService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.serversService.findAllByOwner(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.serversService.findOneOwned(id, req.user.id);
  }

  @Post(':id/start')
  start(@Req() req, @Param('id') id: string) {
    return this.serversService.start(id, req.user.id);
  }

  @Post(':id/stop')
  stop(@Req() req, @Param('id') id: string) {
    return this.serversService.stop(id, req.user.id);
  }

  @Post(':id/restart')
  restart(@Req() req, @Param('id') id: string) {
    return this.serversService.restart(id, req.user.id);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.serversService.remove(id, req.user.id);
  }

  @Get(':id/stats')
  stats(@Req() req, @Param('id') id: string) {
    return this.serversService.getStats(id, req.user.id);
  }

  @Post(':id/command')
  execCommand(@Req() req, @Param('id') id: string, @Body() dto: ExecCommandDto) {
    return this.serversService.execCommand(id, req.user.id, dto.command);
  }
}
