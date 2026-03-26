import { AlertCircle } from 'lucide-react';

export default function ErrorCard({ message, onRetry }) {
  return (
    <div className="card p-6 md:p-8 shadow-apple-sm flex items-center gap-4"
      style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,59,48,0.15)' }}>
        <AlertCircle size={18} color="#FF3B30" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}>
          Try again
        </button>
      )}
    </div>
  );
}
