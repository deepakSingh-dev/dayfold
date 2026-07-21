import { and, desc, eq, isNotNull } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { getAuthContext, jsonError } from '@/server/api';

// GET /api/trash — soft-deleted projects and independently-deleted tasks.
export async function GET() {
  try {
    const { workspaceId } = await getAuthContext();

    const projects = await db.query.projects.findMany({
      where: and(
        eq(schema.projects.workspaceId, workspaceId),
        isNotNull(schema.projects.deletedAt),
      ),
      orderBy: desc(schema.projects.deletedAt),
    });

    // Tasks deleted on their own (whose project is NOT in the trash). Tasks that
    // were removed as part of a project deletion are restored with the project.
    const taskRows = await db.query.tasks.findMany({
      where: and(eq(schema.tasks.workspaceId, workspaceId), isNotNull(schema.tasks.deletedAt)),
      orderBy: desc(schema.tasks.deletedAt),
      with: { project: { columns: { name: true, deletedAt: true } } },
    });

    const tasks = taskRows
      .filter((t) => !t.project?.deletedAt && !t.parentTaskId)
      .map((t) => ({
        id: t.id,
        title: t.title,
        deletedAt: t.deletedAt,
        projectId: t.projectId,
        projectName: t.project?.name ?? null,
      }));

    // Deleted pages: only the top of each deleted subtree (parent not deleted).
    const pageRows = await db.query.pages.findMany({
      where: and(eq(schema.pages.workspaceId, workspaceId), isNotNull(schema.pages.deletedAt)),
      orderBy: desc(schema.pages.deletedAt),
      columns: { id: true, title: true, icon: true, parentPageId: true, deletedAt: true },
    });
    const deletedIds = new Set(pageRows.map((p) => p.id));
    const pages = pageRows
      .filter((p) => !p.parentPageId || !deletedIds.has(p.parentPageId))
      .map((p) => ({ id: p.id, title: p.title, icon: p.icon, deletedAt: p.deletedAt }));

    return Response.json({
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        icon: p.icon,
        color: p.color,
        deletedAt: p.deletedAt,
      })),
      tasks,
      pages,
    });
  } catch (err) {
    return jsonError(err);
  }
}
