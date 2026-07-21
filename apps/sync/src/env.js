import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

// The sync service runs with cwd = apps/sync in dev; load the repo-root .env.
loadEnv({ path: resolve(process.cwd(), '../../.env') });

export const env = {
  port: Number(process.env.SYNC_PORT ?? 1234),
  host: process.env.SYNC_HOST ?? '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL ?? '',
  sharedSecret: process.env.SYNC_SHARED_SECRET ?? 'dev-insecure-sync-secret-change-me',
};
