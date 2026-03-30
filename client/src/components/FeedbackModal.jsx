import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import apiClient from '../api/client';

export default function FeedbackModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(null); // { githubIssueUrl, githubIssueNumber }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiClient.post('/api/issues', { title, description });
      setSubmitted({ githubIssueUrl: data.githubIssueUrl, githubIssueNumber: data.githubIssueNumber });
      setTimeout(onClose, 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-xl p-6"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Report an Issue
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-tertiary)' }}>
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
              Issue reported! Thanks for the feedback.
            </p>
            <a
              href={submitted.githubIssueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm"
              style={{ color: 'var(--accent)' }}
            >
              View #{submitted.githubIssueNumber} on GitHub <ExternalLink size={13} />
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                required
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? What did you expect?"
                required
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            {error && (
              <p className="text-xs" style={{ color: '#FF3B30' }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg text-sm font-medium transition-opacity"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Submitting…' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
