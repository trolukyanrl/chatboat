// routes/admin.js — Analytics with sql.js query logs
import express from 'express';
import { all, get, run, dbReady } from '../services/database.js';
import { getStoreStats } from '../services/vectorStore.js';
import { getProviderInfo } from '../services/llm.js';

await dbReady;
const router = express.Router();

export function logQuery(dept, question, responseTimeMs) {
  run('INSERT INTO query_logs (department,question,response_time) VALUES (?,?,?)',
    [dept, question.slice(0,200), responseTimeMs]);
}

router.get('/stats', (req, res) => {
  const kb  = getStoreStats();
  const llm = getProviderInfo();
  const total = (get('SELECT COUNT(*) AS n FROM query_logs') || {}).n || 0;
  const avgMs = (get('SELECT AVG(response_time) AS avg FROM query_logs') || {}).avg || 0;

  const deptRows = all('SELECT department, COUNT(*) AS cnt FROM query_logs GROUP BY department');
  const queriesByDept = {};
  deptRows.forEach(r => { queriesByDept[r.department] = r.cnt; });

  const recentQueries = all(
    'SELECT department AS dept, question, response_time AS responseTime, created_at AS timestamp FROM query_logs ORDER BY created_at DESC LIMIT 20'
  );

  res.json({
    totalQueries: total,
    avgResponseTimeMs: Math.round(avgMs),
    queriesByDept,
    recentQueries,
    knowledgeBase: kb,
    llm,
    uptime: Math.round(process.uptime()),
  });
});

export default router;
