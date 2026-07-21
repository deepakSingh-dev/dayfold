'use client';

import { useEffect, useReducer, useState } from 'react';
import { BubbleMenu } from '@tiptap/react';
import { Bold, ChevronDown, Code, Italic, Strikethrough } from 'lucide-react';

import { cn } from '@/lib/utils';

const TURN_INTO = [
  { label: 'Text', run: (c) => c.setParagraph() },
  { label: 'Heading 1', run: (c) => c.toggleHeading({ level: 1 }) },
  { label: 'Heading 2', run: (c) => c.toggleHeading({ level: 2 }) },
  { label: 'Heading 3', run: (c) => c.toggleHeading({ level: 3 }) },
  { label: 'Bulleted list', run: (c) => c.toggleBulletList() },
  { label: 'Numbered list', run: (c) => c.toggleOrderedList() },
  { label: 'Checklist', run: (c) => c.toggleTaskList() },
  { label: 'Quote', run: (c) => c.toggleBlockquote() },
  { label: 'Code block', run: (c) => c.toggleCodeBlock() },
  { label: 'Callout', run: (c) => c.toggleCallout() },
  { label: 'Toggle', run: (c) => c.toggleToggle() },
];

function FormatButton({ active, onClick, label, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn('df-bm-btn', active && 'is-active')}
    >
      {children}
    </button>
  );
}

export function EditorBubbleMenu({ editor, onTurnIntoTask }) {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [turnOpen, setTurnOpen] = useState(false);

  // Re-render on selection/content changes so active states stay accurate.
  useEffect(() => {
    if (!editor) return undefined;
    const update = () => forceUpdate();
    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, onHidden: () => setTurnOpen(false) }}
      shouldShow={({ editor: ed, state }) => {
        const { empty } = state.selection;
        if (empty) return false;
        if (ed.isActive('codeBlock') || ed.isActive('image')) return false;
        return true;
      }}
    >
      <div className="df-bubble">
        <FormatButton
          label="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </FormatButton>
        <FormatButton
          label="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </FormatButton>
        <FormatButton
          label="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </FormatButton>
        <FormatButton
          label="Inline code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="size-4" />
        </FormatButton>

        <span className="df-bm-sep" />

        <div className="df-bm-turn">
          <button
            type="button"
            className="df-bm-btn df-bm-turn-trigger"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setTurnOpen((o) => !o)}
          >
            Turn into <ChevronDown className="size-3.5" />
          </button>
          {turnOpen && (
            <div className="df-bm-menu">
              {TURN_INTO.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    item.run(editor.chain().focus()).run();
                    setTurnOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setTurnOpen(false);
                  onTurnIntoTask?.();
                }}
                disabled={!onTurnIntoTask}
                className={cn('df-bm-task', !onTurnIntoTask && 'is-disabled')}
              >
                ✓ Task
              </button>
            </div>
          )}
        </div>
      </div>
    </BubbleMenu>
  );
}
