import { eq, inArray } from 'drizzle-orm';
import { updatePageSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import { ApiError, getAuthContext, jsonError, parseJson } from '@/server/api';
import { collectDescendantIds, getBreadcrumbs, requirePage } from '@/server/page-service';

// GET /api/pages/[id] — a page + its breadcrumb chain.
export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    const page = await requirePage(id, workspaceId);
    const breadcrumbs = await getBreadcrumbs(page, workspaceId);
    return Response.json({
      page: {
        id: page.id,
        parentPageId: page.parentPageId,
        title: page.title,
        icon: page.icon,
        docId: page.docId,
      },
      breadcrumbs,
    });
  } catch (err) {
    return jsonError(err);
  }
}

// PATCH /api/pages/[id] — rename, re-icon, reorder, or re-parent.
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requirePage(id, workspaceId);
    const data = await parseJson(request, updatePageSchema);

    // Re-parenting: target must exist in the workspace and not be a descendant.
    if (data.parentPageId) {
      await requirePage(data.parentPageId, workspaceId);
      const descendants = await collectDescendantIds(id, workspaceId);
      if (descendants.includes(data.parentPageId)) {
        throw new ApiError(400, 'Cannot move a page into its own descendant');
      }
    }

    const [page] = await db
      .update(schema.pages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.pages.id, id))
      .returning();

    return Response.json({ page });
  } catch (err) {
    return jsonError(err);
  }
}

// DELETE /api/pages/[id] — soft-delete the page and its whole subtree.
export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requirePage(id, workspaceId);
    const ids = await collectDescendantIds(id, workspaceId);
    await db
      .update(schema.pages)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(inArray(schema.pages.id, ids));
    return Response.json({ ok: true, count: ids.length });
  } catch (err) {
    return jsonError(err);
  }
}
