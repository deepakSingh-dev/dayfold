import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, asc, eq, isNull } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { devAuthBypass, env } from '@/lib/env';
import { bootstrapUserWorkspace } from '@/server/bootstrap';

/**
 * Returns the current Better Auth session (or null). Cached per-request so
 * multiple callers in one render don't re-hit the auth API.
 *
 * Dev-only: when devAuthBypass is on and there's no real session, we synthesise
 * a session for DEV_BYPASS_EMAIL (falling back to the first user) so the app can
 * be browsed without logging in.
 */
export const getSession = cache(async () => {
  const real = await auth.api.getSession({ headers: await headers() });
  if (real?.user) return real;

  if (devAuthBypass) {
    const user =
      (await db.query.users.findFirst({
        where: eq(schema.users.email, env.DEV_BYPASS_EMAIL),
      })) ?? (await db.query.users.findFirst());
    if (user) {
      return {
        user: { id: user.id, name: user.name, email: user.email, image: user.image },
        session: null,
      };
    }
  }

  return real;
});

/** Like getSession but redirects to /login when there is no session. */
export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }
  return session;
}

/**
 * Resolves the user's active workspace. Self-heals by bootstrapping one if the
 * user somehow has none (e.g. a signup where the bootstrap hook failed).
 * Cached per-request.
 */
export const getActiveWorkspace = cache(async (userId) => {
  const membership = await db.query.workspaceMembers.findFirst({
    where: eq(schema.workspaceMembers.userId, userId),
    with: { workspace: true },
    orderBy: asc(schema.workspaceMembers.createdAt),
  });

  if (membership?.workspace) {
    return membership.workspace;
  }

  // Self-heal: create a starter workspace.
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  const { workspaceId } = await bootstrapUserWorkspace(db, {
    userId,
    userName: user?.name,
  });
  return db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, workspaceId) });
});

/** Verifies a user is a member of a workspace; returns the membership or null. */
export async function getMembership(userId, workspaceId) {
  return db.query.workspaceMembers.findFirst({
    where: and(
      eq(schema.workspaceMembers.userId, userId),
      eq(schema.workspaceMembers.workspaceId, workspaceId),
    ),
  });
}

/** Non-archived, non-deleted projects for a workspace, ordered for the sidebar. */
export async function getWorkspaceProjects(workspaceId) {
  return db.query.projects.findMany({
    where: and(
      eq(schema.projects.workspaceId, workspaceId),
      eq(schema.projects.isArchived, false),
      isNull(schema.projects.deletedAt),
    ),
    orderBy: asc(schema.projects.sortOrder),
  });
}

/** Archived (but not deleted) projects, listed separately in the sidebar. */
export async function getArchivedProjects(workspaceId) {
  return db.query.projects.findMany({
    where: and(
      eq(schema.projects.workspaceId, workspaceId),
      eq(schema.projects.isArchived, true),
      isNull(schema.projects.deletedAt),
    ),
    orderBy: asc(schema.projects.sortOrder),
  });
}

/** Non-deleted notes pages for a workspace (flat for now; tree comes in Phase 6). */
export async function getWorkspacePages(workspaceId) {
  return db.query.pages.findMany({
    where: and(eq(schema.pages.workspaceId, workspaceId), isNull(schema.pages.deletedAt)),
    orderBy: asc(schema.pages.sortOrder),
  });
}
