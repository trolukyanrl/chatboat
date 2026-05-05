// routes/chat.js
import express from 'express';
import { chat } from '../services/rag.js';
import { getProviderInfo } from '../services/llm.js';

const router = express.Router();

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, department = 'general', history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await chat(department, message.trim(), history);
    res.json(result);
  } catch (err) {
    console.error('[Chat Error]', err.message);
    res.status(500).json({
      error: 'Failed to generate response',
      detail: err.message,
    });
  }
});

// GET /api/chat/status
router.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    llm: getProviderInfo(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
