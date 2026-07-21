import { and, eq, isNull } from 'drizzle-orm';
import { updateTaskSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import {
  ApiError,
  getAuthContext,
  jsonError,
  parseJson,
  requireProject,
  requireSection,
  requireTask,
} from '@/server/api';
import { getFullTask, serializeTask } from '@/server/task-service';
import { degradeTaskBlocks, pushTaskBlockUpdate } from '@/server/task-sync';

// GET /api/tasks/[id] — full task for the side-peek (with subtasks).
export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    const task = await requireTask(id, workspaceId);
    return Response.json({ task: await getFullTask(task) });
  } catch (err) {
    return jsonError(err);
  }
}

// PATCH /api/tasks/[id] — update any editable field.
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    const task = await requireTask(id, workspaceId);
    const data = await parseJson(request, updateTaskSchema);

    // Moving to another project must re-validate section membership.
    const targetProjectId = data.projectId ?? task.projectId;
    if (data.projectId && data.projectId !== task.projectId) {
      await requireProject(data.projectId, workspaceId);
    }
    if (data.sectionId) {
      const section = await requireSection(data.sectionId, workspaceId);
      if (section.projectId !== targetProjectId) {
        throw new ApiError(400, 'Section does not belong to the project');
      }
    }

    const patch = { ...data, updatedAt: new Date() };
    if (typeof data.completed === 'boolean') {
      patch.completedAt = data.completed ? new Date() : null;
    }

    const [updated] = await db
      .update(schema.tasks)
      .set(patch)
      .where(eq(schema.tasks.id, id))
      .returning();

    // Keep a moved parent's subtasks in the same project.
    if (data.projectId && data.projectId !== task.projectId) {
      await db
        .update(schema.tasks)
        .set({ projectId: data.projectId, updatedAt: new Date() })
        .where(eq(schema.tasks.parentTaskId, id));
    }

    // Two-way sync: reflect title/completion changes into any embedded blocks.
    if (typeof data.completed === 'boolean' || typeof data.title === 'string') {
      const blockUpdate = {};
      if (typeof data.completed === 'boolean') blockUpdate.completed = data.completed;
      if (typeof data.title === 'string') blockUpdate.title = updated.title;
      await pushTaskBlockUpdate(id, blockUpdate);
    }

    return Response.json({ task: serializeTask(updated) });
  } catch (err) {
    return jsonError(err);
  }
}

// DELETE /api/tasks/[id] — soft-delete a task and its subtasks.
export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requireTask(id, workspaceId);

    const now = new Date();
    await db
      .update(schema.tasks)
      .set({ deletedAt: now, updatedAt: now })
      .where(
        and(
          isNull(schema.tasks.deletedAt),
          // the task itself or one of its subtasks
          eq(schema.tasks.id, id),
        ),
      );
    await db
      .update(schema.tasks)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(schema.tasks.parentTaskId, id), isNull(schema.tasks.deletedAt)));

    // Degrade any embedded doc blocks to "(task deleted)".
    await degradeTaskBlocks(id);

    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
