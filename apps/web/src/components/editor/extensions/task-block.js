import { Node, mergeAttributes } from '@tiptap/core';

/**
 * A "turn into task" block: a checkbox + title that stays two-way synced with a
 * real task. Uses a VANILLA NodeView (not React) so it's compatible with Yjs
 * collaboration. `blockId` is the stable id used by task_doc_links + the sync
 * endpoint; `taskId` links to the real task; `deleted` degrades the block.
 */
export const TaskBlock = Node.create({
  name: 'taskBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return { onToggle: null };
  },

  addAttributes() {
    return {
      blockId: { default: null },
      taskId: { default: null },
      title: { default: '' },
      completed: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-completed') === 'true',
        renderHTML: (attrs) => ({ 'data-completed': attrs.completed ? 'true' : 'false' }),
      },
      deleted: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-deleted') === 'true',
        renderHTML: (attrs) => ({ 'data-deleted': attrs.deleted ? 'true' : 'false' }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="task-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'task-block' })];
  },

  addNodeView() {
    const options = this.options;
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div');
      dom.className = 'df-task-block';
      dom.setAttribute('data-type', 'task-block');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'df-task-block-check';

      const title = document.createElement('span');
      title.className = 'df-task-block-title';

      const link = document.createElement('a');
      link.className = 'df-task-block-link';
      link.textContent = 'open task ↗';

      const hint = document.createElement('span');
      hint.className = 'df-task-block-hint';
      hint.textContent = '(task deleted)';

      dom.append(checkbox, title, link, hint);

      const render = (n) => {
        checkbox.checked = Boolean(n.attrs.completed);
        title.textContent = n.attrs.title || 'Untitled task';
        dom.classList.toggle('is-completed', Boolean(n.attrs.completed));
        dom.classList.toggle('is-deleted', Boolean(n.attrs.deleted));
        checkbox.disabled = Boolean(n.attrs.deleted);
        link.style.display = n.attrs.deleted || !n.attrs.taskId ? 'none' : '';
        hint.style.display = n.attrs.deleted ? '' : 'none';
        link.href = n.attrs.taskId ? `/task/${n.attrs.taskId}` : '#';
      };
      render(node);

      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const completed = checkbox.checked;
        // Update the Yjs doc so all clients + persistence reflect it.
        if (typeof getPos === 'function') {
          const pos = getPos();
          editor.view.dispatch(editor.view.state.tr.setNodeAttribute(pos, 'completed', completed));
        }
        // Update the real task (which pushes to any other linked docs).
        options.onToggle?.(node.attrs.taskId, completed);
      });

      // Let clicks on the checkbox/link through; block drag-select of the atom.
      dom.addEventListener('mousedown', (e) => {
        if (e.target === checkbox || e.target === link) e.stopPropagation();
      });

      return {
        dom,
        update(updated) {
          if (updated.type.name !== 'taskBlock') return false;
          // eslint-disable-next-line no-param-reassign
          node = updated;
          render(updated);
          return true;
        },
      };
    };
  },
});
