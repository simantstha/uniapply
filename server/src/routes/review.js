import express from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ── POST /api/sops/:id/share  (authenticated) ──────────────────────────────
router.post('/sops/:id/share', authMiddleware, async (req, res) => {
  try {
    const sopId = parseInt(req.params.id);
    const sop = await prisma.sOP.findFirst({ where: { id: sopId, userId: req.userId } });
    if (!sop) return res.status(404).json({ error: 'Not found' });

    const existing = await prisma.sOPShareLink.findFirst({ where: { sopId } });
    if (existing) {
      const url = `${process.env.APP_URL || 'http://localhost:5173'}/review/${existing.token}`;
      return res.json({ token: existing.token, url });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const link = await prisma.sOPShareLink.create({ data: { sopId, token, expiresAt } });
    const url = `${process.env.APP_URL || 'http://localhost:5173'}/review/${link.token}`;
    res.json({ token: link.token, url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── DELETE /api/sops/:id/share  (authenticated) ────────────────────────────
router.delete('/sops/:id/share', authMiddleware, async (req, res) => {
  try {
    const sopId = parseInt(req.params.id);
    const sop = await prisma.sOP.findFirst({ where: { id: sopId, userId: req.userId } });
    if (!sop) return res.status(404).json({ error: 'Not found' });

    await prisma.sOPShareLink.deleteMany({ where: { sopId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/sops/:id/review-comments  (authenticated) ────────────────────
router.get('/sops/:id/review-comments', authMiddleware, async (req, res) => {
  try {
    const sopId = parseInt(req.params.id);
    const sop = await prisma.sOP.findFirst({ where: { id: sopId, userId: req.userId } });
    if (!sop) return res.status(404).json({ error: 'Not found' });

    const link = await prisma.sOPShareLink.findFirst({ where: { sopId } });
    if (!link) return res.json([]);

    const comments = await prisma.sOPReviewComment.findMany({
      where: { shareLinkId: link.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/review/:token  (PUBLIC) ──────────────────────────────────────
router.get('/review/:token', async (req, res) => {
  try {
    const link = await prisma.sOPShareLink.findUnique({
      where: { token: req.params.token },
      include: {
        sop: {
          include: {
            university: { select: { name: true, program: true } },
            critiques: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!link) return res.status(404).json({ error: 'Link not found' });
    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.status(410).json({ error: 'Link has expired' });
    }

    const { sop, comments } = link;
    const critique = sop.critiques[0] || null;

    res.json({
      universityName: sop.university.name,
      program: sop.university.program,
      title: sop.title,
      content: sop.content,
      wordCount: sop.wordCount,
      critique: critique ? {
        overallAssessment: critique.overallAssessment,
        authenticityScore: critique.authenticityScore,
        specificityScore: critique.specificityScore,
        clarityScore: critique.clarityScore,
        impactScore: critique.impactScore,
      } : null,
      comments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/review/:token/comments  (PUBLIC) ────────────────────────────
router.post('/review/:token/comments', async (req, res) => {
  try {
    const { reviewerName, comment } = req.body;

    if (!reviewerName || typeof reviewerName !== 'string' || reviewerName.trim().length === 0) {
      return res.status(400).json({ error: 'reviewerName is required' });
    }
    if (reviewerName.trim().length > 50) {
      return res.status(400).json({ error: 'reviewerName must be 50 characters or fewer' });
    }
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({ error: 'comment is required' });
    }
    if (comment.trim().length > 1000) {
      return res.status(400).json({ error: 'comment must be 1000 characters or fewer' });
    }

    const link = await prisma.sOPShareLink.findUnique({ where: { token: req.params.token } });
    if (!link) return res.status(404).json({ error: 'Link not found' });
    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.status(410).json({ error: 'Link has expired' });
    }

    const created = await prisma.sOPReviewComment.create({
      data: {
        shareLinkId: link.id,
        reviewerName: reviewerName.trim(),
        comment: comment.trim(),
      },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
