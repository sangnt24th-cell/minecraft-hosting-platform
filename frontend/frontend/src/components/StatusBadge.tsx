import { ServerStatus } from '../types/server';

const STATUS_META: Record<ServerStatus, { label: string; dot: string; text: string }> = {
  running: { label: 'Đang chạy', dot: 'bg-grass', text: 'text-grass' },
  stopped: { label: 'Đã dừng', dot: 'bg-muted', text: 'text-muted' },
  creating: { label: 'Đang tạo', dot: 'bg-amber', text: 'text-amber' },
  restarting: { label: 'Đang khởi động lại', dot: 'bg-amber', text: 'text-amber' },
  error: { label: 'Lỗi', dot: 'bg-danger', text: 'text-danger' },
  deleting: { label: 'Đang xoá', dot: 'bg-danger', text: 'text-danger' },
};

export function StatusBadge({ status }: { status: ServerStatus }) {
  const meta = STATUS_META[status];
  const isLive = status === 'running';

  return (
    <span className={`inline-flex items-center gap-2 text-sm font-medium ${meta.text}`}>
      <span
        className={`h-2 w-2 rounded-full ${meta.dot} ${isLive ? 'status-dot-running' : ''}`}
      />
      {meta.label}
    </span>
  );
}
