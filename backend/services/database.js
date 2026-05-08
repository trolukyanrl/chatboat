// services/database.js — sql.js SQLite (pure JavaScript, no compilation needed)
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';

const __dir   = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dir, '../data');
const dbPath  = join(dataDir, 'nrl_assistant.db.json');

mkdirSync(dataDir, { recursive: true });

// ── Pure JS SQLite-like store using sql.js ──────────────────────────────────
const require = createRequire(import.meta.url);
let SQL;
try {
  SQL = require('sql.js');
} catch(e) {
  console.error('[DB] sql.js not found. Run: npm install');
  process.exit(1);
}

// sql.js is CommonJS with a default export that is a function
const initSqlJs = typeof SQL === 'function' ? SQL : SQL.default;

let dbInstance = null;
let dbBinary   = null;
const dbFilePath = join(dataDir, 'nrl_assistant.bin');

async function getDb() {
  if (dbInstance) return dbInstance;

  const SqlJs = await initSqlJs();

  if (existsSync(dbFilePath)) {
    const filebuffer = readFileSync(dbFilePath);
    dbInstance = new SqlJs.Database(filebuffer);
    console.log('[DB] SQLite loaded from disk → data/nrl_assistant.bin');
  } else {
    dbInstance = new SqlJs.Database();
    console.log('[DB] SQLite new database created → data/nrl_assistant.bin');
  }

  // Create tables
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      department TEXT NOT NULL,
      source TEXT NOT NULL,
      chunk_text TEXT NOT NULL,
      embedding TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      department TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'open',
      raised_by TEXT DEFAULT 'Employee',
      comments TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS portal_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      keywords TEXT DEFAULT '[]',
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS crawl_jobs (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      department TEXT NOT NULL,
      depth INTEGER DEFAULT 1,
      max_pages INTEGER DEFAULT 20,
      status TEXT DEFAULT 'running',
      pages INTEGER DEFAULT 0,
      chunks INTEGER DEFAULT 0,
      error TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT
    );
    CREATE TABLE IF NOT EXISTS query_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department TEXT NOT NULL,
      question TEXT NOT NULL,
      response_time INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  save();
  return dbInstance;
}

// Save to disk after every write
export function save() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    writeFileSync(dbFilePath, Buffer.from(data));
  } catch(e) {
    console.error('[DB] Save error:', e.message);
  }
}

// Helper: run a query and return all rows as objects
export function all(sql, params = []) {
  const stmt   = dbInstance.prepare(sql);
  const rows   = [];
  stmt.bind(params);
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// Helper: run a query and return first row
export function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

// Helper: run a write query
export function run(sql, params = []) {
  dbInstance.run(sql, params);
  save();
}

// Initialize on import
export const dbReady = getDb();

export default { all, get, run, save, dbReady };
