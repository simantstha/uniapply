import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { Plus, Trash2, ExternalLink, Calendar, PenLine } from 'lucide-react';

const CATEGORIES = ['all', 'dream', 'target', 'safety'];
const STATUSES = ['not_started', 'in_progress', 'submitted', 'accepted', 'rejected', 'waitlisted'];

const categoryStyle = {
  dream: { border: 'border-violet-300', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-400' },
  target: { border: 'border-blue-300', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  safety: { border: 'border-green-300', badge: 'bg-green-100 text-green-700', dot: 'bg-green-400' },
};

const statusLabel = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
};

const statusStyle = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  waitlisted: 'bg-orange-100 text-orange-700',
};

const emptyForm = {
  name: '', program: '', websiteUrl: '', category: 'target',
  applicationDeadline: '', status: 'not_started', notes: '',
};

export default function Universities() {
  const [universities, setUniversities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    apiClient.get('/api/universities')
      .then((res) => setUniversities(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.applicationDeadline) delete payload.applicationDeadline;
      await apiClient.post('/api/universities', payload);
      setShowModal(false);
      setForm(emptyForm);
      fetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add university');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this university?')) return;
    await apiClient.delete(`/api/universities/${id}`);
    fetch();
  };

  const filtered = filter === 'all' ? universities : universities.filter(u => u.category === filter);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Universities</h1>
          <p className="text-sm text-gray-500 mt-0.5">{universities.length} added</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} /> Add University
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === c ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">No universities yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((u) => {
            const cs = categoryStyle[u.category];
            return (
              <div key={u.id} className={`bg-white rounded-xl border-2 ${cs.border} p-5 flex flex-col gap-3`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{u.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{u.program}</p>
                  </div>
                  <button onClick={() => handleDelete(u.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cs.badge}`}>
                    {u.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[u.status]}`}>
                    {statusLabel[u.status]}
                  </span>
                </div>

                {u.applicationDeadline && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar size={12} />
                    {new Date(u.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                )}

                {u.websiteUrl && (
                  <a href={u.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                    <ExternalLink size={11} /> Visit website
                  </a>
                )}

                <Link
                  to={`/sop/${u.id}`}
                  className="flex items-center gap-1.5 mt-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors w-full justify-center"
                >
                  <PenLine size={12} /> Write SOP
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Add University Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-heading font-bold text-gray-900 mb-4">Add University</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-3">
              <ModalField label="University Name *" value={form.name} onChange={set('name')} required placeholder="e.g. MIT" />
              <ModalField label="Program *" value={form.program} onChange={set('program')} required placeholder="e.g. MS Computer Science" />

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                <select value={form.category} onChange={set('category')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="dream">Dream</option>
                  <option value="target">Target</option>
                  <option value="safety">Safety</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Application Deadline</label>
                <input type="date" value={form.applicationDeadline} onChange={set('applicationDeadline')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <ModalField label="Website URL" value={form.websiteUrl} onChange={set('websiteUrl')} placeholder="https://..." />

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Any additional notes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowModal(false); setError(''); setForm(emptyForm); }}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300">
                  {saving ? 'Adding...' : 'Add University'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalField({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}
