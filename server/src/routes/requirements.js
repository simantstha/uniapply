import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { fetchRequirements } from '../services/requirementsService.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

async function computeDocStatus(universityId, userId, lorCount) {
  // Get all docs tagged to this university
  const tags = await prisma.documentTag.findMany({
    where: { universityId },
    include: { document: { select: { docType: true, userId: true } } },
  });

  // Only count docs belonging to this user
  const userTags = tags.filter(t => t.document.userId === userId);
  const counts = {};
  for (const tag of userTags) {
    const type = tag.document.docType;
    counts[type] = (counts[type] || 0) + 1;
  }

  // Check SOP exists for this university
  const sopCount = await prisma.sOP.count({ where: { universityId, userId } });

  const required = lorCount || 1;
  const lorTagged = counts['recommendation'] || 0;

  return {
    transcript:     { count: counts['transcript']  || 0, met: (counts['transcript']  || 0) >= 1 },
    test_scores:    { count: counts['test_scores'] || 0, met: (counts['test_scores'] || 0) >= 1 },
    recommendation: { count: lorTagged, required, met: lorTagged >= required, partial: lorTagged > 0 && lorTagged < required },
    resume:         { count: counts['resume']    || 0, met: (counts['resume']    || 0) >= 1 },
    financial:      { count: counts['financial'] || 0, met: (counts['financial'] || 0) >= 1 },
    sop:            { count: sopCount, met: sopCount >= 1 },
  };
}

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
      const parsedReqs = JSON.parse(cached.requirementsJson);
      const lorCount = parsedReqs.lor_count || null;
      const docStatus = await computeDocStatus(university.id, req.userId, lorCount);
      return res.json({
        ...parsedReqs,
        matched_program: cached.matchedProgram,
        source_url: cached.sourceUrl,
        source_type: cached.sourceType,
        doc_status: docStatus,
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

    const docStatus = await computeDocStatus(university.id, req.userId, result.lor_count || null);
    res.json({ ...result, doc_status: docStatus, cached: false });
  } catch (error) {
    console.error('Requirements error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/universities/:id/requirements — bust cache (force refresh)
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
