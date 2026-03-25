import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const [universities, sops, critiques, profile, recentUniversities, allUniversities] = await Promise.all([
      prisma.university.count({ where: { userId: req.userId } }),
      prisma.sOP.count({ where: { userId: req.userId, wordCount: { gt: 0 } } }),
      prisma.sOPCritique.count({ where: { sop: { userId: req.userId } } }),
      prisma.profile.findUnique({ where: { userId: req.userId } }),
      prisma.university.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.university.findMany({ where: { userId: req.userId } }),
    ]);

    // Profile completion
    const profileFields = ['undergraduateInstitution', 'undergraduateMajor', 'graduationYear', 'gpa', 'fieldOfStudy', 'careerGoals', 'toeflScore'];
    const filled = profile ? profileFields.filter(f => profile[f] != null && profile[f] !== '').length : 0;
    const profileCompletion = Math.round((filled / profileFields.length) * 100);

    // Upcoming deadlines (next 60 days)
    const now = new Date();
    const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = allUniversities
      .filter(u => u.applicationDeadline && new Date(u.applicationDeadline) >= now && new Date(u.applicationDeadline) <= in60)
      .sort((a, b) => new Date(a.applicationDeadline) - new Date(b.applicationDeadline))
      .slice(0, 4);

    // Status breakdown
    const statusBreakdown = allUniversities.reduce((acc, u) => {
      acc[u.status] = (acc[u.status] || 0) + 1;
      return acc;
    }, {});

    // Category breakdown
    const categoryBreakdown = allUniversities.reduce((acc, u) => {
      acc[u.category] = (acc[u.category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      universities, sops, critiques,
      profileCompletion,
      recentUniversities,
      upcomingDeadlines,
      statusBreakdown,
      categoryBreakdown,
      userName: (await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, createdAt: true, plan: true } })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
