import { eq } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { ApiError, getAuthContext, jsonError } from '@/server/api';

// DELETE /api/attachments/[id] — remove an attachment (workspace-scoped).
export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    const attachment = await db.query.attachments.findFirst({
      where: eq(schema.attachments.id, id),
      with: { task: { columns: { workspaceId: true } } },
    });
    if (!attachment || attachment.task.workspaceId !== workspaceId) {
      throw new ApiError(404, 'Attachment not found');
    }
    await db.delete(schema.attachments).where(eq(schema.attachments.id, id));
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
