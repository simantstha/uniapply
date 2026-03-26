# University Requirements Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a student views a university, show structured admission requirements (GPA, GRE, TOEFL, essays, etc.) fetched from the university's website via Claude + College Scorecard API, cached in DB.

**Architecture:** Two-step Claude call — first ask Claude to suggest the most likely requirements page URL for the university+program, then fetch + strip that page, then pass content back to Claude for structured extraction. College Scorecard API provides institution-level stats (acceptance rate, SAT median). Results cached in a new `UniversityRequirements` DB table keyed on `(universityName, program)`. Frontend shows a collapsible Requirements panel per university card.

**Tech Stack:** Express, Prisma/SQLite, Anthropic SDK (claude-sonnet-4-6), native `fetch` for web scraping, College Scorecard API (free, no key needed for basic fields), React

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `server/prisma/schema.prisma` | Modify | Add `UniversityRequirements` model |
| `server/src/services/requirementsService.js` | Create | URL discovery, page fetch, Claude extraction, Scorecard fetch |
| `server/src/routes/requirements.js` | Create | `GET /api/universities/:id/requirements` endpoint |
| `server/src/server.js` | Modify | Register requirements route |
| `client/src/pages/Universities.jsx` | Modify | Add Requirements button + collapsible panel per card |

---

## Task 1: Add Prisma Schema for Requirements Cache

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: Add `UniversityRequirements` model to schema**

Add after the `SOPCritique` model in `server/prisma/schema.prisma`:

```prisma
model UniversityRequirements {
  id              Int      @id @default(autoincrement())
  universityName  String   @map("university_name")
  program         String
  matchedProgram  String?  @map("matched_program")
  requirementsJson String  @map("requirements_json")
  sourceUrl       String?  @map("source_url")
  sourceType      String   @default("ai_knowledge") @map("source_type") // 'website' | 'ai_knowledge'
  createdAt       DateTime @default(now()) @map("created_at")

  @@unique([universityName, program])
  @@map("university_requirements")
}
```

- [ ] **Step 2: Run migration**

```bash
cd server && npx prisma migrate dev --name add_university_requirements
```

Expected output: `✔  Generated Prisma Client`

- [ ] **Step 3: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations/
git commit -m "feat: add UniversityRequirements cache table"
```

---

## Task 2: Create Requirements Service

**Files:**
- Create: `server/src/services/requirementsService.js`

This service has three responsibilities:
1. Ask Claude for the most likely requirements page URL
2. Fetch + strip that page HTML to plain text
3. Ask Claude to extract structured requirements from the page content (or from its own knowledge if fetch failed)

It also fetches institution-level stats from College Scorecard API.

- [ ] **Step 1: Create `server/src/services/requirementsService.js`**

```js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Step 1: Ask Claude to suggest the best URL for program requirements
async function discoverRequirementsUrl(universityName, program, degreeLevel) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `What is the most likely direct URL for admission requirements for "${program}" (${degreeLevel}) at ${universityName}?

Return ONLY a JSON object with this shape:
{"url": "https://...", "confidence": "high" | "medium" | "low"}

If you are not confident in a specific URL, return {"url": null, "confidence": "low"}.
Do not explain. Just JSON.`,
    }],
  });

  const text = message.content[0].text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { url: null, confidence: 'low' };
  try {
    return JSON.parse(match[0]);
  } catch {
    return { url: null, confidence: 'low' };
  }
}

// Step 2: Fetch URL and strip HTML to plain text
async function fetchPageText(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UniApply/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Strip scripts, styles, then HTML tags
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Return first 6000 chars to stay within token limits
    return stripped.length > 100 ? stripped.slice(0, 6000) : null;
  } catch {
    return null;
  }
}

// Step 3: Extract structured requirements via Claude
async function extractRequirements(universityName, program, degreeLevel, pageText) {
  const context = pageText
    ? `Here is content scraped from ${universityName}'s website:\n\n${pageText}\n\nUsing this content and your knowledge,`
    : `Using your knowledge,`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `${context} extract the admission requirements for "${program}" (${degreeLevel}) at ${universityName}.

Return ONLY valid JSON in this exact shape:
{
  "matched_program": "<exact program name as offered by the university>",
  "program_exists": true | false,
  "gpa": { "minimum": <number or null>, "competitive": <number or null>, "scale": "4.0" },
  "gre": { "required": true | false | "optional", "verbal_range": "<e.g. 155-165 or null>", "quant_range": "<e.g. 160-170 or null>", "writing_min": <number or null> },
  "toefl": { "minimum": <number or null> },
  "ielts": { "minimum": <number or null> },
  "application_components": ["<e.g. Statement of Purpose>", "<Letters of Recommendation>"],
  "lor_count": <number or null>,
  "application_fee": <number or null>,
  "notes": "<1-2 sentence summary of anything notable>",
  "source_note": "<'Based on official website content' or 'Based on AI knowledge — verify on official website'>"
}`,
    }],
  });

  const text = message.content[0].text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid Claude response for requirements extraction');
  return JSON.parse(match[0]);
}

// Fetch institution-level stats from College Scorecard API
async function fetchScorecardStats(universityName) {
  try {
    const encoded = encodeURIComponent(universityName);
    const url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?school.name=${encoded}&fields=school.name,latest.admissions.admission_rate.overall,latest.admissions.sat_scores.midpoint.critical_reading,latest.admissions.sat_scores.midpoint.math,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state&api_key=DEMO_KEY&per_page=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    const school = data?.results?.[0];
    if (!school) return null;
    return {
      acceptance_rate: school['latest.admissions.admission_rate.overall'],
      sat_reading_midpoint: school['latest.admissions.sat_scores.midpoint.critical_reading'],
      sat_math_midpoint: school['latest.admissions.sat_scores.midpoint.math'],
      tuition_in_state: school['latest.cost.tuition.in_state'],
      tuition_out_of_state: school['latest.cost.tuition.out_of_state'],
    };
  } catch {
    return null;
  }
}

// Main entry point — orchestrates all steps
export async function fetchRequirements(universityName, program, degreeLevel) {
  // Step 1: Discover URL
  const { url, confidence } = await discoverRequirementsUrl(universityName, program, degreeLevel);

  // Step 2: Fetch page text if confidence is high or medium
  let pageText = null;
  let sourceUrl = null;
  let sourceType = 'ai_knowledge';

  if (url && confidence !== 'low') {
    pageText = await fetchPageText(url);
    if (pageText) {
      sourceUrl = url;
      sourceType = 'website';
    }
  }

  // Step 3: Extract requirements
  const requirements = await extractRequirements(universityName, program, degreeLevel, pageText);

  // Step 4: Fetch Scorecard stats (non-blocking — null on failure)
  const scorecard = await fetchScorecardStats(universityName);

  return {
    ...requirements,
    scorecard,
    source_url: sourceUrl,
    source_type: sourceType,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/services/requirementsService.js
git commit -m "feat: add requirements service (URL discovery, fetch, Claude extraction, Scorecard)"
```

---

## Task 3: Create Requirements Route + Register in Server

**Files:**
- Create: `server/src/routes/requirements.js`
- Modify: `server/src/server.js`

- [ ] **Step 1: Create `server/src/routes/requirements.js`**

```js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { fetchRequirements } from '../services/requirementsService.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/universities/:id/requirements
// Returns cached requirements or fetches fresh ones
router.get('/:id/requirements', async (req, res) => {
  try {
    const university = await prisma.university.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!university) return res.status(404).json({ error: 'University not found' });

    const cacheKey = {
      universityName: university.name,
      program: university.program,
    };

    // Return cached result if exists
    const cached = await prisma.universityRequirements.findUnique({
      where: { universityName_program: cacheKey },
    });
    if (cached) {
      return res.json({
        ...JSON.parse(cached.requirementsJson),
        matched_program: cached.matchedProgram,
        source_url: cached.sourceUrl,
        source_type: cached.sourceType,
        cached: true,
      });
    }

    // Fetch fresh
    const result = await fetchRequirements(university.name, university.program, university.degreeLevel);

    // Cache it
    await prisma.universityRequirements.create({
      data: {
        universityName: university.name,
        program: university.program,
        matchedProgram: result.matched_program || null,
        requirementsJson: JSON.stringify(result),
        sourceUrl: result.source_url || null,
        sourceType: result.source_type || 'ai_knowledge',
      },
    });

    res.json({ ...result, cached: false });
  } catch (error) {
    console.error('Requirements error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/universities/:id/requirements  — bust cache (force refresh)
router.delete('/:id/requirements', async (req, res) => {
  try {
    const university = await prisma.university.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!university) return res.status(404).json({ error: 'University not found' });

    await prisma.universityRequirements.deleteMany({
      where: { universityName: university.name, program: university.program },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

- [ ] **Step 2: Register route in `server/src/server.js`**

Add after the existing imports:
```js
import requirementsRoutes from './routes/requirements.js';
```

Add after `app.use('/api/universities', universitiesRoutes);`:
```js
app.use('/api/universities', requirementsRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/requirements.js server/src/server.js
git commit -m "feat: add requirements endpoint with DB caching"
```

---

## Task 4: Frontend Requirements Panel in Universities Page

**Files:**
- Modify: `client/src/pages/Universities.jsx`

Add a "Requirements" button to each university card that fetches and displays structured requirements in an expandable panel below the card actions.

- [ ] **Step 1: Add state + fetch logic to `Universities.jsx`**

At the top of the `Universities` component, add:

```js
const [reqState, setReqState] = useState({}); // { [universityId]: { loading, data, error, open } }

const toggleRequirements = async (u) => {
  const current = reqState[u.id] || {};

  // If already open, just close
  if (current.open) {
    setReqState(s => ({ ...s, [u.id]: { ...current, open: false } }));
    return;
  }

  // If we already have data, just open
  if (current.data) {
    setReqState(s => ({ ...s, [u.id]: { ...current, open: true } }));
    return;
  }

  // Fetch
  setReqState(s => ({ ...s, [u.id]: { loading: true, open: true } }));
  try {
    const res = await apiClient.get(`/api/universities/${u.id}/requirements`);
    setReqState(s => ({ ...s, [u.id]: { loading: false, data: res.data, open: true } }));
  } catch (err) {
    setReqState(s => ({ ...s, [u.id]: { loading: false, error: 'Failed to load requirements', open: true } }));
  }
};
```

- [ ] **Step 2: Add Requirements button to each card**

In the card footer (after the "Write SOP" button inside `<div className="px-5 pb-5">`), replace with:

```jsx
<div className="px-5 pb-5 space-y-2">
  <Link to={`/sop/${u.id}`} className="btn-primary w-full flex items-center justify-center gap-2 py-2">
    <PenLine size={12} strokeWidth={2} /> Write SOP
  </Link>
  <button
    onClick={() => toggleRequirements(u)}
    className="btn-secondary w-full flex items-center justify-center gap-2 py-2 text-xs"
  >
    <BookOpen size={12} strokeWidth={1.8} />
    {reqState[u.id]?.open ? 'Hide Requirements' : 'View Requirements'}
  </button>
</div>
```

Also add `BookOpen` to the lucide-react import at the top:
```js
import { Plus, Trash2, ExternalLink, Calendar, PenLine, X, Search, BookOpen } from 'lucide-react';
```

- [ ] **Step 3: Add the Requirements panel below each card**

Replace the outer card `<div key={u.id} ...>` wrapper with a wrapping fragment and add the panel after:

```jsx
<div key={u.id} className="flex flex-col gap-0">
  <div className="card shadow-apple-sm hover:shadow-apple transition-all flex flex-col overflow-hidden">
    {/* ...existing card content unchanged... */}
  </div>

  {/* Requirements panel */}
  {reqState[u.id]?.open && (
    <div className="card border-t-0 rounded-t-none px-5 py-4 space-y-4"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}>
      {reqState[u.id]?.loading && (
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Fetching requirements…</span>
        </div>
      )}

      {reqState[u.id]?.error && (
        <p className="text-xs" style={{ color: '#FF3B30' }}>{reqState[u.id].error}</p>
      )}

      {reqState[u.id]?.data && <RequirementsPanel data={reqState[u.id].data} websiteUrl={u.websiteUrl} />}
    </div>
  )}
</div>
```

- [ ] **Step 4: Add the `RequirementsPanel` component at the bottom of `Universities.jsx`**

```jsx
function RequirementsPanel({ data, websiteUrl }) {
  const formatRate = (r) => r != null ? `${Math.round(r * 100)}%` : null;
  const formatGpa = (g) => g != null ? g.toFixed(1) : null;

  return (
    <div className="space-y-4">
      {/* Matched program header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
          Requirements for
        </p>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {data.matched_program || 'Program'}
        </p>
        {!data.program_exists && (
          <p className="text-xs mt-0.5" style={{ color: '#D4A843' }}>
            ⚠ This exact program may not be offered — showing closest match
          </p>
        )}
      </div>

      {/* Academic requirements */}
      <div className="grid grid-cols-2 gap-2">
        {data.gpa?.competitive && (
          <Req label="Competitive GPA" value={`${formatGpa(data.gpa.competitive)} / ${data.gpa.scale || '4.0'}`} />
        )}
        {data.gpa?.minimum && (
          <Req label="Minimum GPA" value={`${formatGpa(data.gpa.minimum)} / ${data.gpa.scale || '4.0'}`} />
        )}
        {data.gre?.required !== undefined && (
          <Req label="GRE"
            value={data.gre.required === false ? 'Not required' : data.gre.required === 'optional' ? 'Optional' : 'Required'}
            highlight={data.gre.required === true}
          />
        )}
        {data.gre?.quant_range && <Req label="GRE Quant" value={data.gre.quant_range} />}
        {data.toefl?.minimum && <Req label="TOEFL" value={`${data.toefl.minimum}+`} />}
        {data.ielts?.minimum && <Req label="IELTS" value={`${data.ielts.minimum}+`} />}
        {data.lor_count && <Req label="Letters of Rec" value={`${data.lor_count} required`} />}
        {data.application_fee && <Req label="App Fee" value={`$${data.application_fee}`} />}
      </div>

      {/* Scorecard stats */}
      {data.scorecard && (
        <div className="grid grid-cols-2 gap-2">
          {data.scorecard.acceptance_rate != null && (
            <Req label="Acceptance Rate" value={formatRate(data.scorecard.acceptance_rate)} />
          )}
          {data.scorecard.tuition_out_of_state != null && (
            <Req label="Tuition (OOS)" value={`$${data.scorecard.tuition_out_of_state.toLocaleString()}`} />
          )}
        </div>
      )}

      {/* Application components */}
      {data.application_components?.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
            Required Documents
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.application_components.map((c, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{data.notes}</p>
      )}

      {/* Source + refresh */}
      <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {data.source_type === 'website' ? '✓ From official website' : 'AI knowledge — '}
          {data.source_type !== 'website' && websiteUrl && (
            <a href={websiteUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
              verify on official site
            </a>
          )}
        </p>
        {data.source_url && (
          <a href={data.source_url} target="_blank" rel="noreferrer"
            className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
            <ExternalLink size={10} /> Source
          </a>
        )}
      </div>
    </div>
  );
}

function Req({ label, value, highlight }) {
  return (
    <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
      <p className="text-xs uppercase tracking-wide font-semibold mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: highlight ? 'var(--accent)' : 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Universities.jsx
git commit -m "feat: add requirements panel to university cards"
```

---

## Self-Review

**Spec coverage:**
- ✅ Two-step Claude call (URL discovery → extraction)
- ✅ Web fetch with HTML stripping
- ✅ Fallback to AI knowledge when fetch fails/low confidence
- ✅ College Scorecard institution stats
- ✅ DB caching keyed on `(universityName, program)`
- ✅ Cache bust via DELETE endpoint
- ✅ "Source: website vs AI knowledge" label in UI
- ✅ Program match warning when `program_exists: false`
- ✅ Collapsible panel (doesn't clutter the card by default)

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:** `fetchRequirements` returns `{ ...requirements, scorecard, source_url, source_type }` — consumed correctly in the route handler and `RequirementsPanel`.
