import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.js';
import documentRoutes from './routes/documents.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET','POST','DELETE'] }));
app.use(express.json({ limit: '2mb' }));

app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'NRL AI Assistant', version: '1.0.0' }));

app.listen(PORT, () => {
  console.log(`\n🏭 NRL AI Assistant Backend`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   LLM Provider: ${process.env.LLM_PROVIDER || 'groq'}\n`);
});
