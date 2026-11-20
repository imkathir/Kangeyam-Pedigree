'use strict';

/**
 * PostgreSQL worker — runs every query for the app off the main thread.
 *
 * db.js (main thread) speaks to this worker synchronously through SharedArrayBuffer
 * + Atomics.ping-pong, so the entire Express app keeps the synchronous
 * `db.prepare(sql).get/all/run(...)` style it was written with, while the actual
 * driver (pg) stays fully asynchronous inside this thread.
 */
const { parentPort, workerData } = require('worker_threads');
const { Pool, types } = require('pg');

// COUNT/MAX come back as int8 (bigint) strings by default — the app expects numbers.
types.setTypeParser(20, (v) => parseInt(v, 10));
types.setTypeParser(1700, (v) => parseFloat(v));

const { connectionString, ssl, state, request, response, max } = workerData;

const pool = new Pool({
  connectionString,
  ssl,
  max: max || 4,
  connectionTimeoutMillis: 10_000,
  query_timeout: 30_000,
});

const stateArr = new Int32Array(state);
const reqBytes = new Uint8Array(request);
const respBytes = new Uint8Array(response);
const decoder = new TextDecoder();
const encoder = new TextEncoder();

function writeResponse(msg) {
  let bytes = encoder.encode(JSON.stringify(msg));
  if (bytes.length + 4 > respBytes.length) {
    bytes = encoder.encode(JSON.stringify({ ok: 0, error: 'response exceeds shared buffer' }));
  }
  new Int32Array(respBytes.buffer)[0] = bytes.length;
  respBytes.set(bytes, 4);
}

async function handle({ op, sql, params }) {
  if (op === 'exec') {
    await pool.query(sql);
    return { ok: 1 };
  }
  const result = await pool.query(sql, params || []);
  if (op === 'get') return { ok: 1, rows: result.rows.slice(0, 1) };
  if (op === 'all') return { ok: 1, rows: result.rows };
  // run
  const first = result.rows && result.rows[0];
  return {
    ok: 1,
    changes: result.rowCount,
    lastInsertRowid: first && first.id !== undefined ? first.id : undefined,
    rows: result.rows,
  };
}

async function mainLoop() {
  let seen = 0;
  for (;;) {
    // Block until the main thread posts a request (or asks us to stop).
    Atomics.wait(stateArr, 0, seen);
    const seq = Atomics.load(stateArr, 0);
    if (seq === -1) break; // shutdown
    const len = new Int32Array(reqBytes.buffer)[0];
    let reply;
    try {
      const payload = JSON.parse(decoder.decode(reqBytes.subarray(4, 4 + len)));
      reply = await handle(payload);
    } catch (err) {
      reply = { ok: 0, error: (err && err.message) || String(err) };
    }
    writeResponse(reply);
    Atomics.store(stateArr, 1, seq);
    Atomics.notify(stateArr, 1);
    seen = seq;
  }
  await pool.end().catch(() => {});
  parentPort?.postMessage('done');
}

mainLoop().catch((err) => {
  writeResponse({ ok: 0, error: (err && err.message) || String(err) });
  Atomics.store(stateArr, 1, Atomics.load(stateArr, 0));
  Atomics.notify(stateArr, 1);
});
