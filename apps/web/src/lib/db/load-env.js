import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';

/**
 * Loads the repo-root .env for standalone scripts (migrate, seed) that run
 * with cwd = apps/web. Import this first, before anything reads process.env.
 */
loadEnv({ path: resolve(process.cwd(), '../../.env') });
