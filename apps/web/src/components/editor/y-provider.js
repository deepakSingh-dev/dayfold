'use client';

import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { IndexeddbPersistence } from 'y-indexeddb';

/**
 * Room-keyed cache of Yjs doc + Hocuspocus provider + IndexedDB persistence.
 * Ensures exactly one provider/doc per room even under React StrictMode's
 * mount→unmount→remount, so the editor always binds to the doc the provider
 * actually syncs. Ref-counted; destroy is deferred so a StrictMode remount can
 * re-acquire before teardown.
 */
const cache = new Map();

export function acquireProvider({ room, wsUrl, token, user }) {
  let entry = cache.get(room);
  if (!entry) {
    const ydoc = new Y.Doc();
    const idb = new IndexeddbPersistence(room, ydoc);
    const provider = new HocuspocusProvider({ url: wsUrl, name: room, document: ydoc, token });
    // Publish identity for presence once, outside React's render cycle.
    if (user) provider.setAwarenessField('user', user);
    entry = { ydoc, provider, idb, refs: 0 };
    cache.set(room, entry);
  }
  entry.refs += 1;
  return entry;
}

export function releaseProvider(room) {
  const entry = cache.get(room);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs > 0) return;
  setTimeout(() => {
    const e = cache.get(room);
    if (e && e.refs <= 0) {
      e.provider.destroy();
      e.idb.destroy();
      cache.delete(room);
    }
  }, 200);
}
