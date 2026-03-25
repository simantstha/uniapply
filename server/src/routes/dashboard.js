import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const [universities, sops, critiques] = await Promise.all([
      prisma.university.count({ where: { userId: req.userId } }),
      prisma.sOP.count({ where: { userId: req.userId } }),
      prisma.sOPCritique.count({
        where: { sop: { userId: req.userId } },
      }),
    ]);
    res.json({ universities, sops, critiques });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
