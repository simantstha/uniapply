# University Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let students select 2–4 universities and compare them side by side across requirements, stats, and document completion status.

**Architecture:** Three-part frontend change. (1) Universities page gets checkboxes on each card and a floating action bar that appears when 2–4 are selected. (2) A new Compare page at `/compare?ids=1,2,3` fetches each university + its requirements in parallel and renders a horizontal comparison table. (3) App.jsx gets the new `/compare` route. No backend changes needed — the existing `GET /api/universities/:id` and `GET /api/universities/:id/requirements` endpoints provide all data.

**Tech Stack:** React, React Router (`useNavigate`, `useSearchParams`), apiClient (axios wrapper)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `client/src/pages/Universities.jsx` | Modify | `selected` state (Set), checkbox on each card, floating action bar |
| `client/src/pages/Compare.jsx` | Create | Comparison table page — fetch universities + requirements, render table |
| `client/src/App.jsx` | Modify | Add `/compare` route |

---

## Task 1: Add Checkboxes and Floating Action Bar to Universities Page

**Files:**
- Modify: `client/src/pages/Universities.jsx`

- [ ] **Step 1: Add `useNavigate` and `CheckSquare` / `Square` imports**

Find:
```js
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { Plus, Trash2, ExternalLink, Calendar, PenLine, X, Search, Pencil } from 'lucide-react';
```
Replace with:
```js
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { Plus, Trash2, ExternalLink, Calendar, PenLine, X, Search, Pencil, CheckSquare, Square, GitCompareArrows } from 'lucide-react';
```

- [ ] **Step 2: Add `selected` state and `navigate`**

Inside the `Universities` component, after the existing state declarations, add:
```js
const navigate = useNavigate();
const [selected, setSelected] = useState(new Set());
```

- [ ] **Step 3: Add `toggleSelect` handler**

After `const closeEdit = ...` (or after other handlers), add:
```js
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
```

- [ ] **Step 4: Clear selection when add modal opens**

Change:
```js
<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
```
To:
```js
<button onClick={() => { setShowModal(true); setSelected(new Set()); }} className="btn-primary flex items-center gap-1.5">
```

- [ ] **Step 5: Add checkbox to each card**

Inside the card's top-right button group (the `<div className="flex items-center gap-1 flex-shrink-0">` added for the edit/delete buttons), add a checkbox button before the pencil button:

```jsx
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
  <button onClick={() => handleDelete(u.id)}
    className="p-1.5 rounded-lg transition-all"
    style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.18)'}
    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}>
    <Trash2 size={13} />
  </button>
</div>
```

- [ ] **Step 6: Add floating action bar**

Before the closing `</div>` of the page wrapper (after both modals), add:

```jsx
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
```

- [ ] **Step 7: Verify build**

```bash
cd /Users/simantstha/Documents/Playground/uniapply/client && npm run build 2>&1 | tail -5
```
Expected: `✓ built in` with no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/simantstha/Documents/Playground/uniapply && git add client/src/pages/Universities.jsx && git commit -m "feat: add university selection checkboxes and compare floating bar"
```

---

## Task 2: Create Compare Page

**Files:**
- Create: `client/src/pages/Compare.jsx`

- [ ] **Step 1: Create the Compare page skeleton**

Create `client/src/pages/Compare.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { ChevronLeft, ExternalLink } from 'lucide-react';

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

// Completion dot: green = met, amber = partial, gray = missing
function Dot({ completion }) {
  if (!completion) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
  if (completion.met) return <span style={{ color: '#16A34A' }}>✓</span>;
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

  const [columns, setColumns] = useState([]); // [{ uni, req, loading, error }]

  useEffect(() => {
    if (!ids.length) return;

    // Init columns with loading state
    setColumns(ids.map(id => ({ id, uni: null, req: null, loading: true, error: null })));

    // Fetch each university + requirements in parallel
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
  }, []);

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

  // Table rows definition
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
        return (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: dl.bg, color: dl.color }}>{dl.label}</span>
        );
      },
    },
    {
      label: 'Category',
      render: (col) => {
        if (col.loading) return <Cell loading />;
        const cat = categoryConfig[col.uni?.category];
        if (!cat) return <span>—</span>;
        return (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
        );
      },
    },
    {
      label: 'Status',
      render: (col) => {
        if (col.loading) return <Cell loading />;
        const stat = statusConfig[col.uni?.status];
        if (!stat) return <span>—</span>;
        return (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: stat.bg, color: stat.color }}>{stat.label}</span>
        );
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
        if (!ds) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
        return <span className="text-sm" style={{ color: ds.met ? '#16A34A' : ds.partial ? '#D4A843' : 'var(--text-tertiary)' }}>
          {ds.count}/{ds.required}
        </span>;
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/universities" className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <ChevronLeft size={15} /> Back
        </Link>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Comparing {numCols} {numCols === 1 ? 'University' : 'Universities'}
        </h1>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${numCols * 200 + 160}px` }}>
          {/* University header row */}
          <div className="flex" style={{ paddingLeft: '160px' }}>
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
                  style={{ borderTop: '1px solid var(--border-subtle)', paddingLeft: '160px' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--text-tertiary)', marginLeft: '-160px', width: '160px', paddingRight: '16px' }}>
                    {row.sectionLabel}
                  </p>
                </div>
              );
            }
            return (
              <div key={i} className="flex items-center py-2.5"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {/* Row label */}
                <div style={{ width: '160px', paddingRight: '16px', flexShrink: 0 }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{row.label}</p>
                </div>
                {/* Values */}
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
```

- [ ] **Step 2: Verify the file has no syntax errors**

```bash
cd /Users/simantstha/Documents/Playground/uniapply/client && npm run build 2>&1 | tail -10
```
Expected: errors about missing route (Compare not imported yet), NOT syntax errors. If there are syntax errors in Compare.jsx, fix them before proceeding.

- [ ] **Step 3: Commit**

```bash
cd /Users/simantstha/Documents/Playground/uniapply && git add client/src/pages/Compare.jsx && git commit -m "feat: add university comparison page"
```

---

## Task 3: Register Compare Route in App.jsx

**Files:**
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Import Compare**

Find:
```js
import Documents from './pages/Documents';
import Onboarding from './pages/Onboarding';
```
Replace with:
```js
import Documents from './pages/Documents';
import Compare from './pages/Compare';
import Onboarding from './pages/Onboarding';
```

- [ ] **Step 2: Add the /compare route**

Find:
```jsx
<Route path="sop/:universityId" element={<SOPList />} />
<Route path="sop/:universityId/:sopId" element={<SOPWorkshop />} />
```
Replace with:
```jsx
<Route path="compare" element={<Compare />} />
<Route path="sop/:universityId" element={<SOPList />} />
<Route path="sop/:universityId/:sopId" element={<SOPWorkshop />} />
```

- [ ] **Step 3: Verify full build passes**

```bash
cd /Users/simantstha/Documents/Playground/uniapply/client && npm run build 2>&1 | tail -5
```
Expected: `✓ built in` with no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/simantstha/Documents/Playground/uniapply && git add client/src/App.jsx && git commit -m "feat: register /compare route"
```

---

## Self-Review

**Spec coverage:**
- ✅ Checkbox on each card, max 4, disabled when at max
- ✅ Floating action bar when ≥ 2 selected with university count + Compare button + clear button
- ✅ Navigate to `/compare?ids=1,2,3`
- ✅ Compare page fetches university + requirements in parallel per column
- ✅ Table rows: Program, Degree, Category, Status, Deadline, GPA, TOEFL, IELTS, SAT midpoints, GRE, LOR, App Fee, Acceptance Rate, Tuition, Transcript, Test Scores, Rec Letters, Resume, SOP
- ✅ Completion dots (✓ / partial count / —) for document rows
- ✅ Loading skeleton per cell while fetching
- ✅ Error state per column
- ✅ Horizontal scroll on mobile (minWidth enforced)
- ✅ Back link to /universities
- ✅ Selection cleared when add modal opens
- ✅ Compare page is read-only

**Placeholder scan:** None.

**Type consistency:** `col.req.doc_status` shape matches what the requirements endpoint returns: `{ transcript, test_scores, recommendation, resume, financial, sop }` each with `{ met, partial, count, required }`.
