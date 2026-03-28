import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const [universities, sops, critiques, documents, profile, recentUniversities, allUniversities] = await Promise.all([
      prisma.university.count({ where: { userId: req.userId } }),
      prisma.sOP.count({ where: { userId: req.userId, wordCount: { gt: 0 } } }),
      prisma.sOPCritique.count({ where: { sop: { userId: req.userId } } }),
      prisma.document.count({ where: { userId: req.userId } }),
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
      universities, sops, critiques, documents,
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

router.get('/overview', async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();

    const [universities, lors] = await Promise.all([
      prisma.university.findMany({
        where: { userId },
        orderBy: [{ applicationDeadline: 'asc' }, { createdAt: 'asc' }],
        include: {
          sops: {
            select: { id: true, wordCount: true, critiques: { select: { id: true } } },
          },
        },
      }),
      prisma.letterOfRecommendation.findMany({
        where: { userId },
        select: { universityIds: true, status: true, recommenderName: true },
      }),
    ]);

    const universityCards = universities.map(u => {
      const deadline = u.applicationDeadline ? new Date(u.applicationDeadline) : null;
      const daysLeft = deadline ? Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)) : null;

      let risk = 'none';
      if (daysLeft !== null) {
        if (daysLeft < 0) risk = 'overdue';
        else if (daysLeft <= 14) risk = 'red';
        else if (daysLeft <= 30) risk = 'yellow';
        else risk = 'green';
      }

      const activeSops = u.sops.filter(s => s.wordCount > 0);
      const hasCritique = u.sops.some(s => s.critiques.length > 0);
      const sopStatus = activeSops.length === 0 ? 'none' : hasCritique ? 'reviewed' : 'draft';

      const uniLors = lors.filter(l => {
        try { return JSON.parse(l.universityIds || '[]').includes(u.id); } catch { return false; }
      });
      const lorConfirmed = uniLors.filter(l => ['confirmed', 'submitted'].includes(l.status)).length;

      return {
        id: u.id,
        name: u.name,
        program: u.program,
        category: u.category.toLowerCase(),
        status: u.status,
        deadline: u.applicationDeadline,
        daysLeft,
        risk,
        sopStatus,
        lorTotal: uniLors.length,
        lorConfirmed,
      };
    });

    // Build today's actions sorted by urgency
    const actions = [];
    for (const u of universityCards) {
      if (u.daysLeft !== null && u.daysLeft < 0) {
        if (u.status !== 'submitted' && u.status !== 'accepted' && u.status !== 'rejected') {
          actions.push({ urgency: -1, text: `${u.name} deadline has passed`, subtext: 'Update the status', to: `/universities`, icon: 'alert' });
        }
        continue;
      }
      const withinWindow = u.daysLeft !== null && u.daysLeft <= 45;
      if (withinWindow || u.daysLeft === null) {
        const d = u.daysLeft ?? 999;
        if (u.sopStatus === 'none')
          actions.push({ urgency: d, text: `Write SOP for ${u.name}`, subtext: u.daysLeft != null ? `${u.daysLeft}d left` : 'No deadline set', to: `/sop/${u.id}`, icon: 'sop' });
        else if (u.sopStatus === 'draft')
          actions.push({ urgency: d + 5, text: `Get AI critique on ${u.name} SOP`, subtext: u.daysLeft != null ? `${u.daysLeft}d left` : 'No deadline set', to: `/sop/${u.id}`, icon: 'critique' });
        if (u.lorTotal > 0 && u.lorConfirmed < u.lorTotal)
          actions.push({ urgency: d + 2, text: `${u.lorTotal - u.lorConfirmed} LOR${u.lorTotal - u.lorConfirmed > 1 ? 's' : ''} pending for ${u.name}`, subtext: u.daysLeft != null ? `${u.daysLeft}d left` : '', to: `/universities`, icon: 'lor' });
        if (u.daysLeft === null && u.status === 'not_started')
          actions.push({ urgency: 500, text: `Set deadline for ${u.name}`, subtext: 'No deadline added yet', to: `/universities`, icon: 'deadline' });
      }
    }
    actions.sort((a, b) => a.urgency - b.urgency);

    res.json({ universities: universityCards, actions: actions.slice(0, 5) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
