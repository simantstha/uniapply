import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const UPLOADS_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(UPLOADS_DIR, String(req.userId));
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/webp',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.use(authMiddleware);

// List all documents for the user
router.get('/', async (req, res) => {
  try {
    const docs = await prisma.document.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        tags: {
          include: { university: { select: { id: true, name: true } } },
        },
      },
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a document
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file or unsupported type. Allowed: PDF, DOC, DOCX, JPG, PNG.' });

  try {
    const doc = await prisma.document.create({
      data: {
        userId: req.userId,
        name: req.body.name || req.file.originalname,
        docType: req.body.docType || 'other',
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        filePath: req.file.path,
      },
    });
    // Save university tags if provided
    const universityIds = req.body.universityIds
      ? JSON.parse(req.body.universityIds)
      : [];

    if (universityIds.length > 0) {
      const valid = await prisma.university.findMany({
        where: { id: { in: universityIds }, userId: req.userId },
        select: { id: true },
      });
      const validIds = valid.map(u => u.id);
      if (validIds.length > 0) {
        await prisma.documentTag.createMany({
          data: validIds.map(universityId => ({ documentId: doc.id, universityId })),
        });
      }
    }

    const docWithTags = await prisma.document.findUnique({
      where: { id: doc.id },
      include: {
        tags: {
          include: { university: { select: { id: true, name: true } } },
        },
      },
    });
    res.json(docWithTags);
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: err.message });
  }
});

// Download a document (protected — only owner)
router.get('/:id/download', async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (!fs.existsSync(doc.filePath)) return res.status(404).json({ error: 'File missing from disk' });
    res.download(doc.filePath, doc.fileName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a document
router.delete('/:id', async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    fs.unlink(doc.filePath, () => {});
    await prisma.document.delete({ where: { id: doc.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Replace all university tags for a document
router.patch('/:id/tags', async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const universityIds = Array.isArray(req.body.universityIds) ? req.body.universityIds : [];

    const valid = await prisma.university.findMany({
      where: { id: { in: universityIds }, userId: req.userId },
      select: { id: true },
    });
    const validIds = valid.map(u => u.id);

    await prisma.$transaction([
      prisma.documentTag.deleteMany({ where: { documentId: doc.id } }),
      ...(validIds.length > 0 ? [prisma.documentTag.createMany({
        data: validIds.map(universityId => ({ documentId: doc.id, universityId })),
      })] : []),
    ]);

    const updated = await prisma.document.findUnique({
      where: { id: doc.id },
      include: {
        tags: {
          include: { university: { select: { id: true, name: true } } },
        },
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
