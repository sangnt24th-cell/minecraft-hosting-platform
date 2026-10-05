import { useEffect, useState } from 'react';
import { fetchFileContent, updateFileContent } from '../api/files';

const FILES = [
  { key: 'server.properties', label: 'server.properties' },
  { key: 'whitelist.json', label: 'whitelist.json' },
  { key: 'ops.json', label: 'ops.json' },
];

export function FileBrowser({ serverId }: { serverId: string }) {
  const [activeFile, setActiveFile] = useState(FILES[0].key);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSavedMessage(null);
    fetchFileContent(serverId, activeFile)
      .then(setContent)
      .catch((err) => setError(err?.response?.data?.message ?? 'Không đọc được file'))
      .finally(() => setLoading(false));
  }, [serverId, activeFile]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const result = await updateFileContent(serverId, activeFile, content);
      setSavedMessage(
        result.needsRestart
          ? 'Đã lưu — cần Restart server để áp dụng thay đổi.'
          : 'Đã lưu và áp dụng ngay.',
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Lưu thất bại — kiểm tra lại định dạng nội dung');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full gap-4">
      <div className="w-52 shrink-0 space-y-1">
        {FILES.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFile(f.key)}
            className={`w-full text-left px-3 py-2 rounded text-sm font-mono transition-colors ${
              activeFile === f.key
                ? 'bg-panelraised text-ink border border-line'
                : 'text-muted hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col border border-line rounded-md bg-panel min-h-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
          <span className="font-mono text-xs text-muted">{activeFile}</span>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-3.5 py-1.5 rounded bg-grass hover:bg-grassdim transition-colors text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>

        {error && (
          <div className="px-4 py-2 text-sm text-danger border-b border-line">{error}</div>
        )}
        {savedMessage && (
          <div className="px-4 py-2 text-sm text-grass border-b border-line">{savedMessage}</div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">
            Đang tải...
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-[#0d100c] font-mono text-[13px] p-4 outline-none resize-none leading-relaxed"
          />
        )}
      </div>
    </div>
  );
}
