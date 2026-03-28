# User Journey Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between "shortlisted + SOP ready" and "visa stamped" by adding application status tracking, a cost calculator, a pre-flight checklist, and a post-admission visa pathway — all wired into the existing Dashboard.

**Architecture:** Phase-aware Dashboard — no new pages. Fetch universities in Dashboard for Active/Decisions grouping. New components (ApplicationStatusPicker, CostCalculatorBanner, PreflightDrawer, PostAdmissionDrawer) are self-contained and imported into Dashboard and Universities pages. Static data files for fees and portal URLs.

**Tech Stack:** React + Vite, Express + Prisma + SQLite, axios (`apiClient`), Lucide icons, CSS variables

---

## File Map

**Create:**
- `client/src/data/applicationFees.js` — school name → fee lookup
- `client/src/data/portalUrls.js` — school name → portal URL + type
- `client/src/components/ApplicationStatusPicker.jsx` — status pill with dropdown
- `client/src/components/CostCalculatorBanner.jsx` — collapsible cost summary
- `client/src/components/PreflightDrawer.jsx` — pre-apply checklist drawer
- `client/src/components/PostAdmissionDrawer.jsx` — visa checklist drawer

**Modify:**
- `server/prisma/schema.prisma` — add `applicationStatus`, `applicationPortalUrl`, `applicationPortalType` to University
- `server/src/routes/universities.js` — handle new fields in PATCH
- `client/src/pages/Dashboard.jsx` — Active/Decisions panels, cost banner, drawers
- `client/src/pages/Universities.jsx` — status picker + pre-flight button on cards

---

## Task 1: Schema Migration + API Update

**Files:**
- Modify: `server/prisma/schema.prisma`
- Modify: `server/src/routes/universities.js`

- [ ] **Step 1: Add new fields to University model in schema.prisma**

In `server/prisma/schema.prisma`, add three fields to the `University` model after the `fundingType` line:

```prisma
model University {
  id                   Int       @id @default(autoincrement())
  userId               Int       @map("user_id")
  name                 String
  program              String
  degreeLevel          String    @default("masters") @map("degree_level")
  websiteUrl           String?   @map("website_url")
  category             String
  applicationDeadline  DateTime? @map("application_deadline")
  status               String    @default("not_started")
  notes                String?
  fundingType          String    @default("unknown") @map("funding_type")
  applicationStatus    String    @default("not_applied") @map("application_status")
  applicationPortalUrl String?   @map("application_portal_url")
  applicationPortalType String?  @map("application_portal_type")
  createdAt            DateTime  @default(now()) @map("created_at")
  updatedAt            DateTime  @updatedAt @map("updated_at")

  reminder30SentAt  DateTime? @map("reminder_30_sent_at")
  reminder14SentAt  DateTime? @map("reminder_14_sent_at")
  reminder7SentAt   DateTime? @map("reminder_7_sent_at")

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  sops         SOP[]
  documentTags DocumentTag[]

  @@map("universities")
}
```

- [ ] **Step 2: Run migration**

```bash
cd /Users/simantstha/Documents/Playground/uniapply/server
npx prisma migrate dev --name add_application_status
```

Expected output: `✔  Your database is now in sync with your schema.`

- [ ] **Step 3: Update PATCH handler in universities.js to accept new fields**

Replace the existing `router.patch('/:id', ...)` handler:

```js
router.patch('/:id', async (req, res) => {
  try {
    const { status, notes, fundingType, applicationStatus, applicationPortalUrl, applicationPortalType } = req.body;
    const data = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (fundingType !== undefined) data.fundingType = fundingType;
    if (applicationStatus !== undefined) data.applicationStatus = applicationStatus;
    if (applicationPortalUrl !== undefined) data.applicationPortalUrl = applicationPortalUrl;
    if (applicationPortalType !== undefined) data.applicationPortalType = applicationPortalType;
    const university = await prisma.university.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data,
    });
    if (university.count === 0) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.university.findUnique({ where: { id: parseInt(req.params.id) } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

- [ ] **Step 4: Verify API manually**

Start server: `cd server && npm run dev`

Run in a separate terminal (replace TOKEN with a real JWT from login):
```bash
curl -X PATCH http://localhost:3001/api/universities/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"applicationStatus":"applied"}'
```

Expected: JSON response with `applicationStatus: "applied"`

- [ ] **Step 5: Commit**

```bash
cd /Users/simantstha/Documents/Playground/uniapply
git add server/prisma/schema.prisma server/prisma/migrations server/src/routes/universities.js
git commit -m "feat: add applicationStatus + portalUrl fields to University schema"
```

---

## Task 2: ApplicationStatusPicker Component

**Files:**
- Create: `client/src/components/ApplicationStatusPicker.jsx`

- [ ] **Step 1: Create ApplicationStatusPicker.jsx**

```jsx
// client/src/components/ApplicationStatusPicker.jsx
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const APPLICATION_STATUSES = [
  { value: 'not_applied', label: 'Not Applied', color: 'var(--text-tertiary)',    bg: 'var(--bg-secondary)' },
  { value: 'applied',     label: 'Applied',     color: '#3B82F6',                bg: 'rgba(59,130,246,0.1)' },
  { value: 'interview',   label: 'Interview',   color: '#7C3AED',                bg: 'rgba(124,58,237,0.1)' },
  { value: 'admitted',    label: 'Admitted',    color: '#34C759',                bg: 'rgba(52,199,89,0.1)' },
  { value: 'rejected',    label: 'Rejected',    color: '#FF3B30',                bg: 'rgba(255,59,48,0.1)' },
  { value: 'waitlisted',  label: 'Waitlisted',  color: '#D4A843',                bg: 'rgba(212,168,67,0.12)' },
];

export default function ApplicationStatusPicker({ value = 'not_applied', onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = APPLICATION_STATUSES.find(s => s.value === value) || APPLICATION_STATUSES[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 20,
          background: current.bg,
          border: `1px solid ${current.color}22`,
          color: current.color,
          fontSize: 12, fontWeight: 500, cursor: disabled ? 'default' : 'pointer',
          whiteSpace: 'nowrap',
        }}>
        {current.label}
        {!disabled && <ChevronDown size={11} strokeWidth={2} />}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4,
          background: 'var(--bg-primary)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 4, minWidth: 140,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          {APPLICATION_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => { onChange(s.value); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '6px 10px', borderRadius: 7,
                background: s.value === value ? s.bg : 'transparent',
                color: s.value === value ? s.color : 'var(--text-primary)',
                fontSize: 13, fontWeight: s.value === value ? 500 : 400,
                border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={e => { if (s.value !== value) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={e => { if (s.value !== value) e.currentTarget.style.background = 'transparent'; }}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify component renders**

Start client: `cd client && npm run dev`

Open `/universities` in the browser. The component will be wired in Task 3 — for now just confirm no import errors appear in the terminal.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ApplicationStatusPicker.jsx
git commit -m "feat: ApplicationStatusPicker component with 6-state dropdown"
```

---

## Task 3: Wire Status Picker into Universities Page + Dashboard Grouping

**Files:**
- Modify: `client/src/pages/Universities.jsx` (status picker on cards)
- Modify: `client/src/pages/Dashboard.jsx` (Active/Decisions panels)

- [ ] **Step 1: Add applicationStatus update handler to Universities.jsx**

In `client/src/pages/Universities.jsx`, add the import at the top (alongside existing imports):

```jsx
import ApplicationStatusPicker from '../components/ApplicationStatusPicker';
```

Then add this handler inside the component (near other handlers like `handleEdit`, `handleDelete`):

```jsx
const handleApplicationStatusChange = async (universityId, newStatus) => {
  try {
    const res = await apiClient.patch(`/api/universities/${universityId}`, {
      applicationStatus: newStatus,
    });
    setUniversities(prev =>
      prev.map(u => u.id === universityId ? { ...u, applicationStatus: res.data.applicationStatus } : u)
    );
  } catch {
    // silently ignore — status reverts on refresh
  }
};
```

- [ ] **Step 2: Add ApplicationStatusPicker to university cards in Universities.jsx**

Find where each university card renders its category badge (something like `<span>{u.category}</span>`). Add the picker directly after the category badge inside each card:

```jsx
<ApplicationStatusPicker
  value={u.applicationStatus || 'not_applied'}
  onChange={(newStatus) => handleApplicationStatusChange(u.id, newStatus)}
/>
```

- [ ] **Step 3: Add universities fetch + Active/Decisions section to Dashboard.jsx**

At the top of `Dashboard.jsx`, add to imports:
```jsx
import ApplicationStatusPicker, { APPLICATION_STATUSES } from '../components/ApplicationStatusPicker';
```

Add state and fetch inside the `Dashboard` component, alongside existing state:
```jsx
const [universities, setUniversities] = useState([]);

const handleAppStatusChange = async (universityId, newStatus) => {
  try {
    const res = await apiClient.patch(`/api/universities/${universityId}`, {
      applicationStatus: newStatus,
    });
    setUniversities(prev =>
      prev.map(u => u.id === universityId ? { ...u, applicationStatus: res.data.applicationStatus } : u)
    );
  } catch { /* silent */ }
};
```

Add the university fetch inside the existing `fetchStats` function, alongside the other API calls:
```jsx
const fetchStats = () => {
  setError(false);
  Promise.all([
    apiClient.get('/api/dashboard/stats'),
    apiClient.get('/api/dashboard/overview'),
    apiClient.get('/api/universities'),
  ]).then(([statsRes, overviewRes, uniRes]) => {
    setData(statsRes.data);
    setOverview(overviewRes.data);
    setUniversities(uniRes.data);
  }).catch(() => setError(true));
};
```

- [ ] **Step 4: Add Active/Decisions panels to Dashboard JSX**

Add this section inside the Dashboard `return`, after the journey panel and before the closing `</div>`:

```jsx
{/* ── Application Status Panels ── */}
{universities.length > 0 && (() => {
  const ACTIVE_STATUSES = ['not_applied', 'applied', 'interview'];
  const DECISION_STATUSES = ['admitted', 'rejected', 'waitlisted'];
  const active = universities
    .filter(u => ACTIVE_STATUSES.includes(u.applicationStatus || 'not_applied'))
    .sort((a, b) => {
      if (a.applicationDeadline && b.applicationDeadline)
        return new Date(a.applicationDeadline) - new Date(b.applicationDeadline);
      if (a.applicationDeadline) return -1;
      if (b.applicationDeadline) return 1;
      return 0;
    });
  const decisions = universities
    .filter(u => DECISION_STATUSES.includes(u.applicationStatus || 'not_applied'))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return (
    <div className="space-y-4">
      {/* Active */}
      {active.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Active Applications
          </h3>
          <div className="space-y-2">
            {active.map(u => (
              <div key={u.id} className="flex items-center justify-between gap-3 py-2"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{u.program}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {u.applicationDeadline && (
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(u.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <ApplicationStatusPicker
                    value={u.applicationStatus || 'not_applied'}
                    onChange={(s) => handleAppStatusChange(u.id, s)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decisions */}
      {decisions.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Decisions
          </h3>
          <div className="space-y-2">
            {decisions.map(u => (
              <div key={u.id} className="flex items-center justify-between gap-3 py-2"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{u.program}</p>
                </div>
                <ApplicationStatusPicker
                  value={u.applicationStatus || 'not_applied'}
                  onChange={(s) => handleAppStatusChange(u.id, s)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
})()}
```

- [ ] **Step 5: Manual verification**

1. Open `/universities` — each card should show an `ApplicationStatusPicker` pill
2. Change a status — pill updates immediately
3. Refresh `/universities` — status persists (fetched from API)
4. Open `/dashboard` — university appears in "Active Applications" section
5. Change status to "Admitted" on dashboard — it moves to "Decisions" section

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Universities.jsx client/src/pages/Dashboard.jsx
git commit -m "feat: application status picker on university cards + Active/Decisions panels on dashboard"
```

---

## Task 4: Cost Calculator Banner

**Files:**
- Create: `client/src/data/applicationFees.js`
- Create: `client/src/components/CostCalculatorBanner.jsx`
- Modify: `client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Create applicationFees.js**

```js
// client/src/data/applicationFees.js
// Application fees in USD. Source: individual university graduate admissions pages.
// Last verified: March 2026. Confirm on each school's portal before applying.

export const APPLICATION_FEES = {
  // USA — Top programs
  'Massachusetts Institute of Technology': 90,
  'MIT': 90,
  'Stanford University': 125,
  'Harvard University': 85,
  'Carnegie Mellon University': 75,
  'CMU': 75,
  'Cornell University': 105,
  'Columbia University': 110,
  'New York University': 85,
  'NYU': 85,
  'University of Pennsylvania': 80,
  'Yale University': 105,
  'Princeton University': 90,
  'California Institute of Technology': 75,
  'Caltech': 75,
  'Georgia Institute of Technology': 75,
  'Georgia Tech': 75,
  'University of California San Diego': 135,
  'UCSD': 135,
  'University of California Berkeley': 120,
  'UC Berkeley': 120,
  'University of California Los Angeles': 120,
  'UCLA': 120,
  'University of Michigan': 75,
  'University of Washington': 85,
  'University of Massachusetts Amherst': 85,
  'UMass Amherst': 85,
  'Arizona State University': 70,
  'ASU': 70,
  'University of Texas at Austin': 65,
  'UT Austin': 65,
  'Purdue University': 60,
  'University of Illinois Urbana-Champaign': 70,
  'UIUC': 70,
  'University of Wisconsin-Madison': 56,
  'Ohio State University': 60,
  'Penn State University': 65,
  'Northeastern University': 100,
  'Boston University': 95,
  'BU': 95,
  'University of Minnesota': 95,
  'Virginia Tech': 75,
  'University of Maryland': 75,
  'Stony Brook University': 100,
  // Canada
  'University of Toronto': 90,
  'University of Waterloo': 90,
  'McGill University': 60,
  'University of British Columbia': 108,
  'UBC': 108,
  'University of Ottawa': 80,
  'Simon Fraser University': 90,
  // UK
  'University of London': 30,
  'Imperial College London': 85,
  // Default fallback (not in map)
};

export const DEFAULT_FEE = 75; // USD — conservative estimate if school not found

// Score sending costs (USD)
export const SCORE_SEND_COSTS = {
  gre: 30,    // per school, ETS
  toefl: 20,  // per school, ETS (4 free sends at test time; cost after)
  ielts: 25,  // per school, approximately
};
```

- [ ] **Step 2: Create CostCalculatorBanner.jsx**

```jsx
// client/src/components/CostCalculatorBanner.jsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, Lightbulb } from 'lucide-react';
import { APPLICATION_FEES, DEFAULT_FEE, SCORE_SEND_COSTS } from '../data/applicationFees';

export default function CostCalculatorBanner({ universities, profile }) {
  const [open, setOpen] = useState(false);

  if (!universities || universities.length === 0) return null;

  // Calculate cost per school
  const breakdown = universities.map(u => {
    const appFee = APPLICATION_FEES[u.name] ?? DEFAULT_FEE;
    const gre  = (profile?.greVerbal || profile?.greQuant) ? SCORE_SEND_COSTS.gre   : 0;
    const toefl = profile?.toeflScore                      ? SCORE_SEND_COSTS.toefl : 0;
    const ielts = profile?.ieltsScore                      ? SCORE_SEND_COSTS.ielts : 0;
    return { name: u.name, appFee, gre, toefl, ielts, total: appFee + gre + toefl + ielts };
  });

  const minTotal = breakdown.reduce((sum, b) => sum + b.appFee, 0);
  const maxTotal = breakdown.reduce((sum, b) => sum + b.total, 0);
  const freeSchools = universities.filter(u => (APPLICATION_FEES[u.name] ?? DEFAULT_FEE) === 0);

  return (
    <div className="card overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <div className="flex items-center gap-2">
          <DollarSign size={15} style={{ color: '#34C759' }} strokeWidth={1.8} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Application Cost Estimate
          </span>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            — {universities.length} school{universities.length !== 1 ? 's' : ''},{' '}
            <strong>${minTotal.toLocaleString()}–${maxTotal.toLocaleString()}</strong>
          </span>
        </div>
        {open
          ? <ChevronUp size={15} style={{ color: 'var(--text-tertiary)' }} />
          : <ChevronDown size={15} style={{ color: 'var(--text-tertiary)' }} />}
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {/* Per-school breakdown */}
          <div className="px-4 py-3 space-y-1">
            {breakdown.map(b => (
              <div key={b.name} className="flex items-center justify-between text-xs py-1"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="truncate mr-4" style={{ color: 'var(--text-primary)', maxWidth: 220 }}>
                  {b.name}
                </span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span style={{ color: 'var(--text-tertiary)' }}>app fee ${b.appFee}</span>
                  {b.gre > 0   && <span style={{ color: 'var(--text-tertiary)' }}>GRE +${b.gre}</span>}
                  {b.toefl > 0 && <span style={{ color: 'var(--text-tertiary)' }}>TOEFL +${b.toefl}</span>}
                  {b.ielts > 0 && <span style={{ color: 'var(--text-tertiary)' }}>IELTS +${b.ielts}</span>}
                  <span className="font-medium" style={{ color: 'var(--text-primary)', minWidth: 40, textAlign: 'right' }}>
                    ${b.total}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}>
              <span>Total estimate</span>
              <span>${minTotal.toLocaleString()}–${maxTotal.toLocaleString()}</span>
            </div>
            <p className="text-xs pt-1" style={{ color: 'var(--text-tertiary)' }}>
              Fees verified where possible — confirm on each school's portal before applying.
            </p>
          </div>

          {/* Cost-cutting tips */}
          <div className="px-4 py-3" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={13} style={{ color: '#D4A843' }} strokeWidth={1.8} />
              <span className="text-xs font-semibold" style={{ color: '#D4A843' }}>
                Ways to reduce costs
              </span>
            </div>
            <ul className="space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {freeSchools.length > 0 && (
                <li>• <strong style={{ color: '#34C759' }}>No fee:</strong>{' '}
                  {freeSchools.map(s => s.name).join(', ')} — free to apply</li>
              )}
              <li>• Attend a virtual info session — many schools email a fee waiver code afterward</li>
              <li>• Email admissions directly and ask for a fee waiver — works more often than you'd expect</li>
              <li>• TOEFL includes 4 free score sends at test time — use them strategically</li>
              <li>• Some schools offer an early-application fee reduction — check each portal</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add CostCalculatorBanner to Dashboard.jsx**

Add import at the top of `Dashboard.jsx`:
```jsx
import CostCalculatorBanner from '../components/CostCalculatorBanner';
```

Add profile state and fetch alongside existing state:
```jsx
const [profile, setProfile] = useState(null);
```

In `fetchStats`, add profile fetch:
```jsx
const fetchStats = () => {
  setError(false);
  Promise.all([
    apiClient.get('/api/dashboard/stats'),
    apiClient.get('/api/dashboard/overview'),
    apiClient.get('/api/universities'),
    apiClient.get('/api/profile'),
  ]).then(([statsRes, overviewRes, uniRes, profileRes]) => {
    setData(statsRes.data);
    setOverview(overviewRes.data);
    setUniversities(uniRes.data);
    setProfile(profileRes.data);
  }).catch(() => setError(true));
};
```

Add the banner in Dashboard JSX, just before the Application Status Panels section added in Task 3:
```jsx
{/* ── Cost Calculator ── */}
<CostCalculatorBanner universities={universities} profile={profile} />
```

- [ ] **Step 4: Manual verification**

1. Open `/dashboard` — "Application Cost Estimate" banner visible above the status panels
2. Click to expand — per-school breakdown with fees + score send costs
3. If you have TOEFL/GRE in your profile, those rows appear in breakdown
4. "Ways to reduce costs" tips visible at the bottom

- [ ] **Step 5: Commit**

```bash
git add client/src/data/applicationFees.js client/src/components/CostCalculatorBanner.jsx client/src/pages/Dashboard.jsx
git commit -m "feat: application cost calculator banner on dashboard"
```

---

## Task 5: Pre-flight Drawer + Portal Link

**Files:**
- Create: `client/src/data/portalUrls.js`
- Create: `client/src/components/PreflightDrawer.jsx`
- Modify: `client/src/pages/Universities.jsx`

- [ ] **Step 1: Create portalUrls.js**

```js
// client/src/data/portalUrls.js
// Graduate application portal URLs. Undergrads use Common App.
// Last verified: March 2026.

export const PORTAL_URLS = {
  'Massachusetts Institute of Technology': { url: 'https://apply.mit.edu', type: 'direct' },
  'MIT': { url: 'https://apply.mit.edu', type: 'direct' },
  'Stanford University': { url: 'https://gradadmissions.stanford.edu/apply', type: 'direct' },
  'Harvard University': { url: 'https://gsas.harvard.edu/apply', type: 'direct' },
  'Carnegie Mellon University': { url: 'https://www.cmu.edu/graduate-admissions/apply/', type: 'direct' },
  'CMU': { url: 'https://www.cmu.edu/graduate-admissions/apply/', type: 'direct' },
  'Cornell University': { url: 'https://www.gradschool.cornell.edu/admissions/apply/', type: 'direct' },
  'Columbia University': { url: 'https://apply.gsas.columbia.edu', type: 'direct' },
  'New York University': { url: 'https://www.nyu.edu/admissions/graduate-admissions/how-to-apply.html', type: 'direct' },
  'NYU': { url: 'https://www.nyu.edu/admissions/graduate-admissions/how-to-apply.html', type: 'direct' },
  'University of Pennsylvania': { url: 'https://www.upenn.edu/admissions/graduate-professional', type: 'direct' },
  'Yale University': { url: 'https://gsas.yale.edu/admissions/applying-yale', type: 'direct' },
  'Princeton University': { url: 'https://gradschool.princeton.edu/admission/applying-princeton/application', type: 'direct' },
  'Georgia Institute of Technology': { url: 'https://grad.gatech.edu/apply', type: 'direct' },
  'Georgia Tech': { url: 'https://grad.gatech.edu/apply', type: 'direct' },
  'University of California San Diego': { url: 'https://gradapply.ucsd.edu/apply/', type: 'direct' },
  'UCSD': { url: 'https://gradapply.ucsd.edu/apply/', type: 'direct' },
  'University of California Berkeley': { url: 'https://grad.berkeley.edu/admissions/apply/', type: 'direct' },
  'UC Berkeley': { url: 'https://grad.berkeley.edu/admissions/apply/', type: 'direct' },
  'University of Michigan': { url: 'https://rackham.umich.edu/admissions/applying/', type: 'direct' },
  'University of Washington': { url: 'https://grad.uw.edu/admissions/applying-to-graduate-school/', type: 'direct' },
  'University of Massachusetts Amherst': { url: 'https://www.umass.edu/gradschool/admissions/how-apply', type: 'direct' },
  'UMass Amherst': { url: 'https://www.umass.edu/gradschool/admissions/how-apply', type: 'direct' },
  'Arizona State University': { url: 'https://graduate.asu.edu/apply', type: 'direct' },
  'ASU': { url: 'https://graduate.asu.edu/apply', type: 'direct' },
  'University of Texas at Austin': { url: 'https://utdirect.utexas.edu/apps/adm/admisgrad/', type: 'direct' },
  'UT Austin': { url: 'https://utdirect.utexas.edu/apps/adm/admisgrad/', type: 'direct' },
  'Purdue University': { url: 'https://gradapply.purdue.edu/apply/', type: 'direct' },
  'Northeastern University': { url: 'https://graduateadmissions.northeastern.edu/apply/', type: 'direct' },
  'Boston University': { url: 'https://www.bu.edu/admissions/graduate/', type: 'direct' },
  'BU': { url: 'https://www.bu.edu/admissions/graduate/', type: 'direct' },
  'University of Toronto': { url: 'https://apply.sgs.utoronto.ca/', type: 'direct' },
  'University of Waterloo': { url: 'https://uwaterloo.ca/graduate-studies-postdoctoral-affairs/future-students/how-apply', type: 'direct' },
  'University of Ottawa': { url: 'https://grad.uottawa.ca/en/programs/applying', type: 'direct' },
  'McGill University': { url: 'https://www.mcgill.ca/applying/graduate', type: 'direct' },
};

export const COMMON_APP_URL = 'https://www.commonapp.org/apply';

export function getPortalInfo(universityName, degreeLevel) {
  if (degreeLevel === 'undergraduate') {
    return { url: COMMON_APP_URL, type: 'common_app' };
  }
  return PORTAL_URLS[universityName] || null;
}
```

- [ ] **Step 2: Create PreflightDrawer.jsx**

```jsx
// client/src/components/PreflightDrawer.jsx
import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { getPortalInfo } from '../data/portalUrls';

export default function PreflightDrawer({ university, onClose, onMarkApplied }) {
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!university) return;
    apiClient.get(`/api/universities/${university.id}/checklist`)
      .then(res => setChecklist(res.data.checklist || []))
      .catch(() => setChecklist([]))
      .finally(() => setLoading(false));
  }, [university?.id]);

  if (!university) return null;

  const portal = getPortalInfo(university.name, university.degreeLevel);

  // Map checklist items to pre-flight checks
  const checks = [
    {
      label: 'SOP written & critiqued',
      done: checklist.some(c => c.item === 'Statement of Purpose' && c.status === 'complete'),
      link: `/sop/${university.id}`,
      linkLabel: 'Open SOP Editor',
    },
    {
      label: 'Recommendation letters confirmed',
      done: checklist.some(c => c.item === 'Recommendation Letters' && c.status === 'complete'),
      link: '/documents',
      linkLabel: 'Manage LORs',
    },
    {
      label: 'Transcript uploaded',
      done: checklist.some(c => c.item === 'Transcript' && c.status === 'complete'),
      link: '/documents',
      linkLabel: 'Upload Documents',
    },
    {
      label: 'Test scores uploaded',
      done: checklist.some(c => c.item === 'Test Scores' && c.status === 'complete'),
      link: '/documents',
      linkLabel: 'Upload Documents',
    },
  ];

  const allDone = checks.every(c => c.done);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: 420,
        background: 'var(--bg-primary)', borderLeft: '1px solid var(--border)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 30px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Ready to Apply?
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {university.name}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Pre-flight checks */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: 'var(--text-tertiary)' }}>
              Pre-flight checklist
            </h3>
            {loading ? (
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Checking…</div>
            ) : (
              <div className="space-y-2">
                {checks.map(c => (
                  <div key={c.label} className="flex items-center justify-between gap-3 py-2"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      {c.done
                        ? <CheckCircle size={15} style={{ color: '#34C759', flexShrink: 0 }} />
                        : <AlertCircle size={15} style={{ color: '#D4A843', flexShrink: 0 }} />}
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{c.label}</span>
                    </div>
                    {!c.done && (
                      <Link to={c.link} onClick={onClose}
                        className="text-xs flex items-center gap-0.5 flex-shrink-0"
                        style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                        {c.linkLabel} <ChevronRight size={11} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!loading && !allDone && (
              <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>
                You can still proceed — these are recommendations, not blockers.
              </p>
            )}
          </div>

          {/* Portal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: 'var(--text-tertiary)' }}>
              Application portal
            </h3>
            {portal ? (
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: portal.type === 'common_app' ? 'rgba(59,130,246,0.1)' : 'rgba(52,199,89,0.1)',
                      color: portal.type === 'common_app' ? '#3B82F6' : '#34C759',
                    }}>
                    {portal.type === 'common_app' ? 'Common App' : 'Direct Portal'}
                  </span>
                </div>
                {!confirming ? (
                  <button
                    onClick={() => setConfirming(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Go to Application Portal
                    <ExternalLink size={14} />
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-center" style={{ color: 'var(--text-primary)' }}>
                      Mark this as Applied?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { window.open(portal.url, '_blank'); onMarkApplied(university.id); onClose(); }}
                        className="flex-1 py-2 rounded-xl text-sm font-medium"
                        style={{ background: '#34C759', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        Yes, I'm applying
                      </button>
                      <button
                        onClick={() => { window.open(portal.url, '_blank'); onClose(); }}
                        className="flex-1 py-2 rounded-xl text-sm"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                        Just browsing
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Portal not found in our database.{' '}
                  {university.websiteUrl
                    ? <a href={university.websiteUrl} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--accent)' }}>Visit university website →</a>
                    : 'Search for the graduate admissions page on the university website.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Add "Ready to Apply" button + PreflightDrawer to Universities.jsx**

Add imports at the top of `Universities.jsx`:
```jsx
import PreflightDrawer from '../components/PreflightDrawer';
```

Add state inside the component:
```jsx
const [preflightUniversity, setPreflightUniversity] = useState(null);
```

Add handler for marking applied:
```jsx
const handleMarkApplied = async (universityId) => {
  try {
    const res = await apiClient.patch(`/api/universities/${universityId}`, {
      applicationStatus: 'applied',
    });
    setUniversities(prev =>
      prev.map(u => u.id === universityId ? { ...u, applicationStatus: res.data.applicationStatus } : u)
    );
  } catch { /* silent */ }
};
```

On each university card, add a "Ready to Apply" button after the `ApplicationStatusPicker` (only show when `applicationStatus === 'not_applied'`):
```jsx
{(u.applicationStatus === 'not_applied' || !u.applicationStatus) && (
  <button
    onClick={() => setPreflightUniversity(u)}
    className="text-xs px-3 py-1.5 rounded-lg font-medium"
    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
    Ready to Apply →
  </button>
)}
```

Add the drawer at the end of the component JSX (before closing tag):
```jsx
{preflightUniversity && (
  <PreflightDrawer
    university={preflightUniversity}
    onClose={() => setPreflightUniversity(null)}
    onMarkApplied={handleMarkApplied}
  />
)}
```

- [ ] **Step 4: Manual verification**

1. Open `/universities` — "Ready to Apply →" button visible on cards with `not_applied` status
2. Click it — drawer slides in from right with pre-flight checklist
3. Incomplete items show amber warning + link to fix them
4. Portal section shows "Common App" badge for undergrad schools, "Direct Portal" for grad
5. Click "Go to Application Portal" → confirmation prompt appears
6. Click "Yes, I'm applying" → portal opens in new tab, status updates to "Applied", drawer closes
7. Button disappears from the card (status is now "applied")

- [ ] **Step 5: Commit**

```bash
git add client/src/data/portalUrls.js client/src/components/PreflightDrawer.jsx client/src/pages/Universities.jsx
git commit -m "feat: pre-flight checklist drawer + portal link on university cards"
```

---

## Task 6: Post-Admission Pathway Drawer

**Files:**
- Create: `client/src/components/PostAdmissionDrawer.jsx`
- Modify: `client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Create PostAdmissionDrawer.jsx**

```jsx
// client/src/components/PostAdmissionDrawer.jsx
import { X, CheckCircle, Circle, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatMonth(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getSteps(enrollmentDate) {
  const enroll = enrollmentDate ? new Date(enrollmentDate) : null;

  return [
    {
      id: 'accept',
      label: 'Accept your offer & pay enrollment deposit',
      detail: 'Deposit is typically $500–$1,000 and non-refundable. Confirm the deadline in your offer letter.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -8))}` : 'Within 2–4 weeks of offer letter',
    },
    {
      id: 'i20',
      label: 'Request your I-20 from the school',
      detail: 'Contact the international students office immediately after accepting. I-20 takes 3–6 weeks to arrive.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -7))}` : 'Right after accepting — allow 3–6 weeks',
    },
    {
      id: 'sevis',
      label: 'Pay SEVIS fee ($350)',
      detail: 'Pay at FMJfee.com using your I-20 SEVIS ID. Keep the receipt — you\'ll need it at the visa interview.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -6))}` : 'After receiving I-20, before visa appointment',
      link: { url: 'https://www.fmjfee.com', label: 'Pay at FMJfee.com' },
    },
    {
      id: 'ds160',
      label: 'Complete DS-160 form (online)',
      detail: 'The DS-160 is the US visa application form. Print the confirmation page — you\'ll need it at the interview.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -5))}` : 'At least 3 weeks before visa appointment',
      link: { url: 'https://ceac.state.gov/genniv/', label: 'Fill DS-160' },
    },
    {
      id: 'visa_appt',
      label: 'Schedule F-1 visa appointment (US Embassy, Kathmandu)',
      detail: 'Book via the US Embassy Kathmandu portal. Slots fill up 4–8 weeks out — book early.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -5))}` : 'Book early — slots fill 4–8 weeks out',
      link: { url: 'https://np.usembassy.gov/visas/nonimmigrant-visas/', label: 'US Embassy Kathmandu' },
    },
    {
      id: 'visa_docs',
      label: 'Prepare visa documents',
      detail: 'Required: I-20, DS-160 confirmation, SEVIS receipt, valid passport, passport photo, bank statements (3+ months), admission letter, academic transcripts.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -4))}` : '1 week before your appointment',
    },
    {
      id: 'visa_interview',
      label: 'Attend F-1 visa interview',
      detail: 'Arrive 15 minutes early. Be ready to explain your study plans and ties to Nepal. Most Nepali students are approved.',
      timing: 'On your appointment date',
    },
    {
      id: 'orientation',
      label: 'Register for orientation + arrange housing',
      detail: 'On-campus housing fills fast. Most universities open housing applications 3–4 months before arrival.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -3))}` : 'As soon as visa is stamped',
    },
    {
      id: 'flights',
      label: 'Book flights to your university city',
      detail: 'Book 4–6 weeks out for best prices. Plan to arrive 3–5 days before orientation.',
      timing: enroll ? `Target: ${formatMonth(addMonths(enroll, -2))}` : '4–6 weeks before program start',
    },
  ];
}

export default function PostAdmissionDrawer({ university, onClose }) {
  if (!university) return null;

  const enrollmentDate = localStorage.getItem('uniapply_enrollment_date');
  const steps = getSteps(enrollmentDate);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: 440,
        background: 'var(--bg-primary)', borderLeft: '1px solid var(--border)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 30px rgba(0,0,0,0.15)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} style={{ color: '#34C759' }} strokeWidth={1.6} />
                <h2 className="text-base font-semibold" style={{ color: '#34C759' }}>
                  You got in!
                </h2>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {university.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {university.program}
              </p>
            </div>
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', flexShrink: 0 }}>
              <X size={18} />
            </button>
          </div>
          {!enrollmentDate && (
            <div className="mt-3 text-xs px-3 py-2 rounded-lg"
              style={{ background: 'rgba(212,168,67,0.1)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.2)' }}>
              Set your enrollment date on the{' '}
              <Link to="/timeline" onClick={onClose} style={{ color: '#D4A843', fontWeight: 600 }}>
                Timeline page
              </Link>{' '}
              to see target dates for each step.
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="p-5 space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-4"
            style={{ color: 'var(--text-tertiary)' }}>
            Your next steps
          </h3>
          {steps.map((step, i) => (
            <div key={step.id} className="flex gap-3 pb-4"
              style={{ borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none' }}>
              {/* Number */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                style={{ background: 'rgba(52,199,89,0.1)', color: '#34C759' }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  {step.label}
                </p>
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {step.detail}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium" style={{ color: '#D4A843' }}>
                    {step.timing}
                  </span>
                  {step.link && (
                    <a href={step.link.url} target="_blank" rel="noreferrer"
                      className="text-xs flex items-center gap-0.5"
                      style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                      {step.link.label} <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Wire PostAdmissionDrawer into Dashboard.jsx**

Add import at the top of `Dashboard.jsx`:
```jsx
import PostAdmissionDrawer from '../components/PostAdmissionDrawer';
```

Add state inside the component:
```jsx
const [postAdmissionUniversity, setPostAdmissionUniversity] = useState(null);
const [celebratedIds, setCelebratedIds] = useState(() => {
  try { return JSON.parse(localStorage.getItem('uniapply_celebrated') || '[]'); } catch { return []; }
});
```

Update `handleAppStatusChange` to trigger post-admission drawer when status becomes "admitted":
```jsx
const handleAppStatusChange = async (universityId, newStatus) => {
  try {
    const res = await apiClient.patch(`/api/universities/${universityId}`, {
      applicationStatus: newStatus,
    });
    setUniversities(prev =>
      prev.map(u => u.id === universityId ? { ...u, applicationStatus: res.data.applicationStatus } : u)
    );
    if (newStatus === 'admitted') {
      const uni = universities.find(u => u.id === universityId);
      if (uni && !celebratedIds.includes(universityId)) {
        setPostAdmissionUniversity({ ...uni, applicationStatus: 'admitted' });
        const newCelebrated = [...celebratedIds, universityId];
        setCelebratedIds(newCelebrated);
        localStorage.setItem('uniapply_celebrated', JSON.stringify(newCelebrated));
      }
    }
  } catch { /* silent */ }
};
```

Add "View next steps" button on Admitted cards in the Decisions panel (inside the `decisions.map(u => ...)` block):
```jsx
{u.applicationStatus === 'admitted' && (
  <button
    onClick={() => setPostAdmissionUniversity(u)}
    className="text-xs px-2 py-1 rounded-lg"
    style={{ background: 'rgba(52,199,89,0.1)', color: '#34C759', border: '1px solid rgba(52,199,89,0.2)', cursor: 'pointer' }}>
    View next steps
  </button>
)}
```

Add drawer at the end of Dashboard JSX (before closing tag):
```jsx
{postAdmissionUniversity && (
  <PostAdmissionDrawer
    university={postAdmissionUniversity}
    onClose={() => setPostAdmissionUniversity(null)}
  />
)}
```

- [ ] **Step 3: Manual verification**

1. Open `/dashboard` — change a university's applicationStatus to "Admitted"
2. Post-admission drawer opens automatically (first time only)
3. Drawer shows 9 steps with target dates if enrollment date is set in Timeline
4. If no enrollment date set — amber nudge to set it on /timeline
5. "Decisions" panel shows "View next steps" button on Admitted cards
6. Click "View next steps" → drawer reopens

- [ ] **Step 4: Commit**

```bash
git add client/src/components/PostAdmissionDrawer.jsx client/src/pages/Dashboard.jsx
git commit -m "feat: post-admission visa pathway drawer with timeline-aware steps"
```

---

## Task 7: Multiple Admissions Nudge + Rejected/Waitlisted Guidance

**Files:**
- Modify: `client/src/components/PostAdmissionDrawer.jsx`
- Modify: `client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Add multiple admissions nudge to Dashboard Decisions panel**

In the Decisions panel inside Dashboard.jsx, add this above the `decisions.map(...)` block:

```jsx
{decisions.filter(u => u.applicationStatus === 'admitted').length >= 2 && (
  <div className="mb-3 px-3 py-2.5 rounded-xl flex items-center gap-2"
    style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)' }}>
    <Sparkles size={13} style={{ color: '#34C759', flexShrink: 0 }} strokeWidth={1.6} />
    <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
      You're admitted to {decisions.filter(u => u.applicationStatus === 'admitted').length} schools.{' '}
      <Link to="/compare" style={{ color: '#34C759', fontWeight: 600 }}>
        Compare them before accepting →
      </Link>
    </p>
  </div>
)}
```

Make sure `Sparkles` and `Link` are imported (both already used in Dashboard.jsx).

- [ ] **Step 2: Add Rejected/Waitlisted guidance to Decisions panel cards**

Inside the `decisions.map(u => ...)` block, after the `ApplicationStatusPicker`, add:

```jsx
{u.applicationStatus === 'rejected' && (
  <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
    Consider emailing admissions for feedback
  </span>
)}
{u.applicationStatus === 'waitlisted' && (
  <button
    onClick={() => setWaitlistTipId(u.id === waitlistTipId ? null : u.id)}
    className="text-xs"
    style={{ background: 'none', border: 'none', color: '#D4A843', cursor: 'pointer', fontWeight: 500 }}>
    How to respond →
  </button>
)}
{u.applicationStatus === 'waitlisted' && waitlistTipId === u.id && (
  <div className="w-full mt-2 px-3 py-2.5 rounded-xl text-xs"
    style={{ background: 'rgba(212,168,67,0.08)', color: 'var(--text-secondary)', border: '1px solid rgba(212,168,67,0.2)' }}>
    Write a <strong>letter of continued interest</strong>: reaffirm your enthusiasm, share any new achievements since applying, and confirm you'll attend if accepted. Keep it under 300 words. Email the admissions office directly.
  </div>
)}
```

Add state for the waitlist tip toggle (inside Dashboard component):
```jsx
const [waitlistTipId, setWaitlistTipId] = useState(null);
```

- [ ] **Step 3: Manual verification**

1. Set 2 universities to "Admitted" — green nudge appears: "You're admitted to 2 schools. Compare them before accepting →"
2. Set a university to "Rejected" — "Consider emailing admissions for feedback" text appears
3. Set a university to "Waitlisted" — "How to respond →" button appears
4. Click "How to respond" — letter of continued interest tip expands inline

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Dashboard.jsx client/src/components/PostAdmissionDrawer.jsx
git commit -m "feat: multiple admissions compare nudge + rejected/waitlisted guidance"
```

---

## Final Verification Checklist

- [ ] Schema migration ran cleanly (`npx prisma migrate status` shows no pending migrations)
- [ ] `applicationStatus` persists across page refresh (stored in DB via PATCH)
- [ ] Status picker works on both `/universities` and `/dashboard`
- [ ] Cost calculator shows correct total for current university list
- [ ] Cost calculator breakdown updates when profile test scores change
- [ ] Pre-flight drawer: all 4 checks pull live data from `/api/universities/:id/checklist`
- [ ] "Go to Application Portal" opens correct URL in new tab
- [ ] "Yes, I'm applying" updates status to "applied" and closes drawer
- [ ] Post-admission drawer opens automatically on first "Admitted" status change
- [ ] "View next steps" button reopens drawer for admitted schools
- [ ] Step dates are dynamic when enrollment date is set in Timeline
- [ ] Amber nudge appears when no enrollment date is set
- [ ] Multiple admissions: nudge appears at 2+ admitted schools, links to /compare
- [ ] Waitlisted: letter of continued interest tip expands on click
