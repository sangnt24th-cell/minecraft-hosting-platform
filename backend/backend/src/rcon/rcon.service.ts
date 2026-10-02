import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'net';

// Implement Source RCON Protocol (chuẩn Valve, Minecraft dùng lại giao thức này).
// Tham khảo: https://developer.valvesoftware.com/wiki/Source_RCON_Protocol
// Packet format: [Size(int32)] [ID(int32)] [Type(int32)] [Body(string)] [0x00] [0x00]

enum PacketType {
  SERVERDATA_AUTH = 3,
  SERVERDATA_AUTH_RESPONSE = 2,
  SERVERDATA_EXECCOMMAND = 2,
  SERVERDATA_RESPONSE_VALUE = 0,
}

@Injectable()
export class RconService {
  private readonly logger = new Logger(RconService.name);

  // Mỗi lệnh RCON mở một kết nối riêng và đóng lại ngay sau khi nhận response.
  // Đơn giản, an toàn cho một web app gọi lệnh không liên tục (không cần giữ pool kết nối).
  async sendCommand(
    host: string,
    port: number,
    password: string,
    command: string,
    timeoutMs = 5000,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      let authenticated = false;
      let buffer = Buffer.alloc(0);
      let requestId = 1;

      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error('RCON timeout - không kết nối được tới server'));
      }, timeoutMs);

      socket.connect(port, host, () => {
        socket.write(this.buildPacket(requestId, PacketType.SERVERDATA_AUTH, password));
      });

      socket.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);

        while (buffer.length >= 4) {
          const size = buffer.readInt32LE(0);
          if (buffer.length < size + 4) break; // chưa nhận đủ packet, chờ thêm data

          const packet = buffer.subarray(0, size + 4);
          buffer = buffer.subarray(size + 4);

          const id = packet.readInt32LE(4);
          const type = packet.readInt32LE(8);
          const body = packet.toString('utf8', 12, packet.length - 2);

          if (!authenticated) {
            if (type === PacketType.SERVERDATA_AUTH_RESPONSE) {
              if (id === -1) {
                clearTimeout(timeout);
                socket.destroy();
                reject(new Error('RCON auth thất bại - sai mật khẩu'));
                return;
              }
              authenticated = true;
              requestId = 2;
              socket.write(
                this.buildPacket(requestId, PacketType.SERVERDATA_EXECCOMMAND, command),
              );
            }
          } else if (type === PacketType.SERVERDATA_RESPONSE_VALUE) {
            clearTimeout(timeout);
            socket.destroy();
            resolve(body);
            return;
          }
        }
      });

      socket.on('error', (err) => {
        clearTimeout(timeout);
        this.logger.error(`Lỗi kết nối RCON: ${err.message}`);
        reject(err);
      });
    });
  }

  private buildPacket(id: number, type: PacketType, body: string): Buffer {
    const bodyBuf = Buffer.from(body, 'utf8');
    const size = 4 + 4 + bodyBuf.length + 2; // id + type + body + 2 null terminators
    const buf = Buffer.alloc(4 + size);

    buf.writeInt32LE(size, 0);
    buf.writeInt32LE(id, 4);
    buf.writeInt32LE(type, 8);
    bodyBuf.copy(buf, 12);
    buf.writeInt8(0, 12 + bodyBuf.length);
    buf.writeInt8(0, 12 + bodyBuf.length + 1);

    return buf;
  }
}
