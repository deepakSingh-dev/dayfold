import { eq } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { getAuthContext, jsonError, requireProject } from '@/server/api';

// POST /api/projects/[id]/restore — undelete the project and its tasks.
export async function POST(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requireProject(id, workspaceId, { includeDeleted: true });

    const now = new Date();
    await db
      .update(schema.projects)
      .set({ deletedAt: null, isArchived: false, updatedAt: now })
      .where(eq(schema.projects.id, id));
    await db
      .update(schema.tasks)
      .set({ deletedAt: null, updatedAt: now })
      .where(eq(schema.tasks.projectId, id));

    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
