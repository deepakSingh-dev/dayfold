import { eq } from 'drizzle-orm';
import { updateFieldSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import { ApiError, getAuthContext, jsonError, parseJson } from '@/server/api';

async function requireField(fieldId, workspaceId) {
  const field = await db.query.customFieldDefs.findFirst({
    where: eq(schema.customFieldDefs.id, fieldId),
    with: { project: { columns: { workspaceId: true } } },
  });
  if (!field || field.project.workspaceId !== workspaceId) {
    throw new ApiError(404, 'Field not found');
  }
  return field;
}

// PATCH /api/fields/[id] — rename a field or edit its select options.
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requireField(id, workspaceId);
    const data = await parseJson(request, updateFieldSchema);
    const [field] = await db
      .update(schema.customFieldDefs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.customFieldDefs.id, id))
      .returning();
    return Response.json({ field });
  } catch (err) {
    return jsonError(err);
  }
}

// DELETE /api/fields/[id] — remove a field (its values cascade).
export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requireField(id, workspaceId);
    await db.delete(schema.customFieldDefs).where(eq(schema.customFieldDefs.id, id));
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
