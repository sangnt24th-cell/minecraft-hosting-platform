import { ServerInstance } from '../types/server';
import { StatusBadge } from './StatusBadge';

interface Props {
  servers: ServerInstance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
}

export function ServerSidebar({ servers, selectedId, onSelect, onCreateClick }: Props) {
  return (
    <aside className="w-72 shrink-0 border-r border-line bg-panel flex flex-col h-screen">
      <div className="px-5 py-5 border-b border-line">
        <div className="font-display font-bold text-lg tracking-tight">MineHost</div>
        <div className="text-xs text-muted mt-0.5">Bảng điều khiển server</div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {servers.length === 0 && (
          <div className="px-5 py-6 text-sm text-muted">
            Chưa có server nào. Tạo server đầu tiên bên dưới.
          </div>
        )}
        {servers.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full text-left px-5 py-3.5 border-l-2 transition-colors ${
              selectedId === s.id
                ? 'border-l-grass bg-panelraised'
                : 'border-l-transparent hover:bg-panelraised/60'
            }`}
          >
            <div className="font-medium text-sm truncate">{s.name}</div>
            <div className="text-xs text-muted mt-1 font-mono">
              {s.minecraftVersion} · {s.edition}
            </div>
            <div className="mt-1.5">
              <StatusBadge status={s.status} />
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-line">
        <button
          onClick={onCreateClick}
          className="w-full py-2.5 rounded bg-grass hover:bg-grassdim transition-colors font-medium text-sm text-base"
        >
          + Tạo server mới
        </button>
      </div>
    </aside>
  );
}
