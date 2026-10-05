import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { DockerService } from '../docker/docker.service';

// Namespace riêng cho console log, client kết nối tới ws://host/console
@WebSocketGateway({ namespace: 'console', cors: { origin: '*' } })
export class ConsoleGateway implements OnGatewayDisconnect {
  private readonly logger = new Logger(ConsoleGateway.name);

  @WebSocketServer()
  server: Server;

  // Theo dõi stream đang mở để đóng lại khi client disconnect, tránh rò rỉ stream
  private activeStreams = new Map<string, any>();

  // Buffer riêng cho từng client để ghép các chunk TCP bị cắt giữa chừng một frame Docker
  private demuxBuffers = new Map<string, Buffer>();

  constructor(private readonly dockerService: DockerService) {}

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @MessageBody() data: { serverId: string; containerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const stream = await this.dockerService.getLogStream(data.containerId);
      this.activeStreams.set(client.id, stream);
      this.demuxBuffers.set(client.id, Buffer.alloc(0));

      stream.on('data', (chunk: Buffer) => {
        this.demuxAndEmit(client, chunk);
      });

      stream.on('error', (err: Error) => {
        client.emit('log-error', err.message);
      });

      client.emit('subscribed', { serverId: data.serverId });
    } catch (err) {
      client.emit('log-error', (err as Error).message);
    }
  }

  // Docker trả log dạng "multiplexed stream": mỗi frame có header riêng 8 byte
  // [stream_type(1 byte)] [0x00 0x00 0x00 (padding)] [payload_size(4 byte, big-endian)]
  // theo sau là đúng payload_size byte dữ liệu thật. Một chunk TCP có thể chứa nhiều
  // frame gộp lại, hoặc cắt dở giữa 1 frame — nên phải tự ghép buffer và parse tuần tự,
  // không thể chỉ cắt 8 byte đầu của cả chunk như code cũ.
  private demuxAndEmit(client: Socket, chunk: Buffer) {
    let buffer = Buffer.concat([this.demuxBuffers.get(client.id) ?? Buffer.alloc(0), chunk]);

    const HEADER_SIZE = 8;
    while (buffer.length >= HEADER_SIZE) {
      const payloadSize = buffer.readUInt32BE(4);
      const frameTotalSize = HEADER_SIZE + payloadSize;

      // Chưa nhận đủ dữ liệu cho frame hiện tại — dừng lại, chờ chunk tiếp theo
      if (buffer.length < frameTotalSize) break;

      const payload = buffer.subarray(HEADER_SIZE, frameTotalSize);
      client.emit('log', payload.toString('utf8'));

      buffer = buffer.subarray(frameTotalSize);
    }

    this.demuxBuffers.set(client.id, buffer);
  }

  handleDisconnect(client: Socket) {
    const stream = this.activeStreams.get(client.id);
    if (stream?.destroy) stream.destroy();
    this.activeStreams.delete(client.id);
    this.demuxBuffers.delete(client.id);
    this.logger.log(`Client ${client.id} ngắt kết nối, đã dọn stream`);
  }
}

