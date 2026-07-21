import { getAuthContext, jsonError } from '@/server/api';
import { getSession } from '@/lib/session';

// GET /api/me — the current user's id + name (for "own comment" checks, etc.).
export async function GET() {
  try {
    await getAuthContext();
    const session = await getSession();
    return Response.json({ id: session.user.id, name: session.user.name });
  } catch (err) {
    return jsonError(err);
  }
}
