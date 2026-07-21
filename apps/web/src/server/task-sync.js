import { eq } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { env } from '@/lib/env';

/** POST an update to the sync service's internal task-block endpoint. */
async function callSync(docId, payload) {
  try {
    await fetch(`${env.SYNC_INTERNAL_URL}/internal/docs/${docId}/update-task-block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sync-secret': env.SYNC_SHARED_SECRET },
      body: JSON.stringify(payload),
      // Never let a sync hiccup block the task mutation.
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.error('[task-sync] push failed:', err?.message ?? err);
  }
}

/**
 * Push a task change (title/completed) into every doc that embeds it as a
 * task-block, so open editors update live. No-op if the task isn't linked.
 */
export async function pushTaskBlockUpdate(taskId, update) {
  const links = await db.query.taskDocLinks.findMany({
    where: eq(schema.taskDocLinks.taskId, taskId),
  });
  await Promise.all(links.map((l) => callSync(l.docId, { blockId: l.blockId, ...update })));
}

/**
 * On task deletion: degrade every embedded block to "(task deleted)" and drop
 * the link rows.
 */
export async function degradeTaskBlocks(taskId) {
  const links = await db.query.taskDocLinks.findMany({
    where: eq(schema.taskDocLinks.taskId, taskId),
  });
  await Promise.all(links.map((l) => callSync(l.docId, { blockId: l.blockId, deleted: true })));
  if (links.length) {
    await db.delete(schema.taskDocLinks).where(eq(schema.taskDocLinks.taskId, taskId));
  }
}
