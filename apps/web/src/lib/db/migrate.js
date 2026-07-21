import './load-env.js';

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

/**
 * Applies pending Drizzle migrations. Run via `npm run db:migrate`.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env at the repo root.');
  }

  const pool = new Pool({ connectionString, max: 1 });
  const db = drizzle(pool);

  console.log('Running migrations…');
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  console.log('Migrations complete.');

  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
