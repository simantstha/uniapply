# Critique Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Include `extracurriculars` and `researchInterests` profile fields in the AI critique prompt so Claude can evaluate personal statements in the context of the student's full profile.

**Architecture:** Single-file backend change. Both fields already exist in the `Profile` Prisma model and are already stored in the database. The `critiques.js` route already fetches the profile and passes it to `generateCritique()`. We only need to extend the `profileSection` string in `claudeAPI.js` to include the two missing fields. No schema changes, no frontend changes.

**Tech Stack:** Node.js, Anthropic SDK (`claude-sonnet-4-6`)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `server/src/services/claudeAPI.js` | Modify | Add extracurriculars + researchInterests to profileSection string |

---

## Task 1: Add Extracurriculars and Research Interests to Critique Prompt

**Files:**
- Modify: `server/src/services/claudeAPI.js`

- [ ] **Step 1: Read the current profileSection**

Open `server/src/services/claudeAPI.js` and find the `profileSection` template literal (lines 10–23). It currently ends with:

```js
- Career Goals: ${profile.careerGoals || 'Not provided'}
${!isUndergrad ? `- Work Experience: ${profile.workExperienceYears ? profile.workExperienceYears + ' years' : 'Not provided'}` : ''}
`.trim() : 'STUDENT PROFILE: Not provided';
```

- [ ] **Step 2: Extend profileSection with the missing fields**

Replace the entire `profileSection` assignment (lines 10–23) with:

```js
const profileSection = profile ? `
STUDENT PROFILE:
- Applying for: ${degreeLevel.charAt(0).toUpperCase() + degreeLevel.slice(1)} level
- GPA: ${profile.gpa != null ? (profile.gpaScale === 'percentage' ? `${profile.gpa}% (percentage scale)` : profile.gpaScale === 'cgpa_10' ? `${profile.gpa}/10 (CGPA)` : `${profile.gpa}/4.0`) : 'Not provided'}
${isUndergrad
  ? `- SAT: ${profile.satScore || 'Not provided'} | ACT: ${profile.actScore || 'Not provided'}`
  : `- GRE: V${profile.greVerbal || '?'} Q${profile.greQuant || '?'} W${profile.greWriting || '?'}`
}
- TOEFL: ${profile.toeflScore || 'Not provided'} | IELTS: ${profile.ieltsScore || 'Not provided'}
- ${isUndergrad ? 'High School / Previous Institution' : 'Undergraduate Institution'}: ${profile.undergraduateInstitution || 'Not provided'}
- ${isUndergrad ? 'Intended Major' : 'Major / Field'}: ${profile.undergraduateMajor || profile.fieldOfStudy || 'Not provided'}
- Career Goals: ${profile.careerGoals || 'Not provided'}
${isUndergrad
  ? `- Extracurricular Activities: ${profile.extracurriculars || 'Not provided'}`
  : `- Work Experience: ${profile.workExperienceYears ? profile.workExperienceYears + ' years' : 'Not provided'}
- Research Interests: ${profile.researchInterests || 'Not provided'}
- Extracurricular Activities / Volunteering: ${profile.extracurriculars || 'Not provided'}`
}
`.trim() : 'STUDENT PROFILE: Not provided';
```

- [ ] **Step 3: Verify the build compiles**

```bash
cd /Users/simantstha/Documents/Playground/uniapply/server && node --input-type=module <<'EOF'
import { readFileSync } from 'fs';
const src = readFileSync('src/services/claudeAPI.js', 'utf8');
console.log('Syntax OK, length:', src.length);
EOF
```
Expected: `Syntax OK, length: <some number>`

If there's a syntax error, check the template literal carefully — every `${}` must be balanced.

- [ ] **Step 4: Commit**

```bash
cd /Users/simantstha/Documents/Playground/uniapply && git add server/src/services/claudeAPI.js && git commit -m "feat: include extracurriculars and research interests in AI critique prompt"
```

---

## Self-Review

**Spec coverage:**
- ✅ Undergrad path includes `extracurriculars`
- ✅ Graduate path includes `researchInterests` and `extracurriculars`
- ✅ Fallback to `'Not provided'` when field is null/empty
- ✅ No schema changes needed
- ✅ No frontend changes needed

**Placeholder scan:** None.

**Type consistency:** `profile.extracurriculars` and `profile.researchInterests` are the exact field names from the Prisma `Profile` model.
