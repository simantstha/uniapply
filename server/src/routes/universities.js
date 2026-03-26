import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

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

router.get('/', async (req, res) => {
  try {
    const universities = await prisma.university.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(universities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.plan === 'free') {
      const count = await prisma.university.count({ where: { userId: req.userId } });
      if (count >= 3) {
        return res.status(403).json({ error: 'Free plan limit: 3 universities. Upgrade to add more.' });
      }
    }

    const university = await prisma.university.create({
      data: { ...req.body, userId: req.userId },
    });
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

router.put('/:id', async (req, res) => {
  try {
    const university = await prisma.university.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data: req.body,
    });
    if (university.count === 0) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.university.findUnique({ where: { id: parseInt(req.params.id) } });
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
