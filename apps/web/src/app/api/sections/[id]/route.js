import { eq } from 'drizzle-orm';
import { updateSectionSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import { getAuthContext, jsonError, parseJson, requireSection } from '@/server/api';

// PATCH /api/sections/[id] — rename or reorder a section.
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requireSection(id, workspaceId);
    const data = await parseJson(request, updateSectionSchema);

    const [section] = await db
      .update(schema.sections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.sections.id, id))
      .returning();

    return Response.json({ section });
  } catch (err) {
    return jsonError(err);
  }
}

// DELETE /api/sections/[id] — remove a section; its tasks fall back to "no section".
export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requireSection(id, workspaceId);

    // FK is ON DELETE SET NULL, so tasks are preserved without a section.
    await db.delete(schema.sections).where(eq(schema.sections.id, id));

    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
