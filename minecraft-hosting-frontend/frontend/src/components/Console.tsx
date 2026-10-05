import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon } from 'xterm-addon-search';
import 'xterm/css/xterm.css';
import { execCommand } from '../api/servers';

interface Props {
  serverId: string;
  lines: string[];
  connected: boolean;
  canSendCommand: boolean;
}

export function Console({ serverId, lines, connected, canSendCommand }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const writtenCountRef = useRef(0);

  const [command, setCommand] = useState('');
  const [sending, setSending] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Khởi tạo terminal 1 lần khi component mount — không phụ thuộc vào lines,
  // vì ta sẽ tự ghi thêm dòng mới vào terminal thay vì re-render lại toàn bộ
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      convertEol: true,
      disableStdin: true, // terminal chỉ hiển thị log, không nhận gõ trực tiếp (gửi lệnh qua ô input riêng bên dưới)
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorStyle: 'bar',
      theme: {
        background: '#0d100c',
        foreground: '#e8e6d9',
        cursor: '#6b9b37',
        selectionBackground: '#333d29',
      },
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(searchAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;
    writtenCountRef.current = 0;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      termRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]); // tạo lại terminal mới khi chuyển sang server khác

  // Ghi thêm đúng phần log MỚI vào terminal thay vì ghi lại từ đầu mỗi lần — tránh giật/lag
  // khi log dài, và giữ đúng vị trí cuộn + lịch sử tìm kiếm của người dùng
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    if (lines.length < writtenCountRef.current) {
      // Mảng lines bị reset từ bên ngoài (ví dụ subscribe lại WebSocket) — xoá sạch terminal, ghi lại từ đầu
      term.clear();
      writtenCountRef.current = 0;
    }

    const newLines = lines.slice(writtenCountRef.current);
    for (const line of newLines) {
      term.writeln(line);
    }
    writtenCountRef.current = lines.length;
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

  const handleSearchNext = () => {
    if (searchTerm) searchAddonRef.current?.findNext(searchTerm);
  };

  const handleSearchPrev = () => {
    if (searchTerm) searchAddonRef.current?.findPrevious(searchTerm);
  };

  return (
    <div className="flex flex-col h-full border border-line rounded bg-[#0d100c]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="text-xs font-mono text-muted">console</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="text-xs font-mono text-muted hover:text-ink transition-colors"
          >
            🔍 tìm kiếm
          </button>
          <span className={`text-xs font-mono ${connected ? 'text-grass' : 'text-muted'}`}>
            {connected ? '● đã kết nối' : '○ mất kết nối'}
          </span>
        </div>
      </div>

      {searchOpen && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-line bg-panel">
          <input
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.shiftKey ? handleSearchPrev() : handleSearchNext();
              if (e.key === 'Escape') setSearchOpen(false);
            }}
            placeholder="Tìm trong log... (Enter: tiếp theo, Shift+Enter: trước đó)"
            className="flex-1 bg-base border border-line rounded px-2.5 py-1 text-xs font-mono outline-none focus:border-grass"
          />
          <button
            onClick={handleSearchPrev}
            className="px-2 py-1 rounded border border-line text-xs text-muted hover:text-ink transition-colors"
          >
            ↑
          </button>
          <button
            onClick={handleSearchNext}
            className="px-2 py-1 rounded border border-line text-xs text-muted hover:text-ink transition-colors"
          >
            ↓
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 px-2 py-2">
        <div ref={containerRef} className="h-full w-full" />
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
