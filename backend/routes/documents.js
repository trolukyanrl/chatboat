// routes/documents.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { addDocuments, listDepartments, clearDepartment } from '../services/vectorStore.js';
import { chunkText } from '../services/rag.js';

const router = express.Router();

const upload = multer({
  dest: 'data/uploads/',
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

async function extractText(filePath, mimetype, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.pdf') {
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  // .txt or .md
  return fs.readFile(filePath, 'utf-8');
}

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Allowed: .pdf, .txt, .md' });
  }

  const { department = 'general' } = req.body;

  try {
    const text = await extractText(req.file.path, req.file.mimetype, req.file.originalname);
    const chunks = chunkText(text);

    if (!chunks.length) {
      return res.status(400).json({ error: 'No extractable text found in file' });
    }

    const result = await addDocuments(department, chunks, req.file.originalname);
    await fs.unlink(req.file.path).catch(() => {});

    res.json({
      success: true,
      file: req.file.originalname,
      department,
      chunks: result.added,
    });
  } catch (err) {
    console.error('[Upload Error]', err.message);
    await fs.unlink(req.file.path).catch(() => {});
    res.status(500).json({ error: 'Failed to process document', detail: err.message });
  }
});

// GET /api/documents/departments
router.get('/departments', async (req, res) => {
  try {
    const departments = await listDepartments();
    res.json({ departments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/documents/:department
router.delete('/:department', async (req, res) => {
  try {
    const result = await clearDepartment(req.params.department);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
