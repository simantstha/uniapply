import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { suggestUniversities } from '../services/claudeAPI.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.post('/suggest-universities', async (req, res) => {
  try {
    const userId = req.userId;

    const profile = await prisma.profile.findUnique({ where: { userId } });

    const degreeLevel = profile?.degreeLevel || 'masters';
    const suggestions = await suggestUniversities(profile || {}, degreeLevel);

    res.json({ suggestions });
  } catch (error) {
    console.error('suggest-universities error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
