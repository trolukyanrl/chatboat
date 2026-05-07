// routes/tickets.js
import express from 'express';
import { createTicket, getTickets, getTicket, updateTicket, getTicketStats } from '../services/ticketStore.js';

const router = express.Router();

// POST /api/tickets — create ticket (public — any employee can raise)
router.post('/', (req, res) => {
  const { title, description, department, priority, raisedBy } = req.body;
  if (!title || !description || !department) {
    return res.status(400).json({ error: 'title, description, and department are required' });
  }
  const ticket = createTicket({ title, description, department, priority, raisedBy });
  res.status(201).json(ticket);
});

// GET /api/tickets — list tickets (admin only, handled in server.js middleware)
router.get('/', (req, res) => {
  const { department, status, priority } = req.query;
  res.json(getTickets({ department, status, priority }));
});

// GET /api/tickets/stats
router.get('/stats', (req, res) => res.json(getTicketStats()));

// GET /api/tickets/:id
router.get('/:id', (req, res) => {
  const ticket = getTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

// PATCH /api/tickets/:id — update status/priority/comment (admin only)
router.patch('/:id', (req, res) => {
  const ticket = updateTicket(req.params.id, req.body);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

export default router;
