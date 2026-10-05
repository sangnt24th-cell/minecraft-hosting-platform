# MineHost — Frontend

Dashboard React quản lý Minecraft Server, kết nối trực tiếp với backend NestJS.

## Cách chạy

1. Đảm bảo backend đang chạy tại `http://localhost:3000` (xem README của backend)
2. Cài dependencies:
   ```
   npm install
   ```
3. Chạy dev server:
   ```
   npm run dev
   ```
4. Mở `http://localhost:5173`

Nếu backend chạy ở địa chỉ/cổng khác, sửa `API_BASE_URL` trong `src/api/client.ts`.

## Đã có

- Đăng nhập / đăng ký
- Danh sách server (sidebar), tự động refresh mỗi 4s để cập nhật trạng thái (đặc biệt khi server đang ở "creating")
- Tạo server mới (form đầy đủ theo đúng các trường backend hỗ trợ)
- Start / Stop / Restart / Xoá server
- Tab Tổng quan: hiển thị CPU/RAM realtime (poll mỗi 5s khi server đang chạy)
- Tab Console: log server realtime qua WebSocket + gửi lệnh RCON

## Còn thiếu (làm sau)

- File browser quản lý file server (world, plugins...)
- Trang cài đặt server (sửa RAM, whitelist... sau khi tạo)
- Quên mật khẩu / đổi mật khẩu
- Responsive cho mobile (hiện tối ưu cho desktop, đúng với tính chất là control panel)
