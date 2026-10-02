# Minecraft Server Hosting Platform — Backend

Backend NestJS cho đồ án nền tảng cho thuê/host Minecraft Server (Docker Engine API + RCON + WebSocket).

## Cấu trúc đã dựng (Tuần 1-2 theo đề cương)

```
src/
  entities/           4 bảng: User, ServerInstance, ServerConfig, ServerLogMeta
  auth/                Đăng ký / đăng nhập, JWT
  servers/             CRUD server, start/stop/restart, gửi lệnh console
  docker/              DockerService — tạo/quản lý container qua dockerode
  rcon/                RconService — tự cài đặt Source RCON Protocol
  websocket/           ConsoleGateway — stream log console realtime qua Socket.IO
```

## Cách chạy (Windows, đã cài Docker Desktop + Node.js)

1. Cài dependencies:
   ```
   npm install
   ```

2. Copy file môi trường:
   ```
   copy .env.example .env
   ```
   (sửa `JWT_SECRET` thành chuỗi bất kỳ)

3. Bật PostgreSQL bằng Docker:
   ```
   docker compose up -d
   ```

4. Chạy backend (chế độ dev, tự reload khi sửa code):
   ```
   npm run start:dev
   ```

5. Backend chạy tại `http://localhost:3000`. Bảng trong PostgreSQL sẽ tự được tạo (synchronize=true khi dev).

## Test nhanh bằng Postman / Thunder Client

- `POST /auth/register` — body: `{ "username", "email", "password" }`
- `POST /auth/login` — trả về `accessToken`
- `POST /servers` (cần header `Authorization: Bearer <accessToken>`) — tạo server mới, backend sẽ tự gọi Docker để pull image `itzg/minecraft-server` và chạy container (lần đầu sẽ hơi lâu vì phải tải image, image ~500MB)
- `GET /servers` — danh sách server của mình
- `POST /servers/:id/command` — body: `{ "command": "say hello" }` — gửi lệnh qua RCON

## Lưu ý quan trọng

- **Cần Docker Desktop đang chạy** trước khi start backend, nếu không DockerService sẽ báo lỗi kết nối.
- Lần đầu tạo server sẽ tự động `docker pull itzg/minecraft-server` — cần internet, có thể mất vài phút.
- Đây là phần khung (scaffold) của Tuần 1-2 + phần lõi Docker/RCON của Tuần 3-4 làm trước — còn thiếu: module Users riêng, upload/quản lý file server (file browser), migration thay cho synchronize, module thống kê/log chi tiết, và toàn bộ frontend React.
- Port RCON hiện đang cấp `25765-25864` (tách biệt khỏi port game `25565-25664`) — đây là cổng backend expose ra host, còn RCON port *bên trong* container Docker luôn cố định là `25575` (xem `docker.service.ts`).
