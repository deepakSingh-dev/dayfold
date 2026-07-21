import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import { updateTaskBlockInFragment } from './task-block.js';

/** Builds a fragment with a taskBlock (optionally nested) for testing. */
function makeDoc({ nested = false } = {}) {
  const doc = new Y.Doc();
  const frag = doc.getXmlFragment('default');

  const para = new Y.XmlElement('paragraph');
  const task = new Y.XmlElement('taskBlock');
  task.setAttribute('blockId', 'b1');
  task.setAttribute('taskId', 't1');
  task.setAttribute('title', 'Original');
  task.setAttribute('completed', false);

  if (nested) {
    const wrapper = new Y.XmlElement('toggle');
    wrapper.insert(0, [task]);
    frag.insert(0, [para, wrapper]);
  } else {
    frag.insert(0, [para, task]);
  }
  return { doc, frag };
}

describe('updateTaskBlockInFragment', () => {
  it('marks a block completed', () => {
    const { doc, frag } = makeDoc();
    const found = updateTaskBlockInFragment(frag, { blockId: 'b1', completed: true });
    expect(found).toBe(true);
    const block = frag.toArray().find((n) => n.nodeName === 'taskBlock');
    expect(block.getAttribute('completed')).toBe(true);
    doc.destroy();
  });

  it('renames a block', () => {
    const { frag } = makeDoc();
    updateTaskBlockInFragment(frag, { blockId: 'b1', title: 'Renamed' });
    const block = frag.toArray().find((n) => n.nodeName === 'taskBlock');
    expect(block.getAttribute('title')).toBe('Renamed');
  });

  it('degrades a deleted block', () => {
    const { frag } = makeDoc();
    updateTaskBlockInFragment(frag, { blockId: 'b1', deleted: true });
    const block = frag.toArray().find((n) => n.nodeName === 'taskBlock');
    expect(block.getAttribute('deleted')).toBe(true);
    expect(block.getAttribute('taskId')).toBeNull();
  });

  it('finds a nested block', () => {
    const { frag } = makeDoc({ nested: true });
    const found = updateTaskBlockInFragment(frag, { blockId: 'b1', completed: true });
    expect(found).toBe(true);
  });

  it('returns false for an unknown block', () => {
    const { frag } = makeDoc();
    expect(updateTaskBlockInFragment(frag, { blockId: 'nope', completed: true })).toBe(false);
  });
});
