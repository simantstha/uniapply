# Document Tagging & Requirements Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let students tag uploaded documents to universities so the Requirements tab shows green/partial/empty completion per document type.

**Architecture:** New `DocumentTag` join table (Document ↔ University many-to-many). Documents route gets a PATCH tags endpoint + includes tags in GET. Requirements route computes `doc_status` per university from tagged docs + existing SOPs. Frontend: tag picker in upload modal + edit tags on existing docs. Requirements panel shows completion color per tile.

**Tech Stack:** Prisma/SQLite, Express, React

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `server/prisma/schema.prisma` | Modify | Add `DocumentTag` model, update relations on `Document` and `University` |
| `server/src/routes/documents.js` | Modify | Include tags in GET, add PATCH /:id/tags, accept universityIds on POST |
| `server/src/routes/requirements.js` | Modify | Add `doc_status` object to GET /:id/requirements response |
| `client/src/pages/Documents.jsx` | Modify | University multi-select in upload modal, tag display + edit on each doc |
| `client/src/pages/SOPList.jsx` | Modify | Pass doc_status to RequirementsPanel, completion indicators on Req tiles |

---

## Completion Logic

| Doc Type | Green when |
|----------|-----------|
| `transcript` | ≥ 1 uploaded + tagged to this university |
| `test_scores` | ≥ 1 uploaded + tagged to this university |
| `recommendation` | count tagged ≥ `lor_count` from requirements (or ≥ 1 if lor_count unknown) |
| `resume` | ≥ 1 uploaded + tagged |
| `financial` | ≥ 1 uploaded + tagged |
| `sop` | ≥ 1 SOP draft exists for this university |

Partial (amber): recommendation where 0 < count < lor_count.

---

## Task 1: Prisma Schema — DocumentTag Join Table

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: Add `DocumentTag` model and update relations**

Add to `schema.prisma` after the `Document` model:

```prisma
model DocumentTag {
  documentId   Int @map("document_id")
  universityId Int @map("university_id")

  document   Document   @relation(fields: [documentId],   references: [id], onDelete: Cascade)
  university University @relation(fields: [universityId], references: [id], onDelete: Cascade)

  @@id([documentId, universityId])
  @@map("document_tags")
}
```

Add to the `Document` model (after the `user` relation line):
```prisma
  tags DocumentTag[]
```

Add to the `University` model (after the `sops` relation line):
```prisma
  documentTags DocumentTag[]
```

- [ ] **Step 2: Run migration**

```bash
cd /Users/simantstha/Documents/Playground/uniapply/server && npx prisma migrate dev --name add_document_tags
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 3: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/
git commit -m "feat: add DocumentTag join table"
```

---

## Task 2: Update Documents Route

**Files:**
- Modify: `server/src/routes/documents.js`

Three changes:
1. `GET /` — include `tags` (array of `{ universityId, university: { id, name } }`) on each document
2. `POST /` — accept optional `universityIds` array in form body, create tags after document
3. `PATCH /:id/tags` — replace all tags for a document with new `universityIds` array

- [ ] **Step 1: Update `GET /` to include tags**

Replace:
```js
const docs = await prisma.document.findMany({
  where: { userId: req.userId },
  orderBy: { createdAt: 'desc' },
});
```

With:
```js
const docs = await prisma.document.findMany({
  where: { userId: req.userId },
  orderBy: { createdAt: 'desc' },
  include: {
    tags: {
      include: { university: { select: { id: true, name: true } } },
    },
  },
});
```

- [ ] **Step 2: Update `POST /` to accept and save universityIds**

After `const doc = await prisma.document.create({...})`, add:

```js
// Save university tags if provided
const universityIds = req.body.universityIds
  ? JSON.parse(req.body.universityIds)
  : [];

if (universityIds.length > 0) {
  // Verify all universities belong to this user before tagging
  const valid = await prisma.university.findMany({
    where: { id: { in: universityIds }, userId: req.userId },
    select: { id: true },
  });
  const validIds = valid.map(u => u.id);
  if (validIds.length > 0) {
    await prisma.documentTag.createMany({
      data: validIds.map(universityId => ({ documentId: doc.id, universityId })),
    });
  }
}
```

Then update the response to include tags:
```js
const docWithTags = await prisma.document.findUnique({
  where: { id: doc.id },
  include: {
    tags: {
      include: { university: { select: { id: true, name: true } } },
    },
  },
});
res.json(docWithTags);
```

- [ ] **Step 3: Add `PATCH /:id/tags` endpoint**

Add before the `export default router` line:

```js
// Replace all university tags for a document
router.patch('/:id/tags', async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const universityIds = Array.isArray(req.body.universityIds) ? req.body.universityIds : [];

    // Verify universities belong to this user
    const valid = await prisma.university.findMany({
      where: { id: { in: universityIds }, userId: req.userId },
      select: { id: true },
    });
    const validIds = valid.map(u => u.id);

    // Replace tags atomically
    await prisma.$transaction([
      prisma.documentTag.deleteMany({ where: { documentId: doc.id } }),
      ...(validIds.length > 0 ? [prisma.documentTag.createMany({
        data: validIds.map(universityId => ({ documentId: doc.id, universityId })),
      })] : []),
    ]);

    const updated = await prisma.document.findUnique({
      where: { id: doc.id },
      include: {
        tags: {
          include: { university: { select: { id: true, name: true } } },
        },
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/documents.js
git commit -m "feat: add university tagging to documents (GET includes tags, POST accepts universityIds, PATCH /:id/tags)"
```

---

## Task 3: Add doc_status to Requirements Route

**Files:**
- Modify: `server/src/routes/requirements.js`

Add `doc_status` to both the cached and fresh response paths. `doc_status` is computed fresh every time (not cached) since docs change frequently.

- [ ] **Step 1: Add `computeDocStatus` helper function**

Add before the route definitions in `requirements.js`:

```js
async function computeDocStatus(universityId, userId, lorCount) {
  // Get all docs tagged to this university
  const tags = await prisma.documentTag.findMany({
    where: { universityId },
    include: { document: { select: { docType: true, userId: true } } },
  });

  // Only count docs belonging to this user
  const userTags = tags.filter(t => t.document.userId === userId);
  const counts = {};
  for (const tag of userTags) {
    const type = tag.document.docType;
    counts[type] = (counts[type] || 0) + 1;
  }

  // Check SOP exists for this university
  const sopCount = await prisma.sOP.count({ where: { universityId, userId } });

  const required = lorCount || 1;
  const lorTagged = counts['recommendation'] || 0;

  return {
    transcript:     { count: counts['transcript']  || 0, met: (counts['transcript']  || 0) >= 1 },
    test_scores:    { count: counts['test_scores'] || 0, met: (counts['test_scores'] || 0) >= 1 },
    recommendation: { count: lorTagged, required, met: lorTagged >= required, partial: lorTagged > 0 && lorTagged < required },
    resume:         { count: counts['resume']    || 0, met: (counts['resume']    || 0) >= 1 },
    financial:      { count: counts['financial'] || 0, met: (counts['financial'] || 0) >= 1 },
    sop:            { count: sopCount, met: sopCount >= 1 },
  };
}
```

- [ ] **Step 2: Call `computeDocStatus` in the GET route**

In the GET `/:id/requirements` handler, after getting the `university` object, add doc_status computation to both paths:

For the **cached** path, change the return to:
```js
if (cached) {
  const parsedReqs = JSON.parse(cached.requirementsJson);
  const lorCount = parsedReqs.lor_count || null;
  const docStatus = await computeDocStatus(university.id, req.userId, lorCount);
  return res.json({
    ...parsedReqs,
    matched_program: cached.matchedProgram,
    source_url: cached.sourceUrl,
    source_type: cached.sourceType,
    doc_status: docStatus,
    cached: true,
  });
}
```

For the **fresh** path, change the final response to:
```js
const docStatus = await computeDocStatus(university.id, req.userId, result.lor_count || null);
res.json({ ...result, doc_status: docStatus, cached: false });
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/requirements.js
git commit -m "feat: add doc_status completion tracking to requirements endpoint"
```

---

## Task 4: Documents Page — Tag UI

**Files:**
- Modify: `client/src/pages/Documents.jsx`

Add university fetching, tag display on each doc card, university multi-select in upload modal, and a tag edit modal for existing docs.

- [ ] **Step 1: Add university state + fetch + tag state**

Add to the top of the `Documents` component (after existing useState hooks):

```js
const [universities, setUniversities] = useState([]);
const [tagModal, setTagModal] = useState(null); // { doc } or null
const [tagSelection, setTagSelection] = useState([]); // selected universityIds
const [tagSaving, setTagSaving] = useState(false);
```

Add to the existing `useEffect`:
```js
useEffect(() => {
  fetchDocs();
  apiClient.get('/api/universities').then(res => setUniversities(res.data)).catch(() => {});
}, []);
```

Also add `selectedUniversities` to the upload form state. Change:
```js
const [form, setForm] = useState({ name: '', docType: 'transcript' });
```
To:
```js
const [form, setForm] = useState({ name: '', docType: 'transcript', universityIds: [] });
```

- [ ] **Step 2: Update `handleUpload` to send universityIds**

In the `handleUpload` function, add after `fd.append('docType', form.docType)`:
```js
fd.append('universityIds', JSON.stringify(form.universityIds));
```

- [ ] **Step 3: Add tag save handler**

Add after `handleDownload`:
```js
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
```

- [ ] **Step 4: Add `Tags` icon to imports and show tags on each doc card**

Add `Tags` to the lucide import:
```js
import { Upload, FileText, Trash2, Download, File, Image, X, Tags } from 'lucide-react';
```

In each doc card, after the `<div className="flex-1 min-w-0">` name/size block, add:
```jsx
{/* University tags */}
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
```

Add a tag edit button in the doc card action buttons (before the download button):
```jsx
<button
  onClick={() => { setTagModal({ doc }); setTagSelection(doc.tags?.map(t => t.universityId) || []); }}
  className="p-1.5 rounded-lg transition-all"
  style={{ background: 'var(--navy-subtle)', color: 'var(--navy)' }}
  onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
  title="Tag universities">
  <Tags size={13} />
</button>
```

- [ ] **Step 5: Add university multi-select to upload modal**

In the upload form, add after the docType section (before the Cancel/Upload buttons):

```jsx
{universities.length > 0 && (
  <div>
    <label className="label">Tag Universities</label>
    <div className="space-y-1.5 max-h-36 overflow-y-auto">
      {/* Tag all shortcut */}
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
```

Also reset `universityIds` when modal closes. Change `setForm({ name: file.name.replace(/\.[^.]+$/, ''), docType: 'transcript' })` to:
```js
setForm({ name: file.name.replace(/\.[^.]+$/, ''), docType: 'transcript', universityIds: [] });
```

- [ ] **Step 6: Add tag edit modal**

Add after the upload modal closing `)}`:

```jsx
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
```

- [ ] **Step 7: Commit**

```bash
git add client/src/pages/Documents.jsx
git commit -m "feat: add university tagging UI to documents page"
```

---

## Task 5: Requirements Panel — Completion Indicators

**Files:**
- Modify: `client/src/pages/SOPList.jsx`

Update `RequirementsPanel` to accept `docStatus` and pass completion state to `Req` tiles. Update `Req` to show green check / amber partial / default.

- [ ] **Step 1: Pass `doc_status` to `RequirementsPanel`**

In the requirements tab content block, change:
```jsx
{req.data && <RequirementsPanel data={req.data} websiteUrl={university?.websiteUrl} />}
```
To:
```jsx
{req.data && <RequirementsPanel data={req.data} websiteUrl={university?.websiteUrl} docStatus={req.data.doc_status} />}
```

- [ ] **Step 2: Update `RequirementsPanel` signature and pass docStatus to tiles**

Change the function signature:
```js
function RequirementsPanel({ data, websiteUrl, docStatus }) {
```

Update the Academic section Req tiles to include completion:
```jsx
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
{data.lor_count != null && (
  <Req label="Letters of Rec"
    value={`${data.lor_count} required`}
    completion={docStatus?.recommendation}
    showCount
  />
)}
{data.application_fee != null && <Req label="App Fee" value={`$${data.application_fee}`} />}
{data.international_deadline && <Req label="Intl Deadline" value={data.international_deadline} />}
{data.scorecard?.acceptance_rate != null && <Req label="Acceptance Rate" value={formatRate(data.scorecard.acceptance_rate)} />}
{data.scorecard?.tuition_out_of_state != null && <Req label="Tuition (Intl)" value={`$${data.scorecard.tuition_out_of_state.toLocaleString()}`} />}
```

Add SOP tile at the end of the academic grid:
```jsx
<Req label="SOP / Personal Statement" value={docStatus?.sop?.met ? 'Draft ready' : 'Not started'} completion={docStatus?.sop} />
```

Update English proficiency tiles:
```jsx
{data.toefl?.minimum != null && <Req label="TOEFL (iBT)" value={`${data.toefl.minimum}+`} highlight completion={docStatus?.test_scores} />}
{data.ielts?.minimum != null && <Req label="IELTS" value={`${data.ielts.minimum}+`} highlight completion={docStatus?.test_scores} />}
```

Update Required Documents tags to show transcript/resume/financial completion:
```jsx
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
```

- [ ] **Step 3: Update `Req` component to show completion**

Replace the existing `Req` function with:

```jsx
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
      {/* Completion badge */}
      {completion && (
        <span className="absolute top-2 right-2 text-xs">
          {met ? '✓' : partial ? `${completion.count}/${completion.required}` : ''}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/SOPList.jsx
git commit -m "feat: add completion indicators to requirements panel"
```

---

## Self-Review

**Spec coverage:**
- ✅ Tag at upload (universityIds in POST)
- ✅ Edit tags after upload (PATCH /:id/tags)
- ✅ Tag all universities shortcut
- ✅ Tags shown on doc cards
- ✅ doc_status computed from tagged docs + SOPs
- ✅ Green = uploaded + tagged (met: true)
- ✅ Amber = partial (recommendation count < required)
- ✅ LOR shows "X / Y uploaded" count
- ✅ SOP = green if any draft exists for university
- ✅ test_scores doc satisfies GRE/TOEFL/IELTS tiles

**Placeholder scan:** None — all code is complete.

**Type consistency:** `completion` prop shape `{ met, partial, count, required }` — consistent across all Req usages.
