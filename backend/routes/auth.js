// routes/auth.js — Simple admin authentication
import express from 'express';

const router = express.Router();

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'nrl@admin123';
const SECRET     = process.env.ADMIN_SECRET   || 'nrl-secret-key';

// Simple signed token: base64(user:timestamp):signature
function makeToken(username) {
  const payload = Buffer.from(`${username}:${Date.now()}`).toString('base64');
  const sig     = Buffer.from(`${payload}:${SECRET}`).toString('base64').slice(0, 16);
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expectedSig = Buffer.from(`${payload}:${SECRET}`).toString('base64').slice(0, 16);
  if (sig !== expectedSig) return false;
  // Check expiry — 8 hours
  try {
    const [, ts] = Buffer.from(payload, 'base64').toString().split(':');
    return Date.now() - parseInt(ts) < 8 * 60 * 60 * 1000;
  } catch { return false; }
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ success: true, token: makeToken(username), username });
  }
  res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  res.json({ valid: verifyToken(token) });
});

// Middleware to protect admin routes
export function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized. Admin login required.' });
  }
  next();
}

export { verifyToken };
export default router;
