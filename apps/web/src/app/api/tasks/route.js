import { createTaskSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import {
  ApiError,
  getAuthContext,
  jsonError,
  nextTaskSortOrder,
  parseJson,
  requireProject,
  requireSection,
  requireTask,
} from '@/server/api';
import { serializeTask } from '@/server/task-service';

// POST /api/tasks — create a task or subtask (assigned to self by default).
export async function POST(request) {
  try {
    const { userId, workspaceId } = await getAuthContext();
    const data = await parseJson(request, createTaskSchema);
    await requireProject(data.projectId, workspaceId);

    if (data.sectionId) {
      const section = await requireSection(data.sectionId, workspaceId);
      if (section.projectId !== data.projectId) {
        throw new ApiError(400, 'Section does not belong to the project');
      }
    }
    if (data.parentTaskId) {
      const parent = await requireTask(data.parentTaskId, workspaceId);
      if (parent.projectId !== data.projectId) {
        throw new ApiError(400, 'Parent task does not belong to the project');
      }
    }

    const sortOrder = await nextTaskSortOrder(
      data.projectId,
      data.sectionId ?? null,
      data.parentTaskId ?? null,
    );

    const [task] = await db
      .insert(schema.tasks)
      .values({
        workspaceId,
        projectId: data.projectId,
        sectionId: data.sectionId ?? null,
        parentTaskId: data.parentTaskId ?? null,
        title: data.title,
        priority: data.priority ?? null,
        dueDate: data.dueDate ?? null,
        assigneeId: userId,
        sortOrder,
      })
      .returning();

    return Response.json({ task: serializeTask(task) }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
