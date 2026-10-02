import { useEffect, useState } from 'react';
import { ServerInstance, ServerStats } from '../types/server';
import { StatusBadge } from './StatusBadge';
import { Console } from './Console';
import { QuickActions } from './QuickActions';
import { FileBrowser } from './FileBrowser';
import { useServerConsole } from '../hooks/useServerConsole';
import { fetchStats, startServer, stopServer, restartServer, deleteServer } from '../api/servers';

interface Props {
  server: ServerInstance;
  onChanged: () => void;
  onDeleted: () => void;
}

type Tab = 'overview' | 'console' | 'files';

export function ServerDetailPanel({ server, onChanged, onDeleted }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { lines, connected } = useServerConsole(
    tab === 'console' ? server.id : null,
    server.containerId,
  );

  useEffect(() => {
    if (server.status !== 'running') {
      setStats(null);
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await fetchStats(server.id);
        if (!cancelled) setStats(data);
      } catch {
        // server có thể vừa dừng giữa lúc poll — bỏ qua, vòng lặp sau sẽ tự cập nhật lại status
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [server.id, server.status]);

  const runAction = async (action: string, fn: () => Promise<void>) => {
    setActionLoading(action);
    try {
      await fn();
      onChanged();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Xoá server "${server.name}"? Hành động này không thể hoàn tác.`)) return;
    setActionLoading('delete');
    try {
      await deleteServer(server.id);
      onDeleted();
    } finally {
      setActionLoading(null);
    }
  };

  const memoryPercent = stats ? Math.round((stats.memoryUsageMb / stats.memoryLimitMb) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="px-8 pt-6 pb-4 border-b border-line">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-bold text-xl">{server.name}</h1>
            <div className="mt-1.5"><StatusBadge status={server.status} /></div>
          </div>
          <div className="flex gap-2">
            {server.status === 'running' && (
              <>
                <ActionButton
                  label="Restart"
                  loading={actionLoading === 'restart'}
                  onClick={() => runAction('restart', () => restartServer(server.id))}
                />
                <ActionButton
                  label="Stop"
                  variant="danger"
                  loading={actionLoading === 'stop'}
                  onClick={() => runAction('stop', () => stopServer(server.id))}
                />
              </>
            )}
            {server.status === 'stopped' && (
              <ActionButton
                label="Start"
                variant="primary"
                loading={actionLoading === 'start'}
                onClick={() => runAction('start', () => startServer(server.id))}
              />
            )}
            <ActionButton
              label="Xoá"
              variant="danger"
              loading={actionLoading === 'delete'}
              onClick={handleDelete}
            />
          </div>
        </div>

        <div className="flex gap-5 mt-5">
          <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
            Tổng quan
          </TabButton>
          <TabButton active={tab === 'console'} onClick={() => setTab('console')}>
            Console
          </TabButton>
          <TabButton active={tab === 'files'} onClick={() => setTab('files')}>
            File
          </TabButton>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-8">
        {tab === 'overview' && (
          <div className="grid grid-cols-2 gap-6 max-w-3xl">
            <InfoCard label="Phiên bản" value={`${server.minecraftVersion} · ${server.edition}`} />
            <InfoCard label="Cổng game" value={String(server.gamePort)} mono />
            <InfoCard label="Cổng RCON" value={String(server.rconPort)} mono />
            <InfoCard label="Người chơi tối đa" value={String(server.config.maxPlayers)} />
            <InfoCard label="Độ khó" value={server.config.difficulty} />
            <InfoCard label="Chế độ chơi" value={server.config.gameMode} />

            <div className="col-span-2 bg-panel border border-line rounded-md p-5">
              <div className="text-xs text-muted mb-3">Tài nguyên sử dụng</div>
              {stats ? (
                <div className="space-y-4">
                  <ResourceBar label="CPU" percent={Math.min(stats.cpuPercent, 100)} valueLabel={`${stats.cpuPercent}%`} />
                  <ResourceBar label="RAM" percent={memoryPercent} valueLabel={`${stats.memoryUsageMb} / ${stats.memoryLimitMb} MB`} />
                </div>
              ) : (
                <div className="text-sm text-muted">
                  {server.status === 'running' ? 'Đang tải...' : 'Server không chạy — không có dữ liệu'}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'console' && (
          <div className="h-full max-w-4xl flex flex-col">
            <QuickActions serverId={server.id} disabled={server.status !== 'running'} />
            <div className="flex-1 min-h-0">
              <Console
                serverId={server.id}
                lines={lines}
                connected={connected}
                canSendCommand={server.status === 'running'}
              />
            </div>
          </div>
        )}

        {tab === 'files' && (
          <div className="h-full max-w-4xl">
            <FileBrowser serverId={server.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-panel border border-line rounded-md p-4">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

function ResourceBar({ label, percent, valueLabel }: { label: string; percent: number; valueLabel: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-ink">{valueLabel}</span>
      </div>
      <div className="h-1.5 bg-base rounded-full overflow-hidden">
        <div
          className="h-full bg-grass transition-all duration-500"
          style={{ width: `${Math.max(percent, 2)}%` }}
        />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
        active ? 'border-grass text-ink' : 'border-transparent text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function ActionButton({
  label,
  onClick,
  loading,
  variant = 'default',
}: {
  label: string;
  onClick: () => void;
  loading: boolean;
  variant?: 'default' | 'primary' | 'danger';
}) {
  const styles = {
    default: 'border border-line text-ink hover:bg-panelraised',
    primary: 'bg-grass hover:bg-grassdim',
    danger: 'border border-danger/40 text-danger hover:bg-danger/10',
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-3.5 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 ${styles}`}
    >
      {loading ? '...' : label}
    </button>
  );
}
