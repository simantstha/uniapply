import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { Plus, Trash2, ExternalLink, Calendar, PenLine, X } from 'lucide-react';

const CATEGORIES = ['all', 'dream', 'target', 'safety'];

const degreeLevelConfig = {
  undergraduate: { label: 'Undergrad', color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
  masters:       { label: "Master's",  color: '#0071E3', bg: 'rgba(0,113,227,0.1)' },
  phd:           { label: 'PhD',       color: '#BF5AF2', bg: 'rgba(191,90,242,0.1)' },
  certificate:   { label: 'Certificate', color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  other:         { label: 'Other',     color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' },
};

const categoryConfig = {
  dream:  { color: '#BF5AF2', bg: 'rgba(191,90,242,0.08)',  border: '#BF5AF2', label: 'Dream' },
  target: { color: '#0071E3', bg: 'rgba(0,113,227,0.08)',   border: '#0071E3', label: 'Target' },
  safety: { color: '#34C759', bg: 'rgba(52,199,89,0.08)',   border: '#34C759', label: 'Safety' },
};

const statusConfig = {
  not_started: { label: 'Not Started', color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' },
  in_progress: { label: 'In Progress', color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
  submitted: { label: 'Submitted', color: '#0071E3', bg: 'rgba(0,113,227,0.1)' },
  accepted: { label: 'Accepted', color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  rejected: { label: 'Rejected', color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
  waitlisted: { label: 'Waitlisted', color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
};

const emptyForm = { name: '', program: '', degreeLevel: 'masters', websiteUrl: '', category: 'target', applicationDeadline: '', status: 'not_started', notes: '' };

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

  const filtered = filter === 'all' ? universities : universities.filter(u => u.category === filter);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Universities</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{universities.length} added</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-1.5">
          <Plus size={14} strokeWidth={2.5} /> <span className="hidden sm:inline">Add University</span><span className="sm:hidden">Add</span>
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
            return (
              <div key={u.id} className="card shadow-apple-sm hover:shadow-apple transition-all flex flex-col overflow-hidden">
                {/* Colored top stripe */}
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
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: cat.bg, color: cat.color }}>
                      {cat.label}
                    </span>
                    {(() => { const dl = degreeLevelConfig[u.degreeLevel] || degreeLevelConfig.masters; return (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: dl.bg, color: dl.color }}>
                        {dl.label}
                      </span>
                    ); })()}
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: stat.bg, color: stat.color }}>
                      {stat.label}
                    </span>
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
                  <Link to={`/sop/${u.id}`}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-2">
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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <div className="card shadow-apple-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Add University</h2>
              <button onClick={() => { setShowModal(false); setError(''); setForm(emptyForm); }}
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
              <MField label="University Name *" value={form.name} onChange={set('name')} required placeholder="e.g. MIT" />
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
                <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Any notes..."
                  className="input resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowModal(false); setError(''); setForm(emptyForm); }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Adding...' : 'Add'}</button>
              </div>
            </form>
          </div>
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
