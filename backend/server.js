// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.js';
import documentRoutes from './routes/documents.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE'],
}));
app.use(express.json({ limit: '2mb' }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NRL AI Assistant',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏭 NRL AI Assistant Backend`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   LLM Provider: ${process.env.LLM_PROVIDER || 'openai'}`);
  console.log(`   ChromaDB: ${process.env.CHROMA_URL || 'http://localhost:8000'}\n`);
});
