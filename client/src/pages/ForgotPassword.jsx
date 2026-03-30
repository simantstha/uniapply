import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Mail, ArrowLeft } from 'lucide-react';
import { LogoWordmark } from '../components/Logo';
import apiClient from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { dark, toggle } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/api/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
          <LogoWordmark size="lg" />
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Forgot your password?</h1>
          <p className="text-sm mt-1 text-center" style={{ color: 'var(--text-secondary)' }}>
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="card p-6 shadow-apple">
          {submitted ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(196,98,45,0.1)' }}>
                <Mail size={22} style={{ color: 'var(--accent)' }} strokeWidth={1.8} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Check your email</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox (and spam folder).
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 px-3.5 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="input"
                    placeholder="you@example.com"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
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
