import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { generateLorRequestEmail } from '../services/claudeAPI.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// List all LORs for the user, with university names resolved
router.get('/', async (req, res) => {
  try {
    const lors = await prisma.letterOfRecommendation.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    // Resolve university names for each LOR
    const result = await Promise.all(
      lors.map(async (lor) => {
        let universities = [];
        if (lor.universityIds) {
          try {
            const ids = JSON.parse(lor.universityIds);
            if (Array.isArray(ids) && ids.length > 0) {
              universities = await prisma.university.findMany({
                where: { id: { in: ids }, userId: req.userId },
                select: { id: true, name: true },
              });
            }
          } catch {
            // malformed JSON — return empty universities
          }
        }
        return { ...lor, universities };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new LOR
router.post('/', async (req, res) => {
  const { recommenderName, recommenderEmail, relationship, universityIds, deadline, notes } = req.body;

  if (!recommenderName || !relationship) {
    return res.status(400).json({ error: 'recommenderName and relationship are required' });
  }

  // Validate and normalise universityIds
  let uidsJson = null;
  if (Array.isArray(universityIds) && universityIds.length > 0) {
    const valid = await prisma.university.findMany({
      where: { id: { in: universityIds }, userId: req.userId },
      select: { id: true },
    });
    const validIds = valid.map((u) => u.id);
    if (validIds.length > 0) uidsJson = JSON.stringify(validIds);
  }

  try {
    const lor = await prisma.letterOfRecommendation.create({
      data: {
        userId: req.userId,
        recommenderName,
        recommenderEmail: recommenderEmail || null,
        relationship,
        universityIds: uidsJson,
        deadline: deadline ? new Date(deadline) : null,
        notes: notes || null,
      },
    });

    // Return with resolved universities
    let universities = [];
    if (uidsJson) {
      universities = await prisma.university.findMany({
        where: { id: { in: JSON.parse(uidsJson) }, userId: req.userId },
        select: { id: true, name: true },
      });
    }

    res.json({ ...lor, universities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update any fields on a LOR
router.patch('/:id', async (req, res) => {
  try {
    const lor = await prisma.letterOfRecommendation.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!lor) return res.status(404).json({ error: 'Not found' });

    const { recommenderName, recommenderEmail, relationship, universityIds, deadline, notes, status } = req.body;

    const updateData = {};
    if (recommenderName !== undefined) updateData.recommenderName = recommenderName;
    if (recommenderEmail !== undefined) updateData.recommenderEmail = recommenderEmail || null;
    if (relationship !== undefined) updateData.relationship = relationship;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes || null;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;

    if (universityIds !== undefined) {
      if (Array.isArray(universityIds) && universityIds.length > 0) {
        const valid = await prisma.university.findMany({
          where: { id: { in: universityIds }, userId: req.userId },
          select: { id: true },
        });
        const validIds = valid.map((u) => u.id);
        updateData.universityIds = validIds.length > 0 ? JSON.stringify(validIds) : null;
      } else {
        updateData.universityIds = null;
      }
    }

    const updated = await prisma.letterOfRecommendation.update({
      where: { id: lor.id },
      data: updateData,
    });

    // Return with resolved universities
    let universities = [];
    if (updated.universityIds) {
      try {
        const ids = JSON.parse(updated.universityIds);
        if (Array.isArray(ids) && ids.length > 0) {
          universities = await prisma.university.findMany({
            where: { id: { in: ids }, userId: req.userId },
            select: { id: true, name: true },
          });
        }
      } catch {
        // ignore
      }
    }

    res.json({ ...updated, universities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Draft a request email for a LOR
router.post('/:id/draft-email', async (req, res) => {
  try {
    const userId = req.userId;
    const lor = await prisma.letterOfRecommendation.findFirst({
      where: { id: parseInt(req.params.id), userId },
    });
    if (!lor) return res.status(404).json({ error: 'Not found' });

    const [profile, user] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    ]);

    // Resolve university names from universityIds JSON array
    let universityNames = [];
    if (lor.universityIds) {
      try {
        const ids = JSON.parse(lor.universityIds);
        if (Array.isArray(ids) && ids.length > 0) {
          const unis = await prisma.university.findMany({
            where: { id: { in: ids }, userId },
            select: { name: true },
          });
          universityNames = unis.map((u) => u.name);
        }
      } catch {
        // malformed JSON — leave empty
      }
    }

    const deadlineStr = lor.deadline
      ? new Date(lor.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : null;

    const email = await generateLorRequestEmail({
      studentName: user?.name || 'Student',
      recommenderName: lor.recommenderName,
      recommenderEmail: lor.recommenderEmail,
      relationship: lor.relationship,
      universities: universityNames,
      deadline: deadlineStr,
      fieldOfStudy: profile?.fieldOfStudy,
      careerGoals: profile?.careerGoals,
      programLevel: profile?.studyLevel,
    });

    res.json({ email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a LOR
router.delete('/:id', async (req, res) => {
  try {
    const lor = await prisma.letterOfRecommendation.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!lor) return res.status(404).json({ error: 'Not found' });
    await prisma.letterOfRecommendation.delete({ where: { id: lor.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
