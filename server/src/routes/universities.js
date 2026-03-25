import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

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
