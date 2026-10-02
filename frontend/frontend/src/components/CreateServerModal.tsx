import { FormEvent, useState } from 'react';
import { CreateServerPayload } from '../types/server';

interface Props {
  onClose: () => void;
  onCreate: (payload: CreateServerPayload) => Promise<void>;
}

export function CreateServerModal({ onClose, onCreate }: Props) {
  const [form, setForm] = useState<CreateServerPayload>({
    name: '',
    minecraftVersion: '1.20.4',
    edition: 'vanilla',
    maxRamMb: 1024,
    maxPlayers: 10,
    difficulty: 'normal',
    gameMode: 'survival',
    whitelistEnabled: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onCreate(form);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Tạo server thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-panel border border-line rounded-md w-full max-w-md">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-display font-semibold text-base">Tạo server mới</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5">Tên server</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-base border border-line rounded px-3 py-2 text-sm outline-none focus:border-grass"
              placeholder="Server của tôi"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1.5">Phiên bản</label>
              <input
                required
                value={form.minecraftVersion}
                onChange={(e) => setForm({ ...form, minecraftVersion: e.target.value })}
                className="w-full bg-base border border-line rounded px-3 py-2 text-sm outline-none focus:border-grass font-mono"
                placeholder="1.20.4"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Loại server</label>
              <select
                value={form.edition}
                onChange={(e) => setForm({ ...form, edition: e.target.value })}
                className="w-full bg-base border border-line rounded px-3 py-2 text-sm outline-none focus:border-grass"
              >
                <option value="vanilla">Vanilla</option>
                <option value="paper">Paper</option>
                <option value="forge">Forge</option>
                <option value="fabric">Fabric</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1.5">RAM tối đa (MB)</label>
              <input
                type="number"
                min={512}
                max={8192}
                step={256}
                required
                value={form.maxRamMb}
                onChange={(e) => setForm({ ...form, maxRamMb: Number(e.target.value) })}
                className="w-full bg-base border border-line rounded px-3 py-2 text-sm outline-none focus:border-grass font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Số người chơi tối đa</label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={form.maxPlayers}
                onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) })}
                className="w-full bg-base border border-line rounded px-3 py-2 text-sm outline-none focus:border-grass font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1.5">Độ khó</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full bg-base border border-line rounded px-3 py-2 text-sm outline-none focus:border-grass"
              >
                <option value="peaceful">Peaceful</option>
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Chế độ chơi</label>
              <select
                value={form.gameMode}
                onChange={(e) => setForm({ ...form, gameMode: e.target.value })}
                className="w-full bg-base border border-line rounded px-3 py-2 text-sm outline-none focus:border-grass"
              >
                <option value="survival">Survival</option>
                <option value="creative">Creative</option>
                <option value="adventure">Adventure</option>
                <option value="spectator">Spectator</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.whitelistEnabled}
              onChange={(e) => setForm({ ...form, whitelistEnabled: e.target.checked })}
              className="accent-grass"
            />
            Bật whitelist
          </label>

          {error && <div className="text-sm text-danger">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-sm text-muted hover:text-ink transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded bg-grass hover:bg-grassdim transition-colors text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'Tạo server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
