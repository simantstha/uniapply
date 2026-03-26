import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { ChevronLeft, Plus, PenLine, Star, Trash2, Clock, FileText, Sparkles, Crown, BookOpen, ExternalLink } from 'lucide-react';

const categoryConfig = {
  dream:  { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', label: 'Dream' },
  target: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', label: 'Target' },
  safety: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)',  label: 'Safety' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function avgScore(critique) {
  if (!critique) return null;
  const vals = [critique.authenticityScore, critique.specificityScore, critique.clarityScore, critique.impactScore].filter(v => v != null);
  if (!vals.length) return null;
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

function scoreColor(s) {
  if (s >= 7) return '#34C759';
  if (s >= 4) return '#FF9F0A';
  return '#FF3B30';
}

const assessmentStyle = {
  strong: { color: '#34C759', bg: 'rgba(52,199,89,0.08)', border: 'rgba(52,199,89,0.2)' },
  good:   { color: '#FF9F0A', bg: 'rgba(255,159,10,0.08)', border: 'rgba(255,159,10,0.2)' },
  weak:   { color: '#FF3B30', bg: 'rgba(255,59,48,0.08)',  border: 'rgba(255,59,48,0.2)'  },
};

function CritiquePanel({ critique }) {
  if (!critique) return (
    <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl"
      style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--border)' }}>
      <Sparkles size={13} strokeWidth={1.6} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No AI critique yet — open editor to generate one</p>
    </div>
  );

  const avg = avgScore(critique);
  const sc = avg != null ? parseFloat(avg) : null;
  const ast = assessmentStyle[critique.overallAssessment] || assessmentStyle.good;
  const subs = [
    { label: 'Auth',    value: critique.authenticityScore },
    { label: 'Spec',    value: critique.specificityScore },
    { label: 'Clarity', value: critique.clarityScore },
    { label: 'Impact',  value: critique.impactScore },
  ];

  return (
    <div className="mt-3 rounded-xl overflow-hidden"
      style={{ background: 'rgba(191,90,242,0.05)', border: '1px solid rgba(191,90,242,0.18)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid rgba(191,90,242,0.12)' }}>
        <Sparkles size={11} strokeWidth={2} style={{ color: '#BF5AF2', flexShrink: 0 }} />
        <span className="text-xs font-semibold flex-1" style={{ color: '#BF5AF2' }}>AI Critique</span>
        {critique.overallAssessment && (
          <span className="text-xs font-bold capitalize px-2 py-0.5 rounded-lg"
            style={{ background: ast.bg, color: ast.color, border: `1px solid ${ast.border}` }}>
            {critique.overallAssessment}
          </span>
        )}
      </div>
      {/* Scores */}
      <div className="flex items-center gap-4 px-3 py-3">
        {sc != null && (
          <div className="flex-shrink-0 text-center pr-4" style={{ borderRight: '1px solid rgba(191,90,242,0.15)' }}>
            <p className="text-3xl font-bold tabular-nums leading-none" style={{ color: scoreColor(sc) }}>{avg}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>/ 10</p>
          </div>
        )}
        <div className="flex-1 grid grid-cols-4 gap-2">
          {subs.map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-base font-bold tabular-nums leading-none"
                style={{ color: value != null ? scoreColor(value) : 'var(--text-tertiary)' }}>
                {value ?? '—'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SOPList() {
  const { universityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [university, setUniversity] = useState(null);
  const [sops, setSops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sops');
  const [req, setReq] = useState({ loading: false, data: null, error: null });

  const isPremium = user?.plan === 'student' || user?.plan === 'premium';

  useEffect(() => {
    Promise.all([
      apiClient.get(`/api/universities/${universityId}`),
      apiClient.get(`/api/sops?universityId=${universityId}`),
    ])
      .then(([uniRes, sopRes]) => {
        setUniversity(uniRes.data);
        setSops(sopRes.data);
      })
      .catch(() => navigate('/universities'))
      .finally(() => setLoading(false));
  }, [universityId]);

  const handleNew = async () => {
    if (creating) return;
    setCreating(true);
    setError('');
    try {
      const res = await apiClient.post('/api/sops', {
        universityId: parseInt(universityId),
        title: `Draft ${sops.length + 1}`,
        content: '',
      });
      navigate(`/sop/${universityId}/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create draft');
      setCreating(false);
    }
  };

  const handleMarkBest = async (sopId) => {
    try {
      await apiClient.patch(`/api/sops/${sopId}/final`);
      setSops(prev => prev.map(s => ({
        ...s,
        status: s.id === sopId ? 'final' : (s.status === 'final' ? 'draft' : s.status),
      })));
    } catch { /* silent */ }
  };

  const handleDelete = async (sopId) => {
    if (!confirm('Delete this draft and its critique?')) return;
    await apiClient.delete(`/api/sops/${sopId}`);
    setSops(prev => prev.filter(s => s.id !== sopId));
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === 'requirements' && !req.data && !req.loading) {
      setReq({ loading: true, data: null, error: null });
      try {
        const res = await apiClient.get(`/api/universities/${universityId}/requirements`);
        setReq({ loading: false, data: res.data, error: null });
      } catch {
        setReq({ loading: false, data: null, error: 'Failed to load requirements.' });
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
    </div>
  );

  const cat = categoryConfig[university?.category] || categoryConfig.target;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">

      {/* Back */}
      <button onClick={() => navigate('/universities')}
        className="flex items-center gap-1.5 text-sm mb-6 transition-all"
        style={{ color: 'var(--text-tertiary)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
        <ChevronLeft size={16} />
        Universities
      </button>

      {/* University header */}
      <div className="card shadow-apple-sm overflow-hidden mb-2">
        <div className="h-1 w-full" style={{ background: cat.color }} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                {university?.degreeLevel && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    {university.degreeLevel.charAt(0).toUpperCase() + university.degreeLevel.slice(1)}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>{university?.name}</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{university?.program}</p>
            </div>
            {activeTab === 'sops' && (
              <button onClick={handleNew} disabled={creating || (!isPremium && sops.length >= 1)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-white flex-shrink-0 transition-all active:scale-95"
                style={{
                  background: (!isPremium && sops.length >= 1) ? 'rgba(196,98,45,0.35)' : 'var(--accent)',
                  cursor: (!isPremium && sops.length >= 1) ? 'not-allowed' : 'pointer',
                }}>
                <Plus size={14} strokeWidth={2.5} />
                {creating ? 'Creating...' : 'New Draft'}
              </button>
            )}
          </div>
          {!isPremium && sops.length >= 1 && activeTab === 'sops' && (
            <p className="text-xs mt-3 px-3 py-2 rounded-xl" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
              Upgrade to Student or Premium to create multiple drafts.
            </p>
          )}
          {error && (
            <p className="text-xs mt-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}>{error}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          {[
            { id: 'sops', label: 'SOPs', icon: FileText },
            { id: 'requirements', label: 'Requirements', icon: BookOpen },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => handleTabChange(id)}
              className="flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-all relative"
              style={{ color: activeTab === id ? 'var(--accent)' : 'var(--text-secondary)' }}>
              <Icon size={13} strokeWidth={1.8} />
              {label}
              {activeTab === id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'requirements' && (
        <div className="card shadow-apple-sm p-5 mt-4">
          {req.loading && (
            <div className="flex items-center gap-2 py-4">
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Fetching requirements…</span>
            </div>
          )}
          {req.error && <p className="text-sm" style={{ color: '#FF3B30' }}>{req.error}</p>}
          {req.data && <RequirementsPanel data={req.data} websiteUrl={university?.websiteUrl} docStatus={req.data.doc_status} />}
        </div>
      )}

      {activeTab === 'sops' && sops.length === 0 && (
        <div className="card shadow-apple-sm p-12 text-center mt-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(0,113,227,0.08)' }}>
            <FileText size={22} style={{ color: 'var(--accent)' }} strokeWidth={1.6} />
          </div>
          <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>No drafts yet</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>Create your first draft to start writing your {university?.degreeLevel === 'undergraduate' ? 'personal statement' : 'statement of purpose'}.</p>
          <button onClick={handleNew} disabled={creating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-95"
            style={{ background: 'var(--accent)' }}>
            <Plus size={14} strokeWidth={2.5} />
            {creating ? 'Creating...' : 'Create First Draft'}
          </button>
        </div>
      )}

      {activeTab === 'sops' && sops.length > 0 && (
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between px-1 mb-1">
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{sops.length} draft{sops.length !== 1 ? 's' : ''}</p>
            {sops.some(s => s.status === 'final') && (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <Crown size={10} className="inline mr-1" style={{ color: '#FF9F0A' }} />
                Best draft marked
              </p>
            )}
          </div>

          {sops.map((sop, idx) => {
            const latestCritique = sop.critiques?.[0];
            const isBest = sop.status === 'final';

            return (
              <div key={sop.id} className="card shadow-apple-sm overflow-hidden transition-all"
                style={isBest ? { border: '1px solid rgba(255,159,10,0.35)' } : {}}>

                {/* Best banner */}
                {isBest && (
                  <div className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold"
                    style={{ background: 'rgba(255,159,10,0.08)', color: '#FF9F0A', borderBottom: '1px solid rgba(255,159,10,0.15)' }}>
                    <Crown size={11} strokeWidth={2} />
                    Best Draft
                  </div>
                )}

                <div className="p-4 flex items-start gap-4">
                  {/* Draft number */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ background: isBest ? 'rgba(255,159,10,0.1)' : 'var(--bg-secondary)', color: isBest ? '#FF9F0A' : 'var(--text-tertiary)' }}>
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{sop.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <FileText size={10} />
                            {sop.wordCount} words
                          </span>
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <Clock size={10} />
                            {timeAgo(sop.updatedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleMarkBest(sop.id)}
                          title={isBest ? 'Best draft' : 'Mark as best'}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            background: isBest ? 'rgba(255,159,10,0.12)' : 'var(--bg-secondary)',
                            color: isBest ? '#FF9F0A' : 'var(--text-tertiary)',
                          }}
                          onMouseEnter={e => { if (!isBest) e.currentTarget.style.color = '#FF9F0A'; }}
                          onMouseLeave={e => { if (!isBest) e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
                          <Star size={13} fill={isBest ? '#FF9F0A' : 'none'} />
                        </button>
                        <button onClick={() => handleDelete(sop.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: 'rgba(255,59,48,0.06)', color: '#FF3B30' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.14)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.06)'}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <CritiquePanel critique={latestCritique} />

                    <Link to={`/sop/${universityId}/${sop.id}`}
                      className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium transition-all"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,113,227,0.08)'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                      <PenLine size={11} strokeWidth={2} />
                      Open in Editor
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RequirementsPanel({ data, websiteUrl, docStatus }) {
  const formatRate = (r) => r != null ? `${Math.round(r * 100)}%` : null;
  const formatGpa = (g) => g != null ? Number(g).toFixed(1) : null;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>Requirements for</p>
        <p className="text-base font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Fraunces, serif' }}>
          {data.matched_program || 'Program'}
        </p>
        {data.program_exists === false && (
          <p className="text-xs mt-1" style={{ color: '#D4A843' }}>
            ⚠ This exact program may not be offered — showing closest match
          </p>
        )}
      </div>

      {/* Academic requirements */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>Academic</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.gpa?.competitive != null && (
            <Req label="Competitive GPA" value={`${formatGpa(data.gpa.competitive)} / ${data.gpa.scale || '4.0'}`} />
          )}
          {data.gpa?.minimum != null && (
            <Req label="Minimum GPA" value={`${formatGpa(data.gpa.minimum)} / ${data.gpa.scale || '4.0'}`} />
          )}
          {data.gre?.required !== undefined && (
            <Req label="GRE"
              value={data.gre.required === false ? 'Not required' : data.gre.required === 'optional' ? 'Optional' : 'Required'}
              highlight={data.gre.required === true}
              completion={docStatus?.test_scores}
            />
          )}
          {data.gre?.quant_range && <Req label="GRE Quant" value={data.gre.quant_range} completion={docStatus?.test_scores} />}
          {data.scorecard?.acceptance_rate != null && <Req label="Acceptance Rate" value={formatRate(data.scorecard.acceptance_rate)} />}
          {data.scorecard?.tuition_out_of_state != null && <Req label="Tuition (Intl)" value={`$${data.scorecard.tuition_out_of_state.toLocaleString()}`} />}
          {data.lor_count != null && (
            <Req label="Letters of Rec"
              value={`${data.lor_count} required`}
              completion={docStatus?.recommendation}
              showCount
            />
          )}
          {data.application_fee != null && <Req label="App Fee" value={`$${data.application_fee}`} />}
          {data.international_deadline && <Req label="Intl Deadline" value={data.international_deadline} />}
          <Req label="SOP / Personal Statement" value={docStatus?.sop?.met ? 'Draft ready' : 'Not started'} completion={docStatus?.sop} />
        </div>
      </div>

      {/* English proficiency */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>English Proficiency</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.toefl?.minimum != null && <Req label="TOEFL (iBT)" value={`${data.toefl.minimum}+`} highlight completion={docStatus?.test_scores} />}
          {data.ielts?.minimum != null && <Req label="IELTS" value={`${data.ielts.minimum}+`} highlight completion={docStatus?.test_scores} />}
        </div>
        {data.english_proficiency_waiver && (
          <p className="text-xs mt-2 px-3 py-2 rounded-xl" style={{ background: 'var(--gold-subtle)', color: 'var(--gold)' }}>
            ⚡ Waiver: {data.english_proficiency_waiver}
          </p>
        )}
      </div>

      {/* International-specific */}
      {(data.credential_evaluation || data.financial_docs || data.visa) && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>International Requirements</p>
          <div className="space-y-2">
            {data.credential_evaluation && (
              <InfoRow icon="📋" label="Transcript Evaluation" value={data.credential_evaluation} />
            )}
            {data.financial_docs && (
              <InfoRow icon="💰" label="Proof of Funds" value={data.financial_docs} />
            )}
            {data.visa && (
              <InfoRow icon="✈️" label="Student Visa" value={data.visa} />
            )}
          </div>
        </div>
      )}

      {/* Application components */}
      {data.application_components?.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>Required Documents</p>
          <div className="flex flex-wrap gap-1.5">
            {data.application_components.map((c, i) => {
              const lc = c.toLowerCase();
              let comp = null;
              if (lc.includes('transcript')) comp = docStatus?.transcript;
              else if (lc.includes('resume') || lc.includes('cv')) comp = docStatus?.resume;
              else if (lc.includes('financial') || lc.includes('fund')) comp = docStatus?.financial;
              const met = comp?.met;
              return (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
                  style={{
                    background: met ? 'rgba(22,163,74,0.1)' : 'var(--accent-subtle)',
                    color: met ? '#16A34A' : 'var(--accent)',
                  }}>
                  {met && '✓ '}{c}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {data.notes && (
        <p className="text-sm leading-relaxed px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{data.notes}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {data.source_type === 'website' ? '✓ From official website' : 'AI knowledge — '}
          {data.source_type !== 'website' && websiteUrl && (
            <a href={websiteUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
              verify on official site
            </a>
          )}
        </p>
        {data.source_url && (
          <a href={data.source_url} target="_blank" rel="noreferrer"
            className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
            <ExternalLink size={10} /> Source
          </a>
        )}
      </div>
    </div>
  );
}

function Req({ label, value, highlight, completion, showCount }) {
  const met = completion?.met;
  const partial = completion?.partial;

  let borderColor = 'var(--border-subtle)';
  let bg = 'var(--bg-secondary)';
  if (met) { borderColor = 'rgba(22,163,74,0.3)'; bg = 'rgba(22,163,74,0.06)'; }
  else if (partial) { borderColor = 'rgba(212,168,67,0.3)'; bg = 'rgba(212,168,67,0.06)'; }

  return (
    <div className="px-3 py-2.5 rounded-xl relative" style={{ background: bg, border: `1px solid ${borderColor}` }}>
      <p className="text-xs uppercase tracking-wide font-semibold mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-sm font-semibold pr-5" style={{ color: highlight && !met ? 'var(--accent)' : 'var(--text-primary)' }}>{value}</p>
      {showCount && completion && (
        <p className="text-xs mt-0.5" style={{ color: met ? '#16A34A' : partial ? '#D4A843' : 'var(--text-tertiary)' }}>
          {completion.count} / {completion.required} uploaded
        </p>
      )}
      {completion && (
        <span className="absolute top-2 right-2 text-xs">
          {met ? '✓' : partial ? `${completion.count}/${completion.required}` : ''}
        </span>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
      <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide font-semibold mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}
