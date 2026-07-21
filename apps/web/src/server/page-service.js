import { and, asc, eq, isNull } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { ApiError } from '@/server/api';

/** A page in the caller's workspace, or throws 404. */
export async function requirePage(pageId, workspaceId, { includeDeleted = false } = {}) {
  const where = includeDeleted
    ? and(eq(schema.pages.id, pageId), eq(schema.pages.workspaceId, workspaceId))
    : and(
        eq(schema.pages.id, pageId),
        eq(schema.pages.workspaceId, workspaceId),
        isNull(schema.pages.deletedAt),
      );
  const page = await db.query.pages.findFirst({ where });
  if (!page) throw new ApiError(404, 'Page not found');
  return page;
}

/** All non-deleted pages for a workspace (flat; the client builds the tree). */
export async function listPages(workspaceId) {
  return db.query.pages.findMany({
    where: and(eq(schema.pages.workspaceId, workspaceId), isNull(schema.pages.deletedAt)),
    orderBy: asc(schema.pages.sortOrder),
    columns: { id: true, parentPageId: true, title: true, icon: true, sortOrder: true },
  });
}

/** Ancestor chain (root → page) for breadcrumbs. */
export async function getBreadcrumbs(page, workspaceId) {
  const chain = [{ id: page.id, title: page.title, icon: page.icon }];
  let current = page;
  const guard = new Set([page.id]);
  while (current.parentPageId && !guard.has(current.parentPageId)) {
    guard.add(current.parentPageId);
    // eslint-disable-next-line no-await-in-loop
    const parent = await db.query.pages.findFirst({
      where: and(
        eq(schema.pages.id, current.parentPageId),
        eq(schema.pages.workspaceId, workspaceId),
      ),
      columns: { id: true, parentPageId: true, title: true, icon: true },
    });
    if (!parent) break;
    chain.unshift({ id: parent.id, title: parent.title, icon: parent.icon });
    current = parent;
  }
  return chain;
}

/** All descendant page ids of a page (inclusive), for delete/restore. */
export async function collectDescendantIds(rootId, workspaceId) {
  const all = await db.query.pages.findMany({
    where: eq(schema.pages.workspaceId, workspaceId),
    columns: { id: true, parentPageId: true },
  });
  const byParent = new Map();
  for (const p of all) {
    if (!byParent.has(p.parentPageId)) byParent.set(p.parentPageId, []);
    byParent.get(p.parentPageId).push(p.id);
  }
  const ids = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop();
    ids.push(id);
    for (const child of byParent.get(id) ?? []) stack.push(child);
  }
  return ids;
}
