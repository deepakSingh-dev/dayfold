import { and, eq, isNull } from 'drizzle-orm';
import { updateProjectSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import { getAuthContext, jsonError, parseJson, requireProject } from '@/server/api';

// PATCH /api/projects/[id] — rename, recolor, re-icon, describe, or archive.
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requireProject(id, workspaceId);
    const data = await parseJson(request, updateProjectSchema);

    const [project] = await db
      .update(schema.projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.projects.id, id))
      .returning();

    return Response.json({ project });
  } catch (err) {
    return jsonError(err);
  }
}

// DELETE /api/projects/[id] — soft-delete the project and its tasks.
export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requireProject(id, workspaceId);

    const now = new Date();
    await db
      .update(schema.projects)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(schema.projects.id, id));
    await db
      .update(schema.tasks)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(schema.tasks.projectId, id), isNull(schema.tasks.deletedAt)));

    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
