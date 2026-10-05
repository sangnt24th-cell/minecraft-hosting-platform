import { useEffect, useState, useCallback } from 'react';
import { ServerInstance, CreateServerPayload } from '../types/server';
import { fetchServers, createServer } from '../api/servers';
import { ServerSidebar } from '../components/ServerSidebar';
import { ServerDetailPanel } from '../components/ServerDetailPanel';
import { CreateServerModal } from '../components/CreateServerModal';

// Server ở trạng thái creating/restarting cần được poll thường xuyên hơn để UI cập nhật kịp
const POLL_INTERVAL_MS = 4000;

export function DashboardPage() {
  const [servers, setServers] = useState<ServerInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadServers = useCallback(async () => {
    const data = await fetchServers();
    setServers(data);
    setLoading(false);
    return data;
  }, []);

  useEffect(() => {
    loadServers().then((data) => {
      if (data.length > 0) setSelectedId((prev) => prev ?? data[0].id);
    });
    const interval = setInterval(loadServers, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadServers]);

  const handleCreate = async (payload: CreateServerPayload) => {
    const created = await createServer(payload);
    await loadServers();
    setSelectedId(created.id);
  };

  const handleDeleted = async () => {
    setSelectedId(null);
    const data = await loadServers();
    if (data.length > 0) setSelectedId(data[0].id);
  };

  const selectedServer = servers.find((s) => s.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted text-sm">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="flex bg-base min-h-screen">
      <ServerSidebar
        servers={servers}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreateClick={() => setShowCreateModal(true)}
      />

      {selectedServer ? (
        <ServerDetailPanel
          key={selectedServer.id}
          server={selectedServer}
          onChanged={loadServers}
          onDeleted={handleDeleted}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted text-sm">
          Chọn hoặc tạo một server để bắt đầu
        </div>
      )}

      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
