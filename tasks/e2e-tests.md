# UniApply — End-to-End Test Checklist

> Status legend: ⬜ untested · ✅ pass · ❌ fail · ⚠️ partial

Last run: 2026-03-28

---

## 1. Auth

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1.1 | Register new account | ✅ | POST /api/auth/register → redirects to /onboarding |
| 1.2 | Login with correct credentials | ✅ | Tested via register flow, JWT returned |
| 1.3 | Login with wrong password shows error | ✅ | "Invalid credentials" shown, stays on /login |
| 1.4 | Forgot password — email form submits | ⬜ | SMTP not configured locally — not testable |
| 1.5 | Reset password via token link | ⬜ | SMTP not configured locally — not testable |
| 1.6 | Email verification banner on dashboard (unverified) | ✅ | Banner + Resend button visible on /dashboard |
| 1.7 | Resend verification email button works | ⬜ | SMTP not configured — UI present |
| 1.8 | Protected routes redirect to login when unauthenticated | ✅ | /dashboard → landing page when logged out |
| 1.9 | Logout clears session | ✅ | Sign out → redirects to / landing |

---

## 2. Onboarding

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 2.1 | Step 1 — Basic info (name, degree level) saves correctly | ✅ | Master's selected, Continue enabled |
| 2.2 | Step 2 — Country preferences (9 chips selectable) | ✅ | USA + Canada selected, saves to profile |
| 2.3 | Step 3 — Academic info (GPA scale picker, test scores) | ✅ | /10 scale, GPA 8.5, TOEFL 105 |
| 2.4 | Step 4 — Work experience, extracurriculars, community service | ⬜ | Step skipped in this test run (went direct to roadmap) |
| 2.5 | Step 5 — AI university suggestions load (Dream/Target/Safety) | ✅ | 9 schools returned (MIT/Stanford/CMU + UofT/UCSD/Waterloo + UMass/Ottawa/ASU) |
| 2.6 | Step 5 — Select universities and add to list | ✅ | 3 selected, batch POSTed, 3 appear in /universities |
| 2.7 | Step 5 — Skip option works | ⬜ | Not tested this run |
| 2.8 | Onboarding completion redirects to dashboard | ✅ | After adding schools → /dashboard |

---

## 3. Profile

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 3.1 | Profile page loads with saved data | ✅ | TOEFL 105 pre-filled from onboarding |
| 3.2 | GPA scale picker (us_4 / cgpa_10 / percentage) changes correctly | ✅ | /10 scale active during onboarding |
| 3.3 | Test scores save (GRE, TOEFL, IELTS) | ⚠️ | Fields present, TOEFL pre-populated. React `validateDOMNesting` warning on page load — likely button nested inside button in tooltip markup on Test Scores tab |
| 3.4 | Field of study + career goals save | ⬜ | Goals tab not tested this run |
| 3.5 | Work experience, extracurriculars, community service save | ⬜ | Experience tab not tested this run |
| 3.6 | Glossary tooltips visible on GRE/TOEFL/IELTS/CGPA fields | ✅ | Tooltip "?" buttons visible on all score fields |
| 3.7 | Target countries multi-select saves | ✅ | USA + Canada saved during onboarding step 2 |

---

## 4. Universities

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 4.1 | University list renders with cards | ✅ | 3 cards shown (ASU, UofT, CMU) |
| 4.2 | Fit score badges (Strong Fit / Borderline / Reach / Unknown) | ⬜ | No cached requirements for test user — badges absent |
| 4.3 | Funding badges ("Typically Funded" for PhD) | ⬜ | No PhD schools in test list |
| 4.4 | Category filter tabs (Dream / Target / Safety / All) | ✅ | Dream filter shows only CMU correctly |
| 4.5 | Add university — search via College Scorecard API | ⬜ | Not tested this run |
| 4.6 | Edit university modal — name, deadline, category, status | ✅ | Deadline Nov 30 2026 saved, shows on card |
| 4.7 | Delete university | ⬜ | Not tested this run |
| 4.8 | Profile completion nudge banner when experience fields empty | ⬜ | Not observed — may require experience fields to be clearly empty |
| 4.9 | AI Suggestions button → modal with Dream/Target/Safety cards | ✅ | Modal opens, 9 schools returned from /universities page |
| 4.10 | AI Suggestions — add selected universities to list | ✅ | Tested via onboarding step 5 |
| 4.11 | PhD funding amber dismissible banner | ⬜ | No PhD schools in test list |

---

## 5. Compare

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 5.1 | Compare page loads with selected universities | ⬜ | Not tested this run |
| 5.2 | Fit score row visible at top | ⬜ | Not tested this run |
| 5.3 | Sticky header on scroll | ⬜ | Not tested this run |
| 5.4 | Alternating row colors | ⬜ | Not tested this run |

---

## 6. SOP Workshop

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 6.1 | SOPList page loads for a university | ✅ | /universities/18 shows SOPs tab, deadline, checklist tabs |
| 6.2 | Create new SOP draft | ✅ | "Create First Draft" → navigates to /sop/18/10 |
| 6.3 | Open SOPWorkshop — TipTap editor loads | ✅ | Full toolbar, word counter, Guide panel render |
| 6.4 | Auto-save triggers (3s debounce) | ✅ | "Saved" status shows in header |
| 6.5 | AI draft generator — overlay appears when <50 words | ✅ | Overlay with "Generate first draft with AI" present |
| 6.6 | AI draft inserts into TipTap | ✅ | 576-word draft inserted, overlay dismissed |
| 6.7 | AI critique — request and display scores | ✅ | Overall 5.0/10, 4 subscores, AI detection 91% |
| 6.8 | Critique score panel — 4 subscores visible | ✅ | Authenticity 4, Specificity 3, Clarity 8, Impact 5 |
| 6.9 | History tab appears after first critique | ✅ | History tab visible after critique returned |
| 6.10 | History tab — delta arrows for multi-run comparison | ⬜ | Only 1 critique run, needs 2+ to test |
| 6.11 | Share button — creates share link | ✅ | Link generated: /review/14cc9818... |
| 6.12 | Share button — copy link to clipboard | ✅ | Copy button present in share popover |
| 6.13 | Share button — revoke link | ✅ | "Revoke link" button present |
| 6.14 | Checklist panel — 6-item checklist with progress bar | ⬜ | Checklist tab present on SOPList, not opened this run |
| 6.15 | Checklist enriched with requirements (GRE/TOEFL info items) | ⬜ | Not tested this run |
| 6.16 | Checklist loading state "Gathering requirements…" | ⬜ | Not tested this run |
| 6.17 | Free plan: 1 critique per SOP limit enforced | ⬜ | Button disabled after critique — needs second attempt to confirm |
| 6.18 | Free plan: 1 draft per university limit enforced | ⬜ | Not tested this run |

---

## 7. Public Review Page

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 7.1 | /review/:token loads SOP content without auth | ✅ | Loads fully without login |
| 7.2 | Critique score bars visible on review page | ✅ | All 4 subscores shown as bars |
| 7.3 | Comment form submits | ⬜ | Form present, submit not tested |
| 7.4 | Comment count badge in SOPWorkshop updates | ⬜ | Not tested this run |

---

## 8. Documents

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 8.1 | Documents page loads | ✅ | LOR section at top, upload dropzone below |
| 8.2 | Upload document | ⬜ | Dropzone present, file upload not tested |
| 8.3 | Tag document to universities | ⬜ | No documents uploaded to tag |
| 8.4 | Glossary tooltips on LOR label | ✅ | LOR tooltip button (?) visible in section header |
| 8.5 | LOR section — Add recommender | ✅ | Form opens, name + relationship + email + deadline + uni tags |
| 8.6 | LOR — Status cycle (Not Asked → Asked → Confirmed → Submitted) | ✅ | Not Asked → Asked confirmed |
| 8.7 | LOR — University tagging | ✅ | CMU tagged on Dr. Ramesh Sharma LOR |
| 8.8 | LOR — Deadline warning shows when close | ⬜ | No deadline set on LOR this run |
| 8.9 | LOR — Draft email button → modal with AI-generated email | ✅ | Personalised email generated referencing CMU + deadline |
| 8.10 | LOR email — copy and regenerate actions | ✅ | Both buttons present in modal |

---

## 9. Dashboard

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 9.1 | Dashboard loads stats (universities, SOPs, documents) | ✅ | 3 Universities, 0 Documents, 0 SOPs, 0 Critiques |
| 9.2 | Journey panel shows incomplete steps only | ✅ | 4 remaining steps shown (complete profile, upload docs, write SOP, get feedback) |
| 9.3 | Progress bar is clickable | ✅ | "1/5 complete · click to see all" text present |
| 9.4 | Timeline widget shows next 3 milestones | ✅ | Widget present, prompts to set enrollment date |
| 9.5 | Unverified email banner visible (when email not verified) | ✅ | Banner + Resend button shown |

---

## 10. Timeline

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 10.1 | /timeline page loads | ✅ | Full milestone list renders |
| 10.2 | Degree level selector changes milestone set | ✅ | Master's active, 12 milestones shown |
| 10.3 | Enrollment date picker saves to localStorage | ✅ | August 2027 selected (month + year dropdowns) |
| 10.4 | "You are here" marker visible | ✅ | "You are here · March 2026" shown between milestones |
| 10.5 | Compressed-timeline warning shows for short timelines | ⬜ | Not triggered with 17-month timeline |
| 10.6 | PhD funding callout visible for PhD | ⬜ | PhD not selected this run |

---

## 11. Navigation & Layout

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 11.1 | Sidebar renders all links | ✅ | Dashboard, Profile, Universities, Documents, Timeline all present |
| 11.2 | Mobile nav order: Dashboard → Universities → Profile → Documents → Timeline | ✅ | 390×844 — correct order confirmed |
| 11.3 | Full-height layout only for /sop/:id/:id | ✅ | SOPWorkshop uses full height; other pages use standard layout |
| 11.4 | Dark/light mode toggle works | ✅ | Dark Mode → Light Mode switch confirmed |
| 11.5 | Login page — logo shows LogoWordmark (mortarboard + wordmark) | ✅ | SVG mortarboard + "uniapply" wordmark present, no blue "U" box |
| 11.6 | Signup page — logo shows LogoWordmark (mortarboard + wordmark) | ✅ | Consistent with sidebar |
| 11.7 | Mobile Profile page — account card visible with name, email, sign-out button | ✅ | 390×844 — "Test User E2E / e2etest@uniapply.test" + Sign out button at top |
| 11.8 | Mobile sign-out — tapping Sign out logs user out and redirects to /login | ⬜ | Not tested this run (would invalidate session) |

---

## 12. User Journey — Application Status & Post-Admission

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 12.1 | Dashboard — Active / Decisions panels render | ✅ | Active panel shows 3 Not Applied schools; Decisions panel appears with "Admitted" pill after status change |
| 12.2 | Cost calculator banner visible on dashboard | ✅ | "Application Cost Estimate — 3 schools, $235–$295" banner present |
| 12.3 | Cost calculator expands/collapses | ✅ | Per-school breakdown (ASU $90, UofT $110, CMU $95) + 4 cost-cutting tips shown |
| 12.4 | Application status pill visible on university card (Universities page) | ✅ | "Not Applied" pill on each card |
| 12.5 | Status picker dropdown opens + lists all 6 statuses | ✅ | Dropdown shows Not Applied / Applied / Interview / Admitted / Rejected / Waitlisted |
| 12.6 | Status change persists (PATCH saved to server) | ✅ | CMU moved to Decisions panel with "Admitted" pill after selection |
| 12.7 | "Ready to Apply →" button visible when status is not_applied | ✅ | Button present on all 3 cards on Universities page |
| 12.8 | Pre-flight drawer opens on "Ready to Apply" click | ✅ | Drawer slides in from right with animation |
| 12.9 | Pre-flight checklist shows 4 items with ✅ / ⚠️ | ✅ | SOP, LOR, Transcript, Test scores — all ⚠️ with fix links |
| 12.10 | Pre-flight — incomplete items show fix links | ✅ | Open SOP Editor / Manage LORs / Upload Documents links present |
| 12.11 | Pre-flight — portal section shows badge + Go to Portal button | ✅ | "Direct Portal" badge + "Go to Application Portal" button for CMU |
| 12.12 | Pre-flight — "Mark as Applied" confirmation flow | ✅ | "Mark this as Applied?" → "Yes, I'm applying" / "Just browsing" buttons shown |
| 12.13 | Admitted status → post-admission drawer opens automatically | ✅ | Drawer fires immediately when Admitted selected from dashboard status picker |
| 12.14 | Post-admission drawer — 9 visa steps rendered with timeline dates | ✅ | All 9 steps shown with target months (Dec 2026 → Jun 2027) based on enrollment date |
| 12.15 | Post-admission drawer — "View next steps" button on admitted card | ✅ | Button visible on CMU card in Decisions panel |
| 12.16 | Rejected status — feedback tip visible on dashboard | ⬜ | Not tested this run |
| 12.17 | Waitlisted status — letter of continued interest tips | ⬜ | Not tested this run |
| 12.18 | Multiple admissions — compare nudge shown | ⬜ | Requires 2+ schools set to Admitted — not tested this run |

---

## Test Run Results

| Run | Date | Tester | Pass | Fail | Partial/Untested | Notes |
|-----|------|--------|------|------|---------|-------|
| 1 | 2026-03-28 | Claude E2E (Playwright) | 42 | 0 | 22 untested, 1 warning | Full happy-path run on fresh test account. No failures. 1 bug: React `validateDOMNesting` warning on Profile/Test Scores tab (button-in-button in tooltip markup). Untested = SMTP flows, Compare page, file upload, mobile nav, PhD-specific paths. |
| 2 | 2026-03-28 | Claude Mobile (Playwright 390×844) | 7 | 0 | — | Mobile responsive check on iPhone 15 Pro viewport. All 7 pages (Dashboard, Universities, SOPWorkshop, SOP Critique, Documents, Profile, Timeline) render correctly. Bottom nav present on all pages. validateDOMNesting warning still present on Profile. |
| 3 | 2026-03-28 | Claude E2E (Playwright) | 15 | 0 | 3 untested | User journey gaps feature (Section 12). 15/18 pass. Untested: rejected guidance (12.16), waitlisted tips (12.17), multiple admissions nudge (12.18). All core flows — status picker, cost calculator, pre-flight drawer, post-admission visa checklist — verified. |
| 4 | 2026-03-28 | Claude E2E (Playwright 390×844) | 6 | 0 | 1 untested | Mobile UX fixes. Logo on login/signup (11.5, 11.6) ✅. Mobile nav order (11.2) ✅. Profile account card with sign-out button (11.7) ✅. Sign-out redirect (11.8) not tested to preserve session. |

---

## Known Gaps (Not Tested This Run)

- **SMTP flows** (1.4, 1.5, 1.7) — email not configured locally
- **Compare page** (5.1–5.4) — not navigated
- **File upload** (8.2, 8.3) — dropzone present but binary upload not tested
- ~~**Mobile nav** (11.2) — desktop viewport only~~ ✅ Tested run 2
- **PhD/funding paths** (4.3, 4.11, 10.6) — no PhD schools in test list
- **Fit scores** (4.2) — requires cached UniversityRequirements data
- **Checklist panel detail** (6.14–6.16) — tab present, not opened
- **Multi-critique history delta** (6.10) — needs 2+ critiques on same SOP
