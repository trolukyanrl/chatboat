// routes/chat.js
import express from 'express';
import { chat } from '../services/rag.js';
import { getProviderInfo } from '../services/llm.js';
import { logQuery } from './admin.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, department = 'general', history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    const start = Date.now();
    const result = await chat(department, message.trim(), history);
    const responseTime = Date.now() - start;

    logQuery(department, message.trim(), responseTime);

    res.json({ ...result, responseTimeMs: responseTime });
  } catch (err) {
    console.error('[Chat Error]', err.message);
    res.status(500).json({ error: 'Failed to generate response', detail: err.message });
  }
});

router.get('/status', (req, res) => {
  res.json({ status: 'ok', llm: getProviderInfo(), timestamp: new Date().toISOString() });
});

export default router;
