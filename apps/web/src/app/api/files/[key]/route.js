import { mimeFromName, readStoredFile } from '@/server/storage';

// GET /api/files/[key] — serve an uploaded file. Keys are uuid-prefixed so they
// aren't guessable; auth-gating downloads is a Phase 9 hardening item.
export async function GET(_request, { params }) {
  const { key } = await params;
  try {
    const data = await readStoredFile(key);
    return new Response(data, {
      headers: {
        'Content-Type': mimeFromName(key),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
