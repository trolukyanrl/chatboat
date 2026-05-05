// routes/links.js
import express from 'express';
import { getDeptLinks, getAllLinks, addLink, deleteLink, findLinks } from '../services/linkNavigator.js';

const router = express.Router();

// GET /api/links — all links
router.get('/', (req, res) => res.json(getAllLinks()));

// GET /api/links/:department — links for a dept
router.get('/:department', (req, res) => {
  res.json(getDeptLinks(req.params.department));
});

// GET /api/links/:department/search?q=query — search links
router.get('/:department/search', (req, res) => {
  const { q = '' } = req.query;
  res.json(findLinks(req.params.department, q));
});

// POST /api/links/:department — add a link
router.post('/:department', (req, res) => {
  const { title, url, keywords, desc } = req.body;
  if (!title || !url) return res.status(400).json({ error: 'title and url are required' });
  const result = addLink(req.params.department, {
    title, url,
    keywords: Array.isArray(keywords) ? keywords : (keywords || '').split(',').map(k => k.trim()),
    desc: desc || '',
  });
  res.json(result);
});

// DELETE /api/links/:department/:title — remove a link
router.delete('/:department/:title', (req, res) => {
  const result = deleteLink(req.params.department, decodeURIComponent(req.params.title));
  res.json(result);
});

export default router;
