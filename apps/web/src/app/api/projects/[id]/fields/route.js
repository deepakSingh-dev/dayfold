import { asc, desc, eq } from 'drizzle-orm';
import { createFieldSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import { getAuthContext, jsonError, parseJson, requireProject } from '@/server/api';

// GET /api/projects/[id]/fields — custom field defs for the project.
export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requireProject(id, workspaceId);
    const fields = await db.query.customFieldDefs.findMany({
      where: eq(schema.customFieldDefs.projectId, id),
      orderBy: asc(schema.customFieldDefs.sortOrder),
    });
    return Response.json({ fields });
  } catch (err) {
    return jsonError(err);
  }
}

// POST /api/projects/[id]/fields — create a custom field def.
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requireProject(id, workspaceId);
    const data = await parseJson(request, createFieldSchema);

    const [last] = await db
      .select({ sortOrder: schema.customFieldDefs.sortOrder })
      .from(schema.customFieldDefs)
      .where(eq(schema.customFieldDefs.projectId, id))
      .orderBy(desc(schema.customFieldDefs.sortOrder))
      .limit(1);

    const [field] = await db
      .insert(schema.customFieldDefs)
      .values({
        projectId: id,
        name: data.name,
        type: data.type,
        options: data.type === 'select' ? (data.options ?? []) : null,
        sortOrder: String((Number(last?.sortOrder) || 0) + 1),
      })
      .returning();

    return Response.json({ field }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
