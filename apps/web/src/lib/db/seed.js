import './load-env.js';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema.js';

/**
 * Seeds a demo user (demo@demo.dev / demo1234) with a realistic workspace:
 * one project (3 sections + tasks) and one notes page. Idempotent — running it
 * again resets the demo workspace rather than duplicating it.
 *
 * Password hashing uses Better Auth's own hasher so the demo account can log in
 * through the normal auth flow (wired in Phase 1).
 */

const DEMO_EMAIL = 'demo@demo.dev';
const DEMO_PASSWORD = 'demo1234';
const DEMO_NAME = 'Demo User';

/** A minimal empty-but-valid editor document snapshot. */
function emptyDoc(text = '') {
  const json = {
    type: 'doc',
    content: text
      ? [{ type: 'paragraph', content: [{ type: 'text', text }] }]
      : [{ type: 'paragraph' }],
  };
  return { json, text };
}

async function hashDemoPassword(password) {
  // Better Auth exposes its default scrypt hasher here; keeps the demo account
  // loginable via the standard email/password provider.
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

  // Workspace + owner membership.
  const [workspace] = await db
    .insert(schema.workspaces)
    .values({ name: `${DEMO_NAME}'s Workspace`, plan: 'free', createdBy: user.id })
    .returning();
  if (!workspace) throw new Error('Failed to create workspace');

  await db.insert(schema.workspaceMembers).values({
    workspaceId: workspace.id,
    userId: user.id,
    role: 'owner',
  });

  // Sample project + sections.
  const [project] = await db
    .insert(schema.projects)
    .values({
      workspaceId: workspace.id,
      name: 'Product Launch',
      color: '#8b5cf6',
      icon: '🚀',
      description: 'Everything to get Dayfold v1 out the door.',
      sortOrder: '1',
    })
    .returning();
  if (!project) throw new Error('Failed to create project');

  const sectionRows = await db
    .insert(schema.sections)
    .values([
      { projectId: project.id, name: 'To Do', sortOrder: '1' },
      { projectId: project.id, name: 'In Progress', sortOrder: '2' },
      { projectId: project.id, name: 'Done', sortOrder: '3' },
    ])
    .returning();
  const [todo, inProgress, done] = sectionRows;
  if (!todo || !inProgress || !done) throw new Error('Failed to create sections');

  const today = new Date();
  const inDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  await db.insert(schema.tasks).values([
    {
      workspaceId: workspace.id,
      projectId: project.id,
      sectionId: todo.id,
      title: 'Write launch announcement',
      priority: 'high',
      dueDate: inDays(3),
      assigneeId: user.id,
      sortOrder: '1',
    },
    {
      workspaceId: workspace.id,
      projectId: project.id,
      sectionId: todo.id,
      title: 'Design social media assets',
      priority: 'medium',
      dueDate: inDays(5),
      assigneeId: user.id,
      sortOrder: '2',
    },
    {
      workspaceId: workspace.id,
      projectId: project.id,
      sectionId: inProgress.id,
      title: 'Finalize pricing page',
      priority: 'high',
      dueDate: inDays(1),
      assigneeId: user.id,
      sortOrder: '1',
    },
    {
      workspaceId: workspace.id,
      projectId: project.id,
      sectionId: done.id,
      title: 'Set up analytics',
      priority: 'low',
      completed: true,
      completedAt: new Date(),
      assigneeId: user.id,
      sortOrder: '1',
    },
  ]);

  // Sample notes page with its own doc.
  const welcome = emptyDoc('Welcome to Dayfold! This is your first note. Press "/" for blocks.');
  const [pageDoc] = await db
    .insert(schema.docs)
    .values({ kind: 'page', snapshotJson: welcome.json, snapshotText: welcome.text })
    .returning();
  if (!pageDoc) throw new Error('Failed to create page doc');

  await db.insert(schema.pages).values({
    workspaceId: workspace.id,
    title: 'Welcome to Dayfold',
    icon: '👋',
    docId: pageDoc.id,
    sortOrder: '1',
  });

  console.log(`Seed complete. Log in as ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
