import * as Y from 'yjs';

/**
 * Walks a Yjs XML fragment (the Tiptap doc) to find a `taskBlock` element by its
 * blockId and update its attributes in place. Used by the internal sync endpoint
 * so a task change made elsewhere (board, list) flows into open editor docs.
 *
 * Returns true if a matching block was found.
 */
export function updateTaskBlockInFragment(fragment, { blockId, title, completed, deleted }) {
  let found = false;

  const visit = (node) => {
    if (found || !(node instanceof Y.XmlElement)) return;
    if (node.nodeName === 'taskBlock' && node.getAttribute('blockId') === blockId) {
      if (deleted === true) {
        node.setAttribute('deleted', true);
        node.setAttribute('taskId', null);
      } else {
        if (typeof title === 'string') node.setAttribute('title', title);
        if (typeof completed === 'boolean') node.setAttribute('completed', completed);
      }
      found = true;
      return;
    }
    // Recurse into children.
    for (const child of node.toArray()) visit(child);
  };

  for (const child of fragment.toArray()) visit(child);
  return found;
}

/**
 * Applies the update within a single Yjs transaction tagged with `origin`
 * (so clients can distinguish server-originated changes from user edits).
 */
export function applyTaskBlockUpdate(ydoc, update, origin) {
  const fragment = ydoc.getXmlFragment('default');
  let found = false;
  ydoc.transact(() => {
    found = updateTaskBlockInFragment(fragment, update);
  }, origin);
  return found;
}
