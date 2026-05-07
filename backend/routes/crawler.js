// routes/crawler.js
import express from 'express';
import { crawlUrl, getCrawlJobs, getCrawlJob } from '../services/crawler.js';

const router = express.Router();

// POST /api/crawler — start a crawl job
router.post('/', async (req, res) => {
  const { url, department, depth = 1, maxPages = 20 } = req.body;
  if (!url || !department) return res.status(400).json({ error: 'url and department are required' });
  try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

  const job = await crawlUrl(url, department, Math.min(depth, 3), Math.min(maxPages, 50));
  res.json(job);
});

// GET /api/crawler — list all crawl jobs
router.get('/', (req, res) => res.json(getCrawlJobs()));

// GET /api/crawler/:id — get job status
router.get('/:id', (req, res) => {
  const job = getCrawlJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

export default router;
