import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { LogoWordmark } from '../Logo';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.successMessage;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <button onClick={toggle} className="fixed top-4 right-4 p-2 rounded-xl transition-all" style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}>
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <LogoWordmark size="lg" />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Sign in to UniApply</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Your study abroad journey starts here</p>
        </div>

        <div className="card p-6 shadow-apple">
          {successMessage && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(52,199,89,0.08)', color: '#34C759', border: '1px solid rgba(52,199,89,0.2)' }}>
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="input" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <div className="text-center mt-2">
              <Link to="/forgot-password" className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Forgot password?
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium" style={{ color: 'var(--accent)' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
