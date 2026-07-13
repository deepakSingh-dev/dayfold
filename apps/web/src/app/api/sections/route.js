import { desc, eq } from 'drizzle-orm';
import { createSectionSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import { getAuthContext, jsonError, parseJson, requireProject } from '@/server/api';

// POST /api/sections — add a section to the end of a project.
export async function POST(request) {
  try {
    const { workspaceId } = await getAuthContext();
    const data = await parseJson(request, createSectionSchema);
    await requireProject(data.projectId, workspaceId);

    const [last] = await db
      .select({ sortOrder: schema.sections.sortOrder })
      .from(schema.sections)
      .where(eq(schema.sections.projectId, data.projectId))
      .orderBy(desc(schema.sections.sortOrder))
      .limit(1);
    const sortOrder = String((Number(last?.sortOrder) || 0) + 1);

    const [section] = await db
      .insert(schema.sections)
      .values({ projectId: data.projectId, name: data.name, sortOrder })
      .returning();

    return Response.json({ section }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
