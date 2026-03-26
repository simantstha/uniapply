import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import apiClient from '../api/client';

export default function VerifyEmail() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    apiClient.get(`/api/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-apple-blue rounded-2xl flex items-center justify-center shadow-apple mb-4">
            <span className="text-white text-xl font-bold">U</span>
          </div>
        </div>

        <div className="card p-8 shadow-apple text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-4">
                <Loader size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Verifying your email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(52,199,89,0.1)' }}>
                  <CheckCircle size={28} color="#34C759" strokeWidth={1.8} />
                </div>
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Email verified!</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Your email address has been verified. You can now close this tab or head back to the app.
              </p>
              <Link to="/dashboard" className="btn-primary text-sm inline-block">
                Go to Dashboard
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,59,48,0.08)' }}>
                  <XCircle size={28} color="#FF3B30" strokeWidth={1.8} />
                </div>
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Verification failed</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
              <Link to="/dashboard" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                Back to Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
