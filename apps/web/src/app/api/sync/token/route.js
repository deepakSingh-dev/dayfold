import { userColor } from '@dayfold/shared/editor';
import { signToken } from '@dayfold/shared/token';

import { db, schema } from '@/lib/db';
import { env } from '@/lib/env';
import { ApiError, getAuthContext, jsonError, requireDocAccess } from '@/server/api';
import { eq } from 'drizzle-orm';

// GET /api/sync/token?docId=... — mints a short-lived token authorizing a Yjs
// connection to that doc's room. Verifies the caller can access the doc.
export async function GET(request) {
  try {
    const { userId, workspaceId } = await getAuthContext();
    const docId = new URL(request.url).searchParams.get('docId');
    if (!docId) throw new ApiError(400, 'docId is required');

    await requireDocAccess(docId, workspaceId);

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      columns: { name: true },
    });

    const token = signToken(
      { userId, workspaceId, docId, exp: Math.floor(Date.now() / 1000) + 60 * 60 },
      env.SYNC_SHARED_SECRET,
    );

    // Derive the ws:// URL from the public sync URL.
    const wsUrl = env.NEXT_PUBLIC_SYNC_URL.replace(/^http/, 'ws');

    return Response.json({
      token,
      wsUrl,
      room: `doc:${docId}`,
      user: { id: userId, name: user?.name ?? 'Someone', color: userColor(userId) },
    });
  } catch (err) {
    return jsonError(err);
  }
}
