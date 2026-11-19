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

/**
 * Additive migrations — schema.sql only runs CREATE TABLE IF NOT EXISTS, so databases
 * created before a column existed need it added here. Safe to run on every boot.
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
    const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
    if (!cols.includes(column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
      added += 1;
    }
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_animals_review ON animals(review_status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_owners_review ON owners(review_status)');

  // Coat-colour list changed (Kari Mayilai / Karambai / Vellai replaced by
  // Kaari / Kaarampasu / Kurra). SQLite can't alter a CHECK, so rebuild the
  // animals table. Only current_color values that are no longer options are
  // cleared (to NULL) — explicitly permitted by the operator for this field;
  // every other column is copied verbatim.
  const animalsSql = (db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='animals'`).get() || {}).sql || '';
  if (animalsSql.includes('KARI_MAYILAI')) {
    db.exec('PRAGMA foreign_keys=OFF');
    db.exec(`
      CREATE TABLE animals_rebuild (
        id                   INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_or_reg_no        TEXT UNIQUE,
        name_ta              TEXT NOT NULL,
        name_en              TEXT NOT NULL,
        sex                  TEXT NOT NULL CHECK (sex IN ('BULL','COW')),
        dob                  TEXT,
        dob_precision        TEXT NOT NULL DEFAULT 'ESTIMATED_BY_TEETH'
                             CHECK (dob_precision IN ('EXACT','MONTH_YEAR','YEAR_ONLY','ESTIMATED_BY_TEETH')),
        dentition_stage      TEXT CHECK (dentition_stage IN ('CALF_MILK_TEETH','TWO_TOOTH','FOUR_TOOTH','SIX_TOOTH','FULL_MOUTH')),
        birth_color          TEXT CHECK (birth_color IN ('RED_FAWN','GREY','BLACK','OTHER')),
        current_color        TEXT DEFAULT 'MAYILAI'
                             CHECK (current_color IS NULL OR current_color IN ('MAYILAI','SEVALAI','KARI','KARAM_PASU','KURRA','OTHER')),
        distinctive_markings TEXT,
        current_village      TEXT,
        current_district     TEXT,
        sire_id              INTEGER REFERENCES animals(id) ON DELETE SET NULL,
        dam_id               INTEGER REFERENCES animals(id) ON DELETE SET NULL,
        is_stub              INTEGER NOT NULL DEFAULT 0,
        status               TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SOLD','DECEASED')),
        notes                TEXT,
        archived_at          TEXT,
        review_status        TEXT NOT NULL DEFAULT 'APPROVED'
                             CHECK (review_status IN ('PENDING','APPROVED','REJECTED')),
        submitted_at         TEXT,
        reviewed_at          TEXT,
        review_note          TEXT,
        submitter_name       TEXT,
        submitter_phone      TEXT,
        created_at           TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO animals_rebuild (
        id, tag_or_reg_no, name_ta, name_en, sex, dob, dob_precision, dentition_stage,
        birth_color, current_color, distinctive_markings, current_village, current_district,
        sire_id, dam_id, is_stub, status, notes, archived_at, review_status,
        submitted_at, reviewed_at, review_note, submitter_name, submitter_phone, created_at
      )
      SELECT
        id, tag_or_reg_no, name_ta, name_en, sex, dob, dob_precision, dentition_stage,
        birth_color,
        CASE WHEN current_color IN ('MAYILAI','SEVALAI','KARI','KARAM_PASU','KURRA','OTHER')
             THEN current_color ELSE NULL END,
        distinctive_markings, current_village, current_district,
        sire_id, dam_id, is_stub, status, notes, archived_at, review_status,
        submitted_at, reviewed_at, review_note, submitter_name, submitter_phone, created_at
      FROM animals;
      DROP TABLE animals;
      ALTER TABLE animals_rebuild RENAME TO animals;
    `);
    db.exec('PRAGMA foreign_keys=ON');
    db.exec('CREATE INDEX IF NOT EXISTS idx_animals_sex    ON animals(sex)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_animals_color  ON animals(current_color)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_animals_sire   ON animals(sire_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_animals_dam    ON animals(dam_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_animals_village ON animals(current_village)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_animals_review ON animals(review_status)');
    console.log('[db] migrated coat-colour options (removed colours cleared)');
  }

  if (added) console.log(`[db] migrated ${added} column(s)`);
}
migrate();

/**
 * Demo data is opt-in. The registry starts empty on a new deployment and only fills
 * with records that were submitted and approved (or created by an admin), which is
 * what a real herd needs. `SEED_DEMO_DATA=1 npm start` / `npm run seed` loads the
 * 29-animal sample herd back in.
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

/** Empty every table, keeping the schema. Used by `npm run db:wipe`. */
function wipe() {
  const tables = [
    'breeding_events', 'achievements', 'animal_media', 'animal_ownerships',
    'animals', 'owners',
  ];
  for (const t of tables) db.exec(`DELETE FROM ${t}`);
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('animals','owners','animal_ownerships','animal_media','achievements','breeding_events')");
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

module.exports = { db, seedIfEmpty, wipe, counts, DB_PATH, DB_MODE };
