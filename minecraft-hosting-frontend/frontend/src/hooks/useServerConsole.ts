import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';

export function useServerConsole(serverId: string | null, containerId: string | null) {
  const [lines, setLines] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!serverId || !containerId) return;

    setLines([]);
    const socket = io(`${API_BASE_URL}/console`, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('subscribe', { serverId, containerId });
    });

    socket.on('log', (text: string) => {
      // Log Docker/Minecraft có thể gộp nhiều dòng trong 1 lần emit, tách theo \n để hiển thị đúng dòng
      setLines((prev) => [...prev, ...text.split('\n').filter(Boolean)].slice(-500));
    });

    socket.on('log-error', (message: string) => {
      setLines((prev) => [...prev, `[Lỗi] ${message}`]);
    });

    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [serverId, containerId]);

  return { lines, connected };
}
