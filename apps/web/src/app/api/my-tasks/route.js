import { and, asc, eq, isNull } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { getAuthContext, jsonError } from '@/server/api';
import { serializeTask } from '@/server/task-service';

// GET /api/my-tasks — incomplete tasks assigned to me across the workspace.
export async function GET() {
  try {
    const { userId, workspaceId } = await getAuthContext();

    const rows = await db.query.tasks.findMany({
      where: and(
        eq(schema.tasks.workspaceId, workspaceId),
        eq(schema.tasks.assigneeId, userId),
        eq(schema.tasks.completed, false),
        isNull(schema.tasks.deletedAt),
      ),
      orderBy: asc(schema.tasks.dueDate),
      with: { project: { columns: { name: true, icon: true, deletedAt: true } } },
    });

    const tasks = rows
      .filter((t) => !t.project?.deletedAt)
      .map((t) =>
        serializeTask(t, {
          projectName: t.project?.name ?? null,
          projectIcon: t.project?.icon ?? null,
        }),
      );

    return Response.json({ tasks });
  } catch (err) {
    return jsonError(err);
  }
}
