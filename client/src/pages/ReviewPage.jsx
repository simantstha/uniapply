import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function ScoreBar({ label, value }) {
  const color = value >= 7 ? '#34C759' : value >= 4 ? '#FF9F0A' : '#FF3B30';
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: '700', color }}>{value}/10</span>
      </div>
      <div style={{ height: '6px', borderRadius: '999px', background: '#E5E7EB' }}>
        <div style={{ height: '6px', borderRadius: '999px', background: color, width: `${value * 10}%`, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'expired' | 'error'
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({ reviewerName: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/review/${token}`)
      .then(async res => {
        if (res.status === 404) { setStatus('expired'); return; }
        if (res.status === 410) { setStatus('expired'); return; }
        if (!res.ok) { setStatus('error'); return; }
        const json = await res.json();
        setData(json);
        setComments(json.comments || []);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/review/${token}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerName: form.reviewerName, comment: form.comment }),
      });
      const json = await res.json();
      if (!res.ok) { setSubmitError(json.error || 'Failed to submit'); return; }
      setComments(prev => [...prev, json]);
      setForm({ reviewerName: '', comment: '' });
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const pageStyle = {
    minHeight: '100vh',
    background: '#FBF7F0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#1C1C1E',
  };

  const containerStyle = {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '40px 24px 80px',
  };

  if (status === 'loading') {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #D97706', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === 'expired' || status === 'error') {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: '#1C1C1E' }}>
            {status === 'expired' ? 'Link expired or invalid' : 'Something went wrong'}
          </h1>
          <p style={{ color: '#6B7280', fontSize: '15px' }}>
            {status === 'expired'
              ? 'This review link has expired or is no longer active.'
              : 'Unable to load this review page. Please try again later.'}
          </p>
        </div>
      </div>
    );
  }

  const textContent = stripHtml(data.content);
  const overallScore = data.critique
    ? (() => {
        const scores = [data.critique.authenticityScore, data.critique.specificityScore, data.critique.clarityScore, data.critique.impactScore].filter(Boolean);
        return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
      })()
    : null;

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-block', background: '#D97706', color: 'white', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '999px', marginBottom: '16px', textTransform: 'uppercase' }}>
            For Review
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '6px', lineHeight: '1.2' }}>{data.universityName}</h1>
          <p style={{ fontSize: '15px', color: '#6B7280', marginBottom: '4px' }}>{data.program}</p>
          {data.title && <p style={{ fontSize: '13px', color: '#9CA3AF' }}>{data.title}</p>}
          <p style={{ fontSize: '12px', color: '#D97706', marginTop: '8px', fontWeight: '500' }}>{data.wordCount} words</p>
        </div>

        {/* SOP Content */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '36px 40px', marginBottom: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '24px' }}>
            Statement of Purpose
          </p>
          <div style={{ fontSize: '16px', lineHeight: '1.85', color: '#1C1C1E', whiteSpace: 'pre-wrap' }}>
            {textContent}
          </div>
        </div>

        {/* AI Critique */}
        {data.critique && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px 32px', marginBottom: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1C1C1E' }}>AI Critique</h2>
              {overallScore && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: Number(overallScore) >= 7 ? '#34C759' : Number(overallScore) >= 4 ? '#FF9F0A' : '#FF3B30' }}>{overallScore}</span>
                  <span style={{ fontSize: '14px', color: '#9CA3AF' }}>/10</span>
                </div>
              )}
            </div>
            {data.critique.authenticityScore != null && <ScoreBar label="Authenticity" value={data.critique.authenticityScore} />}
            {data.critique.specificityScore != null && <ScoreBar label="Specificity" value={data.critique.specificityScore} />}
            {data.critique.clarityScore != null && <ScoreBar label="Clarity" value={data.critique.clarityScore} />}
            {data.critique.impactScore != null && <ScoreBar label="Impact" value={data.critique.impactScore} />}
          </div>
        )}

        {/* Comments */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1C1C1E', marginBottom: '20px' }}>
            Leave a Comment {comments.length > 0 && <span style={{ color: '#9CA3AF', fontWeight: '400' }}>({comments.length})</span>}
          </h2>

          {/* Existing comments */}
          {comments.length > 0 && (
            <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {comments.map(c => (
                <div key={c.id} style={{ padding: '14px 16px', borderRadius: '12px', background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1C1C1E' }}>{c.reviewerName}</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0 }}>{c.comment}</p>
                </div>
              ))}
            </div>
          )}

          {/* Comment form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Your name"
              value={form.reviewerName}
              onChange={e => setForm(f => ({ ...f, reviewerName: e.target.value }))}
              maxLength={50}
              required
              style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '14px', color: '#1C1C1E', outline: 'none', background: '#FAFAFA' }}
            />
            <textarea
              placeholder="Your feedback on this SOP..."
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              maxLength={1000}
              required
              rows={4}
              style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '14px', color: '#1C1C1E', outline: 'none', resize: 'vertical', background: '#FAFAFA', fontFamily: 'inherit' }}
            />
            {submitError && (
              <p style={{ fontSize: '13px', color: '#EF4444', padding: '8px 12px', background: 'rgba(239,68,68,0.07)', borderRadius: '8px', margin: 0 }}>{submitError}</p>
            )}
            {submitSuccess && (
              <p style={{ fontSize: '13px', color: '#10B981', padding: '8px 12px', background: 'rgba(16,185,129,0.07)', borderRadius: '8px', margin: 0 }}>Comment submitted. Thank you!</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '11px 24px', borderRadius: '10px', background: submitting ? '#92A0AC' : '#D97706', color: 'white', fontSize: '14px', fontWeight: '600', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s', alignSelf: 'flex-start' }}>
              {submitting ? 'Submitting...' : 'Submit Comment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
