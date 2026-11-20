'use strict';

/**
 * Database layer — PostgreSQL (Neon in production, a local cluster in dev/test).
 *
 * The Express app was written against a synchronous SQLite-style API
 * (`db.prepare(sql).get/all/run(...)`). PostgreSQL drivers are asynchronous, so
 * queries are shipped to a worker thread (pg-worker.js) over SharedArrayBuffer and
 * the main thread blocks on Atomics.wait until the answer arrives. Every call site
 * in the app stays synchronous; the driver stays fully async inside the worker.
 *
 * DATABASE_URL is REQUIRED — there is deliberately no ephemeral fallback, because
 * a throwaway database is how production data kept disappearing on every deploy.
 */

const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || null;
if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is required (postgresql://…). Production should use a persistent ' +
    'Neon database; locally run a PostgreSQL cluster and point DATABASE_URL at it. ' +
    'There is no ephemeral fallback on purpose — data must survive deploys.'
  );
}

// Shared-memory buffers: 16 MB each covers the largest allowed photo payloads
// (~4.2 MB of base64) with room to spare.
const BUFFER_BYTES = 16 * 1024 * 1024;
const stateBuf = new Int32Array(new SharedArrayBuffer(16));
const reqBuf = new Uint8Array(new SharedArrayBuffer(BUFFER_BYTES));
const respBuf = new Uint8Array(new SharedArrayBuffer(BUFFER_BYTES));

const isNeon = /neon\.tech|sslmode=require/i.test(DATABASE_URL);
const worker = new Worker(path.join(__dirname, 'pg-worker.js'), {
  workerData: {
    connectionString: DATABASE_URL,
    ssl: isNeon ? { rejectUnauthorized: true } : undefined,
    state: stateBuf.buffer,
    request: reqBuf.buffer,
    response: respBuf.buffer,
    max: 4,
  },
  // Don't keep the process alive just because the worker is idling in Atomics.wait.
  unref: true,
});
let workerDead = false;
worker.on('error', () => { workerDead = true; });
worker.on('exit', () => {
  if (!workerDead) workerDead = true;
  // Release a main thread that is blocked waiting for a response.
  Atomics.store(stateBuf, 1, Atomics.load(stateBuf, 0));
  Atomics.notify(stateBuf, 1);
});

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Translate SQLite-style placeholders to PostgreSQL $n:
 *  - `?` positional (spread args)
 *  - `@name` named (single object arg, better-sqlite3 compatible)
 * Both are quote-aware so `?`/`@` inside string literals stay untouched.
 */
function bind(sql, args) {
  const named =
    args.length === 1 &&
    args[0] !== null &&
    typeof args[0] === 'object' &&
    !Array.isArray(args[0]) &&
    Object.getPrototypeOf(args[0]) === Object.prototype &&
    /@[A-Za-z_]/.test(sql);
  const obj = named ? args[0] : null;
  const positional = named ? [] : args;
  let posIdx = 0;
  const namedIdx = new Map();
  const params = [];
  let out = '';
  let inString = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (c === "'") {
      // '' inside a literal toggles twice and stays inside — correct either way.
      inString = !inString;
      out += c;
      continue;
    }
    if (!inString && c === '?') {
      params.push(positional[posIdx++]);
      out += '$' + params.length;
      continue;
    }
    if (!inString && c === '@') {
      let j = i + 1;
      while (j < sql.length && /[A-Za-z0-9_]/.test(sql[j])) j++;
      const name = sql.slice(i + 1, j);
      if (!namedIdx.has(name)) {
        namedIdx.set(name, params.length);
        params.push(obj && obj[name] !== undefined ? obj[name] : null);
      }
      out += '$' + (namedIdx.get(name) + 1);
      i = j - 1;
      continue;
    }
    out += c;
  }
  return { sql: out, params: params.map((p) => (p === undefined ? null : p)) };
}

function send(op, sql, args) {
  if (workerDead) throw new Error('database worker is not running');
  const bound = bind(sql, args);
  const payload = encoder.encode(JSON.stringify({ op, sql: bound.sql, params: bound.params }));
  if (payload.length + 4 > reqBuf.length) {
    throw new Error('query payload exceeds the 16 MB shared buffer');
  }
  new Int32Array(reqBuf.buffer)[0] = payload.length;
  reqBuf.set(payload, 4);
  const seq = Atomics.load(stateBuf, 0) + 1;
  Atomics.store(stateBuf, 0, seq);
  Atomics.notify(stateBuf, 0);
  Atomics.wait(stateBuf, 1, seq - 1);
  if (Atomics.load(stateBuf, 1) !== seq || workerDead) {
    throw new Error('database worker died while running a query');
  }
  const len = new Int32Array(respBuf.buffer)[0];
  const msg = JSON.parse(decoder.decode(respBuf.subarray(4, 4 + len)));
  if (!msg.ok) throw new Error(msg.error);
  return msg;
}

class Statement {
  constructor(sql) {
    this.sql = sql;
  }

  get(...args) {
    const msg = send('get', this.sql, args);
    return msg.rows && msg.rows.length ? msg.rows[0] : undefined;
  }

  all(...args) {
    const msg = send('all', this.sql, args);
    return msg.rows || [];
  }

  run(...args) {
    const msg = send('run', this.sql, args);
    return { changes: msg.changes, lastInsertRowid: msg.lastInsertRowid };
  }
}

class Database {
  prepare(sql) {
    return new Statement(sql);
  }

  /** Run one or more `;`-separated statements with no parameters. */
  exec(sql) {
    return send('exec', sql, []);
  }

  /**
   * better-sqlite3 compatible: returns a wrapper that runs BEGIN → fn() → COMMIT
   * (ROLLBACK on throw) when invoked — seed.js calls it as `db.transaction(fn)()`.
   */
  transaction(fn) {
    return (...args) => {
      send('exec', 'BEGIN', []);
      try {
        const result = fn(...args);
        send('exec', 'COMMIT', []);
        return result;
      } catch (err) {
        try { send('exec', 'ROLLBACK', []); } catch { /* connection may be gone */ }
        throw err;
      }
    };
  }

  close() {
    try {
      const seq = Atomics.load(stateBuf, 0) + 1;
      Atomics.store(stateBuf, 0, -1); // worker interprets -1 as shutdown
      Atomics.notify(stateBuf, 0);
      void seq;
    } catch { /* already gone */ }
    return worker.terminate();
  }
}

const db = new Database();

// ── schema + migrations (synchronous through the bridge) ──────────────────────
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

/**
 * Additive migrations — schema.sql only runs CREATE TABLE IF NOT EXISTS, so a
 * database created before a column existed needs it added here. Safe on every boot.
 */
const MIGRATIONS = [
  ['animals', 'review_status', "TEXT NOT NULL DEFAULT 'APPROVED'"],
  ['animals', 'submitted_at', 'TEXT'],
  ['animals', 'reviewed_at', 'TEXT'],
  ['animals', 'review_note', 'TEXT'],
  ['animals', 'submitter_name', 'TEXT'],
  ['animals', 'submitter_phone', 'TEXT'],
  ['owners', 'review_status', "TEXT NOT NULL DEFAULT 'APPROVED'"],
  ['owners', 'submitted_at', 'TEXT'],
  ['owners', 'reviewed_at', 'TEXT'],
  ['owners', 'review_note', 'TEXT'],
  ['owners', 'submitter_name', 'TEXT'],
  ['owners', 'submitter_phone', 'TEXT'],
];

function migrate() {
  let added = 0;
  for (const [table, column, ddl] of MIGRATIONS) {
    const row = db
      .prepare(
        `SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ? AND column_name = ?`
      )
      .get(table, column);
    if (!row) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
      added += 1;
    }
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_animals_review ON animals(review_status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_owners_review ON owners(review_status)');
  if (added) console.log(`[db] migrated ${added} column(s)`);
}
migrate();

const urlForLog = DATABASE_URL.replace(/\/\/([^@/]+)@/, '//***@');
const DB_PATH = urlForLog;
const DB_MODE = /neon\.tech/i.test(DATABASE_URL) ? 'neon' : 'postgres';

/**
 * Demo data is opt-in. The registry starts empty on a new deployment and only
 * fills with records that were submitted and approved (or created by an admin),
 * which is what a real herd needs. `SEED_DEMO_DATA=1 npm start` loads the sample herd.
 */
function seedIfEmpty({ force = false } = {}) {
  if (!force && process.env.SEED_DEMO_DATA !== '1') return false;
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM animals').get();
  if (n === 0) {
    const { seed } = require('./seed');
    seed(db);
    console.log('[db] seeded demo registry (SEED_DEMO_DATA=1)');
    return true;
  }
  return false;
}

/** Empty every table, keep the schema. Used by `npm run db:wipe`. */
function wipe() {
  db.exec(
    'TRUNCATE breeding_events, achievements, animal_media, animal_ownerships, animals, owners RESTART IDENTITY'
  );
}

function counts() {
  return db
    .prepare(`SELECT
      (SELECT COUNT(*) FROM animals) AS animals,
      (SELECT COUNT(*) FROM animals WHERE review_status = 'PENDING') AS pending_animals,
      (SELECT COUNT(*) FROM owners) AS owners,
      (SELECT COUNT(*) FROM owners WHERE review_status = 'PENDING') AS pending_owners`)
    .get();
}

module.exports = { db, seedIfEmpty, wipe, counts, DB_PATH, DB_MODE, DATABASE_URL };
