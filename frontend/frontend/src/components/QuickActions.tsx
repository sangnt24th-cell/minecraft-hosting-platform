import { useState } from 'react';
import { execCommand } from '../api/servers';

interface Props {
  serverId: string;
  disabled: boolean;
}

interface QuickAction {
  label: string;
  variant?: 'default' | 'danger';
  // Trả về null để huỷ thao tác (ví dụ người dùng bấm Cancel ở prompt nhập tên)
  buildCommand: () => string | null;
}

export function QuickActions({ serverId, disabled }: Props) {
  const [running, setRunning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const actions: QuickAction[] = [
    {
      label: 'Save World',
      buildCommand: () => 'save-all',
    },
    {
      label: 'Announce',
      buildCommand: () => {
        const msg = window.prompt('Nội dung thông báo gửi tới tất cả người chơi:');
        return msg?.trim() ? `say ${msg.trim()}` : null;
      },
    },
    {
      label: 'Whitelist Add',
      buildCommand: () => {
        const name = window.prompt('Tên người chơi cần thêm vào whitelist:');
        return name?.trim() ? `whitelist add ${name.trim()}` : null;
      },
    },
    {
      label: 'Whitelist Remove',
      buildCommand: () => {
        const name = window.prompt('Tên người chơi cần gỡ khỏi whitelist:');
        return name?.trim() ? `whitelist remove ${name.trim()}` : null;
      },
    },
    {
      label: 'Kick',
      variant: 'danger',
      buildCommand: () => {
        const name = window.prompt('Tên người chơi cần kick:');
        if (!name?.trim()) return null;
        const reason = window.prompt('Lý do (có thể để trống):') ?? '';
        return `kick ${name.trim()}${reason.trim() ? ` ${reason.trim()}` : ''}`;
      },
    },
    {
      label: 'Ban',
      variant: 'danger',
      buildCommand: () => {
        const name = window.prompt('Tên người chơi cần ban:');
        if (!name?.trim()) return null;
        const reason = window.prompt('Lý do (có thể để trống):') ?? '';
        return `ban ${name.trim()}${reason.trim() ? ` ${reason.trim()}` : ''}`;
      },
    },
  ];

  const handleRun = async (action: QuickAction) => {
    const command = action.buildCommand();
    if (!command) return; // người dùng huỷ prompt

    setRunning(action.label);
    setFeedback(null);
    try {
      const response = await execCommand(serverId, command);
      setFeedback({ text: response || `Đã gửi: ${command}`, isError: false });
    } catch (err: any) {
      setFeedback({
        text: err?.response?.data?.message ?? 'Gửi lệnh thất bại',
        isError: true,
      });
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="mb-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            disabled={disabled || running !== null}
            onClick={() => handleRun(action)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-40 ${
              action.variant === 'danger'
                ? 'border border-danger/40 text-danger hover:bg-danger/10'
                : 'border border-line text-ink hover:bg-panelraised'
            }`}
          >
            {running === action.label ? '...' : action.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`mt-2 text-xs font-mono ${feedback.isError ? 'text-danger' : 'text-muted'}`}>
          {feedback.text}
        </div>
      )}

      {disabled && (
        <div className="mt-2 text-xs text-muted">Server phải đang chạy để dùng các lệnh nhanh</div>
      )}
    </div>
  );
}
