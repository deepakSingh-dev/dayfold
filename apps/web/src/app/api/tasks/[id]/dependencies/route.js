import { and, eq } from 'drizzle-orm';
import { addDependencySchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import { ApiError, getAuthContext, jsonError, parseJson, requireTask } from '@/server/api';

// POST /api/tasks/[id]/dependencies — mark this task blocked by another.
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    const task = await requireTask(id, workspaceId);
    const { dependsOnTaskId } = await parseJson(request, addDependencySchema);

    if (dependsOnTaskId === id) throw new ApiError(400, "A task can't block itself");
    const blocker = await requireTask(dependsOnTaskId, workspaceId);
    if (blocker.projectId !== task.projectId) {
      throw new ApiError(400, 'Dependencies must be within the same project');
    }

    // Prevent a direct circular pair (A↔B).
    const reverse = await db.query.taskDependencies.findFirst({
      where: and(
        eq(schema.taskDependencies.taskId, dependsOnTaskId),
        eq(schema.taskDependencies.dependsOnTaskId, id),
      ),
    });
    if (reverse) throw new ApiError(400, 'That would create a circular dependency');

    const [dep] = await db
      .insert(schema.taskDependencies)
      .values({ taskId: id, dependsOnTaskId })
      .onConflictDoNothing()
      .returning();

    return Response.json({ dependency: dep ?? null }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
