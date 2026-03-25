import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { generateCritique } from '../services/claudeAPI.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Generate critique for a SOP
router.post('/', async (req, res) => {
  try {
    const { sopId } = req.body;
    if (!sopId) return res.status(400).json({ error: 'sopId is required' });

    const sop = await prisma.sOP.findFirst({
      where: { id: parseInt(sopId), userId: req.userId },
      include: { university: true },
    });
    if (!sop) return res.status(404).json({ error: 'SOP not found' });

    const plainText = sop.content.replace(/<[^>]*>/g, '').trim();
    if (plainText.split(/\s+/).filter(Boolean).length < 50) {
      return res.status(400).json({ error: 'SOP is too short. Write at least 50 words before requesting a critique.' });
    }

    // Free plan: max 1 critique per SOP
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.plan === 'free') {
      const count = await prisma.sOPCritique.count({ where: { sopId: parseInt(sopId) } });
      if (count >= 1) {
        return res.status(403).json({ error: 'Free plan limit: 1 critique per SOP. Upgrade for unlimited critiques.' });
      }
    }

    const profile = await prisma.profile.findUnique({ where: { userId: req.userId } });

    const result = await generateCritique(sop, profile, sop.university);

    const critique = await prisma.sOPCritique.create({
      data: {
        sopId: parseInt(sopId),
        overallAssessment: result.overall_assessment,
        authenticityScore: result.scores.authenticity,
        specificityScore: result.scores.specificity,
        clarityScore: result.scores.clarity,
        impactScore: result.scores.impact,
        strengths: JSON.stringify(result.strengths),
        weaknesses: JSON.stringify(result.weaknesses),
        suggestions: JSON.stringify(result.suggestions),
        rawCritiqueText: JSON.stringify(result),
      },
    });

    res.json(critique);
  } catch (error) {
    console.error('Critique error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all critiques for a SOP
router.get('/:sopId', async (req, res) => {
  try {
    const sop = await prisma.sOP.findFirst({
      where: { id: parseInt(req.params.sopId), userId: req.userId },
    });
    if (!sop) return res.status(404).json({ error: 'SOP not found' });

    const critiques = await prisma.sOPCritique.findMany({
      where: { sopId: parseInt(req.params.sopId) },
      orderBy: { createdAt: 'desc' },
    });
    res.json(critiques);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
