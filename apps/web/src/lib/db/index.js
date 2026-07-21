import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from '@/lib/env';
import * as schema from './schema.js';

/**
 * Postgres connection pool + Drizzle client. A single pool is reused across
 * hot reloads in dev via a global to avoid exhausting connections.
 */
const globalForDb = globalThis;

const pool =
  globalForDb.__dayfoldPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__dayfoldPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
