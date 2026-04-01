# Issue Reporter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated users report bugs from anywhere in the app via a floating button, automatically creating a labeled GitHub issue and storing the report in the database.

**Architecture:** New `IssueReport` Prisma model → `POST/GET /api/issues` Express route → GitHub REST API creates issue → frontend floating button opens modal for quick submit → `/issues` page shows history with GitHub links.

**Tech Stack:** Prisma (SQLite), Express, GitHub REST API (`fetch`), React, axios (`apiClient`), lucide-react icons, Tailwind CSS + CSS variables (existing app theme).

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `server/prisma/schema.prisma` | Add `IssueReport` model + `User.issueReports` relation |
| Create | `server/src/routes/issues.js` | `POST /api/issues` + `GET /api/issues` |
| Modify | `server/src/server.js` | Mount issues route |
| Create | `client/src/components/FeedbackModal.jsx` | Modal form: title + description + submit |
| Create | `client/src/components/FeedbackButton.jsx` | Fixed floating button that opens FeedbackModal |
| Modify | `client/src/components/layout/Layout.jsx` | Render `<FeedbackButton />` inside layout |
| Create | `client/src/pages/Issues.jsx` | `/issues` history page |
| Modify | `client/src/components/layout/Sidebar.jsx` | Add "Report Issue" nav item |
| Modify | `client/src/components/layout/MobileNav.jsx` | Add "Report Issue" nav item |
| Modify | `client/src/App.jsx` | Import `Issues` + add `/issues` route |

---

## Task 1: Add IssueReport schema model

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: Add IssueReport model to schema**

Open `server/prisma/schema.prisma`. Add this block at the end of the file:

```prisma
model IssueReport {
  id                Int      @id @default(autoincrement())
  userId            Int      @map("user_id")
  user              User     @relation(fields: [userId], references: [id])
  title             String
  description       String
  githubIssueUrl    String   @map("github_issue_url")
  githubIssueNumber Int      @map("github_issue_number")
  createdAt         DateTime @default(now()) @map("created_at")

  @@map("issue_reports")
}
```

- [ ] **Step 2: Add relation to User model**

In the same file, find the `User` model's relation block (it ends with `lors LetterOfRecommendation[]`). Add one line after it:

```prisma
  issueReports IssueReport[]
```

- [ ] **Step 3: Run migration**

```bash
cd server
npx prisma migrate dev --name add_issue_reports
```

Expected: `The following migration(s) have been applied: .../add_issue_reports/migration.sql`

- [ ] **Step 4: Verify Prisma client regenerated**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 5: Commit**

```bash
cd server
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add IssueReport schema model"
```

---

## Task 2: Create issues route

**Files:**
- Create: `server/src/routes/issues.js`

- [ ] **Step 1: Create the route file**

Create `server/src/routes/issues.js` with the following content:

```js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// POST /api/issues — create a report + GitHub issue
router.post('/', async (req, res) => {
  const { title, description } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required.' });
  if (!description || !description.trim()) return res.status(400).json({ error: 'Description is required.' });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });

  // Create GitHub issue
  const githubRes = await fetch('https://api.github.com/repos/simantstha/uniapply/issues', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title.trim(),
      body: `${description.trim()}\n\n---\n*Reported by: ${user.name} (${user.email})*`,
      labels: ['user-report'],
    }),
  });

  if (!githubRes.ok) {
    const err = await githubRes.text();
    console.error('GitHub API error:', err);
    return res.status(502).json({ error: 'Could not create GitHub issue. Please try again.' });
  }

  const ghData = await githubRes.json();

  const report = await prisma.issueReport.create({
    data: {
      userId: req.userId,
      title: title.trim(),
      description: description.trim(),
      githubIssueUrl: ghData.html_url,
      githubIssueNumber: ghData.number,
    },
  });

  res.status(201).json(report);
});

// GET /api/issues — list user's reports
router.get('/', async (req, res) => {
  const reports = await prisma.issueReport.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      githubIssueUrl: true,
      githubIssueNumber: true,
      createdAt: true,
    },
  });
  res.json(reports);
});

export default router;
```

- [ ] **Step 2: Mount route in server.js**

Open `server/src/server.js`. Add the import with the other route imports at the top:

```js
import issuesRoutes from './routes/issues.js';
```

Then add the mount line after `app.use('/api/lors', lorsRoutes);`:

```js
app.use('/api/issues', issuesRoutes);
```

- [ ] **Step 3: Add GITHUB_TOKEN to server/.env**

Open `server/.env` and add:

```
GITHUB_TOKEN=your_classic_pat_here
```

The PAT needs the `repo` scope. Create one at: https://github.com/settings/tokens

- [ ] **Step 4: Smoke-test the endpoints**

Start the server:
```bash
cd server && npm run dev
```

Test GET (should return empty array):
```bash
curl -H "Authorization: Bearer <your_jwt>" http://localhost:3001/api/issues
```
Expected: `[]`

Test POST:
```bash
curl -X POST http://localhost:3001/api/issues \
  -H "Authorization: Bearer <your_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test issue","description":"This is a test report from the plan."}'
```
Expected: 201 with `{ id, title, githubIssueUrl, githubIssueNumber, ... }`. Check that the issue appears in https://github.com/simantstha/uniapply/issues with label `user-report`.

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/issues.js server/src/server.js
git commit -m "feat: add issues route with GitHub integration"
```

---

## Task 3: FeedbackModal component

**Files:**
- Create: `client/src/components/FeedbackModal.jsx`

- [ ] **Step 1: Create FeedbackModal.jsx**

Create `client/src/components/FeedbackModal.jsx`:

```jsx
import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import apiClient from '../api/client';

export default function FeedbackModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(null); // { githubIssueUrl, githubIssueNumber }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiClient.post('/api/issues', { title, description });
      setSubmitted({ githubIssueUrl: data.githubIssueUrl, githubIssueNumber: data.githubIssueNumber });
      setTimeout(onClose, 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-xl p-6"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Report an Issue
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-tertiary)' }}>
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
              Issue reported! Thanks for the feedback.
            </p>
            <a
              href={submitted.githubIssueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm"
              style={{ color: 'var(--accent)' }}
            >
              View #{submitted.githubIssueNumber} on GitHub <ExternalLink size={13} />
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                required
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? What did you expect?"
                required
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            {error && (
              <p className="text-xs" style={{ color: '#FF3B30' }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg text-sm font-medium transition-opacity"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Submitting…' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/FeedbackModal.jsx
git commit -m "feat: add FeedbackModal component"
```

---

## Task 4: FeedbackButton + wire into Layout

**Files:**
- Create: `client/src/components/FeedbackButton.jsx`
- Modify: `client/src/components/layout/Layout.jsx`

- [ ] **Step 1: Create FeedbackButton.jsx**

Create `client/src/components/FeedbackButton.jsx`:

```jsx
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 md:bottom-6 md:right-6 z-40 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        style={{ background: 'var(--accent)', color: '#fff' }}
        title="Report an issue"
      >
        <MessageSquare size={18} />
      </button>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}
```

Note: `bottom-24` on mobile so the button sits above the MobileNav bar. `bottom-6` on desktop where there's no bottom nav.

- [ ] **Step 2: Add FeedbackButton to Layout**

Open `client/src/components/layout/Layout.jsx`. Add the import at the top:

```jsx
import FeedbackButton from '../FeedbackButton';
```

Add `<FeedbackButton />` just before the closing `</div>` of the layout:

```jsx
export default function Layout() {
  const location = useLocation();
  const isSOP = /^\/sop\/\d+\/\d+/.test(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <main className={`flex-1 overflow-y-auto ${isSOP ? 'overflow-hidden flex flex-col' : 'pb-20 md:pb-0'}`}>
        <Outlet />
      </main>
      <MobileNav />
      <FeedbackButton />
    </div>
  );
}
```

- [ ] **Step 3: Start frontend dev server and verify button appears**

```bash
cd client && npm run dev
```

Open http://localhost:5173/dashboard. You should see a round accent-colored button with a chat icon in the bottom-right corner. Clicking it should open the modal.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/FeedbackButton.jsx client/src/components/layout/Layout.jsx
git commit -m "feat: add floating FeedbackButton to layout"
```

---

## Task 5: Issues history page

**Files:**
- Create: `client/src/pages/Issues.jsx`

- [ ] **Step 1: Create Issues.jsx**

Create `client/src/pages/Issues.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { ExternalLink, Bug } from 'lucide-react';
import apiClient from '../api/client';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Issues() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/api/issues')
      .then(({ data }) => setReports(data))
      .catch(() => setError('Failed to load your reports.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Reported Issues
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
        Issues you've reported. Use the <Bug size={13} className="inline" /> button in the bottom-right corner to report a new one.
      </p>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm" style={{ color: '#FF3B30' }}>{error}</p>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-tertiary)' }}>
          <Bug size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No issues reported yet.</p>
          <p className="text-xs mt-1">Use the button in the bottom-right corner to report a problem.</p>
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map(report => (
            <div
              key={report.id}
              className="rounded-xl px-4 py-3.5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {report.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    #{report.githubIssueNumber} · {timeAgo(report.createdAt)}
                  </p>
                </div>
                <a
                  href={report.githubIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1 text-xs font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  GitHub <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Issues.jsx
git commit -m "feat: add Issues history page"
```

---

## Task 6: Wire up navigation and route

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/components/layout/Sidebar.jsx`
- Modify: `client/src/components/layout/MobileNav.jsx`

- [ ] **Step 1: Add /issues route to App.jsx**

Open `client/src/App.jsx`. Add the import near the other page imports:

```jsx
import Issues from './pages/Issues';
```

Add the route inside the `<PrivateRoute>` block, after the `/timeline` route:

```jsx
<Route path="/issues" element={<Issues />} />
```

- [ ] **Step 2: Add "Report Issue" to Sidebar**

Open `client/src/components/layout/Sidebar.jsx`. Add `Bug` to the lucide import:

```jsx
import { LayoutDashboard, User, Building2, FolderOpen, LogOut, Sun, Moon, CalendarClock, Bug } from 'lucide-react';
```

Add to the `navItems` array after the Timeline entry:

```js
{ to: '/issues', icon: Bug, label: 'Report Issue' },
```

- [ ] **Step 3: Add "Report Issue" to MobileNav**

Open `client/src/components/layout/MobileNav.jsx`. Add `Bug` to the lucide import:

```jsx
import { LayoutDashboard, User, Building2, FolderOpen, CalendarClock, Bug } from 'lucide-react';
```

Add to the `navItems` array after the Timeline entry:

```js
{ to: '/issues', icon: Bug, label: 'Report Issue' },
```

- [ ] **Step 4: Verify end-to-end in browser**

With both servers running (`npm run dev` in `server/` and `client/`):

1. Open http://localhost:5173/dashboard — sidebar should show "Report Issue" link with Bug icon.
2. Click the floating button (bottom-right) → modal opens.
3. Fill in title + description → submit → success message with GitHub link appears.
4. Check https://github.com/simantstha/uniapply/issues — new issue should be there with `user-report` label.
5. Navigate to http://localhost:5173/issues — the submitted report appears with issue number + GitHub link.

- [ ] **Step 5: Commit**

```bash
git add client/src/App.jsx client/src/components/layout/Sidebar.jsx client/src/components/layout/MobileNav.jsx
git commit -m "feat: wire issues route and nav links"
```

---

## Task 7: Set Fly.io secret + deploy

- [ ] **Step 1: Set GITHUB_TOKEN on Fly.io**

```bash
cd server
fly secrets set GITHUB_TOKEN=your_classic_pat_here
```

Expected: `Release v... created` (Fly auto-redeploys)

- [ ] **Step 2: Deploy frontend to Vercel**

```bash
cd client
vercel --prod
```

- [ ] **Step 3: Open final PR**

```bash
git checkout -b feat/issue-reporter
git push -u origin feat/issue-reporter
gh pr create --title "feat: in-app issue reporter with GitHub integration" --body "$(cat <<'EOF'
## Summary
- Floating \`MessageSquare\` button on every authenticated page opens a report modal
- Reports create a labeled GitHub issue in simantstha/uniapply automatically
- \`/issues\` page shows full history with GitHub links
- New \`IssueReport\` Prisma model stores reports locally

## Test plan
- [ ] Submit a report via floating button → GitHub issue created with \`user-report\` label
- [ ] Success confirmation shows GitHub issue number + link
- [ ] \`/issues\` page lists past reports newest-first
- [ ] Empty state shown when no reports exist
- [ ] Error message shown when GitHub API fails (test by temporarily using invalid token)
- [ ] Sidebar + MobileNav "Report Issue" links work

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
