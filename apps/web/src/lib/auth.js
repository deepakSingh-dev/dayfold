import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';

import { db, schema } from '@/lib/db';
import { env, googleOAuthEnabled } from '@/lib/env';
import { bootstrapUserWorkspace } from '@/server/bootstrap';

/**
 * Better Auth server instance.
 *
 * - Email + password is always on; Google is enabled only when its env creds
 *   are present (googleOAuthEnabled).
 * - Uses our existing Drizzle tables (users/sessions/accounts/verifications).
 *   IDs are uuid with DB-side defaults, so we disable Better Auth's id
 *   generation and let Postgres assign them.
 * - On user creation (any provider) we bootstrap a personal workspace with a
 *   sample project and notes page.
 */
export const auth = betterAuth({
  appName: 'Dayfold',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    // Solo-user product; no email server wired yet.
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  socialProviders: googleOAuthEnabled
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {},

  advanced: {
    // Let Postgres generate uuid primary keys (columns default gen_random_uuid).
    database: {
      generateId: false,
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await bootstrapUserWorkspace(db, { userId: user.id, userName: user.name });
          } catch (err) {
            // Never block signup on bootstrap failure; the workspace helper
            // self-heals on first app load if this ever fails.
            console.error('[auth] bootstrap failed for user', user.id, err);
          }
        },
      },
    },
  },

  // Keep Next.js cookie handling correct for server actions / route handlers.
  plugins: [nextCookies()],
});
