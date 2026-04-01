import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { fetchRequirements } from '../services/requirementsService.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

function normalizeGpa(gpa, scale) {
  if (!gpa) return null;
  if (scale === 'us_4') return gpa;
  if (scale === 'cgpa_10') return (gpa / 10) * 4;
  if (scale === 'percentage') return (gpa / 100) * 4;
  return gpa;
}

function computeFitScore(profile, requirements) {
  if (!profile || !requirements) return 'unknown';

  const req = JSON.parse(requirements.requirementsJson);
  let score = 0;
  let factors = 0;

  // GPA check — normalize profile GPA to 4.0 scale
  const profileGpa = normalizeGpa(profile.gpa, profile.gpaScale);
  const reqGpaMin = req.gpa?.minimum;
  const reqGpaCompetitive = req.gpa?.competitive;

  if (profileGpa && reqGpaMin) {
    factors++;
    if (profileGpa >= (reqGpaCompetitive || reqGpaMin + 0.3)) score += 2;
    else if (profileGpa >= reqGpaMin) score += 1;
    else score += 0;
  }

  // TOEFL check
  const reqToeflMin = req.toefl?.minimum;
  if (profile.toeflScore && reqToeflMin) {
    factors++;
    if (profile.toeflScore >= reqToeflMin + 5) score += 2;
    else if (profile.toeflScore >= reqToeflMin) score += 1;
    else score += 0;
  }

  // IELTS check
  const reqIeltsMin = req.ielts?.minimum;
  if (profile.ieltsScore && reqIeltsMin) {
    factors++;
    if (profile.ieltsScore >= reqIeltsMin + 0.5) score += 2;
    else if (profile.ieltsScore >= reqIeltsMin) score += 1;
    else score += 0;
  }

  if (factors === 0) return 'unknown';
  const ratio = score / (factors * 2);
  if (ratio >= 0.75) return 'strong';
  if (ratio >= 0.4) return 'borderline';
  return 'reach';
}

// Must be defined before /:id routes to avoid routing conflicts
router.get('/fit-scores', async (req, res) => {
  try {
    const [profile, universities] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: req.userId } }),
      prisma.university.findMany({ where: { userId: req.userId } }),
    ]);

    const scores = {};
    await Promise.all(universities.map(async (u) => {
      const requirements = await prisma.universityRequirements.findUnique({
        where: { universityName_program: { universityName: u.name, program: u.program } },
      });
      scores[u.id] = computeFitScore(profile, requirements);
    }));

    res.json({ scores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function deriveFunding(degreeLevel) {
  if (degreeLevel === 'phd') return { fundingType: 'funded', fundingSuggested: true };
  if (degreeLevel === 'undergraduate') return { fundingType: 'self_funded', fundingSuggested: true };
  return { fundingType: 'unknown', fundingSuggested: true };
}

router.get('/', async (req, res) => {
  try {
    const universities = await prisma.university.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    const enriched = universities.map(u => {
      if (u.fundingType !== 'unknown') {
        return { ...u, fundingSuggested: false };
      }
      const derived = deriveFunding(u.degreeLevel);
      return { ...u, fundingType: derived.fundingType, fundingSuggested: derived.fundingSuggested };
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.plan === 'free') {
      const count = await prisma.university.count({ where: { userId: req.userId } });
      if (count >= 10) {
        return res.status(403).json({ error: 'Free plan limit: 10 universities. Upgrade to add more.' });
      }
    }

    const university = await prisma.university.create({
      data: { ...req.body, userId: req.userId },
    });

    // Fire-and-forget: warm the requirements cache so it's ready when the user opens this university
    const cacheKey = { universityName: university.name, program: university.program };
    (async () => {
      try {
        const cached = await prisma.universityRequirements.findUnique({ where: { universityName_program: cacheKey } });
        if (cached) return;
        const result = await fetchRequirements(university.name, university.program, university.degreeLevel);
        await prisma.universityRequirements.upsert({
          where: { universityName_program: cacheKey },
          create: {
            universityName: university.name,
            program: university.program,
            matchedProgram: result.matched_program || null,
            requirementsJson: JSON.stringify(result),
            sourceUrl: result.source_url || null,
            sourceType: result.source_type || 'ai_knowledge',
          },
          update: {
            matchedProgram: result.matched_program || null,
            requirementsJson: JSON.stringify(result),
            sourceUrl: result.source_url || null,
            sourceType: result.source_type || 'ai_knowledge',
          },
        });
        console.log(`[prefetch] requirements cached for ${university.name} — ${university.program}`);
      } catch (err) {
        console.error(`[prefetch] requirements failed for ${university.name}:`, err.message);
      }
    })();

    res.json(university);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const university = await prisma.university.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!university) return res.status(404).json({ error: 'Not found' });
    res.json(university);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/checklist', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.userId;

    // 1. Fetch the university (scoped to user)
    const university = await prisma.university.findFirst({ where: { id, userId } });
    if (!university) return res.status(404).json({ error: 'Not found' });

    // 2. Fetch all SOPs for this university
    const sops = await prisma.sOP.findMany({
      where: { universityId: id, userId },
      include: { critiques: { take: 1, orderBy: { createdAt: 'desc' } } },
    });

    // 3. Fetch documents tagged to this university
    const docTags = await prisma.documentTag.findMany({
      where: { universityId: id },
      include: { document: true },
    });
    // Only count docs belonging to this user
    const userDocs = docTags.filter(t => t.document.userId === userId).map(t => t.document);

    // 4. Fetch LORs for this university
    const allLors = await prisma.letterOfRecommendation.findMany({ where: { userId } });
    const universityLors = allLors.filter(lor => {
      try {
        const ids = JSON.parse(lor.universityIds || '[]');
        return Array.isArray(ids) && ids.includes(id);
      } catch {
        return false;
      }
    });

    // 5. Fetch cached requirements for lor_count
    const cachedReqs = await prisma.universityRequirements.findFirst({
      where: { universityName: university.name, program: university.program },
    });
    let lorRequired = 2; // default
    if (cachedReqs) {
      try {
        const parsed = JSON.parse(cachedReqs.requirementsJson);
        if (parsed.lor_count != null) lorRequired = parsed.lor_count;
      } catch { /* keep default */ }
    }

    // --- Parse requirements fields (if cached) ---
    let reqData = null;
    if (cachedReqs) {
      try { reqData = JSON.parse(cachedReqs.requirementsJson); } catch { /* keep null */ }
    }

    // --- Evaluate each checklist item ---

    // SOP
    const hasFinalSop = sops.some(s => s.status === 'final');
    let sopStatus = 'missing';
    let sopDetail = null;
    if (hasFinalSop) {
      sopStatus = 'complete';
      sopDetail = `${sops.length} draft${sops.length !== 1 ? 's' : ''} · best selected`;
    } else if (sops.length > 0) {
      sopStatus = 'in_progress';
      sopDetail = `${sops.length} draft${sops.length !== 1 ? 's' : ''} · not finalised`;
    }

    // LORs
    const submittedLors = universityLors.filter(l => l.status === 'submitted').length;
    let lorStatus = 'missing';
    let lorDetail = `${submittedLors}/${lorRequired} submitted`;
    if (submittedLors >= lorRequired) {
      lorStatus = 'complete';
    } else if (universityLors.length > 0) {
      lorStatus = 'in_progress';
    }

    // Document-based items
    const hasDocType = (type) => userDocs.some(d => d.docType === type);

    const transcriptStatus = hasDocType('transcript') ? 'complete' : 'missing';
    const financialStatus  = hasDocType('financial')  ? 'complete' : 'missing';
    const resumeStatus     = hasDocType('resume')     ? 'complete' : 'missing';

    // Test Scores — enrich detail from requirements if available
    const testScoresStatus = hasDocType('test_scores') ? 'complete' : 'missing';
    let testScoresDetail = testScoresStatus === 'complete' ? 'uploaded' : null;
    if (reqData) {
      const parts = [];
      if (reqData.gre?.required === true)       parts.push('GRE required');
      else if (reqData.gre?.required === 'optional') parts.push('GRE optional');
      if (reqData.toefl?.minimum)               parts.push(`TOEFL min ${reqData.toefl.minimum}`);
      if (reqData.ielts?.minimum)               parts.push(`IELTS min ${reqData.ielts.minimum}`);
      if (parts.length > 0) {
        testScoresDetail = testScoresStatus === 'complete'
          ? `uploaded · ${parts.join(' · ')}`
          : parts.join(' · ');
      }
    }

    // Financial Documents — enrich with fund requirement if available
    let financialDetail = financialStatus === 'complete' ? 'uploaded' : null;
    if (reqData?.financial_docs) {
      financialDetail = financialStatus === 'complete'
        ? `uploaded · ${reqData.financial_docs}`
        : reqData.financial_docs;
    }

    const checklist = [
      { item: 'Statement of Purpose',   status: sopStatus,       detail: sopDetail },
      { item: 'Recommendation Letters', status: lorStatus,       detail: lorDetail },
      { item: 'Transcript',             status: transcriptStatus, detail: transcriptStatus === 'complete' ? 'uploaded' : null },
      { item: 'Test Scores',            status: testScoresStatus, detail: testScoresDetail },
      { item: 'Financial Documents',    status: financialStatus,  detail: financialDetail },
      { item: 'Resume / CV',            status: resumeStatus,     detail: resumeStatus === 'complete' ? 'uploaded' : null },
    ];

    // Conditional items from requirements (status: 'info' — informational, not tracked)
    if (reqData?.credential_evaluation) {
      checklist.push({ item: 'Credential Evaluation', status: 'info', detail: reqData.credential_evaluation });
    }
    if (reqData?.application_fee > 0) {
      checklist.push({ item: 'Application Fee', status: 'info', detail: `$${reqData.application_fee}` });
    }

    // Percent only counts trackable items (exclude 'info')
    const trackable = checklist.filter(c => c.status !== 'info');
    const completeCount = trackable.filter(c => c.status === 'complete').length;
    const percentReady = Math.round((completeCount / trackable.length) * 100);

    res.json({ checklist, percentReady });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/documents', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.userId;

    const university = await prisma.university.findFirst({ where: { id, userId } });
    if (!university) return res.status(404).json({ error: 'Not found' });

    const docTags = await prisma.documentTag.findMany({
      where: { universityId: id },
      include: { document: true },
    });
    const docs = docTags
      .filter(t => t.document.userId === userId)
      .map(t => t.document);

    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, program, degreeLevel, websiteUrl, category, applicationDeadline, status, notes, fundingType, applicationStatus, applicationPortalUrl, applicationPortalType } = req.body;
    const VALID_APP_STATUSES = ['not_applied', 'applied', 'interview', 'admitted', 'rejected', 'waitlisted'];
    if (applicationStatus !== undefined && !VALID_APP_STATUSES.includes(applicationStatus)) {
      return res.status(400).json({ error: 'Invalid applicationStatus value' });
    }
    const data = {};
    if (name !== undefined) data.name = name;
    if (program !== undefined) data.program = program;
    if (degreeLevel !== undefined) data.degreeLevel = degreeLevel;
    if (websiteUrl !== undefined) data.websiteUrl = websiteUrl;
    if (category !== undefined) data.category = category;
    if (applicationDeadline !== undefined) data.applicationDeadline = applicationDeadline;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (fundingType !== undefined) data.fundingType = fundingType;
    if (applicationStatus !== undefined) data.applicationStatus = applicationStatus;
    if (applicationPortalUrl !== undefined) data.applicationPortalUrl = applicationPortalUrl;
    if (applicationPortalType !== undefined) data.applicationPortalType = applicationPortalType;
    const university = await prisma.university.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data,
    });
    if (university.count === 0) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.university.findFirst({ where: { id: parseInt(req.params.id), userId: req.userId } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { status, notes, fundingType, applicationStatus, applicationPortalUrl, applicationPortalType } = req.body;
    const VALID_APP_STATUSES = ['not_applied', 'applied', 'interview', 'admitted', 'rejected', 'waitlisted'];
    if (applicationStatus !== undefined && !VALID_APP_STATUSES.includes(applicationStatus)) {
      return res.status(400).json({ error: 'Invalid applicationStatus value' });
    }
    const data = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (fundingType !== undefined) data.fundingType = fundingType;
    if (applicationStatus !== undefined) data.applicationStatus = applicationStatus;
    if (applicationPortalUrl !== undefined) data.applicationPortalUrl = applicationPortalUrl;
    if (applicationPortalType !== undefined) data.applicationPortalType = applicationPortalType;
    const university = await prisma.university.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data,
    });
    if (university.count === 0) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.university.findFirst({ where: { id: parseInt(req.params.id), userId: req.userId } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await prisma.university.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (result.count === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
