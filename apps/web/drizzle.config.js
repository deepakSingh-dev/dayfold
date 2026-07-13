import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

loadEnv({ path: resolve(process.cwd(), '../../.env') });

export default defineConfig({
  schema: './src/lib/db/schema.js',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://dayfold:dayfold@localhost:5432/dayfold',
  },
  strict: true,
  verbose: true,
});
