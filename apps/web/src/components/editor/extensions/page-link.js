import { Node, mergeAttributes } from '@tiptap/core';

/**
 * A Notion-style sub-page link block. Rendered as a plain anchor (no React
 * NodeView) so it stays compatible with Yjs collaboration. Clicking navigates
 * to the child page.
 */
export const PageLink = Node.create({
  name: 'pageLink',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      pageId: { default: null },
      title: { default: 'Untitled' },
      icon: { default: '📄' },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-page-link]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(HTMLAttributes, {
        'data-page-link': '',
        href: `/notes/${node.attrs.pageId}`,
        class: 'df-page-link',
      }),
      `${node.attrs.icon || '📄'}  ${node.attrs.title || 'Untitled'}`,
    ];
  },
});
