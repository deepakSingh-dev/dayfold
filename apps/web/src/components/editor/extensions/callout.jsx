'use client';

import { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

const EMOJIS = ['💡', '📌', '⚠️', '✅', '❓', '🔥', '📝', '🚀', '❤️', '🎯'];

function CalloutView({ node, updateAttributes, editor }) {
  const [open, setOpen] = useState(false);
  const emoji = node.attrs.emoji || '💡';
  const editable = editor.isEditable;

  return (
    <NodeViewWrapper className="df-callout" data-type="callout">
      <div className="df-callout-emoji" contentEditable={false}>
        <button
          type="button"
          onClick={() => editable && setOpen((o) => !o)}
          className="df-callout-emoji-btn"
          aria-label="Change icon"
        >
          {emoji}
        </button>
        {open && (
          <div className="df-emoji-pop">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  updateAttributes({ emoji: e });
                  setOpen(false);
                }}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
      <NodeViewContent className="df-callout-content" />
    </NodeViewWrapper>
  );
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'paragraph+',
  defining: true,

  addAttributes() {
    return {
      emoji: {
        default: '💡',
        parseHTML: (el) => el.getAttribute('data-emoji') || '💡',
        renderHTML: (attrs) => ({ 'data-emoji': attrs.emoji }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },

  addCommands() {
    return {
      setCallout:
        () =>
        ({ commands }) =>
          commands.wrapIn(this.name),
      toggleCallout:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    };
  },
});
