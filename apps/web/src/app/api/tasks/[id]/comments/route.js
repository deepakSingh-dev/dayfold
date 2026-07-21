import { asc, eq } from 'drizzle-orm';
import { createCommentSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import { getAuthContext, jsonError, parseJson, requireTask } from '@/server/api';

// GET /api/tasks/[id]/comments — comments oldest-first, with author info.
export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requireTask(id, workspaceId);
    const rows = await db.query.comments.findMany({
      where: eq(schema.comments.taskId, id),
      orderBy: asc(schema.comments.createdAt),
      with: { author: { columns: { id: true, name: true } } },
    });
    return Response.json({
      comments: rows.map((c) => ({
        id: c.id,
        body: c.body,
        authorId: c.authorId,
        authorName: c.author?.name ?? 'Someone',
        createdAt: c.createdAt,
        editedAt: c.editedAt,
      })),
    });
  } catch (err) {
    return jsonError(err);
  }
}

// POST /api/tasks/[id]/comments — add a comment.
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { userId, workspaceId } = await getAuthContext();
    await requireTask(id, workspaceId);
    const { body } = await parseJson(request, createCommentSchema);
    const [comment] = await db
      .insert(schema.comments)
      .values({ taskId: id, authorId: userId, body })
      .returning();
    return Response.json({ comment }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
