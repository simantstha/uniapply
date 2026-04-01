# User Flow Guidance Design Spec

## Problem

New users land on the dashboard after onboarding and don't know what to do next. Three compounding issues:

1. **Cold start** — the dashboard journey widget shows 5 steps but doesn't explain *why* each step matters or make the current action obvious
2. **Empty pages give no context** — Universities, Documents, and Timeline are blank for new users with no explanation of what they do or how to start
3. **No connection between sections** — nothing tells the user that adding universities unlocks SOPs, or that documents are per-school, etc.

## Solution

Approach B: enhance the existing dashboard journey widget + add meaningful empty states to the 3 blank pages. No new pages, no product tour overlay, no tooltips.

---

## Component 1 — Enhanced Dashboard Journey Widget

**File:** `client/src/pages/Dashboard.jsx` (journey steps section)

**Changes:**
- Add a 5-segment progress bar above the steps (filled = complete, current = accent, future = faint)
- The **current step** (first incomplete) expands with:
  - Step title (same as before)
  - A one-sentence "why this matters" description explaining what unlocks next
  - An "UP NEXT" badge
  - A direct CTA button linking to the relevant page
- **Completed steps** collapse to a single strikethrough line (title only, reduced opacity)
- **Future steps** render at reduced opacity (faded), showing only step number + title
- A "X of 5 complete" counter in the widget header

**Why-text per step:**

| Step | Why text |
|------|----------|
| 1 — Complete your profile | "Your GPA and test scores power the AI university suggestions and fit scores." |
| 2 — Add your universities | "Your SOPs, documents, and deadlines are all organized per school — this unlocks everything else." |
| 3 — Upload your documents | "Upload once, attach to any university. Most programs require transcripts and test score reports." |
| 4 — Write your personal statement | "Open any university from your list to start its SOP in the guided editor." |
| 5 — Get AI feedback | "The AI critiques your SOP across clarity, fit, and narrative — and gives it a score." |

**No new data fetching needed** — the widget already receives `data` (stats) from the existing `fetchStats` call.

---

## Component 2 — Universities Empty State

**File:** `client/src/pages/Universities.jsx`

**Condition:** render when `universities.length === 0` (already fetched)

**Content:**
- Icon: building emoji or `Building2` lucide icon in a colored rounded square
- Heading: "Build your school list"
- Body: "Add universities you're interested in, then tag each one as Dream, Target, or Safety. Your SOPs, documents, and deadlines are all organized per university."
- Three tier-explainer pills (inline, horizontal):
  - ⭐ **Dream** — Reach schools, apply anyway
  - 🎯 **Target** — Good match for your profile
  - 🛡 **Safety** — Strong admit chance
- CTA button: "+ Add your first university" (triggers the existing add-university modal/flow)

---

## Component 3 — Documents Empty State

**File:** `client/src/pages/Documents.jsx`

**Condition:** render when document list is empty

**Content:**
- Icon: folder emoji or `FolderOpen` lucide icon
- Heading: "Your document vault"
- Body: "Upload your supporting documents once — then attach them to any university. No re-uploading for each school."
- Three doc-type explainer rows (stacked cards):
  - 📄 **Transcripts** — Official academic records from your institution — most programs require this
  - 📝 **Test Scores** — GRE, TOEFL, IELTS, SAT score reports sent to each university
  - ✉️ **Recommendation Letters** — LORs from professors or supervisors — track status per recommender
- CTA button: "+ Upload your first document" (triggers existing upload flow)

---

## Component 4 — Timeline Empty State

**File:** `client/src/pages/Timeline.jsx`

**Condition:** render when no milestones exist / no target semester set

**Content:**
- Icon: calendar emoji or `CalendarClock` lucide icon
- Heading: "Your application timeline"
- Body: "Tell us when you want to start studying — we'll work backwards and build a personalised milestone schedule so nothing slips."
- Four benefit rows (checkmark list):
  - Application deadline countdown per school
  - Test prep milestones (GRE, TOEFL)
  - LOR request reminders
  - SOP draft & revision schedule
- Target semester selector (pill buttons: Fall 2026 / Spring 2027 / Fall 2027) — pre-selects based on `user.targetSemester` if set in profile
- CTA button: "Generate my timeline →"

---

## What We're NOT Building

- Product tour overlay (intro.js style)
- Tooltips on individual UI elements
- New pages or routes
- Changes to the onboarding flow

---

## Success Criteria

A new user who completes onboarding can:
1. Land on the dashboard and immediately know what their next action is
2. Navigate to Universities/Documents/Timeline and understand what each section does within 5 seconds — without reading any external docs
