// routes/admin.js — Admin dashboard API
import express from 'express';
import { getStoreStats } from '../services/vectorStore.js';
import { getProviderInfo } from '../services/llm.js';

const router = express.Router();

// In-memory analytics store
const analytics = {
  queries: [],       // { dept, question, timestamp, responseTime }
  totalQueries: 0,
};

// Called by chat route after every query
export function logQuery(dept, question, responseTimeMs) {
  analytics.totalQueries++;
  analytics.queries.unshift({
    dept,
    question: question.slice(0, 120),
    timestamp: new Date().toISOString(),
    responseTime: responseTimeMs,
  });
  if (analytics.queries.length > 200) analytics.queries.pop();
}

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const kb = getStoreStats();
  const llm = getProviderInfo();

  const deptCounts = {};
  analytics.queries.forEach(q => {
    deptCounts[q.dept] = (deptCounts[q.dept] || 0) + 1;
  });

  const avgResponseTime = analytics.queries.length
    ? Math.round(analytics.queries.reduce((s, q) => s + q.responseTime, 0) / analytics.queries.length)
    : 0;

  res.json({
    totalQueries: analytics.totalQueries,
    avgResponseTimeMs: avgResponseTime,
    queriesByDept: deptCounts,
    recentQueries: analytics.queries.slice(0, 20),
    knowledgeBase: kb,
    llm,
    uptime: Math.round(process.uptime()),
  });
});

export default router;
