# Edit University Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an edit button to each university card that opens a pre-filled modal allowing students to update all university fields including application status.

**Architecture:** Frontend-only change. The `PUT /api/universities/:id` endpoint already exists and accepts all fields. We add edit state + handlers + modal to `Universities.jsx`. The edit modal reuses the same form field patterns as the existing add modal but uses a plain text input for university name (no autocomplete needed) and adds a status selector.

**Tech Stack:** React, lucide-react, apiClient (axios wrapper)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `client/src/pages/Universities.jsx` | Modify | Add edit state, openEdit/closeEdit/handleEditSave handlers, Pencil icon, edit button on cards, edit modal |

---

## Task 1: Edit University

**Files:**
- Modify: `client/src/pages/Universities.jsx`

- [ ] **Step 1: Add `Pencil` to lucide imports**

Find line 4:
```js
import { Plus, Trash2, ExternalLink, Calendar, PenLine, X, Search } from 'lucide-react';
```
Replace with:
```js
import { Plus, Trash2, ExternalLink, Calendar, PenLine, X, Search, Pencil } from 'lucide-react';
```

- [ ] **Step 2: Add edit state variables**

Find the existing state declarations (lines 38–44):
```js
const [universities, setUniversities] = useState([]);
const [filter, setFilter] = useState('all');
const [showModal, setShowModal] = useState(false);
const [form, setForm] = useState(emptyForm);
const [saving, setSaving] = useState(false);
const [error, setError] = useState('');
const [loading, setLoading] = useState(true);
```
Replace with:
```js
const [universities, setUniversities] = useState([]);
const [filter, setFilter] = useState('all');
const [showModal, setShowModal] = useState(false);
const [form, setForm] = useState(emptyForm);
const [saving, setSaving] = useState(false);
const [error, setError] = useState('');
const [loading, setLoading] = useState(true);
const [editingUniversity, setEditingUniversity] = useState(null);
const [editForm, setEditForm] = useState(emptyForm);
const [editSaving, setEditSaving] = useState(false);
const [editError, setEditError] = useState('');
```

- [ ] **Step 3: Add edit helper — `setEdit`**

Find the existing `set` helper:
```js
const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));
```
Add after it:
```js
const setEdit = field => e => setEditForm(f => ({ ...f, [field]: e.target.value }));
```

- [ ] **Step 4: Add `openEdit`, `closeEdit`, `handleEditSave` handlers**

Find `handleDelete`:
```js
const handleDelete = async (id) => {
```
Add before it:
```js
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
  });
  setEditError('');
};

const closeEdit = () => { setEditingUniversity(null); setEditError(''); };

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

```

- [ ] **Step 5: Add edit button to each university card**

Find the delete button in the card:
```jsx
<button onClick={() => handleDelete(u.id)}
  className="flex-shrink-0 p-1.5 rounded-lg transition-all"
  style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}
  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.18)'}
  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}>
  <Trash2 size={13} />
</button>
```
Replace with:
```jsx
<div className="flex items-center gap-1 flex-shrink-0">
  <button onClick={() => openEdit(u)}
    className="p-1.5 rounded-lg transition-all"
    style={{ color: 'var(--text-tertiary)' }}
    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
    title="Edit">
    <Pencil size={13} />
  </button>
  <button onClick={() => handleDelete(u.id)}
    className="p-1.5 rounded-lg transition-all"
    style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.18)'}
    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}>
    <Trash2 size={13} />
  </button>
</div>
```

- [ ] **Step 6: Add the edit modal**

Find the closing `)}` of the existing add modal (after `{showModal && (...)}`) and add the edit modal after it, before `</div>` that closes the page:

```jsx
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
```

- [ ] **Step 7: Verify the app renders without errors**

```bash
cd /Users/simantstha/Documents/Playground/uniapply/client && npm run build 2>&1 | tail -5
```
Expected: `✓ built in` with no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/simantstha/Documents/Playground/uniapply && git add client/src/pages/Universities.jsx && git commit -m "feat: add edit university modal with status selector"
```

---

## Self-Review

**Spec coverage:**
- ✅ Pencil button on each card next to delete
- ✅ Pre-filled modal with all fields
- ✅ Status selector (only in edit modal, not add modal)
- ✅ Save calls PUT /api/universities/:id
- ✅ Updates card in state without full refetch
- ✅ Plain text input for name (no autocomplete)
- ✅ Form validation: name and program required

**Placeholder scan:** None.

**Type consistency:** `editForm` follows same shape as `emptyForm`. `setEdit` mirrors `set`.
