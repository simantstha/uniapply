# UniApply Feature Test Registry

> Auto-managed by post-commit hook. Update `status` after each test run.
> Status: ✅ tested | ⚠️ needs-testing | ❌ broken | 🔲 untested

---

## Auth & Onboarding

| Feature | Route/Area | Status | Last Tested | Notes |
|---------|-----------|--------|-------------|-------|
| Signup + JWT | `/` (signup form) | ✅ tested | 2026-03-27 | Basic flow works |
| Login | `/` (login form) | ✅ tested | 2026-03-27 | |
| Password reset | `/forgot-password`, `/reset-password` | 🔲 untested | — | SMTP not configured in prod |
| Email verification | `/verify-email` | 🔲 untested | — | SMTP not configured in prod |
| Onboarding wizard steps 1–4 | `/onboarding` | ✅ tested | 2026-03-27 | All 4 steps complete |
| Onboarding step 5 — AI suggestions | `/onboarding` step 5 | ✅ tested | 2026-03-27 | Dream/Target/Safety cards render; "Add selected" works |

---

## Profile

| Feature | Route/Area | Status | Last Tested | Notes |
|---------|-----------|--------|-------------|-------|
| GPA scale picker (us_4 / cgpa_10 / percentage) | `/profile` Academics tab | ✅ tested | 2026-03-27 | |
| Test scores (GRE/TOEFL/IELTS) | `/profile` Academics tab | ✅ tested | 2026-03-27 | Glossary tooltips present |
| Field of study + career goals | `/profile` Goals tab | ✅ tested | 2026-03-27 | |
| Target countries multi-select | `/profile` Goals tab | ✅ tested | 2026-03-27 | 9 preset countries; PR #3 |
| Work experience field | `/profile` Experience tab | ✅ tested | 2026-03-27 | PR #3 |
| Extracurriculars field | `/profile` Experience tab | ✅ tested | 2026-03-27 | PR #3 |
| Community service field | `/profile` Experience tab | ✅ tested | 2026-03-27 | PR #3 |

---

## Dashboard

| Feature | Route/Area | Status | Last Tested | Notes |
|---------|-----------|--------|-------------|-------|
| Stats overview | `/dashboard` | ✅ tested | 2026-03-27 | Fixed categoryConfig case bug |
| Journey panel (incomplete steps) | `/dashboard` | ✅ tested | 2026-03-27 | |
| Progress bar (clickable) | `/dashboard` | ✅ tested | 2026-03-27 | |
| Timeline widget (next 3 milestones) | `/dashboard` | 🔲 untested | — | Requires enrollment date set |
| Email verification banner + resend | `/dashboard` | 🔲 untested | — | Only shows for unverified users |

---

## Universities

| Feature | Route/Area | Status | Last Tested | Notes |
|---------|-----------|--------|-------------|-------|
| University list + search | `/universities` | ✅ tested | 2026-03-27 | Fixed categoryConfig case bug |
| Category filter (Dream/Target/Safety) | `/universities` | ✅ tested | 2026-03-27 | |
| Fit score badges | `/universities` | ✅ tested | 2026-03-27 | |
| Funding badges (PhD) | `/universities` | ✅ tested | 2026-03-27 | |
| Edit university modal | `/universities` | 🔲 untested | — | |
| AI Suggestions button + modal | `/universities` | ✅ tested | 2026-03-27 | PR #3; Dream/Target/Safety cards |
| Profile completion nudge banner | `/universities` | ✅ tested | 2026-03-27 | PR #3; shows when experience fields empty |
| Add university via search | `/universities` | 🔲 untested | — | |

---

## Compare

| Feature | Route/Area | Status | Last Tested | Notes |
|---------|-----------|--------|-------------|-------|
| Side-by-side comparison | `/compare` | 🔲 untested | — | |
| Fit score row (top) | `/compare` | 🔲 untested | — | |
| Sticky header + alternating rows | `/compare` | 🔲 untested | — | |

---

## SOP Workshop

| Feature | Route/Area | Status | Last Tested | Notes |
|---------|-----------|--------|-------------|-------|
| SOPList — draft cards | `/sop/:universityId` | 🔲 untested | — | |
| SOPList — checklist panel + progress | `/sop/:universityId` | 🔲 untested | — | |
| SOPList — critique score per card | `/sop/:universityId` | 🔲 untested | — | |
| SOPWorkshop — TipTap editor | `/sop/:universityId/:sopId` | 🔲 untested | — | |
| AI draft generator (overlay card) | `/sop/:universityId/:sopId` | 🔲 untested | — | Appears when word count < 50 |
| AI critique (+ score display) | `/sop/:universityId/:sopId` | 🔲 untested | — | |
| Critique history tab (delta arrows) | `/sop/:universityId/:sopId` | 🔲 untested | — | Appears after ≥1 critique |
| Share button + copy/revoke | `/sop/:universityId/:sopId` | 🔲 untested | — | |
| Public SOP review page + comments | `/review/:token` | 🔲 untested | — | |
| Multi-draft (free plan limit) | `/sop/:universityId` | 🔲 untested | — | Free = 1 draft per university |
| Mark draft as final | `/sop/:universityId` | 🔲 untested | — | |

---

## Documents

| Feature | Route/Area | Status | Last Tested | Notes |
|---------|-----------|--------|-------------|-------|
| Document upload + management | `/documents` | 🔲 untested | — | |
| University tagging on documents | `/documents` | 🔲 untested | — | |
| LOR tracker — add/edit/delete | `/documents` | 🔲 untested | — | |
| LOR status cycling (Not Asked → Submitted) | `/documents` | 🔲 untested | — | |
| LOR deadline warnings | `/documents` | 🔲 untested | — | |
| LOR draft email generator | `/documents` | 🔲 untested | — | |

---

## Timeline

| Feature | Route/Area | Status | Last Tested | Notes |
|---------|-----------|--------|-------------|-------|
| Backwards milestone calculator | `/timeline` | 🔲 untested | — | |
| Degree level selector | `/timeline` | 🔲 untested | — | |
| "You are here" marker | `/timeline` | 🔲 untested | — | |
| Compressed-timeline warning | `/timeline` | 🔲 untested | — | |
| localStorage persistence | `/timeline` | 🔲 untested | — | |

---

## Cross-cutting / Infrastructure

| Feature | Area | Status | Last Tested | Notes |
|---------|------|--------|-------------|-------|
| Glossary tooltips (17 terms) | Profile, Documents, SOPList | 🔲 untested | — | |
| Funding awareness — PhD banner | `/universities` | 🔲 untested | — | Shows when ≥1 PhD university added |
| Deadline reminder emails (cron) | Server | 🔲 untested | — | SMTP not configured |
| Error cards (ErrorCard.jsx) | Dashboard, Universities, Documents | ✅ tested | 2026-03-27 | Does not crash on API error |
| Mobile nav + sidebar | All pages | 🔲 untested | — | |
| Dark/light mode | All pages | 🔲 untested | — | |

---

## Testing Instructions

### Quick smoke test (after any commit)
```bash
# Start servers
cd server && npm run dev &
cd client && npm run dev &

# Then use agent-browser to walk the affected feature
npx agent-browser open http://localhost:5173
```

### Full regression (before merging to main)
Walk through each ✅ feature above to confirm no regressions.

### Adding a new feature to this registry
1. Add a row to the relevant section with status `⚠️ needs-testing`
2. Run the feature manually or via agent-browser
3. Update status to `✅ tested` with the date
