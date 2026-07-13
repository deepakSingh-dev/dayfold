import { and, eq, isNull } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { getActiveWorkspace, getSession } from '@/lib/session';

/**
 * Small toolkit for JSON route handlers: auth context, body validation, and
 * consistent error responses. Handlers wrap their body in try/catch and return
 * `jsonError(e)` so thrown ApiErrors become clean typed responses.
 */

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function jsonError(err) {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  // Never leak internals to the client.
  console.error('[api] unhandled error:', err);
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}

/** Resolves the signed-in user + their active workspace, or throws 401. */
export async function getAuthContext() {
  const session = await getSession();
  if (!session?.user) {
    throw new ApiError(401, 'Unauthorized');
  }
  const workspace = await getActiveWorkspace(session.user.id);
  return { userId: session.user.id, workspaceId: workspace.id, workspace };
}

/** Parses + validates a JSON body against a Zod schema, or throws 400. */
export async function parseJson(request, schema) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, 'Invalid JSON body');
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(400, result.error.issues.map((i) => i.message).join('; '));
  }
  return result.data;
}

// --- Resource authorization (workspace-scoped) -----------------------------

export async function requireProject(projectId, workspaceId, { includeDeleted = false } = {}) {
  const where = includeDeleted
    ? and(eq(schema.projects.id, projectId), eq(schema.projects.workspaceId, workspaceId))
    : and(
        eq(schema.projects.id, projectId),
        eq(schema.projects.workspaceId, workspaceId),
        isNull(schema.projects.deletedAt),
      );
  const project = await db.query.projects.findFirst({ where });
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
}

export async function requireTask(taskId, workspaceId, { includeDeleted = false } = {}) {
  const where = includeDeleted
    ? and(eq(schema.tasks.id, taskId), eq(schema.tasks.workspaceId, workspaceId))
    : and(
        eq(schema.tasks.id, taskId),
        eq(schema.tasks.workspaceId, workspaceId),
        isNull(schema.tasks.deletedAt),
      );
  const task = await db.query.tasks.findFirst({ where });
  if (!task) throw new ApiError(404, 'Task not found');
  return task;
}

export async function requireSection(sectionId, workspaceId) {
  const section = await db.query.sections.findFirst({
    where: eq(schema.sections.id, sectionId),
    with: { project: true },
  });
  if (!section || section.project.workspaceId !== workspaceId) {
    throw new ApiError(404, 'Section not found');
  }
  return section;
}

/**
 * Next sort order for appending: max(sibling sortOrder)+1. Siblings share the
 * same parentTaskId and sectionId (nulls compared explicitly).
 */
export async function nextTaskSortOrder(projectId, sectionId, parentTaskId) {
  const rows = await db.query.tasks.findMany({
    where: and(
      eq(schema.tasks.projectId, projectId),
      isNull(schema.tasks.deletedAt),
      sectionId ? eq(schema.tasks.sectionId, sectionId) : isNull(schema.tasks.sectionId),
      parentTaskId
        ? eq(schema.tasks.parentTaskId, parentTaskId)
        : isNull(schema.tasks.parentTaskId),
    ),
    columns: { sortOrder: true },
  });
  const max = rows.reduce((m, r) => Math.max(m, Number(r.sortOrder) || 0), 0);
  return String(max + 1);
}
