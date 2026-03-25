import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { Plus, Trash2, ExternalLink, Calendar, PenLine, X, Search, Loader2 } from 'lucide-react';
import { searchUniversities } from '../data/usUniversities';

const CATEGORIES = ['all', 'dream', 'target', 'safety'];

const degreeLevelConfig = {
  undergraduate: { label: 'Undergrad',    color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
  masters:       { label: "Master's",     color: '#0071E3', bg: 'rgba(0,113,227,0.1)' },
  phd:           { label: 'PhD',          color: '#BF5AF2', bg: 'rgba(191,90,242,0.1)' },
  certificate:   { label: 'Certificate',  color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  other:         { label: 'Other',        color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' },
};

const categoryConfig = {
  dream:  { color: '#BF5AF2', bg: 'rgba(191,90,242,0.08)', border: '#BF5AF2', label: 'Dream' },
  target: { color: '#0071E3', bg: 'rgba(0,113,227,0.08)', border: '#0071E3', label: 'Target' },
  safety: { color: '#34C759', bg: 'rgba(52,199,89,0.08)', border: '#34C759', label: 'Safety' },
};

const statusConfig = {
  not_started: { label: 'Not Started', color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' },
  in_progress:  { label: 'In Progress',  color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
  submitted:    { label: 'Submitted',    color: '#0071E3', bg: 'rgba(0,113,227,0.1)' },
  accepted:     { label: 'Accepted',     color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  rejected:     { label: 'Rejected',     color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
  waitlisted:   { label: 'Waitlisted',   color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
};

const emptyForm = {
  name: '', program: '', degreeLevel: 'masters', websiteUrl: '',
  category: 'target', applicationDeadline: '', status: 'not_started', notes: '',
};

export default function Universities() {
  const [universities, setUniversities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    apiClient.get('/api/universities').then(res => setUniversities(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

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

  const handleDelete = async (id) => {
    if (!confirm('Delete this university and all its SOPs?')) return;
    await apiClient.delete(`/api/universities/${id}`);
    fetchData();
  };

  const closeModal = () => { setShowModal(false); setError(''); setForm(emptyForm); };

  const filtered = filter === 'all' ? universities : universities.filter(u => u.category === filter);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Universities</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{universities.length} added</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
          <Plus size={14} strokeWidth={2.5} />
          <span className="hidden sm:inline">Add University</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

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
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center shadow-apple-sm">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No universities yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(u => {
            const cat = categoryConfig[u.category];
            const stat = statusConfig[u.status];
            const dl = degreeLevelConfig[u.degreeLevel] || degreeLevelConfig.masters;
            return (
              <div key={u.id} className="card shadow-apple-sm hover:shadow-apple transition-all flex flex-col overflow-hidden">
                <div className="h-1 w-full flex-shrink-0" style={{ background: cat.border }} />
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{u.name}</h3>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{u.program}</p>
                    </div>
                    <button onClick={() => handleDelete(u.id)}
                      className="flex-shrink-0 p-1 rounded-lg transition-colors opacity-40 hover:opacity-100"
                      style={{ color: '#FF3B30' }}>
                      <Trash2 size={13} />
                    </button>
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
                    <PenLine size={12} strokeWidth={2} /> Write SOP
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
    </div>
  );
}

function UniversityAutocomplete({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);

    // Show static results immediately
    const local = searchUniversities(val);
    setSuggestions(local);
    setOpen(local.length > 0);

    // Fetch from College Scorecard API (6,800 schools) with debounce
    clearTimeout(debounceRef.current);
    if (val.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await apiClient.get(`/api/college-search?q=${encodeURIComponent(val)}`);
          // no_api_key → silently keep local results
          if (res.data?.error === 'no_api_key') return;
          const remote = res.data.map(r => ({ name: r.name, website: r.website, sub: r.city && r.state ? `${r.city}, ${r.state}` : '' }));
          const remoteNames = new Set(remote.map(r => r.name.toLowerCase()));
          const localOnly = local.filter(l => !remoteNames.has(l.name.toLowerCase()));
          const merged = [...remote, ...localOnly].slice(0, 10);
          setSuggestions(merged);
          setOpen(merged.length > 0);
        } catch {
          // Keep local results on API failure
        } finally {
          setLoading(false);
        }
      }, 350);
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
        {loading && <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: 'var(--text-tertiary)' }} />}
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

function MField({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input value={value} onChange={onChange} required={required} placeholder={placeholder} className="input" />
    </div>
  );
}
