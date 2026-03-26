import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// List SOPs (optionally filter by universityId)
router.get('/', async (req, res) => {
  try {
    const where = { userId: req.userId };
    if (req.query.universityId) where.universityId = parseInt(req.query.universityId);
    const sops = await prisma.sOP.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        university: { select: { name: true, program: true } },
        critiques: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    res.json(sops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create SOP
router.post('/', async (req, res) => {
  try {
    const { universityId, title, content = '' } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.plan === 'free') {
      const count = await prisma.sOP.count({ where: { userId: req.userId, universityId: parseInt(universityId) } });
      if (count >= 1) {
        return res.status(403).json({ error: 'Free plan: 1 draft per university. Upgrade to Student or Premium for unlimited drafts.' });
      }
    }
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const sop = await prisma.sOP.create({
      data: { universityId: parseInt(universityId), userId: req.userId, title, content, wordCount, version: 1 },
    });
    res.json(sop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get SOP
router.get('/:id', async (req, res) => {
  try {
    const sop = await prisma.sOP.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
      include: {
        university: { select: { name: true, program: true, category: true } },
        critiques: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!sop) return res.status(404).json({ error: 'Not found' });
    res.json(sop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update SOP (auto-save)
router.put('/:id', async (req, res) => {
  try {
    const { content, title, status } = req.body;
    const data = {};
    if (content !== undefined) {
      data.content = content;
      data.wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      data.version = { increment: 1 };
    }
    if (title !== undefined) data.title = title;
    if (status !== undefined) data.status = status;

    const updated = await prisma.sOP.updateMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
      data,
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Not found' });
    const sop = await prisma.sOP.findUnique({ where: { id: parseInt(req.params.id) } });
    res.json(sop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as best / final — resets others for same university
router.patch('/:id/final', async (req, res) => {
  try {
    const sop = await prisma.sOP.findFirst({ where: { id: parseInt(req.params.id), userId: req.userId } });
    if (!sop) return res.status(404).json({ error: 'Not found' });
    await prisma.sOP.updateMany({
      where: { userId: req.userId, universityId: sop.universityId, id: { not: sop.id } },
      data: { status: 'draft' },
    });
    const updated = await prisma.sOP.update({ where: { id: sop.id }, data: { status: 'final' } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete SOP
router.delete('/:id', async (req, res) => {
  try {
    const result = await prisma.sOP.deleteMany({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (result.count === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
