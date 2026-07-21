import { inArray } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { getAuthContext, jsonError } from '@/server/api';
import { collectDescendantIds, requirePage } from '@/server/page-service';

// POST /api/pages/[id]/restore — restore a page and its subtree from the trash.
export async function POST(_request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requirePage(id, workspaceId, { includeDeleted: true });
    const ids = await collectDescendantIds(id, workspaceId);
    await db
      .update(schema.pages)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(inArray(schema.pages.id, ids));
    return Response.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
