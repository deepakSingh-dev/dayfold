import { eq } from 'drizzle-orm';
import { updateCommentSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import { ApiError, getAuthContext, jsonError, parseJson } from '@/server/api';

/** The comment must exist and be authored by the caller. */
async function requireOwnComment(commentId, userId) {
  const comment = await db.query.comments.findFirst({
    where: eq(schema.comments.id, commentId),
  });
  if (!comment) throw new ApiError(404, 'Comment not found');
  if (comment.authorId !== userId) throw new ApiError(403, 'You can only edit your own comments');
  return comment;
}

// PATCH /api/comments/[id] — edit your own comment.
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { userId } = await getAuthContext();
    await requireOwnComment(id, userId);
    const { body } = await parseJson(request, updateCommentSchema);
    const [comment] = await db
      .update(schema.comments)
      .set({ body, editedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.comments.id, id))
      .returning();
    return Response.json({ comment });
  } catch (err) {
    return jsonError(err);
  }
}

// DELETE /api/comments/[id] — delete your own comment.
export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const { userId } = await getAuthContext();
    await requireOwnComment(id, userId);
    await db.delete(schema.comments).where(eq(schema.comments.id, id));
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
