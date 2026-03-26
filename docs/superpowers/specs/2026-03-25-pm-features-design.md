# PM Features Design: Edit University, Critique Enhancements, University Comparison

**Date:** 2026-03-25
**Context:** UniApply is a university application tracker for international students. Primary user is a high school student (undergrad applicant). Three features identified via PM review to improve the core research and tracking workflow.

---

## Feature 1: Edit University

### Problem
University cards can be added and deleted but not edited. Students need to update status (applied → accepted/rejected), change deadlines, fix category, or add notes as the application process progresses. The `PUT /api/universities/:id` endpoint already exists and accepts all fields.

### Design

**Trigger:** A pencil (edit) icon button on each university card, positioned next to the existing delete button.

**Modal:** Reuses the existing "Add University" modal structure, pre-populated with the university's current values. All fields are editable:
- University name (text input, no autocomplete needed for edit)
- Program
- Degree level (select)
- Category: dream / target / safety (select)
- Application deadline (date input)
- Website URL
- Status: not_started / in_progress / submitted / accepted / rejected / waitlisted (select — this field is only in the edit modal, not the add modal)
- Notes (textarea)

**Save:** Calls `PUT /api/universities/:id` with all fields. On success, updates the card in state without a full refetch.

**Files touched:**
- `client/src/pages/Universities.jsx` — add `editingUniversity` state, edit modal JSX, `handleEdit` handler, pencil button on each card

**Constraints:**
- University name field in edit modal is a plain text input (no autocomplete dropdown) — editing an existing university doesn't need autocomplete
- Form validation: same as add modal (name and program required)
- Status selector uses the same `statusConfig` labels/colors already defined in the file

---

## Feature 2: Extracurriculars + Research Interests in Critique Prompt

### Problem
The critique system already passes profile data to Claude (GPA, test scores, institution, career goals). However, `profile.extracurriculars` and `profile.researchInterests` are stored in the DB but not included in the Claude prompt. For undergrad applicants, extracurricular activities are a core evaluation dimension — a personal statement about chess club reads differently when the reviewer knows the student has captained the team for 3 years.

### Design

**Change:** In `claudeAPI.js`, extend the `profileSection` string to include extracurriculars and research interests.

For **undergrad** applicants, add after the institution/major line:
```
- Extracurricular Activities: ${profile.extracurriculars || 'Not provided'}
```

For **graduate** applicants, add after the work experience line:
```
- Research Interests: ${profile.researchInterests || 'Not provided'}
- Extracurricular Activities / Volunteering: ${profile.extracurriculars || 'Not provided'}
```

The critique evaluator section already differentiates by degree level. No changes needed there — the profile context is enough for Claude to weight activities appropriately.

**Files touched:**
- `server/src/services/claudeAPI.js` — extend `profileSection` string (~4 lines added)

**Constraints:**
- No schema changes needed — both fields already exist in the Profile model
- No frontend changes needed — these fields are already captured in the Profile page
- If both fields are null/empty, the fallback `'Not provided'` prevents prompt degradation

---

## Feature 3: University Comparison

### Problem
High school students in the research phase need to compare 2–4 universities side by side across requirements, stats, and their own application status. Currently, users must navigate to each university individually to compare.

### Design

**Trigger:** On the Universities page, each card gets a checkbox in the top-right corner. When 2–4 universities are checked, a floating action bar appears at the bottom of the screen with a "Compare X universities" button.

**Navigation:** Clicking compare navigates to `/compare?ids=1,2,3`. The IDs are the selected university IDs.

**Compare page (`/compare`):**
- Header: "Comparing X Universities" with a back link
- Layout: horizontal scrollable table — universities as columns, comparison rows as rows
- Columns: one per selected university (max 4)
- Rows (in order):
  1. **Header row**: university name, program, category badge, degree level badge
  2. **Status**: application status badge
  3. **Deadline**: formatted date or "—"
  4. **Competitive GPA**: from requirements
  5. **Test Scores**: TOEFL minimum from requirements; for undergrad, SAT midpoints (reading + math) from scorecard if available
  6. **LOR Count**: letters of recommendation required
  7. **App Fee**: application fee
  8. **Acceptance Rate**: from scorecard (formatted as %)
  9. **Tuition (Intl)**: out-of-state tuition from scorecard
  10. **Document Status**: per-type completion indicators (✓/partial/—) for transcript, test scores, recommendation, resume, SOP
- Loading state: per-column skeleton while requirements are being fetched
- If requirements fetch fails for a university, show "—" for all requirement rows with a small "Could not load" note

**Data fetching:**
- Parse `?ids=` param, fetch each university via `GET /api/universities/:id`
- Fetch requirements for each via `GET /api/universities/:id/requirements` (existing endpoint, already includes `doc_status`)
- All fetched in parallel via `Promise.all`

**Files touched:**
- `client/src/pages/Universities.jsx` — add `selected` state (Set of IDs), checkbox on each card, floating action bar
- `client/src/pages/Compare.jsx` — new file, the comparison table
- `client/src/App.jsx` — add `/compare` route

**Constraints:**
- Max 4 universities selectable — if user tries to check a 5th, the 5th checkbox is disabled
- Min 2 required — "Compare" button disabled with 0 or 1 selected
- Checkboxes clear when the add/delete modal opens to avoid stale state
- On mobile: table scrolls horizontally; each column is min-width 160px
- Compare page is read-only — no editing from the comparison view
- If `?ids=` contains IDs that don't belong to the user, those columns show "Not found"

---

## Implementation Order

1. Feature 1 (Edit University) — self-contained, frontend-only, low risk
2. Feature 2 (Critique prompt) — single file, backend-only, low risk
3. Feature 3 (Comparison) — largest, new page + route + parallel data fetching

Each feature is independent and can be implemented and committed separately.
