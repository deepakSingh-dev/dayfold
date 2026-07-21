import { and, eq } from 'drizzle-orm';
import { setFieldValueSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import { ApiError, getAuthContext, jsonError, parseJson, requireTask } from '@/server/api';

// PUT /api/tasks/[id]/fields — upsert a custom field value on a task.
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    const task = await requireTask(id, workspaceId);
    const data = await parseJson(request, setFieldValueSchema);

    // The field must belong to the task's project.
    const field = await db.query.customFieldDefs.findFirst({
      where: and(
        eq(schema.customFieldDefs.id, data.fieldDefId),
        eq(schema.customFieldDefs.projectId, task.projectId),
      ),
    });
    if (!field) throw new ApiError(404, 'Field not found for this project');

    await db
      .insert(schema.customFieldValues)
      .values({ taskId: id, fieldDefId: data.fieldDefId, value: data.value })
      .onConflictDoUpdate({
        target: [schema.customFieldValues.taskId, schema.customFieldValues.fieldDefId],
        set: { value: data.value, updatedAt: new Date() },
      });

    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
