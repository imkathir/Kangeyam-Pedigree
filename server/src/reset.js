'use strict';

/**
 * Empty the registry, keep the schema.  `npm run db:wipe`
 * Pass --with-demo to reload the 29-animal sample herd afterwards.
 */
const { db, wipe, counts, DB_PATH, DB_MODE } = require('./db');

const before = counts();
wipe();
console.log(`[reset] cleared ${before.animals} animals / ${before.owners} owners from ${DB_MODE} db (${DB_PATH})`);

if (process.argv.includes('--with-demo')) {
  const { seed } = require('./seed');
  seed(db);
  console.log('[reset] demo herd reloaded');
}
console.log('[reset] now:', counts());
