'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ReactRenderer } from '@tiptap/react';
import {
  CheckSquare,
  ChevronRight,
  Code2,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Info,
  List,
  ListOrdered,
  Minus,
  Quote,
  Type,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Build the slash-menu items. `onImage` is invoked when the Image item is
 * chosen (it opens a file picker in the editor). Each item's `command` runs the
 * corresponding Tiptap chain.
 */
export function getSlashItems({ onImage, onCreateSubPage }) {
  const items = [
    {
      title: 'Text',
      subtitle: 'Plain paragraph',
      icon: Type,
      terms: ['paragraph', 'text', 'p'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
      title: 'Heading 1',
      subtitle: 'Big section heading',
      icon: Heading1,
      terms: ['h1', 'title', 'heading'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run(),
    },
    {
      title: 'Heading 2',
      subtitle: 'Medium heading',
      icon: Heading2,
      terms: ['h2', 'heading'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run(),
    },
    {
      title: 'Heading 3',
      subtitle: 'Small heading',
      icon: Heading3,
      terms: ['h3', 'heading'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run(),
    },
    {
      title: 'Bulleted list',
      subtitle: 'Simple bullet list',
      icon: List,
      terms: ['bullet', 'unordered', 'ul', 'list'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      title: 'Numbered list',
      subtitle: 'Ordered list',
      icon: ListOrdered,
      terms: ['ordered', 'ol', 'numbered', 'list'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      title: 'Checklist',
      subtitle: 'To-do list with checkboxes',
      icon: CheckSquare,
      terms: ['todo', 'task', 'checkbox', 'check'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
      title: 'Quote',
      subtitle: 'Capture a quote',
      icon: Quote,
      terms: ['blockquote', 'quote'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      title: 'Code block',
      subtitle: 'Code with syntax highlighting',
      icon: Code2,
      terms: ['code', 'snippet', 'pre'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      title: 'Callout',
      subtitle: 'Highlighted note with an icon',
      icon: Info,
      terms: ['callout', 'note', 'aside', 'info'],
      command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setCallout().run(),
    },
    {
      title: 'Toggle',
      subtitle: 'Collapsible section',
      icon: ChevronRight,
      terms: ['toggle', 'collapse', 'accordion', 'details'],
      command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setToggle().run(),
    },
    {
      title: 'Divider',
      subtitle: 'Horizontal rule',
      icon: Minus,
      terms: ['divider', 'hr', 'rule', 'separator'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      title: 'Image',
      subtitle: 'Upload an image',
      icon: ImageIcon,
      terms: ['image', 'photo', 'picture', 'upload'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        onImage?.();
      },
    },
  ];

  if (onCreateSubPage) {
    items.push({
      title: 'Sub-page',
      subtitle: 'Create a nested page',
      icon: FileText,
      terms: ['page', 'subpage', 'sub-page', 'nested'],
      command: async ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        const page = await onCreateSubPage();
        if (page) {
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'pageLink',
              attrs: { pageId: page.id, title: page.title, icon: page.icon },
            })
            .run();
        }
      },
    });
  }

  return items;
}

export function filterSlashItems(items, query) {
  const q = query.toLowerCase().trim();
  if (!q) return items;
  return items.filter(
    (it) => it.title.toLowerCase().includes(q) || it.terms.some((t) => t.includes(q)),
  );
}

const SlashMenuList = forwardRef(function SlashMenuList(props, ref) {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [props.items]);

  const pick = (index) => {
    const item = props.items[index];
    if (item) props.command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (!props.items.length) return false;
      if (event.key === 'ArrowUp') {
        setSelected((s) => (s + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelected((s) => (s + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        pick(selected);
        return true;
      }
      return false;
    },
  }));

  if (!props.items.length) {
    return <div className="df-slash-empty">No blocks found</div>;
  }

  return (
    <div className="df-slash-list">
      {props.items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            type="button"
            key={item.title}
            className={cn('df-slash-item', i === selected && 'is-selected')}
            onMouseEnter={() => setSelected(i)}
            onClick={() => pick(i)}
          >
            <span className="df-slash-icon">
              <Icon className="size-4" />
            </span>
            <span className="df-slash-text">
              <span className="df-slash-title">{item.title}</span>
              <span className="df-slash-sub">{item.subtitle}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});

function positionPopup(popup, clientRect) {
  const rect = clientRect?.();
  if (!rect || !popup) return;
  popup.style.position = 'absolute';
  popup.style.left = `${rect.left + window.scrollX}px`;
  popup.style.top = `${rect.bottom + window.scrollY + 6}px`;
}

/** Suggestion render lifecycle: a body-appended popup rendering the React list. */
export function createSlashRenderer() {
  return () => {
    let component;
    let popup;
    return {
      onStart: (props) => {
        component = new ReactRenderer(SlashMenuList, { props, editor: props.editor });
        popup = document.createElement('div');
        popup.className = 'df-slash-popup';
        document.body.appendChild(popup);
        popup.appendChild(component.element);
        positionPopup(popup, props.clientRect);
      },
      onUpdate: (props) => {
        component?.updateProps(props);
        positionPopup(popup, props.clientRect);
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          popup?.remove();
          return true;
        }
        return component?.ref?.onKeyDown(props) ?? false;
      },
      onExit: () => {
        popup?.remove();
        component?.destroy();
      },
    };
  };
}
