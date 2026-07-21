import { eq, sql } from 'drizzle-orm';
import { saveDocSchema } from '@dayfold/shared/schemas';

import { db, schema } from '@/lib/db';
import { getAuthContext, jsonError, parseJson, requireDocAccess } from '@/server/api';

// PUT /api/docs/[id] — persist a JSON snapshot (+ plaintext for search).
// Phase 4 saves the JSON directly; Phase 5 layers Yjs on top.
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { workspaceId } = await getAuthContext();
    await requireDocAccess(id, workspaceId);
    const data = await parseJson(request, saveDocSchema);

    const [doc] = await db
      .update(schema.docs)
      .set({
        snapshotJson: data.snapshotJson,
        snapshotText: data.snapshotText,
        version: sql`${schema.docs.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(schema.docs.id, id))
      .returning({ version: schema.docs.version });

    return Response.json({ ok: true, version: doc.version });
  } catch (err) {
    return jsonError(err);
  }
}
