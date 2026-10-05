import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';

interface Props {
  onAuthenticated: (token: string) => void;
}

export function LoginPage({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res =
        mode === 'login'
          ? await login(username, password)
          : await register(username, email, password);
      onAuthenticated(res.accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Có lỗi xảy ra, thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-display font-bold text-2xl tracking-tight">MineHost</div>
          <div className="text-sm text-muted mt-1">Nền tảng quản lý Minecraft Server</div>
        </div>

        <div className="bg-panel border border-line rounded-md p-6">
          <div className="flex gap-1 mb-5 bg-base rounded p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-panelraised text-ink' : 'text-muted'
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${
                mode === 'register' ? 'bg-panelraised text-ink' : 'text-muted'
              }`}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs text-muted mb-1.5">Tên đăng nhập</label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-base border border-line rounded px-3 py-2 text-sm outline-none focus:border-grass"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs text-muted mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-base border border-line rounded px-3 py-2 text-sm outline-none focus:border-grass"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-muted mb-1.5">Mật khẩu</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-base border border-line rounded px-3 py-2 text-sm outline-none focus:border-grass"
              />
            </div>

            {error && <div className="text-sm text-danger">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded bg-grass hover:bg-grassdim transition-colors text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
