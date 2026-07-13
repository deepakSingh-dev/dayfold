/**
 * Editor helpers + JSDoc typedefs. The block editor (Tiptap/ProseMirror)
 * serialises documents to a JSON tree; both web and sync reason about snapshots
 * without importing Tiptap. Every block node carries a stable `id` attr (needed
 * for task-block sync).
 */

/**
 * @typedef {Object} ProseMirrorNode
 * @property {string} type
 * @property {Record<string, unknown>} [attrs]
 * @property {ProseMirrorNode[]} [content]
 * @property {Array<{type: string, attrs?: Record<string, unknown>}>} [marks]
 * @property {string} [text]
 */

/**
 * Attributes stored on a `taskBlock` node. `taskId` links back to the real task;
 * `id` is the stable node id used by the two-way sync (task_doc_links).
 * @typedef {Object} TaskBlockAttrs
 * @property {string} id
 * @property {string|null} taskId
 * @property {string} title
 * @property {boolean} completed
 * @property {boolean} [deleted]
 */

/** All block type names supported by the v1 editor. */
export const BLOCK_TYPES = [
  'doc',
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'taskList',
  'taskItem',
  'toggle',
  'blockquote',
  'horizontalRule',
  'codeBlock',
  'callout',
  'image',
  'taskBlock',
  'text',
];

/**
 * Room name convention for a Yjs doc.
 * @param {string} docId
 * @returns {string}
 */
export function docRoomName(docId) {
  return `doc:${docId}`;
}

/** Origin tag applied to Yjs transactions from the server, to guard echo loops. */
export const SERVER_YJS_ORIGIN = 'dayfold-server';
