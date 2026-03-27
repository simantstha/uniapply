import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import ErrorCard from '../components/ErrorCard';
import { Upload, FileText, Trash2, Download, File, Image, X, Tags, UserCheck, Plus, ChevronDown, Mail } from 'lucide-react';
import GlossaryTooltip from '../components/GlossaryTooltip';

const DOC_TYPES = [
  { value: 'transcript',      label: 'Transcript',               color: '#0071E3', bg: 'rgba(0,113,227,0.1)' },
  { value: 'test_scores',     label: 'Test Scores',              color: '#BF5AF2', bg: 'rgba(191,90,242,0.1)' },
  { value: 'recommendation',  label: 'Recommendation Letter',    color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  { value: 'resume',          label: 'Resume / CV',              color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
  { value: 'financial',       label: 'Financial Documents',      color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
  { value: 'passport',        label: 'Passport / ID',            color: '#64D2FF', bg: 'rgba(100,210,255,0.1)' },
  { value: 'other',           label: 'Other',                    color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
];

const typeMap = Object.fromEntries(DOC_TYPES.map(t => [t.value, t]));

const LOR_STATUS_ORDER = ['not_asked', 'asked', 'confirmed', 'submitted'];

const lorStatusConfig = {
  not_asked:  { label: 'Not Asked',  color: 'var(--text-tertiary)', bg: 'rgba(0,0,0,0.05)' },
  asked:      { label: 'Asked',      color: '#D4A843',              bg: 'rgba(212,168,67,0.12)' },
  confirmed:  { label: 'Confirmed',  color: '#0071E3',              bg: 'rgba(0,113,227,0.1)' },
  submitted:  { label: 'Submitted',  color: '#34C759',              bg: 'rgba(52,199,89,0.1)' },
};

const RELATIONSHIP_OPTIONS = [
  { value: 'professor', label: 'Professor' },
  { value: 'employer',  label: 'Employer' },
  { value: 'mentor',    label: 'Mentor' },
  { value: 'other',     label: 'Other' },
];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return <Image size={16} />;
  return <FileText size={16} />;
}

function isDeadlineSoon(deadline) {
  if (!deadline) return false;
  const diff = new Date(deadline) - new Date();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function formatDeadline(deadline) {
  return new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [form, setForm] = useState({ name: '', docType: 'transcript', universityIds: [] });
  const [universities, setUniversities] = useState([]);
  const [tagModal, setTagModal] = useState(null); // { doc } or null
  const [tagSelection, setTagSelection] = useState([]); // selected universityIds
  const [tagSaving, setTagSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const inputRef = useRef(null);

  // LOR state
  const [lors, setLors] = useState([]);
  const [lorsLoading, setLorsLoading] = useState(true);
  const [showLorForm, setShowLorForm] = useState(false);
  const [lorForm, setLorForm] = useState({ recommenderName: '', recommenderEmail: '', relationship: 'professor', universityIds: [], deadline: '', notes: '' });
  const [lorSaving, setLorSaving] = useState(false);
  const [lorError, setLorError] = useState('');
  const [deletingLorId, setDeletingLorId] = useState(null);
  const [cyclingLorId, setCyclingLorId] = useState(null);
  const [emailModal, setEmailModal] = useState(null); // { lorId, recommenderName, email, loading, error }

  const fetchDocs = () => {
    setFetchError(false);
    setLoading(true);
    apiClient.get('/api/documents')
      .then(res => setDocs(res.data))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  };

  const fetchLors = () => {
    apiClient.get('/api/lors').then(res => setLors(res.data)).catch(() => {}).finally(() => setLorsLoading(false));
  };

  useEffect(() => {
    fetchDocs();
    fetchLors();
    apiClient.get('/api/universities').then(res => setUniversities(res.data)).catch(() => {});
  }, []);

  const openModal = (file) => {
    setPendingFile(file);
    setForm({ name: file.name.replace(/\.[^.]+$/, ''), docType: 'transcript', universityIds: [] });
    setError('');
    setShowModal(true);
  };

  const handleFiles = (files) => {
    const file = files[0];
    if (!file) return;
    openModal(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!pendingFile) return;
    setUploading(true);
    setError('');
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', pendingFile);
      fd.append('name', form.name);
      fd.append('docType', form.docType);
      fd.append('universityIds', JSON.stringify(form.universityIds));
      await apiClient.post('/api/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowModal(false);
      setPendingFile(null);
      fetchDocs();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Upload failed';
      setError(errorMsg);
      setUploadError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    await apiClient.delete(`/api/documents/${id}`);
    setDocs(d => d.filter(doc => doc.id !== id));
  };

  const handleSaveTags = async () => {
    if (!tagModal) return;
    setTagSaving(true);
    try {
      const res = await apiClient.patch(`/api/documents/${tagModal.doc.id}/tags`, {
        universityIds: tagSelection,
      });
      setDocs(d => d.map(doc => doc.id === res.data.id ? res.data : doc));
      setTagModal(null);
    } catch {
      // silent — keep modal open
    } finally {
      setTagSaving(false);
    }
  };

  const handleDownload = async (doc) => {
    const res = await apiClient.get(`/api/documents/${doc.id}/download`);
    window.open(res.data.url, '_blank');
  };

  // LOR handlers
  const handleLorFormReset = () => {
    setLorForm({ recommenderName: '', recommenderEmail: '', relationship: 'professor', universityIds: [], deadline: '', notes: '' });
    setLorError('');
    setShowLorForm(false);
  };

  const handleLorSave = async (e) => {
    e.preventDefault();
    if (!lorForm.recommenderName.trim()) {
      setLorError('Recommender name is required.');
      return;
    }
    setLorSaving(true);
    setLorError('');
    try {
      const res = await apiClient.post('/api/lors', {
        recommenderName: lorForm.recommenderName.trim(),
        recommenderEmail: lorForm.recommenderEmail.trim() || undefined,
        relationship: lorForm.relationship,
        universityIds: lorForm.universityIds,
        deadline: lorForm.deadline || undefined,
        notes: lorForm.notes.trim() || undefined,
      });
      setLors(prev => [res.data, ...prev]);
      handleLorFormReset();
    } catch (err) {
      setLorError(err.response?.data?.error || 'Failed to save.');
    } finally {
      setLorSaving(false);
    }
  };

  const handleLorDeleteConfirm = async (id) => {
    await apiClient.delete(`/api/lors/${id}`).catch(() => {});
    setLors(prev => prev.filter(l => l.id !== id));
    setDeletingLorId(null);
  };

  const handleCycleStatus = async (lor) => {
    const currentIdx = LOR_STATUS_ORDER.indexOf(lor.status);
    const nextStatus = LOR_STATUS_ORDER[(currentIdx + 1) % LOR_STATUS_ORDER.length];
    // Optimistic update
    setLors(prev => prev.map(l => l.id === lor.id ? { ...l, status: nextStatus } : l));
    setCyclingLorId(lor.id);
    try {
      const res = await apiClient.patch(`/api/lors/${lor.id}`, { status: nextStatus });
      setLors(prev => prev.map(l => l.id === lor.id ? { ...l, ...res.data } : l));
    } catch {
      // Revert optimistic update on failure
      setLors(prev => prev.map(l => l.id === lor.id ? { ...l, status: lor.status } : l));
    } finally {
      setCyclingLorId(null);
    }
  };

  const handleDraftEmail = async (lor) => {
    setEmailModal({ lorId: lor.id, recommenderName: lor.recommenderName, email: null, loading: true, error: null });
    try {
      const res = await apiClient.post(`/api/lors/${lor.id}/draft-email`);
      setEmailModal(prev => prev?.lorId === lor.id ? { ...prev, email: res.data.email, loading: false } : prev);
    } catch (err) {
      setEmailModal(prev => prev?.lorId === lor.id ? { ...prev, loading: false, error: err.response?.data?.error || 'Failed to generate email.' } : prev);
    }
  };

  const handleRegeneratEmail = () => {
    const lor = lors.find(l => l.id === emailModal?.lorId);
    if (lor) handleDraftEmail(lor);
  };

  // Group by docType
  const grouped = DOC_TYPES.reduce((acc, t) => {
    const items = docs.filter(d => d.docType === t.value);
    if (items.length) acc.push({ ...t, items });
    return acc;
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-5 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Documents</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{docs.length} file{docs.length !== 1 ? 's' : ''} · transcripts, test scores, recommendations & more</p>
        </div>
        <button onClick={() => inputRef.current?.click()} className="btn-primary flex items-center gap-1.5">
          <Upload size={13} strokeWidth={2.5} />
          <span className="hidden sm:inline">Upload</span>
        </button>
      </div>

      {/* ── Recommendation Letters Section ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(52,199,89,0.1)', color: '#34C759' }}>
              <GlossaryTooltip term="LOR" />
            </span>
            {!lorsLoading && (
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{lors.length}</span>
            )}
          </div>
          <button
            onClick={() => { setShowLorForm(v => !v); setLorError(''); }}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,113,227,0.16)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-subtle)'}>
            <Plus size={12} strokeWidth={2.5} />
            Add Recommender
          </button>
        </div>

        {/* Inline add form */}
        {showLorForm && (
          <div className="card p-4 mb-3 shadow-apple-sm" style={{ border: '1px solid var(--accent)20' }}>
            {lorError && (
              <div className="mb-3 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}>{lorError}</div>
            )}
            <form onSubmit={handleLorSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Recommender Name <span style={{ color: '#FF3B30' }}>*</span></label>
                  <input
                    value={lorForm.recommenderName}
                    onChange={e => setLorForm(f => ({ ...f, recommenderName: e.target.value }))}
                    placeholder="e.g. Dr. Jane Smith"
                    className="input"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Relationship</label>
                  <select
                    value={lorForm.relationship}
                    onChange={e => setLorForm(f => ({ ...f, relationship: e.target.value }))}
                    className="input">
                    {RELATIONSHIP_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Email (optional)</label>
                  <input
                    value={lorForm.recommenderEmail}
                    onChange={e => setLorForm(f => ({ ...f, recommenderEmail: e.target.value }))}
                    placeholder="email@example.com"
                    type="email"
                    className="input"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Deadline (optional)</label>
                  <input
                    value={lorForm.deadline}
                    onChange={e => setLorForm(f => ({ ...f, deadline: e.target.value }))}
                    type="date"
                    className="input"
                  />
                </div>
              </div>

              {universities.length > 0 && (
                <div>
                  <label className="label">Tag Universities</label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    <button type="button"
                      onClick={() => setLorForm(f => ({
                        ...f,
                        universityIds: f.universityIds.length === universities.length
                          ? []
                          : universities.map(u => u.id),
                      }))}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: lorForm.universityIds.length === universities.length ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                        color: lorForm.universityIds.length === universities.length ? 'var(--accent)' : 'var(--text-secondary)',
                      }}>
                      {lorForm.universityIds.length === universities.length ? '✓ All universities' : 'Tag all universities'}
                    </button>
                    {universities.map(u => (
                      <button key={u.id} type="button"
                        onClick={() => setLorForm(f => ({
                          ...f,
                          universityIds: f.universityIds.includes(u.id)
                            ? f.universityIds.filter(id => id !== u.id)
                            : [...f.universityIds, u.id],
                        }))}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between"
                        style={{
                          background: lorForm.universityIds.includes(u.id) ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                          color: lorForm.universityIds.includes(u.id) ? 'var(--accent)' : 'var(--text-secondary)',
                        }}>
                        <span className="truncate">{u.name}</span>
                        {lorForm.universityIds.includes(u.id) && <span className="text-xs ml-2 flex-shrink-0">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={handleLorFormReset} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={lorSaving} className="btn-primary flex-1">
                  {lorSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LOR list */}
        {lorsLoading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
          </div>
        ) : lors.length === 0 && !showLorForm ? (
          <div className="card p-8 text-center shadow-apple-sm">
            <UserCheck size={24} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No recommenders added yet</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>Add the professors or employers writing your letters.</p>
            <button
              onClick={() => setShowLorForm(true)}
              className="btn-primary text-xs px-4 py-1.5 mx-auto">
              Add Recommender
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {lors.map(lor => {
              const sc = lorStatusConfig[lor.status] || lorStatusConfig.not_asked;
              const relLabel = RELATIONSHIP_OPTIONS.find(r => r.value === lor.relationship)?.label || lor.relationship;
              const deadlineSoon = isDeadlineSoon(lor.deadline);
              return (
                <div key={lor.id} className="card p-3.5 shadow-apple-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(52,199,89,0.1)', color: '#34C759' }}>
                    <UserCheck size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{lor.recommenderName}</p>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>· {relLabel}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {lor.deadline && (
                        <span className="text-xs" style={{ color: deadlineSoon ? '#FF3B30' : 'var(--text-tertiary)' }}>
                          {deadlineSoon ? '⚠ ' : ''}Due {formatDeadline(lor.deadline)}
                        </span>
                      )}
                      {lor.universities?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lor.universities.map(u => (
                            <span key={u.id} className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                              {u.name.length > 20 ? u.name.slice(0, 20) + '…' : u.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Draft email button */}
                    <button
                      onClick={() => handleDraftEmail(lor)}
                      title="Draft request email"
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all"
                      style={{ background: 'rgba(0,113,227,0.08)', color: 'var(--accent)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,113,227,0.16)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,113,227,0.08)'}>
                      <Mail size={11} strokeWidth={2} />
                      <span className="hidden sm:inline">Draft email</span>
                    </button>

                    {/* Clickable status badge */}
                    <button
                      onClick={() => !cyclingLorId && handleCycleStatus(lor)}
                      title="Click to advance status"
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all"
                      style={{ background: sc.bg, color: sc.color, opacity: cyclingLorId === lor.id ? 0.6 : 1 }}>
                      {sc.label}
                      <ChevronDown size={10} strokeWidth={2.5} />
                    </button>

                    {/* Delete with inline confirm */}
                    {deletingLorId === lor.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: '#FF3B30' }}>Delete?</span>
                        <button
                          onClick={() => handleLorDeleteConfirm(lor.id)}
                          className="text-xs px-2 py-1 rounded-md text-white"
                          style={{ background: '#FF3B30' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.85)'}
                          onMouseLeave={e => e.currentTarget.style.background = '#FF3B30'}>
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingLorId(null)}
                          className="text-xs px-2 py-1 rounded-md"
                          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingLorId(lor.id)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.18)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        className="card mb-6 border-2 border-dashed flex flex-col items-center justify-center py-8 gap-3 cursor-pointer transition-all"
        style={{ borderColor: dragOver ? 'var(--accent)' : 'var(--border)', background: dragOver ? 'rgba(0,113,227,0.04)' : 'var(--bg-secondary)' }}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,113,227,0.1)' }}>
          <Upload size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Drop files here or click to browse</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>PDF, DOC, DOCX, JPG, PNG · max 20 MB</p>
        </div>
      </div>
      <input ref={inputRef} type="file" className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
        onChange={e => handleFiles(e.target.files)} />

      {/* Upload error */}
      {uploadError && (
        <div className="mb-6 px-4 py-3 rounded-xl text-xs" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}>
          {uploadError}
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : fetchError ? (
        <ErrorCard message="Couldn't load documents" onRetry={fetchDocs} />
      ) : docs.length === 0 ? (
        <div className="card p-10 text-center shadow-apple-sm">
          <File size={28} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No documents uploaded yet</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Upload your transcripts, test scores, and other application materials</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(group => (
            <div key={group.value}>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: group.bg, color: group.color }}>{group.label}</span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{group.items.length}</span>
              </div>
              <div className="space-y-2">
                {group.items.map(doc => (
                  <div key={doc.id} className="card p-3.5 shadow-apple-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: group.bg, color: group.color }}>
                      {fileIcon(doc.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{doc.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {doc.fileName} · {formatSize(doc.fileSize)} · {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {doc.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doc.tags.map(t => (
                            <span key={t.universityId} className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                              {t.university.name.length > 20 ? t.university.name.slice(0, 20) + '…' : t.university.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => { setTagModal({ doc }); setTagSelection(doc.tags?.map(t => t.universityId) || []); }}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                        title="Tag universities">
                        <Tags size={13} />
                      </button>
                      <button onClick={() => handleDownload(doc)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ background: 'rgba(0,113,227,0.08)', color: 'var(--accent)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,113,227,0.16)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,113,227,0.08)'}>
                        <Download size={13} />
                      </button>
                      {deletingId === doc.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: '#FF3B30' }}>Delete?</span>
                          <button
                            onClick={() => { handleDelete(doc.id); setDeletingId(null); }}
                            className="text-xs px-2 py-1 rounded-md text-white"
                            style={{ background: '#FF3B30' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.85)'}
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
                        <button onClick={() => setDeletingId(doc.id)}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.18)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <div className="card shadow-apple-lg w-full sm:max-w-sm rounded-t-2xl rounded-b-none sm:rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Add Document</h2>
              <button onClick={() => { setShowModal(false); setPendingFile(null); }} style={{ color: 'var(--text-tertiary)' }}>
                <X size={15} />
              </button>
            </div>

            {/* File preview */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl mb-4" style={{ background: 'var(--bg-secondary)' }}>
              <FileText size={16} style={{ color: 'var(--accent)' }} />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{pendingFile?.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatSize(pendingFile?.size || 0)}</p>
              </div>
            </div>

            {error && (
              <div className="mb-3 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}>{error}</div>
            )}

            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="label">Document Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Unofficial Transcript - TU" className="input" required />
              </div>
              <div>
                <label className="label">Document Type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {DOC_TYPES.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setForm(f => ({ ...f, docType: t.value }))}
                      className="px-2.5 py-2 rounded-xl text-xs font-medium text-left transition-all"
                      style={form.docType === t.value
                        ? { background: t.bg, color: t.color, border: `1px solid ${t.color}40` }
                        : { background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid transparent' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {universities.length > 0 && (
                <div>
                  <label className="label">Tag Universities</label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    <button type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        universityIds: f.universityIds.length === universities.length
                          ? []
                          : universities.map(u => u.id),
                      }))}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: form.universityIds.length === universities.length ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                        color: form.universityIds.length === universities.length ? 'var(--accent)' : 'var(--text-secondary)',
                      }}>
                      {form.universityIds.length === universities.length ? '✓ All universities' : 'Tag all universities'}
                    </button>
                    {universities.map(u => (
                      <button key={u.id} type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          universityIds: f.universityIds.includes(u.id)
                            ? f.universityIds.filter(id => id !== u.id)
                            : [...f.universityIds, u.id],
                        }))}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between"
                        style={{
                          background: form.universityIds.includes(u.id) ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                          color: form.universityIds.includes(u.id) ? 'var(--accent)' : 'var(--text-secondary)',
                        }}>
                        <span className="truncate">{u.name}</span>
                        {form.universityIds.includes(u.id) && <span className="text-xs ml-2 flex-shrink-0">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowModal(false); setPendingFile(null); }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={uploading} className="btn-primary flex-1">{uploading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tag edit modal */}
      {tagModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <div className="card shadow-apple-lg w-full sm:max-w-sm rounded-t-2xl rounded-b-none sm:rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tag Universities</h2>
              <button onClick={() => setTagModal(null)} style={{ color: 'var(--text-tertiary)' }}><X size={15} /></button>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>{tagModal.doc.name}</p>

            {universities.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No universities added yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto mb-4">
                <button type="button"
                  onClick={() => setTagSelection(tagSelection.length === universities.length ? [] : universities.map(u => u.id))}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: tagSelection.length === universities.length ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                    color: tagSelection.length === universities.length ? 'var(--accent)' : 'var(--text-secondary)',
                  }}>
                  {tagSelection.length === universities.length ? '✓ All universities' : 'Tag all universities'}
                </button>
                {universities.map(u => (
                  <button key={u.id} type="button"
                    onClick={() => setTagSelection(s => s.includes(u.id) ? s.filter(id => id !== u.id) : [...s, u.id])}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between"
                    style={{
                      background: tagSelection.includes(u.id) ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                      color: tagSelection.includes(u.id) ? 'var(--accent)' : 'var(--text-secondary)',
                    }}>
                    <span className="truncate">{u.name}</span>
                    {tagSelection.includes(u.id) && <span className="ml-2 flex-shrink-0">✓</span>}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setTagModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSaveTags} disabled={tagSaving} className="btn-primary flex-1">
                {tagSaving ? 'Saving...' : 'Save Tags'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email draft modal */}
      {emailModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <div className="card shadow-apple-lg w-full sm:max-w-lg rounded-t-2xl rounded-b-none sm:rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Request Email for {emailModal.recommenderName}
              </h2>
              <button onClick={() => setEmailModal(null)} style={{ color: 'var(--text-tertiary)' }}>
                <X size={15} />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              AI-drafted email — review and edit before sending
            </p>

            {emailModal.loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Drafting your email...</p>
              </div>
            ) : emailModal.error ? (
              <div className="py-6 text-center">
                <p className="text-xs mb-4 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}>
                  {emailModal.error}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setEmailModal(null)} className="btn-secondary flex-1">Close</button>
                  <button onClick={handleRegeneratEmail} className="btn-primary flex-1">Try again</button>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  className="w-full rounded-xl p-3 text-xs font-mono resize-none mb-4"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    minHeight: '220px',
                    lineHeight: '1.6',
                  }}
                  value={emailModal.email || ''}
                  onChange={e => setEmailModal(prev => ({ ...prev, email: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button onClick={() => setEmailModal(null)} className="btn-secondary">Close</button>
                  <button
                    onClick={handleRegeneratEmail}
                    className="btn-secondary flex items-center gap-1.5">
                    <Mail size={12} />
                    Regenerate
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(emailModal.email || '')}
                    className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                    Copy to clipboard
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
