# User Flow Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix new-user confusion by enhancing the dashboard journey widget and adding rich empty states to Universities, Documents, and Timeline pages.

**Architecture:** All changes are frontend-only JSX edits to 4 existing pages. No new routes, API calls, or components. No test framework exists — verification is manual (start dev server, check in browser).

**Tech Stack:** React 18, Vite, Tailwind CSS, lucide-react icons, CSS variables for theming.

---

## File Map

| File | Change |
|------|--------|
| `client/src/pages/Dashboard.jsx` | Add `why` field to `getJourneySteps`; expand current step with why-text + UP NEXT badge |
| `client/src/pages/Universities.jsx` | Replace minimal empty state with rich Dream/Target/Safety explainer |
| `client/src/pages/Documents.jsx` | Replace minimal empty state with doc-type explainer cards |
| `client/src/pages/Timeline.jsx` | Add dismissible intro banner explaining what the timeline does |

---

## Task 1: Enhanced Dashboard Journey Widget

**Files:**
- Modify: `client/src/pages/Dashboard.jsx`

Context: `getJourneySteps()` is defined at line ~33. The step rendering loop is at line ~398 inside the "Journey Panel" section. The `nextStep` variable (line ~169) already identifies the first incomplete step. We need to:
1. Add a `why` string to each step in `getJourneySteps`
2. Expand the `isNext` step to show that why-text + an "UP NEXT" badge + a larger CTA

- [ ] **Step 1: Add `why` field to `getJourneySteps`**

In `client/src/pages/Dashboard.jsx`, find `function getJourneySteps(data)` and update each step object to include a `why` field:

```jsx
function getJourneySteps(data) {
  return [
    {
      num: 1,
      title: 'Complete your profile',
      desc: 'Add GPA, test scores, and background info',
      why: 'Your GPA and test scores power the AI university suggestions and fit scores.',
      done: (data?.profileCompletion ?? 0) >= 60,
      partial: (data?.profileCompletion ?? 0) > 0,
      to: '/profile',
      cta: 'Go to Profile',
      icon: User,
      color: '#7C3AED',
    },
    {
      num: 2,
      title: 'Add your universities',
      desc: 'Build a dream, target & safety school list',
      why: 'Your SOPs, documents, and deadlines are all organized per school — this unlocks everything else.',
      done: (data?.universities ?? 0) >= 3,
      partial: (data?.universities ?? 0) > 0,
      to: '/universities',
      cta: 'Add Universities',
      icon: Building2,
      color: '#3B82F6',
    },
    {
      num: 3,
      title: 'Upload your documents',
      desc: 'Transcripts, test scores, recommendation letters',
      why: 'Upload once, attach to any university. Most programs require transcripts and test score reports.',
      done: (data?.documents ?? 0) >= 2,
      partial: (data?.documents ?? 0) > 0,
      to: '/documents',
      cta: 'Upload Documents',
      icon: FolderOpen,
      color: '#D4A843',
    },
    {
      num: 4,
      title: 'Write your personal statement',
      desc: 'Select a university to open its SOP editor',
      why: 'Open any university from your list to start its SOP in the guided editor.',
      done: (data?.sops ?? 0) > 0,
      partial: false,
      to: '/universities',
      cta: 'Open SOP Editor',
      icon: FileText,
      color: '#34C759',
    },
    {
      num: 5,
      title: 'Get AI feedback',
      desc: 'Select a university, then open a draft to get AI feedback',
      why: 'The AI critiques your SOP across clarity, fit, and narrative — and gives it a score.',
      done: (data?.critiques ?? 0) > 0,
      partial: false,
      to: '/universities',
      cta: 'Get Critique',
      icon: Sparkles,
      color: '#C4622D',
    },
  ];
}
```

- [ ] **Step 2: Update the step rendering to expand the current step**

Find the step rendering map inside the Journey Panel (the `{(showAllSteps ? journeySteps : journeySteps.filter(s => !s.done)).map((step) => {` block at line ~398) and replace the entire map callback body with:

```jsx
{(showAllSteps ? journeySteps : journeySteps.filter(s => !s.done)).map((step) => {
  const Icon = step.icon;
  const isNext = nextStep?.num === step.num;
  return (
    <div key={step.num}
      className="px-5 py-3.5 transition-all"
      style={{
        background: isNext ? `rgba(0,113,227,0.03)` : 'transparent',
        opacity: step.done ? 0.6 : 1,
        borderBottom: '1px solid var(--border-subtle)',
      }}>
      {isNext ? (
        /* Expanded current step */
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className="flex-shrink-0 mt-0.5">
            {step.partial ? (
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: step.color }}>
                <div className="w-2 h-2 rounded-full" style={{ background: step.color }} />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: step.color }}>
                <span className="text-xs font-medium" style={{ color: step.color }}>{step.num}</span>
              </div>
            )}
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{step.title}</p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: step.color, color: 'white', fontSize: '9px', letterSpacing: '0.5px' }}>
                UP NEXT
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step.why}</p>
            <Link to={step.to}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: step.color, color: 'white' }}>
              {step.cta} <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      ) : (
        /* Collapsed step (done or future) */
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {step.done ? (
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#34C759' }}>
                <Check size={12} color="white" strokeWidth={3} />
              </div>
            ) : step.partial ? (
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: step.color }}>
                <div className="w-2 h-2 rounded-full" style={{ background: step.color }} />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{step.num}</span>
              </div>
            )}
          </div>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: step.done ? 'rgba(52,199,89,0.1)' : `${step.color}14` }}>
            <Icon size={14} style={{ color: step.done ? '#34C759' : step.color }} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: step.done ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: step.done ? 'line-through' : 'none' }}>
              {step.title}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>{step.desc}</p>
          </div>
          {!step.done && (
            <Link to={step.to}
              className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg"
              style={{ color: 'var(--text-tertiary)', background: 'var(--bg-secondary)' }}>
              <ChevronRight size={13} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
})}
```

- [ ] **Step 3: Start dev server and verify in browser**

```bash
cd /Users/simantstha/Documents/Playground/uniapply/client && npm run dev
```

Open http://localhost:5173 → log in → go to Dashboard. Check:
- Journey widget shows "UP NEXT" badge on the current step
- Current step has an explanation sentence + colored CTA button
- Done steps show strikethrough + green checkmark
- Future steps are faint

- [ ] **Step 4: Commit**

```bash
cd /Users/simantstha/Documents/Playground/uniapply
git add client/src/pages/Dashboard.jsx
git commit -m "feat: expand current journey step with why-text and UP NEXT badge"
```

---

## Task 2: Universities Empty State

**Files:**
- Modify: `client/src/pages/Universities.jsx`

Context: The empty state condition is at line ~335:
```jsx
} : filtered.length === 0 && universities.length === 0 ? (
  <div className="card p-12 text-center shadow-apple-sm">
    <p className="text-sm mb-4" ...>No universities added yet...</p>
  </div>
```
The `setShowModal` function already exists to open the Add University modal.

- [ ] **Step 1: Replace the empty state JSX**

Find and replace this exact block in `client/src/pages/Universities.jsx`:

```jsx
      ) : filtered.length === 0 && universities.length === 0 ? (
        <div className="card p-12 text-center shadow-apple-sm">
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>No universities added yet. Start by searching for programs above.</p>
        </div>
```

Replace with:

```jsx
      ) : filtered.length === 0 && universities.length === 0 ? (
        <div className="card p-8 shadow-apple-sm" style={{ textAlign: 'center' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(59,130,246,0.1)' }}>
            <Building2 size={26} style={{ color: '#3B82F6' }} strokeWidth={1.6} />
          </div>
          <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Build your school list</p>
          <p className="text-sm mb-5 mx-auto" style={{ color: 'var(--text-secondary)', maxWidth: '360px', lineHeight: 1.6 }}>
            Add universities you're interested in, then tag each one as{' '}
            <strong style={{ color: '#7C3AED' }}>Dream</strong>,{' '}
            <strong style={{ color: '#3B82F6' }}>Target</strong>, or{' '}
            <strong style={{ color: '#16A34A' }}>Safety</strong>.{' '}
            Your SOPs, documents, and deadlines are all organized per university.
          </p>
          <div className="flex justify-center gap-3 mb-6 flex-wrap">
            <div className="px-3 py-2 rounded-xl text-left" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', minWidth: '100px' }}>
              <p className="text-xs font-bold mb-1" style={{ color: '#a78bfa' }}>⭐ Dream</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Reach schools — apply anyway</p>
            </div>
            <div className="px-3 py-2 rounded-xl text-left" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', minWidth: '100px' }}>
              <p className="text-xs font-bold mb-1" style={{ color: '#60a5fa' }}>🎯 Target</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Good match for your profile</p>
            </div>
            <div className="px-3 py-2 rounded-xl text-left" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', minWidth: '100px' }}>
              <p className="text-xs font-bold mb-1" style={{ color: '#4ade80' }}>🛡 Safety</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Strong admit chance</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)}
            className="btn-primary">
            + Add your first university
          </button>
        </div>
```

- [ ] **Step 2: Verify in browser**

Go to http://localhost:5173/universities on a fresh account (no universities added).
Check: icon, heading, tier pills, and "Add your first university" button are visible.
Click the button — confirm the Add University modal opens.

- [ ] **Step 3: Commit**

```bash
cd /Users/simantstha/Documents/Playground/uniapply
git add client/src/pages/Universities.jsx
git commit -m "feat: rich empty state for Universities page with tier explainer"
```

---

## Task 3: Documents Empty State

**Files:**
- Modify: `client/src/pages/Documents.jsx`

Context: Empty state at line ~526:
```jsx
} : docs.length === 0 ? (
  <div className="card p-10 text-center shadow-apple-sm">
    <File size={28} ... />
    <p ...>No documents uploaded yet</p>
    <p ...>Upload your transcripts, test scores, and other application materials</p>
  </div>
```
The upload trigger already exists — check how the existing upload button works.

- [ ] **Step 1: Add `FolderOpen` to the lucide-react import**

In `client/src/pages/Documents.jsx`, line 4, the import currently reads:
```jsx
import { Upload, FileText, Trash2, Download, File, Image, X, Tags, UserCheck, Plus, ChevronDown, Mail } from 'lucide-react';
```
Add `FolderOpen`:
```jsx
import { Upload, FileText, Trash2, Download, File, FolderOpen, Image, X, Tags, UserCheck, Plus, ChevronDown, Mail } from 'lucide-react';
```

- [ ] **Step 2: Check how file upload is triggered**

Find the existing upload button in Documents.jsx to get the exact `onClick` or `ref` used:

```bash
grep -n "upload\|inputRef\|fileInput\|onClick.*upload\|trigger" /Users/simantstha/Documents/Playground/uniapply/client/src/pages/Documents.jsx | head -20
```

Note the upload trigger pattern — you'll use it in the empty state CTA.

- [ ] **Step 2: Replace the empty state JSX**

Find and replace this block in `client/src/pages/Documents.jsx`:

```jsx
      } : docs.length === 0 ? (
        <div className="card p-10 text-center shadow-apple-sm">
          <File size={28} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No documents uploaded yet</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Upload your transcripts, test scores, and other application materials</p>
        </div>
```

Replace with:

```jsx
      } : docs.length === 0 ? (
        <div className="card p-8 shadow-apple-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(212,168,67,0.1)' }}>
              <FolderOpen size={26} style={{ color: '#D4A843' }} strokeWidth={1.6} />
            </div>
            <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Your document vault</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', maxWidth: '360px', margin: '0 auto', lineHeight: 1.6 }}>
              Upload your supporting documents once — then attach them to any university. No re-uploading for each school.
            </p>
          </div>
          <div className="space-y-2 mb-6">
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-lg flex-shrink-0">📄</span>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>Transcripts</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Official academic records from your institution — most programs require this</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-lg flex-shrink-0">📝</span>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>Test Scores</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>GRE, TOEFL, IELTS, SAT score reports sent to each university</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-lg flex-shrink-0">✉️</span>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>Recommendation Letters</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>LORs from professors or supervisors — track status per recommender</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <button onClick={() => fileInputRef.current?.click()}
              className="btn-primary">
              + Upload your first document
            </button>
          </div>
        </div>
```

**Note:** The `fileInputRef` name must match whatever ref is used by the existing upload trigger. If it's different, use the pattern you found in Step 1.

- [ ] **Step 3: Verify in browser**

Go to http://localhost:5173/documents on an account with no documents.
Check: icon, heading, three doc-type cards, and upload button are visible.
Click the upload button — confirm the file picker opens.

- [ ] **Step 4: Commit**

```bash
cd /Users/simantstha/Documents/Playground/uniapply
git add client/src/pages/Documents.jsx
git commit -m "feat: rich empty state for Documents page with doc-type explainer"
```

---

## Task 4: Timeline Intro Banner

**Files:**
- Modify: `client/src/pages/Timeline.jsx`

Context: Timeline always has milestones (defaults to Aug 2027). New users don't know what it does. We add a dismissible intro banner at the very top of the page content, above the enrollment date picker. Use `localStorage` key `'uniapply_timeline_intro_dismissed'` (consistent with the existing `'uniapply_enrollment_date'` pattern in this file).

- [ ] **Step 1: Add the `introDismissed` state**

In `client/src/pages/Timeline.jsx`, find the existing useState block (around line ~96) and add this state after the existing ones:

```jsx
const [introDismissed, setIntroDismissed] = useState(() =>
  localStorage.getItem('uniapply_timeline_intro_dismissed') === 'true'
);
```

- [ ] **Step 2: Add dismiss handler**

After the state declarations and before the `return`, add:

```jsx
const dismissIntro = () => {
  localStorage.setItem('uniapply_timeline_intro_dismissed', 'true');
  setIntroDismissed(true);
};
```

- [ ] **Step 3: Add the intro banner JSX**

In the `return`, find the opening `<div>` of the page content (the one containing the page `<h1>` heading "Application Timeline"). Add the intro banner immediately after the heading section and before the enrollment date picker section:

```jsx
{/* Intro banner — shown until dismissed */}
{!introDismissed && (
  <div className="card shadow-apple-sm overflow-hidden mb-2">
    <div className="px-5 py-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(52,199,89,0.1)' }}>
        <CalendarClock size={20} style={{ color: '#34C759' }} strokeWidth={1.6} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>How your timeline works</p>
        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Set your target enrollment date below and we'll work backwards to give you a personalised milestone schedule — covering test prep, LOR requests, SOP drafts, and application deadlines.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            'Application deadline countdown per school',
            'Test prep milestones (GRE, TOEFL)',
            'LOR request reminders',
            'SOP draft & revision schedule',
          ].map(item => (
            <span key={item} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: '#34C759' }}>✓</span> {item}
            </span>
          ))}
        </div>
      </div>
      <button onClick={dismissIntro}
        className="flex-shrink-0 p-1 rounded-lg transition-opacity hover:opacity-60"
        style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
        aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  </div>
)}
```

**Note:** `X` and `CalendarClock` are already imported in Timeline.jsx — verify with `grep -n "^import" client/src/pages/Timeline.jsx`.

- [ ] **Step 4: Verify in browser**

Go to http://localhost:5173/timeline on a fresh account (or clear `uniapply_timeline_intro_dismissed` from localStorage).
Check: intro banner appears at top with the 4 bullet points and an X to dismiss.
Click X — banner disappears and doesn't reappear on page refresh.

- [ ] **Step 5: Commit**

```bash
cd /Users/simantstha/Documents/Playground/uniapply
git add client/src/pages/Timeline.jsx
git commit -m "feat: add dismissible intro banner to Timeline page"
```

---

## Final Verification

After all 4 tasks are committed, do a full walkthrough as a new user:

1. Open Dashboard → confirm current step is expanded with UP NEXT + why-text
2. Click the CTA → land on Universities → confirm rich empty state with tier pills
3. Go to Documents → confirm doc-type explainer cards
4. Go to Timeline → confirm intro banner (if not already dismissed)
5. Dismiss the banner → refresh → confirm it stays dismissed

Then open a PR:

```bash
cd /Users/simantstha/Documents/Playground/uniapply
gh pr create --title "feat: user flow guidance — journey widget + empty states" --body "$(cat <<'EOF'
## Summary
- Enhanced dashboard journey widget: current step expands with why-text + UP NEXT badge + colored CTA
- Universities empty state: Dream/Target/Safety tier explainer with descriptions
- Documents empty state: three doc-type cards (Transcripts, Test Scores, LORs) with explanations
- Timeline: dismissible intro banner explaining the backwards-milestone system

## Test Plan
- [ ] New user lands on dashboard, current journey step is obviously the next action
- [ ] Universities page with no schools shows tier explainer + working Add button
- [ ] Documents page with no docs shows doc-type cards + working Upload button
- [ ] Timeline shows intro banner; dismissing it persists across refreshes

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
