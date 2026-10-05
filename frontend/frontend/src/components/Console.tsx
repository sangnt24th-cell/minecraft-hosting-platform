import { useEffect, useRef, useState } from 'react';
import { execCommand } from '../api/servers';

interface Props {
  serverId: string;
  lines: string[];
  connected: boolean;
  canSendCommand: boolean;
}

export function Console({ serverId, lines, connected, canSendCommand }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [command, setCommand] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const handleSend = async () => {
    if (!command.trim() || sending) return;
    setSending(true);
    try {
      await execCommand(serverId, command.trim());
      setCommand('');
    } catch {
      // Lỗi RCON đã được backend log lại, không cần chặn UI
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full border border-line rounded bg-[#0d100c]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="text-xs font-mono text-muted">console</span>
        <span className={`text-xs font-mono ${connected ? 'text-grass' : 'text-muted'}`}>
          {connected ? '● đã kết nối' : '○ mất kết nối'}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed"
      >
        {lines.length === 0 && (
          <div className="text-muted">Đang chờ log từ server...</div>
        )}
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all text-ink/90">
            {line}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-line">
        <span className="text-grass font-mono text-sm">&gt;</span>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={!canSendCommand || sending}
          placeholder={canSendCommand ? 'Nhập lệnh, ví dụ: say hello' : 'Server phải đang chạy để gửi lệnh'}
          className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted disabled:opacity-40"
        />
      </div>
    </div>
  );
}
