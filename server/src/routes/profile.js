import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({ where: { userId: req.userId } });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const existing = await prisma.profile.findUnique({ where: { userId: req.userId } });
    if (existing) return res.status(400).json({ error: 'Profile already exists. Use PUT to update.' });

    const profile = await prisma.profile.create({
      data: { ...req.body, userId: req.userId },
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const profile = await prisma.profile.upsert({
      where: { userId: req.userId },
      update: req.body,
      create: { ...req.body, userId: req.userId },
    });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
