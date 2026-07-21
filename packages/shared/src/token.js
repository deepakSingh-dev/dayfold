import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Tiny HMAC-signed tokens for authenticating Yjs connections. Server-only (uses
 * node:crypto) — imported by the web token endpoint and the sync service, never
 * bundled to the client. Format: base64url(JSON payload).base64url(hmac-sha256).
 */

function sign(body, secret) {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

export function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body, secret)}`;
}

export function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expected = sign(body, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    return null;
  }
  if (payload.exp && Date.now() / 1000 > payload.exp) return null;
  return payload;
}
