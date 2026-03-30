import { useState, useEffect } from 'react';
import { ExternalLink, Bug } from 'lucide-react';
import apiClient from '../api/client';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Issues() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/api/issues')
      .then(({ data }) => setReports(data))
      .catch(() => setError('Failed to load your reports.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Reported Issues
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
        Issues you've reported. Use the <Bug size={13} className="inline" /> button in the bottom-right corner to report a new one.
      </p>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm" style={{ color: '#FF3B30' }}>{error}</p>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-tertiary)' }}>
          <Bug size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No issues reported yet.</p>
          <p className="text-xs mt-1">Use the button in the bottom-right corner to report a problem.</p>
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map(report => (
            <div
              key={report.id}
              className="rounded-xl px-4 py-3.5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {report.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    #{report.githubIssueNumber} · {timeAgo(report.createdAt)}
                  </p>
                </div>
                <a
                  href={report.githubIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1 text-xs font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  GitHub <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
