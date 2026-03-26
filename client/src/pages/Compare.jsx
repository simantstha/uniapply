import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { ChevronLeft, ExternalLink, Check } from 'lucide-react';

const categoryConfig = {
  dream:  { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', label: 'Dream' },
  target: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', label: 'Target' },
  safety: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)',  label: 'Safety' },
};

const degreeLevelConfig = {
  undergraduate: { label: 'Undergrad',   color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
  masters:       { label: "Master's",    color: '#0071E3', bg: 'rgba(0,113,227,0.1)' },
  phd:           { label: 'PhD',         color: '#BF5AF2', bg: 'rgba(191,90,242,0.1)' },
  certificate:   { label: 'Certificate', color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  other:         { label: 'Other',       color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' },
};

const statusConfig = {
  not_started: { label: 'Not Started', color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' },
  in_progress:  { label: 'In Progress',  color: '#D4A843', bg: 'rgba(212,168,67,0.1)' },
  submitted:    { label: 'Submitted',    color: '#1E2D40', bg: 'rgba(30,45,64,0.08)' },
  accepted:     { label: 'Accepted',     color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  rejected:     { label: 'Rejected',     color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
  waitlisted:   { label: 'Waitlisted',   color: '#D4A843', bg: 'rgba(212,168,67,0.1)' },
};

function Dot({ completion }) {
  if (!completion) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
  if (completion.met) return <span style={{ color: '#16A34A' }}><Check size={12} /></span>;
  if (completion.partial) return <span style={{ color: '#D4A843' }}>{completion.count}/{completion.required}</span>;
  return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
}

function Cell({ value, loading }) {
  if (loading) return (
    <div className="h-4 rounded animate-pulse w-16" style={{ background: 'var(--bg-secondary)' }} />
  );
  return <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</span>;
}

export default function Compare() {
  const [searchParams] = useSearchParams();
  const ids = (searchParams.get('ids') || '').split(',').map(Number).filter(Boolean).slice(0, 4);

  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (!ids.length) return;
    setColumns(ids.map(id => ({ id, uni: null, req: null, loading: true, error: null })));
    ids.forEach(id => {
      Promise.all([
        apiClient.get(`/api/universities/${id}`),
        apiClient.get(`/api/universities/${id}/requirements`),
      ])
        .then(([uniRes, reqRes]) => {
          setColumns(prev => prev.map(col =>
            col.id === id
              ? { ...col, uni: uniRes.data, req: reqRes.data, loading: false }
              : col
          ));
        })
        .catch(err => {
          setColumns(prev => prev.map(col =>
            col.id === id
              ? { ...col, loading: false, error: err.response?.data?.error || 'Failed to load' }
              : col
          ));
        });
    });
  }, [searchParams]);

  if (!ids.length) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No universities selected.</p>
        <Link to="/universities" className="mt-3 inline-block text-sm" style={{ color: 'var(--accent)' }}>← Back to Universities</Link>
      </div>
    );
  }

  const numCols = columns.length;
  const colWidth = `${Math.floor(100 / numCols)}%`;

  const rows = [
    {
      label: 'Program',
      render: (col) => <Cell loading={col.loading} value={col.uni?.program} />,
    },
    {
      label: 'Degree',
      render: (col) => {
        if (col.loading) return <Cell loading />;
        const dl = degreeLevelConfig[col.uni?.degreeLevel] || degreeLevelConfig.other;
        return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: dl.bg, color: dl.color }}>{dl.label}</span>;
      },
    },
    {
      label: 'Category',
      render: (col) => {
        if (col.loading) return <Cell loading />;
        const cat = categoryConfig[col.uni?.category];
        if (!cat) return <span>—</span>;
        return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>;
      },
    },
    {
      label: 'Status',
      render: (col) => {
        if (col.loading) return <Cell loading />;
        const stat = statusConfig[col.uni?.status];
        if (!stat) return <span>—</span>;
        return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: stat.bg, color: stat.color }}>{stat.label}</span>;
      },
    },
    {
      label: 'Deadline',
      render: (col) => <Cell loading={col.loading} value={
        col.uni?.applicationDeadline
          ? new Date(col.uni.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : null
      } />,
    },
    { label: '', isSection: true, sectionLabel: 'Requirements' },
    {
      label: 'Competitive GPA',
      render: (col) => <Cell loading={col.loading} value={col.req?.gpa?.competitive != null ? `${col.req.gpa.competitive} / ${col.req.gpa.scale || '4.0'}` : null} />,
    },
    {
      label: 'Minimum GPA',
      render: (col) => <Cell loading={col.loading} value={col.req?.gpa?.minimum != null ? `${col.req.gpa.minimum} / ${col.req.gpa.scale || '4.0'}` : null} />,
    },
    {
      label: 'TOEFL (iBT)',
      render: (col) => <Cell loading={col.loading} value={col.req?.toefl?.minimum != null ? `${col.req.toefl.minimum}+` : null} />,
    },
    {
      label: 'IELTS',
      render: (col) => <Cell loading={col.loading} value={col.req?.ielts?.minimum != null ? `${col.req.ielts.minimum}+` : null} />,
    },
    {
      label: 'SAT Reading / Math',
      render: (col) => {
        const r = col.req?.scorecard?.sat_reading_midpoint;
        const m = col.req?.scorecard?.sat_math_midpoint;
        return <Cell loading={col.loading} value={(r || m) ? `${r || '?'} / ${m || '?'}` : null} />;
      },
    },
    {
      label: 'GRE',
      render: (col) => {
        if (col.loading) return <Cell loading />;
        const gre = col.req?.gre;
        if (!gre) return <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>—</span>;
        if (gre.required === false) return <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Not required</span>;
        if (gre.required === 'optional') return <span className="text-sm" style={{ color: '#D4A843' }}>Optional</span>;
        return <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Required</span>;
      },
    },
    {
      label: 'Letters of Rec',
      render: (col) => <Cell loading={col.loading} value={col.req?.lor_count != null ? `${col.req.lor_count} required` : null} />,
    },
    {
      label: 'App Fee',
      render: (col) => <Cell loading={col.loading} value={col.req?.application_fee != null ? `$${col.req.application_fee}` : null} />,
    },
    {
      label: 'Acceptance Rate',
      render: (col) => <Cell loading={col.loading} value={col.req?.scorecard?.acceptance_rate != null ? `${(col.req.scorecard.acceptance_rate * 100).toFixed(1)}%` : null} />,
    },
    {
      label: 'Tuition (Intl)',
      render: (col) => <Cell loading={col.loading} value={col.req?.scorecard?.tuition_out_of_state != null ? `$${col.req.scorecard.tuition_out_of_state.toLocaleString()}` : null} />,
    },
    { label: '', isSection: true, sectionLabel: 'Your Documents' },
    {
      label: 'Transcript',
      render: (col) => col.loading ? <Cell loading /> : <Dot completion={col.req?.doc_status?.transcript} />,
    },
    {
      label: 'Test Scores',
      render: (col) => col.loading ? <Cell loading /> : <Dot completion={col.req?.doc_status?.test_scores} />,
    },
    {
      label: 'Rec Letters',
      render: (col) => {
        if (col.loading) return <Cell loading />;
        const ds = col.req?.doc_status?.recommendation;
        if (!ds) return <Dot completion={null} />;
        return (
          <div className="flex flex-col gap-0.5">
            <Dot completion={ds} />
            {ds && !ds.met && (
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{ds.count}/{ds.required}</span>
            )}
          </div>
        );
      },
    },
    {
      label: 'Resume',
      render: (col) => col.loading ? <Cell loading /> : <Dot completion={col.req?.doc_status?.resume} />,
    },
    {
      label: 'SOP Draft',
      render: (col) => col.loading ? <Cell loading /> : <Dot completion={col.req?.doc_status?.sop} />,
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/universities" className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <ChevronLeft size={15} /> Back
        </Link>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Comparing {numCols} {numCols === 1 ? 'University' : 'Universities'}
        </h1>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${numCols * 200 + 160}px` }}>
          {/* University header row */}
          <div className="flex" style={{ paddingLeft: '160px', position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-elevated)' }}>
            {columns.map(col => (
              <div key={col.id} style={{ width: colWidth, minWidth: '200px' }} className="px-4 pb-4">
                {col.loading ? (
                  <div className="space-y-2">
                    <div className="h-4 rounded animate-pulse w-32" style={{ background: 'var(--bg-secondary)' }} />
                    <div className="h-3 rounded animate-pulse w-20" style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                ) : col.error ? (
                  <p className="text-xs" style={{ color: '#FF3B30' }}>{col.error}</p>
                ) : (
                  <div>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{col.uni?.name}</p>
                    {col.uni?.websiteUrl && (
                      <a href={col.uni.websiteUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--accent)' }}>
                        <ExternalLink size={10} /> Website
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {rows.map((row, i) => {
            if (row.isSection) {
              return (
                <div key={i} className="flex items-center pt-4 pb-1"
                  style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: '160px', paddingRight: '16px', flexShrink: 0 }}>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                      {row.sectionLabel}
                    </p>
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="flex items-center py-2.5"
                style={{ borderBottom: '1px solid var(--border-subtle)', background: i % 2 === 0 ? 'rgba(0,0,0,0.02)' : undefined }}>
                <div style={{ width: '160px', paddingRight: '16px', flexShrink: 0 }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{row.label}</p>
                </div>
                {columns.map(col => (
                  <div key={col.id} style={{ width: colWidth, minWidth: '200px' }} className="px-4">
                    {row.render(col)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
