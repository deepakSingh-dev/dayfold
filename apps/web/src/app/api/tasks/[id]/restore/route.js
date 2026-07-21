import { eq } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { ApiError, getAuthContext, jsonError, requireProject, requireTask } from '@/server/api';

// POST /api/tasks/[id]/restore — undelete a task and its subtasks.
export async function POST(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    const task = await requireTask(id, workspaceId, { includeDeleted: true });

    // Can't restore a task into a project that's still in the trash.
    const project = await requireProject(task.projectId, workspaceId, { includeDeleted: true });
    if (project.deletedAt) {
      throw new ApiError(400, 'Restore the project first');
    }

    const now = new Date();
    await db
      .update(schema.tasks)
      .set({ deletedAt: null, updatedAt: now })
      .where(eq(schema.tasks.id, id));
    await db
      .update(schema.tasks)
      .set({ deletedAt: null, updatedAt: now })
      .where(eq(schema.tasks.parentTaskId, id));

    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
