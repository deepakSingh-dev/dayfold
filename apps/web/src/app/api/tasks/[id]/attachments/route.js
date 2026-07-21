import { MAX_ATTACHMENT_BYTES } from '@dayfold/shared';

import { db, schema } from '@/lib/db';
import { ApiError, getAuthContext, jsonError, requireTask } from '@/server/api';
import { saveFile } from '@/server/storage';

// POST /api/tasks/[id]/attachments — upload a file attachment (any type, ≤20MB).
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { userId, workspaceId } = await getAuthContext();
    await requireTask(id, workspaceId);

    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') throw new ApiError(400, 'No file provided');
    if (file.size > MAX_ATTACHMENT_BYTES) throw new ApiError(400, 'File exceeds the 20 MB limit');

    const buffer = Buffer.from(await file.arrayBuffer());
    const { storagePath } = await saveFile({ buffer, filename: file.name });

    const [attachment] = await db
      .insert(schema.attachments)
      .values({
        taskId: id,
        uploaderId: userId,
        filename: file.name,
        mime: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        storagePath,
      })
      .returning();

    return Response.json({ attachment: serialize(attachment) }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

function serialize(a) {
  return {
    id: a.id,
    filename: a.filename,
    mime: a.mime,
    sizeBytes: a.sizeBytes,
    url: `/api/files/${encodeURIComponent(a.storagePath)}`,
    isImage: a.mime?.startsWith('image/'),
  };
}
