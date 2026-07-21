import { eq } from 'drizzle-orm';
import { EMPTY_DOC } from '@dayfold/shared/editor';

import { db, schema } from '@/lib/db';
import { getAuthContext, jsonError, requireTask } from '@/server/api';

// GET /api/tasks/[id]/doc — the task's description doc, created lazily on first open.
export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    const task = await requireTask(id, workspaceId);

    if (task.descriptionDocId) {
      const doc = await db.query.docs.findFirst({
        where: eq(schema.docs.id, task.descriptionDocId),
      });
      if (doc) {
        return Response.json({ docId: doc.id, snapshot: doc.snapshotJson ?? EMPTY_DOC });
      }
    }

    // Create + link a fresh description doc.
    const [doc] = await db
      .insert(schema.docs)
      .values({ kind: 'task_description', snapshotJson: EMPTY_DOC, snapshotText: '' })
      .returning();
    await db
      .update(schema.tasks)
      .set({ descriptionDocId: doc.id, updatedAt: new Date() })
      .where(eq(schema.tasks.id, id));

    return Response.json({ docId: doc.id, snapshot: doc.snapshotJson });
  } catch (err) {
    return jsonError(err);
  }
}
