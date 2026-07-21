import { and, desc, eq } from 'drizzle-orm';
import { EMPTY_DOC } from '@dayfold/shared/editor';
import { createPageSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import { getAuthContext, jsonError, parseJson } from '@/server/api';
import { listPages, requirePage } from '@/server/page-service';

// GET /api/pages — flat list of the workspace's pages (client builds the tree).
export async function GET() {
  try {
    const { workspaceId } = await getAuthContext();
    return Response.json({ pages: await listPages(workspaceId) });
  } catch (err) {
    return jsonError(err);
  }
}

// POST /api/pages — create a page (+ its editor doc), optionally under a parent.
export async function POST(request) {
  try {
    const { workspaceId } = await getAuthContext();
    const data = await parseJson(request, createPageSchema);
    if (data.parentPageId) await requirePage(data.parentPageId, workspaceId);

    const [last] = await db
      .select({ sortOrder: schema.pages.sortOrder })
      .from(schema.pages)
      .where(
        and(
          eq(schema.pages.workspaceId, workspaceId),
          data.parentPageId
            ? eq(schema.pages.parentPageId, data.parentPageId)
            : // top-level pages have a null parent; compare via IS NULL
              eq(schema.pages.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(schema.pages.sortOrder))
      .limit(1);
    const sortOrder = String((Number(last?.sortOrder) || 0) + 1);

    const [doc] = await db
      .insert(schema.docs)
      .values({ kind: 'page', snapshotJson: EMPTY_DOC, snapshotText: '' })
      .returning();

    const [page] = await db
      .insert(schema.pages)
      .values({
        workspaceId,
        parentPageId: data.parentPageId ?? null,
        title: data.title?.trim() || 'Untitled',
        icon: data.icon ?? '📄',
        docId: doc.id,
        sortOrder,
      })
      .returning();

    return Response.json({ page }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
