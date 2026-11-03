// Storage: one SQLite file (server/data/live.db) for everything the panels share.
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

export const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "data");
export const UPLOAD_DIR = join(DATA_DIR, "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new DatabaseSync(join(DATA_DIR, "live.db"));
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business TEXT NOT NULL,
    no INTEGER NOT NULL,
    table_no INTEGER NOT NULL,
    lines TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    total REAL NOT NULL,
    status TEXT NOT NULL,
    source TEXT NOT NULL,
    by_waiter TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business TEXT NOT NULL,
    table_no INTEGER NOT NULL,
    status TEXT NOT NULL,
    handled_by TEXT,
    created_at INTEGER NOT NULL,
    answered_at INTEGER,
    done_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS menus (
    business TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  -- Panel screens saved as one JSON document each (staff, settings, notes …)
  CREATE TABLE IF NOT EXISTS docs (
    business TEXT NOT NULL,
    key TEXT NOT NULL,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (business, key)
  );
  -- Businesses as the super panel manages them
  CREATE TABLE IF NOT EXISTS businesses (
    slug TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,            -- super | owner | staff
    business TEXT,                 -- null for super
    staff_id TEXT,                 -- staff member this login belongs to
    password_hash TEXT,            -- null until a password is set
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS orders_business ON orders (business, created_at);
  CREATE INDEX IF NOT EXISTS calls_business ON calls (business, created_at);
`);

// --- JSON documents ---
const docGet = db.prepare("SELECT data, updated_at FROM docs WHERE business = ? AND key = ?");
const docPut = db.prepare(
  "INSERT INTO docs (business, key, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(business, key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
);
export const getDoc = (business, key) => {
  const row = docGet.get(business, key);
  return row ? JSON.parse(row.data) : null;
};
export const putDoc = (business, key, data) => docPut.run(business, key, JSON.stringify(data), Date.now());

const menuGet = db.prepare("SELECT data, updated_at FROM menus WHERE business = ?");
export const getMenu = (business) => {
  const row = menuGet.get(business);
  return row ? { ...JSON.parse(row.data), updatedAt: row.updated_at } : null;
};

const bizGet = db.prepare("SELECT data FROM businesses WHERE slug = ?");
export const getBusiness = (slug) => {
  const row = bizGet.get(slug);
  return row ? JSON.parse(row.data) : null;
};
