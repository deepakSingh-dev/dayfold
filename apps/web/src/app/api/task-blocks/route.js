import { createTaskBlockSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import {
  ApiError,
  getAuthContext,
  jsonError,
  nextTaskSortOrder,
  parseJson,
  requireDocAccess,
  requireProject,
  requireSection,
} from '@/server/api';
import { serializeTask } from '@/server/task-service';

// POST /api/task-blocks — "turn into task": create a real task and link it to
// the editor block (task_doc_links) so the two stay in sync.
export async function POST(request) {
  try {
    const { userId, workspaceId } = await getAuthContext();
    const data = await parseJson(request, createTaskBlockSchema);

    await requireDocAccess(data.docId, workspaceId);
    await requireProject(data.projectId, workspaceId);
    if (data.sectionId) {
      const section = await requireSection(data.sectionId, workspaceId);
      if (section.projectId !== data.projectId) {
        throw new ApiError(400, 'Section does not belong to the project');
      }
    }

    const sortOrder = await nextTaskSortOrder(data.projectId, data.sectionId ?? null, null);

    const [task] = await db
      .insert(schema.tasks)
      .values({
        workspaceId,
        projectId: data.projectId,
        sectionId: data.sectionId ?? null,
        title: data.title,
        assigneeId: userId,
        sourcePageId: data.sourcePageId ?? null,
        sortOrder,
      })
      .returning();

    await db.insert(schema.taskDocLinks).values({
      docId: data.docId,
      taskId: task.id,
      blockId: data.blockId,
    });

    return Response.json({ task: serializeTask(task) }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
