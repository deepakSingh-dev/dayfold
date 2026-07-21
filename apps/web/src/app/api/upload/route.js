import { MAX_ATTACHMENT_BYTES } from '@dayfold/shared';

import { ApiError, getAuthContext, jsonError } from '@/server/api';
import { saveFile } from '@/server/storage';

// POST /api/upload — multipart image upload for the editor. Returns { url }.
export async function POST(request) {
  try {
    await getAuthContext();

    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      throw new ApiError(400, 'No file provided');
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw new ApiError(400, 'File exceeds the 20 MB limit');
    }
    if (!file.type?.startsWith('image/')) {
      throw new ApiError(400, 'Only image uploads are supported here');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await saveFile({ buffer, filename: file.name });

    return Response.json({ url, filename: file.name, size: file.size }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
