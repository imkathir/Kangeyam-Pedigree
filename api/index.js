'use strict';

/**
 * Vercel serverless entry point.
 *
 * The whole Express app from ../server is mounted as a single Node function, so the
 * REST API behaves exactly as it does locally. Vercel routes /api/* here (see vercel.json);
 * everything else is served as static files from web/dist.
 *
 * Database: set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in the Vercel project to persist
 * records in a hosted libSQL database. Without them the function seeds a demo database
 * into /tmp on each cold start (read/write works, but resets after a while).
 */
module.exports = require('../server/src/index.js');
