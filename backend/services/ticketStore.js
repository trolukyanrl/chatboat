// services/ticketStore.js — In-memory ticket store
const tickets = [];
let counter = 1000;

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES   = ['open', 'in-progress', 'resolved', 'closed'];

export function createTicket({ title, description, department, priority = 'medium', raisedBy = 'Employee' }) {
  const ticket = {
    id:          `TKT-${++counter}`,
    title:       title.slice(0, 120),
    description: description.slice(0, 1000),
    department,
    priority:    PRIORITIES.includes(priority) ? priority : 'medium',
    status:      'open',
    raisedBy,
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
    comments:    [],
  };
  tickets.unshift(ticket);
  console.log(`[Tickets] Created ${ticket.id} — ${ticket.title}`);
  return ticket;
}

export function getTickets({ department, status, priority } = {}) {
  return tickets.filter(t => {
    if (department && t.department !== department) return false;
    if (status     && t.status     !== status)     return false;
    if (priority   && t.priority   !== priority)   return false;
    return true;
  });
}

export function getTicket(id) {
  return tickets.find(t => t.id === id) || null;
}

export function updateTicket(id, { status, priority, comment, adminName = 'Admin' }) {
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return null;
  if (status   && STATUSES.includes(status))     ticket.status   = status;
  if (priority && PRIORITIES.includes(priority)) ticket.priority = priority;
  if (comment) {
    ticket.comments.push({ text: comment, by: adminName, at: new Date().toISOString() });
  }
  ticket.updatedAt = new Date().toISOString();
  return ticket;
}

export function getTicketStats() {
  const byStatus   = {};
  const byDept     = {};
  const byPriority = {};
  tickets.forEach(t => {
    byStatus[t.status]     = (byStatus[t.status]   || 0) + 1;
    byDept[t.department]   = (byDept[t.department] || 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority]||0) + 1;
  });
  return { total: tickets.length, byStatus, byDept, byPriority };
}
