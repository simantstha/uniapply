import { useState, useEffect, useRef } from 'react';
import { UniversitiesSkeleton } from '../components/common/Skeleton';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import ErrorCard from '../components/ErrorCard';
import { Plus, Trash2, ExternalLink, Calendar, PenLine, X, Search, Pencil, CheckSquare, Square, GitCompareArrows, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { searchUniversities } from '../data/usUniversities';

const PHD_BANNER_KEY = 'uniapply_phd_banner_dismissed';

const fundingConfig = {
  funded:      { label: 'Typically Funded',  bg: 'rgba(52,199,89,0.1)',   color: '#34C759' },
  self_funded: { label: 'Self-Funded',        bg: 'rgba(255,59,48,0.08)', color: '#FF3B30' },
  partial:     { label: 'Partial Funding',    bg: 'rgba(212,168,67,0.12)', color: '#D4A843' },
};

const CATEGORIES = ['all', 'dream', 'target', 'safety'];

const fitConfig = {
  strong:     { label: 'Strong Fit',  bg: 'rgba(52,199,89,0.1)',   color: '#34C759' },
  borderline: { label: 'Borderline',  bg: 'rgba(212,168,67,0.12)', color: '#D4A843' },
  reach:      { label: 'Reach',       bg: 'rgba(255,59,48,0.1)',   color: '#FF3B30' },
  unknown:    { label: 'Fit Unknown', bg: 'rgba(0,0,0,0.05)',      color: 'var(--text-tertiary)' },
};

const degreeLevelConfig = {
  undergraduate: { label: 'Undergrad',    color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
  masters:       { label: "Master's",     color: '#0071E3', bg: 'rgba(0,113,227,0.1)' },
  phd:           { label: 'PhD',          color: '#BF5AF2', bg: 'rgba(191,90,242,0.1)' },
  certificate:   { label: 'Certificate',  color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  other:         { label: 'Other',        color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' },
};

const categoryConfig = {
  dream:  { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: '#7C3AED', label: 'Dream' },
  target: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: '#3B82F6', label: 'Target' },
  safety: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)', border: '#16A34A', label: 'Safety' },
};

const statusConfig = {
  not_started: { label: 'Not Started', color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' },
  in_progress:  { label: 'In Progress',  color: '#D4A843', bg: 'rgba(212,168,67,0.1)' },
  submitted:    { label: 'Submitted',    color: '#1E2D40', bg: 'rgba(30,45,64,0.08)' },
  accepted:     { label: 'Accepted',     color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  rejected:     { label: 'Rejected',     color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
  waitlisted:   { label: 'Waitlisted',   color: '#D4A843', bg: 'rgba(212,168,67,0.1)' },
};

const emptyForm = {
  name: '', program: '', degreeLevel: 'masters', websiteUrl: '',
  category: 'target', applicationDeadline: '', status: 'not_started', notes: '', fundingType: 'unknown',
};

export default function Universities() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(new Set());
  const [universities, setUniversities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [fitScores, setFitScores] = useState({});
  const [bannerDismissed, setBannerDismissed] = useState(() => localStorage.getItem(PHD_BANNER_KEY) === 'true');

  // AI Suggestions state
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [addingSelected, setAddingSelected] = useState(false);

  const fetchData = () => {
    setFetchError(false);
    setLoading(true);
    apiClient.get('/api/universities')
      .then(res => setUniversities(res.data))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
    apiClient.get('/api/universities/fit-scores').then(res => setFitScores(res.data.scores || {})).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));
  const setEdit = field => e => setEditForm(f => ({ ...f, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.applicationDeadline) delete payload.applicationDeadline;
      else payload.applicationDeadline = new Date(payload.applicationDeadline).toISOString();
      await apiClient.post('/api/universities', payload);
      setShowModal(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add university');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u) => {
    setEditingUniversity(u);
    setEditForm({
      name: u.name,
      program: u.program,
      degreeLevel: u.degreeLevel,
      websiteUrl: u.websiteUrl || '',
      category: u.category,
      applicationDeadline: u.applicationDeadline
        ? new Date(u.applicationDeadline).toISOString().split('T')[0]
        : '',
      status: u.status,
      notes: u.notes || '',
      fundingType: u.fundingType || 'unknown',
    });
    setEditError('');
  };

  const closeEdit = () => { setEditingUniversity(null); setEditError(''); };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    try {
      const payload = { ...editForm };
      if (!payload.applicationDeadline) delete payload.applicationDeadline;
      else payload.applicationDeadline = new Date(payload.applicationDeadline).toISOString();
      const res = await apiClient.put(`/api/universities/${editingUniversity.id}`, payload);
      setUniversities(prev => prev.map(x => x.id === editingUniversity.id ? res.data : x));
      closeEdit();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await apiClient.delete(`/api/universities/${id}`);
    fetchData();
  };

  const closeModal = () => { setShowModal(false); setError(''); setForm(emptyForm); };

  const dismissBanner = () => {
    localStorage.setItem(PHD_BANNER_KEY, 'true');
    setBannerDismissed(true);
  };

  const fetchSuggestions = async () => {
    setSuggestLoading(true);
    setSuggestError('');
    setSuggestions([]);
    setSelectedSuggestions(new Set());
    try {
      const res = await apiClient.post('/api/onboarding/suggest-universities');
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      setSuggestError(err.response?.data?.error || 'Failed to get suggestions. Make sure your profile is complete.');
    } finally {
      setSuggestLoading(false);
    }
  };

  const openSuggestModal = () => {
    setShowSuggestModal(true);
    fetchSuggestions();
  };

  const closeSuggestModal = () => {
    setShowSuggestModal(false);
    setSuggestions([]);
    setSuggestError('');
    setSelectedSuggestions(new Set());
  };

  const toggleSuggestion = (idx) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const addSelectedSuggestions = async () => {
    if (selectedSuggestions.size === 0) return;
    setAddingSelected(true);
    const toAdd = [...selectedSuggestions].map(i => suggestions[i]);
    try {
      await Promise.all(toAdd.map(s =>
        apiClient.post('/api/universities', {
          name: s.name,
          program: s.program,
          degreeLevel: 'masters',
          category: s.tier,
          status: 'not_started',
          fundingType: 'unknown',
        })
      ));
      closeSuggestModal();
      fetchData();
    } catch {
      setSuggestError('Failed to add some universities. Please try again.');
    } finally {
      setAddingSelected(false);
    }
  };

  const hasPhdUniversity = universities.some(u => u.degreeLevel === 'phd');
  const filtered = filter === 'all' ? universities : universities.filter(u => u.category === filter);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Universities</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{universities.length} added</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openSuggestModal} className="btn-secondary flex items-center gap-1.5">
            <Sparkles size={14} />
            <span className="hidden sm:inline">AI Suggestions</span>
            <span className="sm:hidden">Suggest</span>
          </button>
          <button onClick={() => { setShowModal(true); setSelected(new Set()); }} className="btn-primary flex items-center gap-1.5">
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add University</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Profile completion nudge for AI suggestions */}
      {!loading && universities.length > 0 && (
        <ProfileCompletionNudge />
      )}

      {/* PhD Funding Awareness Banner */}
      {hasPhdUniversity && !bannerDismissed && (
        <div className="flex items-start justify-between gap-3 mb-5 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)' }}>
          <p className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
            <span className="mr-1">💡</span>
            <strong>Did you know?</strong> PhD programs in the US are typically fully funded — tuition covered + monthly stipend through Teaching/Research Assistantships. You may not need to self-fund your PhD.{' '}
            <Link to="/timeline" className="underline font-medium" style={{ color: '#D4A843' }}>Learn more</Link>
          </p>
          <button onClick={dismissBanner} className="flex-shrink-0 p-0.5 rounded-md transition-colors"
            style={{ color: '#D4A843' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,168,67,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-1.5 mb-5 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-secondary)' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
            style={filter === c
              ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { color: 'var(--text-secondary)' }}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <UniversitiesSkeleton />
      ) : fetchError ? (
        <ErrorCard message="Couldn't load universities" onRetry={fetchData} />
      ) : filtered.length === 0 && universities.length === 0 ? (
        <div className="card p-12 text-center shadow-apple-sm">
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>No universities added yet. Start by searching for programs above.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center shadow-apple-sm">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No universities in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(u => {
            const cat = categoryConfig[u.category];
            const stat = statusConfig[u.status];
            const dl = degreeLevelConfig[u.degreeLevel] || degreeLevelConfig.masters;
            const fitKey = fitScores[u.id] || 'unknown';
            const fit = fitConfig[fitKey] || fitConfig.unknown;
            // Determine displayed funding type for badge
            const displayFundingType = (u.fundingType === 'unknown' && u.degreeLevel === 'phd')
              ? 'funded'
              : (u.fundingType !== 'unknown' ? u.fundingType : null);
            const fundingBadge = displayFundingType ? fundingConfig[displayFundingType] : null;
            // Only show badge: funded (for phd), self_funded (user-set), partial (user-set)
            // Hide if unknown masters/undergrad
            const showFundingBadge = !!fundingBadge && (
              displayFundingType === 'funded' ||
              (displayFundingType === 'self_funded' && !u.fundingSuggested) ||
              (displayFundingType === 'partial' && !u.fundingSuggested)
            );
            return (
              <div key={u.id} className="card shadow-apple-sm hover:shadow-apple transition-all flex flex-col overflow-hidden">
                  <div className="h-1 w-full flex-shrink-0" style={{ background: cat.border }} />
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{u.name}</h3>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{u.program}</p>
                        {fitKey !== 'unknown' && (
                          <span className="inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: fit.bg, color: fit.color }}>
                            {fit.label}
                          </span>
                        )}
                        {showFundingBadge && (
                          <span
                            className="inline-block mt-1.5 ml-1 text-xs font-medium px-2 py-0.5 rounded-full cursor-default"
                            style={{ background: fundingBadge.bg, color: fundingBadge.color }}
                            title="PhD programs in the US typically offer Teaching/Research Assistantships covering full tuition + monthly stipend (~$1,500-2,500)">
                            {fundingBadge.label} ⓘ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleSelect(u.id)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: selected.has(u.id) ? 'var(--accent)' : 'var(--text-tertiary)' }}
                          title={selected.has(u.id) ? 'Deselect' : selected.size >= 4 ? 'Max 4 selected' : 'Select for comparison'}
                          disabled={!selected.has(u.id) && selected.size >= 4}>
                          {selected.has(u.id) ? <CheckSquare size={13} /> : <Square size={13} />}
                        </button>
                        <button onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: 'var(--text-tertiary)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                          title="Edit">
                          <Pencil size={13} />
                        </button>
                        {deletingId === u.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: '#FF3B30' }}>Delete?</span>
                            <button
                              onClick={() => { handleDelete(u.id); setDeletingId(null); }}
                              className="text-xs px-2 py-1 rounded-md text-white"
                              style={{ background: '#FF3B30' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#D93025'}
                              onMouseLeave={e => e.currentTarget.style.background = '#FF3B30'}>
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="text-xs px-2 py-1 rounded-md"
                              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingId(u.id)}
                            className="p-1.5 rounded-lg transition-all"
                            style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: dl.bg, color: dl.color }}>{dl.label}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: stat.bg, color: stat.color }}>{stat.label}</span>
                    </div>

                    {u.applicationDeadline && (
                      <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                        <Calendar size={11} />
                        {new Date(u.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                    {u.websiteUrl && (
                      <a href={u.websiteUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}>
                        <ExternalLink size={11} /> Visit website
                      </a>
                    )}
                  </div>

                <div className="px-5 pb-5">
                    <Link to={`/sop/${u.id}`} className="btn-primary w-full flex items-center justify-center gap-2 py-2">
                      <PenLine size={12} strokeWidth={2} /> Open
                    </Link>
                  </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <div className="card shadow-apple-lg w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl rounded-b-none sm:rounded-b-2xl overflow-y-auto"
            style={{ maxHeight: '90vh' }}>
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Add University</h2>
                <button onClick={closeModal}
                  className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <X size={15} />
                </button>
              </div>

              {error && (
                <div className="mb-4 px-3.5 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleAdd} className="space-y-3">
                {/* University name with autocomplete */}
                <UniversityAutocomplete
                  value={form.name}
                  onChange={name => setForm(f => ({ ...f, name }))}
                  onSelect={({ name, websiteUrl }) => setForm(f => ({ ...f, name, websiteUrl: websiteUrl || f.websiteUrl }))}
                />

                <MField label="Program *" value={form.program} onChange={set('program')} required placeholder="e.g. BS Computer Science" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Degree Level *</label>
                    <select value={form.degreeLevel} onChange={set('degreeLevel')} className="input">
                      <option value="undergraduate">Undergraduate</option>
                      <option value="masters">Master's</option>
                      <option value="phd">PhD</option>
                      <option value="certificate">Certificate</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Category *</label>
                    <select value={form.category} onChange={set('category')} className="input">
                      <option value="dream">Dream</option>
                      <option value="target">Target</option>
                      <option value="safety">Safety</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Deadline</label>
                  <input type="date" value={form.applicationDeadline} onChange={set('applicationDeadline')} className="input" />
                </div>

                <MField label="Website" value={form.websiteUrl} onChange={set('websiteUrl')} placeholder="https://..." />

                <div>
                  <label className="label">Notes</label>
                  <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Any notes..." className="input resize-none" />
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Adding...' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating compare bar */}
      {selected.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-apple-lg"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {selected.size} selected
          </span>
          <button
            onClick={() => navigate(`/compare?ids=${[...selected].join(',')}`)}
            className="btn-primary flex items-center gap-2 py-1.5 px-4">
            <GitCompareArrows size={14} />
            Compare
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="p-1.5 rounded-lg"
            style={{ color: 'var(--text-tertiary)' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* AI Suggestions Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <div className="card shadow-apple-lg w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl rounded-b-none sm:rounded-b-2xl overflow-y-auto"
            style={{ maxHeight: '90vh' }}>
            <div className="p-5 md:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(196,98,45,0.1)' }}>
                    <Sparkles size={15} style={{ color: 'var(--accent)' }} />
                  </div>
                  <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>AI University Suggestions</h2>
                </div>
                <button onClick={closeSuggestModal}
                  className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <X size={15} />
                </button>
              </div>
              <p className="text-xs mb-5 ml-10" style={{ color: 'var(--text-secondary)' }}>
                Based on your profile — select universities to add to your list.
              </p>

              {suggestError && (
                <div className="mb-4 px-3.5 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}>
                  {suggestError}
                </div>
              )}

              {suggestLoading ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Claude is finding the best matches for your profile...</p>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-5">
                  {['dream', 'target', 'safety'].map(tier => {
                    const tierSuggestions = suggestions.map((s, i) => ({ ...s, idx: i })).filter(s => s.tier === tier);
                    if (!tierSuggestions.length) return null;
                    const tc = categoryConfig[tier];
                    return (
                      <div key={tier}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                            style={{ background: tc.bg, color: tc.color }}>
                            {tc.label}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {tierSuggestions.map(s => {
                            const isSelected = selectedSuggestions.has(s.idx);
                            return (
                              <button key={s.idx} onClick={() => toggleSuggestion(s.idx)}
                                className="w-full text-left p-3.5 rounded-xl transition-all flex items-start gap-3"
                                style={{
                                  background: isSelected ? `${tc.bg}` : 'var(--bg-secondary)',
                                  border: `1.5px solid ${isSelected ? tc.border : 'transparent'}`,
                                }}>
                                <span className="flex-shrink-0 mt-0.5" style={{ color: isSelected ? tc.color : 'var(--text-tertiary)' }}>
                                  {isSelected ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{s.country}</span>
                                  </div>
                                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{s.program}</p>
                                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{s.reason}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <button onClick={closeSuggestModal} className="btn-secondary flex-1">Cancel</button>
                    <button
                      onClick={addSelectedSuggestions}
                      disabled={selectedSuggestions.size === 0 || addingSelected}
                      className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                      {addingSelected ? 'Adding...' : selectedSuggestions.size > 0 ? `Add ${selectedSuggestions.size} Selected` : 'Select Universities'}
                    </button>
                  </div>
                </div>
              ) : !suggestError ? (
                <div className="py-8 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No suggestions available. Please complete your profile first.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Edit University Modal */}
      {editingUniversity && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <div className="card shadow-apple-lg w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl rounded-b-none sm:rounded-b-2xl overflow-y-auto"
            style={{ maxHeight: '90vh' }}>
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Edit University</h2>
                <button onClick={closeEdit}
                  className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <X size={15} />
                </button>
              </div>

              {editError && (
                <div className="mb-4 px-3.5 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}>
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSave} className="space-y-3">
                <div>
                  <label className="label">University Name *</label>
                  <input value={editForm.name} onChange={setEdit('name')} required className="input" />
                </div>

                <MField label="Program *" value={editForm.program} onChange={setEdit('program')} required placeholder="e.g. BS Computer Science" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Degree Level *</label>
                    <select value={editForm.degreeLevel} onChange={setEdit('degreeLevel')} className="input">
                      <option value="undergraduate">Undergraduate</option>
                      <option value="masters">Master's</option>
                      <option value="phd">PhD</option>
                      <option value="certificate">Certificate</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Category *</label>
                    <select value={editForm.category} onChange={setEdit('category')} className="input">
                      <option value="dream">Dream</option>
                      <option value="target">Target</option>
                      <option value="safety">Safety</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Status</label>
                    <select value={editForm.status} onChange={setEdit('status')} className="input">
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="submitted">Submitted</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="waitlisted">Waitlisted</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Funding Type</label>
                    <select value={editForm.fundingType} onChange={setEdit('fundingType')} className="input">
                      <option value="funded">Typically Funded</option>
                      <option value="self_funded">Self-Funded</option>
                      <option value="partial">Partial Funding</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Deadline</label>
                  <input type="date" value={editForm.applicationDeadline} onChange={setEdit('applicationDeadline')} className="input" />
                </div>

                <MField label="Website" value={editForm.websiteUrl} onChange={setEdit('websiteUrl')} placeholder="https://..." />

                <div>
                  <label className="label">Notes</label>
                  <textarea value={editForm.notes} onChange={setEdit('notes')} rows={2} placeholder="Any notes..." className="input resize-none" />
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={closeEdit} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={editSaving} className="btn-primary flex-1">{editSaving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UniversityAutocomplete({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);

    // Static list: instant, no network
    const local = searchUniversities(val);
    setSuggestions(local);
    setOpen(local.length > 0);

    // Server search: debounced, but server now searches in-memory (no API call per request)
    clearTimeout(debounceRef.current);
    if (val.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await apiClient.get(`/api/college-search?q=${encodeURIComponent(val)}`);
          const remote = res.data || [];
          if (!remote.length) return;
          const remoteNames = new Set(remote.map(r => r.name.toLowerCase()));
          const localOnly = local.filter(l => !remoteNames.has(l.name.toLowerCase()));
          const merged = [...remote, ...localOnly].slice(0, 10);
          setSuggestions(merged);
          setOpen(merged.length > 0);
        } catch {
          // Keep local results on failure
        }
      }, 200);
    }
  };

  const handleSelect = (s) => {
    onSelect({ name: s.name, websiteUrl: s.website || s.websiteUrl || '' });
    setSuggestions([]);
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="label">University Name *</label>
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
        <input
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          required
          placeholder="Search 6,800+ US universities..."
          className="input pl-8 pr-8"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 rounded-xl shadow-apple-lg overflow-hidden"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', maxHeight: '260px', overflowY: 'auto' }}>
          {suggestions.map((s, i) => (
            <button key={i} type="button" onMouseDown={() => handleSelect(s)}
              className="w-full text-left px-3.5 py-2.5 transition-colors"
              style={{ borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {s.sub || (s.website || '').replace('https://', '')}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const NUDGE_KEY = 'uniapply_profile_nudge_dismissed';

function ProfileCompletionNudge() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(NUDGE_KEY) === 'true');

  useEffect(() => {
    if (dismissed) return;
    apiClient.get('/api/profile').then(res => {
      const p = res.data;
      const missing = !p?.workExperience && !p?.communityService && !p?.targetCountries;
      if (missing) setShow(true);
    }).catch(() => {});
  }, [dismissed]);

  if (!show || dismissed) return null;

  return (
    <div className="flex items-start justify-between gap-3 mb-5 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(196,98,45,0.07)', border: '1px solid rgba(196,98,45,0.2)' }}>
      <p className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
        <span className="mr-1.5">✨</span>
        <strong>Get better AI suggestions</strong> — add your work experience, community service, and target countries to your{' '}
        <a href="/profile" className="underline font-medium" style={{ color: 'var(--accent)' }}>profile</a>.
      </p>
      <button onClick={() => { localStorage.setItem(NUDGE_KEY, 'true'); setDismissed(true); setShow(false); }}
        className="flex-shrink-0 p-0.5 rounded-md transition-colors"
        style={{ color: 'var(--accent)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,98,45,0.12)'}
        onMouseLeave={e => e.currentTarget.style.background = ''}>
        <X size={15} />
      </button>
    </div>
  );
}

function MField({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input value={value} onChange={onChange} required={required} placeholder={placeholder} className="input" />
    </div>
  );
}

