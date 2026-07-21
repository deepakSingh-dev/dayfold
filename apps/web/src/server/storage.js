import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { env } from '@/lib/env';

/**
 * Local-disk file storage behind a small interface, so S3/R2 can be swapped in
 * later without touching callers. Files live under UPLOAD_DIR (resolved against
 * the repo root) and are served via /api/files/[key].
 */
const UPLOAD_ROOT = path.isAbsolute(env.UPLOAD_DIR)
  ? env.UPLOAD_DIR
  : path.resolve(process.cwd(), '../../', env.UPLOAD_DIR);

const EXT_MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

function safeName(name) {
  return (name || 'file').replace(/[^\w.\-]+/g, '_').slice(-80);
}

export function mimeFromName(name) {
  return EXT_MIME[path.extname(name).toLowerCase()] ?? 'application/octet-stream';
}

/** Persist a file; returns its storage key + a URL to serve it. */
export async function saveFile({ buffer, filename }) {
  await mkdir(UPLOAD_ROOT, { recursive: true });
  const key = `${randomUUID()}-${safeName(filename)}`;
  await writeFile(path.join(UPLOAD_ROOT, key), buffer);
  return { storagePath: key, url: `/api/files/${encodeURIComponent(key)}` };
}

/** Read a stored file by key. `basename` guards against path traversal. */
export async function readStoredFile(key) {
  return readFile(path.join(UPLOAD_ROOT, path.basename(key)));
}
