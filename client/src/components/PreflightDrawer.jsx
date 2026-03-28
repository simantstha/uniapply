// client/src/components/PreflightDrawer.jsx
import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { getPortalInfo } from '../data/portalUrls';

export default function PreflightDrawer({ university, onClose, onMarkApplied }) {
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!university) return;
    setLoading(true);
    setConfirming(false);
    apiClient.get(`/api/universities/${university.id}/checklist`)
      .then(res => setChecklist(res.data.checklist || []))
      .catch(() => setChecklist([]))
      .finally(() => setLoading(false));
  }, [university?.id]);

  if (!university) return null;

  const portal = getPortalInfo(university.name, university.degreeLevel);

  const checks = [
    {
      label: 'SOP written & critiqued',
      done: checklist.some(c => c.item === 'Statement of Purpose' && c.status === 'complete'),
      link: `/sop/${university.id}`,
      linkLabel: 'Open SOP Editor',
    },
    {
      label: 'Recommendation letters confirmed',
      done: checklist.some(c => c.item === 'Recommendation Letters' && c.status === 'complete'),
      link: '/documents',
      linkLabel: 'Manage LORs',
    },
    {
      label: 'Transcript uploaded',
      done: checklist.some(c => c.item === 'Transcript' && c.status === 'complete'),
      link: '/documents',
      linkLabel: 'Upload Documents',
    },
    {
      label: 'Test scores uploaded',
      done: checklist.some(c => c.item === 'Test Scores' && c.status === 'complete'),
      link: '/documents',
      linkLabel: 'Upload Documents',
    },
  ];

  const allDone = checks.every(c => c.done);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
      />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: 420,
        background: 'var(--bg-primary)', borderLeft: '1px solid var(--border)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 30px rgba(0,0,0,0.15)',
      }}>
        <div className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Ready to Apply?
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {university.name}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: 'var(--text-tertiary)' }}>
              Pre-flight checklist
            </h3>
            {loading ? (
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Checking…</div>
            ) : (
              <div className="space-y-2">
                {checks.map(c => (
                  <div key={c.label} className="flex items-center justify-between gap-3 py-2"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      {c.done
                        ? <CheckCircle size={15} style={{ color: '#34C759', flexShrink: 0 }} />
                        : <AlertCircle size={15} style={{ color: '#D4A843', flexShrink: 0 }} />}
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{c.label}</span>
                    </div>
                    {!c.done && (
                      <Link to={c.link} onClick={onClose}
                        className="text-xs flex items-center gap-0.5 flex-shrink-0"
                        style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                        {c.linkLabel} <ChevronRight size={11} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!loading && !allDone && (
              <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>
                You can still proceed — these are recommendations, not blockers.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: 'var(--text-tertiary)' }}>
              Application portal
            </h3>
            {portal ? (
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: portal.type === 'common_app' ? 'rgba(59,130,246,0.1)' : 'rgba(52,199,89,0.1)',
                      color: portal.type === 'common_app' ? '#3B82F6' : '#34C759',
                    }}>
                    {portal.type === 'common_app' ? 'Common App' : 'Direct Portal'}
                  </span>
                </div>
                {!confirming ? (
                  <button
                    onClick={() => setConfirming(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Go to Application Portal
                    <ExternalLink size={14} />
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-center" style={{ color: 'var(--text-primary)' }}>
                      Mark this as Applied?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { window.open(portal.url, '_blank'); onMarkApplied(university.id); onClose(); }}
                        className="flex-1 py-2 rounded-xl text-sm font-medium"
                        style={{ background: '#34C759', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        Yes, I'm applying
                      </button>
                      <button
                        onClick={() => { window.open(portal.url, '_blank'); onClose(); }}
                        className="flex-1 py-2 rounded-xl text-sm"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                        Just browsing
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Portal not found in our database.{' '}
                  {university.websiteUrl
                    ? <a href={university.websiteUrl} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--accent)' }}>Visit university website →</a>
                    : 'Search for the graduate admissions page on the university website.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
