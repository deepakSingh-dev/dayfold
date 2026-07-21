import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Gives every block node a stable `id` attribute (rendered as data-id). New or
 * duplicated nodes get a fresh uuid via an appendTransaction. This powers the
 * Phase 7 "turn into task" two-way sync, which addresses blocks by id.
 */
const BLOCK_TYPES = [
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'taskList',
  'taskItem',
  'blockquote',
  'codeBlock',
  'horizontalRule',
  'image',
  'callout',
];

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`;

export const UniqueId = Extension.create({
  name: 'uniqueId',

  addOptions() {
    return { types: BLOCK_TYPES, attributeName: 'id' };
  },

  addGlobalAttributes() {
    const attr = this.options.attributeName;
    return [
      {
        types: this.options.types,
        attributes: {
          [attr]: {
            default: null,
            parseHTML: (el) => el.getAttribute(`data-${attr}`),
            renderHTML: (attrs) => (attrs[attr] ? { [`data-${attr}`]: attrs[attr] } : {}),
            keepOnSplit: false,
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    const { types, attributeName } = this.options;
    return [
      new Plugin({
        key: new PluginKey('uniqueId'),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((t) => t.docChanged)) return null;
          const tr = newState.tr;
          const seen = new Set();
          let modified = false;
          newState.doc.descendants((node, pos) => {
            if (!types.includes(node.type.name)) return;
            const id = node.attrs[attributeName];
            if (id == null || seen.has(id)) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, [attributeName]: newId() });
              modified = true;
            } else {
              seen.add(id);
            }
          });
          return modified ? tr : null;
        },
      }),
    ];
  },
});
