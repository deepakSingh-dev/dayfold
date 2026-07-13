import { Server } from '@hocuspocus/server';

import { env } from './env.js';

/**
 * Dayfold realtime sync service (Hocuspocus).
 *
 * Phase 0: boots and answers a health check. Authentication, Postgres
 * persistence, snapshots, and the internal task-block sync endpoint arrive in
 * Phase 5 / Phase 7 per the brief.
 */
const server = Server.configure({
  port: env.port,
  address: env.host,
  name: 'dayfold-sync',

  // Handle plain HTTP requests (health check) before the WebSocket upgrade.
  // Rejecting the returned promise tells Hocuspocus we've handled the response.
  onRequest({ request, response }) {
    return new Promise((resolve, reject) => {
      if (request.url === '/health' || request.url === '/') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'ok', service: 'dayfold-sync', phase: 0 }));
        reject();
        return;
      }
      resolve();
    });
  },
});

server
  .listen()
  .then(() => {
    console.log(`[dayfold-sync] listening on http://${env.host}:${env.port} (health: /health)`);
  })
  .catch((err) => {
    console.error('[dayfold-sync] failed to start:', err);
    process.exit(1);
  });
