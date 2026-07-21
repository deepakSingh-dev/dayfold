import { Server } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import pg from 'pg';
import { verifyToken } from '@dayfold/shared/token';
import { SERVER_YJS_ORIGIN } from '@dayfold/shared/editor';

import { env } from './env.js';
import { updateTaskBlockInFragment } from './task-block.js';

/**
 * Dayfold realtime sync service (Hocuspocus).
 *
 * - Authenticates each connection with an HMAC token minted by the web app,
 *   verifying it grants access to the requested doc room.
 * - Persists the Yjs binary state to Postgres (docs.yjs_state, base64) via the
 *   Database extension, and keeps a plaintext snapshot for search/previews.
 */

const pool = new pg.Pool({ connectionString: env.databaseUrl, max: 5 });

const docIdFromRoom = (name) => (name.startsWith('doc:') ? name.slice(4) : name);

/** Best-effort plaintext from the Tiptap Yjs fragment (strip XML tags). */
function plaintextFromDoc(document) {
  try {
    const xml = document.getXmlFragment('default').toString();
    return xml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50000);
  } catch {
    return '';
  }
}

const database = new Database({
  fetch: async ({ documentName }) => {
    const docId = docIdFromRoom(documentName);
    const { rows } = await pool.query('SELECT yjs_state FROM docs WHERE id = $1', [docId]);
    const state = rows[0]?.yjs_state;
    return state ? new Uint8Array(Buffer.from(state, 'base64')) : null;
  },
  store: async ({ documentName, state, document }) => {
    const docId = docIdFromRoom(documentName);
    const base64 = Buffer.from(state).toString('base64');
    const text = plaintextFromDoc(document);
    await pool.query(
      `UPDATE docs
         SET yjs_state = $2, snapshot_text = $3, version = version + 1, updated_at = now()
       WHERE id = $1`,
      [docId, base64, text],
    );
  },
});

const server = Server.configure({
  port: env.port,
  address: env.host,
  name: 'dayfold-sync',
  extensions: [database],

  async onAuthenticate({ token, documentName }) {
    const payload = verifyToken(token, env.sharedSecret);
    if (!payload) throw new Error('Invalid or expired token');
    if (payload.docId !== docIdFromRoom(documentName)) {
      throw new Error('Token does not grant access to this document');
    }
    // Available to other hooks as `context`.
    return { userId: payload.userId, workspaceId: payload.workspaceId };
  },

  onRequest({ request, response }) {
    return new Promise((resolve, reject) => {
      const url = request.url || '';

      if (url === '/health' || url === '/') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'ok', service: 'dayfold-sync', phase: 7 }));
        reject();
        return;
      }

      // Internal: web app pushes a task change into an open doc's task-block.
      const match = url.match(/^\/internal\/docs\/([^/]+)\/update-task-block$/);
      if (match && request.method === 'POST') {
        handleTaskBlockUpdate(match[1], request, response).then(reject, reject);
        return;
      }

      resolve();
    });
  },
});

/** Reads a small JSON body from a Node request. */
function readJson(request) {
  return new Promise((resolve) => {
    let raw = '';
    request.on('data', (c) => {
      raw += c;
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve(null);
      }
    });
    request.on('error', () => resolve(null));
  });
}

async function handleTaskBlockUpdate(docId, request, response) {
  const send = (code, body) => {
    response.writeHead(code, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(body));
  };

  if (request.headers['x-sync-secret'] !== env.sharedSecret) {
    send(401, { error: 'Unauthorized' });
    return;
  }
  const body = await readJson(request);
  if (!body || !body.blockId) {
    send(400, { error: 'blockId required' });
    return;
  }

  try {
    const connection = await server.openDirectConnection(`doc:${docId}`);
    let found = false;
    await connection.transact((doc) => {
      doc.transact(() => {
        found = updateTaskBlockInFragment(doc.getXmlFragment('default'), body);
      }, SERVER_YJS_ORIGIN);
    });
    await connection.disconnect();
    send(200, { ok: true, found });
  } catch (err) {
    console.error('[sync] task-block update failed:', err);
    send(500, { error: 'Internal error' });
  }
}

server
  .listen()
  .then(() => {
    console.log(`[dayfold-sync] listening on http://${env.host}:${env.port} (health: /health)`);
  })
  .catch((err) => {
    console.error('[dayfold-sync] failed to start:', err);
    process.exit(1);
  });
