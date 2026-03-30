import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import apiClient from '../api/client';
import { LogoWordmark } from '../components/Logo';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/auth/reset-password', { token, password });
      navigate('/login', { state: { successMessage: 'Password reset successfully. Please sign in.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Invalid or missing reset token.</p>
          <Link to="/forgot-password" className="btn-primary text-sm">Request a new reset link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <button onClick={toggle} className="fixed top-4 right-4 p-2 rounded-xl transition-all" style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}>
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <LogoWordmark size="lg" />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Set a new password</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Choose a strong password for your account.</p>
        </div>

        <div className="card p-6 shadow-apple">
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="input"
                placeholder="At least 8 characters"
                minLength={8}
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="input"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
