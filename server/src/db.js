'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Database layer.
 *
 * Local development   → a SQLite file next to the server (libSQL's better-sqlite3
 *                       compatible sync API, so every query in the app stays synchronous).
 * Vercel / serverless → set TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) and the exact same
 *                       code talks to a hosted libSQL (Turso) database over HTTPS.
 * Vercel without env → falls back to /tmp, which is writable but ephemeral: perfect for a
 *                       demo, not for real records.
 */

const IS_SERVERLESS = Boolean(process.env.VERCEL);
const REMOTE_URL = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || null;
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || null;

const Database = require('libsql').default || require('libsql');

/** libSQL attaches `_metadata` to single-row results; keep API payloads clean. */
function clean(row) {
  if (!row || typeof row !== 'object') return row;
  if (!('_metadata' in row)) return row;
  const { _metadata, ...rest } = row;
  return rest;
}

class Statement {
  constructor(stmt) {
    this.stmt = stmt;
  }

  get(...args) {
    return clean(this.stmt.get(...args));
  }

  all(...args) {
    const rows = this.stmt.all(...args);
    return Array.isArray(rows) ? rows.map(clean) : rows;
  }

  run(...args) {
    return this.stmt.run(...args);
  }

  columns() {
    return this.stmt.columns();
  }
}

class Connection {
  constructor(url, options) {
    this.inner = new Database(url, options);
  }

  prepare(sql) {
    return new Statement(this.inner.prepare(sql));
  }

  exec(sql) {
    return this.inner.exec(sql);
  }

  pragma(statement, options) {
    try {
      return this.inner.pragma(statement, options);
    } catch {
      return undefined;
    }
  }

  transaction(fn) {
    return this.inner.transaction(fn);
  }

  close() {
    return this.inner.close?.();
  }
}

function resolveTarget() {
  if (REMOTE_URL) {
    return { url: REMOTE_URL, options: AUTH_TOKEN ? { authToken: AUTH_TOKEN } : undefined, remote: true };
  }
  const dir = IS_SERVERLESS ? '/tmp' : path.join(__dirname, '..', 'data');
  fs.mkdirSync(dir, { recursive: true });
  const file = process.env.DB_PATH || path.join(dir, 'kangeyam.db');
  // A bundled read-only copy can be used as the seed source on serverless cold starts.
  const bundled = path.join(__dirname, '..', 'data', 'seed.db');
  if (IS_SERVERLESS && !fs.existsSync(file) && fs.existsSync(bundled)) {
    fs.copyFileSync(bundled, file);
  }
  return { url: `file:${file}`, options: undefined, remote: false };
}

const target = resolveTarget();
const db = new Connection(target.url, target.options);

const DB_PATH = target.remote ? target.url.replace(/\/\/.*@/, '//') : target.url.replace(/^file:/, '');
const DB_MODE = target.remote ? 'turso' : IS_SERVERLESS ? 'ephemeral' : 'file';

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

/** Seed only when the registry is empty. */
function seedIfEmpty() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM animals').get();
  if (n === 0) {
    const { seed } = require('./seed');
    seed(db);
    console.log('[db] seeded registry');
  }
}

module.exports = { db, seedIfEmpty, DB_PATH, DB_MODE };
