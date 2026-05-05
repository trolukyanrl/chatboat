import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.js';
import documentRoutes from './routes/documents.js';
import adminRoutes from './routes/admin.js';
import linkRoutes from './routes/links.js';
import authRoutes, { requireAdmin } from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET','POST','DELETE'] }));
app.use(express.json({ limit: '2mb' }));

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Admin-protected routes
app.use('/api/documents', requireAdmin, documentRoutes);
app.use('/api/admin', requireAdmin, adminRoutes);
app.use('/api/links', requireAdmin, linkRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'NRL AI Assistant', version: '2.0.0' }));

app.listen(PORT, () => {
  console.log(`\n🏭 NRL AI Assistant Backend v2.0`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   LLM Provider: ${process.env.LLM_PROVIDER || 'groq'}`);
  console.log(`   Admin auth: enabled\n`);
});
