import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { createProjectSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import { getAuthContext, jsonError, parseJson } from '@/server/api';

// GET /api/projects — active (non-archived) projects for pickers.
export async function GET() {
  try {
    const { workspaceId } = await getAuthContext();
    const projects = await db.query.projects.findMany({
      where: and(
        eq(schema.projects.workspaceId, workspaceId),
        eq(schema.projects.isArchived, false),
        isNull(schema.projects.deletedAt),
      ),
      orderBy: asc(schema.projects.sortOrder),
      columns: { id: true, name: true, icon: true, color: true },
    });
    return Response.json({ projects });
  } catch (err) {
    return jsonError(err);
  }
}

// POST /api/projects — create a project (appended to the end of the sidebar).
export async function POST(request) {
  try {
    const { workspaceId } = await getAuthContext();
    const data = await parseJson(request, createProjectSchema);

    const [last] = await db
      .select({ sortOrder: schema.projects.sortOrder })
      .from(schema.projects)
      .where(eq(schema.projects.workspaceId, workspaceId))
      .orderBy(desc(schema.projects.sortOrder))
      .limit(1);
    const sortOrder = String((Number(last?.sortOrder) || 0) + 1);

    const [project] = await db
      .insert(schema.projects)
      .values({
        workspaceId,
        name: data.name,
        color: data.color ?? '#8b5cf6',
        icon: data.icon ?? null,
        description: data.description ?? null,
        sortOrder,
      })
      .returning();

    // Give a new project a default section so the List/Board views aren't empty.
    await db.insert(schema.sections).values({
      projectId: project.id,
      name: 'To Do',
      sortOrder: '1',
    });

    return Response.json({ project }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
