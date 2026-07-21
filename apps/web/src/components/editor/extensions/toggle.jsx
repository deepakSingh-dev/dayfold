'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Collapsible toggle block. The first child is the always-visible summary; the
 * rest collapses. Open/closed is stored on the `open` attr; CSS hides the
 * non-first children when closed.
 */
function ToggleView({ node, updateAttributes }) {
  const open = node.attrs.open;
  return (
    <NodeViewWrapper className={cn('df-toggle', !open && 'is-collapsed')} data-type="toggle">
      <button
        type="button"
        contentEditable={false}
        className="df-toggle-caret"
        aria-label={open ? 'Collapse' : 'Expand'}
        onClick={() => updateAttributes({ open: !open })}
      >
        <ChevronRight className="size-4" style={{ transform: open ? 'rotate(90deg)' : 'none' }} />
      </button>
      <NodeViewContent className="df-toggle-content" />
    </NodeViewWrapper>
  );
}

export const Toggle = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'paragraph block*',
  defining: true,

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (el) => el.getAttribute('data-open') !== 'false',
        renderHTML: (attrs) => ({ 'data-open': attrs.open ? 'true' : 'false' }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="toggle"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleView);
  },

  addCommands() {
    return {
      setToggle:
        () =>
        ({ commands }) =>
          commands.wrapIn(this.name),
      toggleToggle:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    };
  },
});
