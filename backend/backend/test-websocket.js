const { io } = require('socket.io-client');

const socket = io('http://localhost:3000/console');

socket.on('connect', () => {
  console.log('✅ WebSocket connected:', socket.id);

  socket.emit('subscribe', {
    serverId: 'd91210b7-b6fd-421b-b944-51bc5aa474ef',
    containerId: 'b0adefd0a3d748aae575155e0ac1ba0467e51b10125921167cd087bec4ab1762',
  });
});

socket.on('subscribed', (data) => {
  console.log('✅ Subscribed:', data);
});

socket.on('log', (data) => {
  console.log('📜 Minecraft:', data);
});

socket.on('log-error', (error) => {
  console.log('❌ Log error:', error);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});