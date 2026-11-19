'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'kangeyam.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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

module.exports = { db, seedIfEmpty, DB_PATH };
