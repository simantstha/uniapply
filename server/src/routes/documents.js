import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { uploadToR2, getSignedDownloadUrl, deleteFromR2 } from '../services/r2Storage.js';

const router = express.Router();
const prisma = new PrismaClient();

// Store file in memory, then stream to R2
const upload = multer({
  storage: multer.memoryStorage(),
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

  let universityIds = [];
  if (req.body.universityIds) {
    try {
      universityIds = JSON.parse(req.body.universityIds);
      if (!Array.isArray(universityIds)) universityIds = [];
    } catch {
      return res.status(400).json({ error: 'Invalid universityIds format' });
    }
  }

  try {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const r2Key = `users/${req.userId}/${unique}-${req.file.originalname}`;

    await uploadToR2(r2Key, req.file.buffer, req.file.mimetype);

    const doc = await prisma.document.create({
      data: {
        userId: req.userId,
        name: req.body.name || req.file.originalname,
        docType: req.body.docType || 'other',
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        filePath: r2Key, // store R2 key in filePath column
      },
    });

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
    res.status(500).json({ error: err.message });
  }
});

// Download a document — returns a signed R2 URL
router.get('/:id/download', async (req, res) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const url = await getSignedDownloadUrl(doc.filePath, doc.fileName);
    res.json({ url });
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

    await deleteFromR2(doc.filePath);
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
