import { z } from 'zod';

/**
 * Server-side environment validation. Imported by any server module that needs
 * config. Fails fast with a readable message if a required var is missing.
 * Google OAuth vars are optional — the app must run with email/password only.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(1).default('dev-insecure-secret-change-me'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SYNC_URL: z.string().url().default('http://localhost:1234'),
  SYNC_INTERNAL_URL: z.string().url().default('http://localhost:1234'),
  SYNC_SHARED_SECRET: z.string().min(1).default('dev-insecure-sync-secret-change-me'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  UPLOAD_DIR: z.string().default('./uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;

/** True when Google OAuth creds are present so we can conditionally enable it. */
export const googleOAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
