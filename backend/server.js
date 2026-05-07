import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.js';
import documentRoutes from './routes/documents.js';
import adminRoutes from './routes/admin.js';
import linkRoutes from './routes/links.js';
import authRoutes, { requireAdmin } from './routes/auth.js';
import crawlerRoutes from './routes/crawler.js';
import { createTicket, getTickets, getTicket, updateTicket, getTicketStats } from './services/ticketStore.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET','POST','DELETE','PATCH'] }));
app.use(express.json({ limit: '2mb' }));

// ── Public routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Any employee can create a ticket
app.post('/api/tickets', (req, res) => {
  const { title, description, department, priority, raisedBy } = req.body;
  if (!title || !description || !department)
    return res.status(400).json({ error: 'title, description, and department are required' });
  res.status(201).json(createTicket({ title, description, department, priority, raisedBy }));
});

// ── Admin-only routes ────────────────────────────────────────────────────────
app.use('/api/documents', requireAdmin, documentRoutes);
app.use('/api/admin',     requireAdmin, adminRoutes);
app.use('/api/links',     requireAdmin, linkRoutes);
app.use('/api/crawler',   requireAdmin, crawlerRoutes);

// Ticket admin routes
app.get('/api/tickets/stats', requireAdmin, (req, res) => res.json(getTicketStats()));
app.get('/api/tickets',       requireAdmin, (req, res) => {
  const { department, status, priority } = req.query;
  res.json(getTickets({ department, status, priority }));
});
app.get('/api/tickets/:id',   requireAdmin, (req, res) => {
  const t = getTicket(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});
app.patch('/api/tickets/:id', requireAdmin, (req, res) => {
  const t = updateTicket(req.params.id, req.body);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});

app.get('/api/health', (req, res) => res.json({ status:'ok', service:'NRL AI Assistant', version:'4.0.0' }));

app.listen(PORT, () => {
  console.log(`\n🏭 NRL AI Assistant Backend v4.0`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   LLM: ${process.env.LLM_PROVIDER||'groq'} | Tickets ✓ | Crawler ✓\n`);
});
