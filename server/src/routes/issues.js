import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// POST /api/issues — create a report + GitHub issue
router.post('/', async (req, res) => {
  const { title, description } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required.' });
  if (!description || !description.trim()) return res.status(400).json({ error: 'Description is required.' });
  if (title.trim().length > 200) return res.status(400).json({ error: 'Title must be 200 characters or fewer.' });
  if (description.trim().length > 2000) return res.status(400).json({ error: 'Description must be 2000 characters or fewer.' });

  if (!process.env.GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN is not set');
    return res.status(503).json({ error: 'Issue reporting is not configured.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Create GitHub issue
    const githubRes = await fetch('https://api.github.com/repos/simantstha/uniapply/issues', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title.trim(),
        body: `${description.trim()}\n\n---\n*Reported by: ${user.name} (${user.email})*`,
        labels: ['user-report'],
      }),
    });

    if (!githubRes.ok) {
      const err = await githubRes.text();
      console.error('GitHub API error:', err);
      return res.status(502).json({ error: 'Could not create GitHub issue. Please try again.' });
    }

    const ghData = await githubRes.json();

    const report = await prisma.issueReport.create({
      data: {
        userId: req.userId,
        title: title.trim(),
        description: description.trim(),
        githubIssueUrl: ghData.html_url,
        githubIssueNumber: ghData.number,
      },
    });

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/issues — list user's reports
router.get('/', async (req, res) => {
  try {
    const reports = await prisma.issueReport.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        githubIssueUrl: true,
        githubIssueNumber: true,
        createdAt: true,
      },
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
