import { eq } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { ApiError, getAuthContext, jsonError } from '@/server/api';

// DELETE /api/dependencies/[id] — remove a dependency link.
export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    const dep = await db.query.taskDependencies.findFirst({
      where: eq(schema.taskDependencies.id, id),
      with: { task: { columns: { workspaceId: true } } },
    });
    if (!dep || dep.task.workspaceId !== workspaceId) {
      throw new ApiError(404, 'Dependency not found');
    }
    await db.delete(schema.taskDependencies).where(eq(schema.taskDependencies.id, id));
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
