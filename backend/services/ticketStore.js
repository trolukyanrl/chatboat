// services/ticketStore.js — sql.js backed ticket store
import { all, get, run, dbReady } from './database.js';

await dbReady;

let counter = 1000;
const lastTicket = get("SELECT id FROM tickets ORDER BY created_at DESC LIMIT 1");
if (lastTicket) {
  const num = parseInt(lastTicket.id.replace('TKT-', ''));
  if (!isNaN(num)) counter = num;
}

const PRIORITIES = ['low','medium','high','critical'];
const STATUSES   = ['open','in-progress','resolved','closed'];

function parseTicket(t) {
  if (!t) return null;
  return { ...t, comments: JSON.parse(t.comments || '[]') };
}

export function createTicket({ title, description, department, priority='medium', raisedBy='Employee' }) {
  const id = `TKT-${++counter}`;
  run(`INSERT INTO tickets (id,title,description,department,priority,status,raised_by,comments)
       VALUES (?,?,?,?,?,'open',?,'[]')`,
    [id, title.slice(0,120), description.slice(0,1000), department,
     PRIORITIES.includes(priority)?priority:'medium', raisedBy]);
  console.log(`[Tickets] Created ${id} → DB`);
  return parseTicket(get('SELECT * FROM tickets WHERE id=?', [id]));
}

export function getTickets({ department, status, priority } = {}) {
  let sql = 'SELECT * FROM tickets WHERE 1=1';
  const p = [];
  if (department) { sql += ' AND department=?'; p.push(department); }
  if (status)     { sql += ' AND status=?';     p.push(status); }
  if (priority)   { sql += ' AND priority=?';   p.push(priority); }
  sql += ' ORDER BY created_at DESC';
  return all(sql, p).map(parseTicket);
}

export function getTicket(id) {
  return parseTicket(get('SELECT * FROM tickets WHERE id=?', [id]));
}

export function updateTicket(id, { status, priority, comment, adminName='Admin' }) {
  const ticket = get('SELECT * FROM tickets WHERE id=?', [id]);
  if (!ticket) return null;
  const comments = JSON.parse(ticket.comments || '[]');
  if (comment) comments.push({ text:comment, by:adminName, at:new Date().toISOString() });
  run(`UPDATE tickets SET
    status=COALESCE(?,status), priority=COALESCE(?,priority),
    comments=?, updated_at=datetime('now') WHERE id=?`,
    [status && STATUSES.includes(status)?status:null,
     priority && PRIORITIES.includes(priority)?priority:null,
     JSON.stringify(comments), id]);
  return parseTicket(get('SELECT * FROM tickets WHERE id=?', [id]));
}

export function getTicketStats() {
  const tickets = all('SELECT status,department,priority FROM tickets');
  const byStatus={}, byDept={}, byPriority={};
  tickets.forEach(t => {
    byStatus[t.status]     = (byStatus[t.status]     || 0) + 1;
    byDept[t.department]   = (byDept[t.department]   || 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
  });
  return { total:tickets.length, byStatus, byDept, byPriority };
}
