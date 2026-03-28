# UniApply — Full User Journey Gaps: Design Spec
**Date:** 2026-03-28
**Status:** Approved

---

## Problem

UniApply currently ends at "you have a shortlist and an SOP." There is no guidance on:
- How to actually submit applications (which portal, what type)
- What it costs to apply to the full shortlist
- Where the student is in the application lifecycle (applied? admitted? rejected?)
- What to do after getting admitted (visa, I-20, SEVIS, departure)

This spec closes those gaps without introducing new pages or breaking the existing mental model.

---

## Approach: Phase-aware Dashboard (Approach C)

The Dashboard becomes the spine of the full journey. Rather than adding new pages, the existing Dashboard is extended to be phase-aware — surfacing the right tools at the right time as students move through:

```
Pre-Application → Applying → Post-Admission
```

All four features below integrate into this flow.

---

## Section 1: Application Status

### What
Each university gets an `applicationStatus` field that tracks its lifecycle:

```
Not Applied → Applied → Interview → Admitted
                                 → Rejected
                                 → Waitlisted
```

### Where
Stored as a new field on the `University` model. Updated via a single-click status picker on each university card — no form, just a pill that opens a small dropdown.

### Dashboard layout
Universities split into two panels:
- **Active** — Not Applied + Applied + Interview, sorted by deadline urgency
- **Decisions** — Admitted + Rejected + Waitlisted, sorted by most recent

Each card shows a colored status pill:
- Grey: Not Applied
- Blue: Applied
- Purple: Interview
- Green: Admitted
- Red: Rejected
- Amber: Waitlisted

### Data
- New `applicationStatus String @default("not_applied")` on `University` model
- `PATCH /api/universities/:id` extended to accept `applicationStatus`

---

## Section 2: Application Cost Calculator

### What
A collapsible banner on the Dashboard showing the realistic total cost to apply to the student's current shortlist.

### Calculation per school
| Cost item | Amount | Condition |
|-----------|--------|-----------|
| Application fee | $50–$90 (per school) | Always shown |
| GRE score send | $30/school | Only if student has GRE score in profile |
| TOEFL score send | $20/school | Only if student has TOEFL score in profile |
| IELTS score send | ~£25/school | Only if student has IELTS score in profile |

**Total shown as:** `"Applying to 6 schools will cost approximately $420–$510"`

Small disclaimer: "Fees verified where possible — confirm on each school's portal."

### Cost-cutting tips (always visible below total)
- Schools with no application fee in their list — highlighted in green
- "Attend a virtual info session — many schools email a waiver code afterward"
- "Email admissions directly and ask for a fee waiver — works more often than you'd expect"
- "Submit early — some schools offer early-bird fee waivers"

### Data source
- Application fees: sourced from College Scorecard where available, manually maintained fallback for top programs
- Score send costs: hardcoded constants (ETS/IELTS pricing is stable)
- No fee waiver eligibility claims — tips only

---

## Section 3: Pre-flight Checklist + Portal Link

### What
When a student clicks "Ready to Apply" on a university card, a drawer opens with a 4-item pre-flight check before redirecting them to the application portal.

### Pre-flight checks (pulled from existing app data)
| Item | Source | Status |
|------|--------|--------|
| SOP written? | SOP draft with >50 words exists | ✅ / ⚠️ |
| SOP critiqued? | At least 1 critique exists | ✅ / ⚠️ |
| LORs confirmed? | All LORs tagged to this uni are Confirmed/Submitted | ✅ / ⚠️ |
| Documents uploaded? | Transcript + test scores tagged to this uni | ✅ / ⚠️ |

Each incomplete item shows a direct link to fix it. Not a hard blocker — students can proceed with warnings.

### Portal link
- **Undergrad** → Common App link + "Common App" badge
- **Grad/PhD** → Direct university portal URL + "Direct Portal" badge
- Portal URLs sourced from a maintained lookup table for top ~500 grad programs
- Single "Go to Application Portal →" button opens portal in new tab

### Status update
After clicking through, a confirmation: "Mark as Applied?" — sets status to Applied on confirm.

### Data
- New `applicationPortalUrl String?` and `applicationPortalType String?` (common_app / direct) on `University` model
- Populated from lookup table when university is added to list

---

## Section 4: Post-Admission Pathway

### What
When status is set to "Admitted," a brief celebratory animation fires, then a drawer opens automatically: **"You got in. Here's what to do next."**

The drawer is always re-accessible from the Admitted university card.

### Visa + departure checklist with timelines

All target dates derived from the student's `enrollmentDate` (already stored in localStorage from the Timeline page).

| # | Step | Timeline |
|---|------|----------|
| 1 | Accept offer + pay deposit | Within 2–4 weeks of offer letter |
| 2 | Request I-20 from the school | Immediately after accepting — allow 3–6 weeks |
| 3 | Pay SEVIS fee ($350) | After receiving I-20, before visa appointment |
| 4 | Complete DS-160 form | At least 3 weeks before visa appointment |
| 5 | Schedule F-1 visa appointment (US Embassy, Kathmandu) | Book early — slots fill 4–8 weeks out |
| 6 | Prepare visa documents | 1 week before appointment |
| 7 | Attend visa interview | On appointment date |
| 8 | Register for orientation + book housing | As soon as visa is stamped |
| 9 | Book flights | 4–6 weeks before program start date |

Each step shows an actual target month (e.g., "By April 2027") when enrollmentDate is set.

### Multiple admissions nudge
If admitted to 2+ schools: "You're admitted to 2 schools. Compare aid offers before accepting." → links to Compare page.

### Rejected / Waitlisted guidance
- **Rejected**: "Consider emailing admissions for feedback on your application."
- **Waitlisted**: "Here's how to write a letter of continued interest." (brief tips inline)

### Data
- No new schema — reads existing `enrollmentDate` from localStorage + `applicationStatus` from University model
- Visa checklist is static content with dynamic date calculation client-side

---

## What we are NOT building (intentional scope cuts)
- Fee waiver eligibility checker — too unreliable for international students, tips are safer
- Document receipt tracking per portal — too granular, data-entry burden
- Interview prep content — out of scope for now
- Financial aid comparison tool — Compare page handles school comparison; aid amounts are user-entered manually if needed

---

## Schema changes required
```prisma
model University {
  // existing fields...
  applicationStatus    String  @default("not_applied")
  applicationPortalUrl String?
  applicationPortalType String? // "common_app" | "direct"
}
```

## New API endpoints
- `PATCH /api/universities/:id` — extended to accept `applicationStatus`, `applicationPortalUrl`, `applicationPortalType` (may already handle this)

## New data files
- `client/src/data/applicationFees.js` — map of school name/ID → application fee amount
- `client/src/data/portalUrls.js` — map of school name/ID → portal URL + type

---

## Implementation order
1. Schema migration — add `applicationStatus`, `applicationPortalUrl`, `applicationPortalType`
2. Status picker on university cards + Dashboard grouping (Active / Decisions)
3. Cost calculator banner on Dashboard
4. Pre-flight drawer + portal link
5. Post-admission pathway drawer with visa checklist
