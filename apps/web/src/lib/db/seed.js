import './load-env.js';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema.js';
import { bootstrapUserWorkspace } from '../../server/bootstrap.js';

/**
 * Seeds a demo user (demo@demo.dev / demo1234) with a realistic workspace via
 * the same bootstrap used on real signup. Idempotent — re-running resets the
 * demo user rather than duplicating.
 *
 * Password hashing uses Better Auth's own hasher so the demo account can log in
 * through the normal auth flow.
 */

const DEMO_EMAIL = 'demo@demo.dev';
const DEMO_PASSWORD = 'demo1234';
const DEMO_NAME = 'Demo User';
const DEMO2_EMAIL = 'demo2@demo.dev';
const DEMO2_NAME = 'Casey Rivera';

async function hashDemoPassword(password) {
  const { hashPassword } = await import('better-auth/crypto');
  return hashPassword(password);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env at the repo root.');
  }
  const pool = new Pool({ connectionString, max: 1 });
  const db = drizzle(pool, { schema });

  console.log('Seeding demo data…');

  // Reset any previous demo user (cascades clean up the whole graph).
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, DEMO_EMAIL) });
  if (existing) {
    await db.delete(schema.users).where(eq(schema.users.id, existing.id));
    console.log('  Removed previous demo user.');
  }

  // User + credential account.
  const [user] = await db
    .insert(schema.users)
    .values({ name: DEMO_NAME, email: DEMO_EMAIL, emailVerified: true })
    .returning();
  if (!user) throw new Error('Failed to create demo user');

  await db.insert(schema.accounts).values({
    accountId: user.id,
    providerId: 'credential',
    userId: user.id,
    password: await hashDemoPassword(DEMO_PASSWORD),
  });

  // Same starter content as a real signup.
  const { workspaceId } = await bootstrapUserWorkspace(db, {
    userId: user.id,
    userName: DEMO_NAME,
  });

  // A second member in the same workspace, for testing realtime collaboration.
  const existing2 = await db.query.users.findFirst({
    where: eq(schema.users.email, DEMO2_EMAIL),
  });
  if (existing2) {
    await db.delete(schema.users).where(eq(schema.users.id, existing2.id));
  }
  const [user2] = await db
    .insert(schema.users)
    .values({ name: DEMO2_NAME, email: DEMO2_EMAIL, emailVerified: true })
    .returning();
  await db.insert(schema.accounts).values({
    accountId: user2.id,
    providerId: 'credential',
    userId: user2.id,
    password: await hashDemoPassword(DEMO_PASSWORD),
  });
  await db.insert(schema.workspaceMembers).values({
    workspaceId,
    userId: user2.id,
    role: 'member',
  });

  console.log(`Seed complete. Log in as ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Collaborator: ${DEMO2_EMAIL} / ${DEMO_PASSWORD} (same workspace)`);
  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
