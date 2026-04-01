# Issue Reporter — Design Spec
*Date: 2026-03-30*

## Overview

In-app bug/issue reporting that lets authenticated users submit problems they encounter. Reports are stored in the database and automatically create labeled GitHub issues in `simantstha/uniapply`.

---

## Placement

Two entry points:
- **Floating button** — fixed bottom-right on every authenticated page. Opens a quick-submit modal without leaving the current page.
- **`/issues` page** — full history page accessible from the sidebar and mobile nav. Shows all issues the logged-in user has submitted.

---

## Schema

New `IssueReport` model added to Prisma schema:

```prisma
model IssueReport {
  id                Int      @id @default(autoincrement())
  userId            Int
  user              User     @relation(fields: [userId], references: [id])
  title             String
  description       String
  githubIssueUrl    String
  githubIssueNumber Int
  createdAt         DateTime @default(now())
}
```

`User` model gets a new relation: `issueReports IssueReport[]`

---

## Backend

### New route file: `server/src/routes/issues.js`

**`POST /api/issues`** (auth required)
1. Validate: title and description required, both non-empty strings.
2. Call GitHub REST API: `POST https://api.github.com/repos/simantstha/uniapply/issues`
   - Headers: `Authorization: Bearer GITHUB_TOKEN`, `Accept: application/vnd.github+json`
   - Body: `{ title, body: "{description}\n\n---\n*Reported by: {user.name} ({user.email})*", labels: ["user-report"] }`
3. On GitHub API success, save `IssueReport` row to DB with `githubIssueUrl` and `githubIssueNumber` from the response.
4. Return the created report (201).
5. On GitHub API failure, return 502 with a user-friendly message. Do not save to DB if GitHub call fails.

**`GET /api/issues`** (auth required)
- Returns all `IssueReport` rows for `req.user.id`, ordered by `createdAt DESC`.
- Fields returned: `id`, `title`, `description`, `githubIssueUrl`, `githubIssueNumber`, `createdAt`.

### Environment variable

`GITHUB_TOKEN` — classic personal access token with `repo` scope. Added to:
- `server/.env` (local)
- Fly.io secrets (`fly secrets set GITHUB_TOKEN=...`)

### Registration

Mount in `server/src/server.js`:
```js
app.use('/api/issues', require('./routes/issues'));
```

---

## Frontend

### `FeedbackButton.jsx`

- Fixed position, bottom-right corner (`fixed bottom-6 right-6 z-50`).
- Small circular button with `MessageSquare` icon (lucide-react).
- Rendered once inside `Layout.jsx`, only when user is authenticated.
- Clicking opens `FeedbackModal`.

### `FeedbackModal.jsx`

- Centered modal (same style as existing modals in the app).
- Fields: **Title** (text input, required) + **Description** (textarea, required).
- Submit button shows loading state while request is in flight.
- On success: replace form with "Issue reported! [View on GitHub →]" confirmation for 3 seconds, then close.
- On error: show inline error message, keep form open so user doesn't lose their text.

### `Issues.jsx` (`/issues`)

- Fetches `GET /api/issues` on mount.
- Renders a list of past reports, newest first.
- Each row: title, relative date (e.g. "2 hours ago"), `#githubIssueNumber`, "View on GitHub →" link.
- Empty state: "No issues reported yet. Use the button in the bottom-right corner to report a problem."
- Loading skeleton + error state handled.

### Navigation updates

- **Sidebar**: add "Report Issue" link (with `Bug` icon from lucide) below existing nav items.
- **MobileNav**: add "Report Issue" entry in the same position.
- Both link to `/issues`.

### Route

Add `/issues` to `App.jsx` route list, protected (requires auth).

---

## Data Flow

```
User clicks floating button
  → FeedbackModal opens
  → User fills title + description → submits
  → POST /api/issues
      → GitHub REST API creates issue (labeled "user-report")
      → DB saves IssueReport row
      → Returns { id, githubIssueUrl, githubIssueNumber, ... }
  → Modal shows success + GitHub link
  → /issues page (GET /api/issues) shows history from DB
```

---

## Error Handling

- GitHub API down or token invalid → 502 returned to client → modal shows "Couldn't submit to GitHub. Please try again."
- Title/description missing → 400 → inline field error.
- Network error on client → inline error, form stays open.

---

## Out of Scope

- Severity or category fields (kept intentionally simple).
- Screenshot attachments.
- Syncing GitHub issue open/closed status (users click the GitHub link to check status).
- Admin view of all users' reports.
- Rate limiting per user (can add later if abused).
