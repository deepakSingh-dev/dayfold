'use client';

import './editor.css';

import { useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import { common, createLowlight } from 'lowlight';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { CodeBlock } from '@/components/editor/extensions/code-block';
import { Callout } from '@/components/editor/extensions/callout';
import { UniqueId } from '@/components/editor/extensions/unique-id';
import { SlashCommand } from '@/components/editor/extensions/slash-command';
import {
  createSlashRenderer,
  filterSlashItems,
  getSlashItems,
} from '@/components/editor/slash-menu';

const lowlight = createLowlight(common);

function EditorSurface({ docId, initialContent }) {
  const saveTimer = useRef(null);
  const fileInputRef = useRef(null);

  const openImagePicker = useCallback(() => fileInputRef.current?.click(), []);

  const save = useCallback(
    (editor) => {
      api
        .saveDoc(docId, { snapshotJson: editor.getJSON(), snapshotText: editor.getText() })
        .catch((err) => toast.error(err.message || 'Could not save'));
    },
    [docId],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }),
      Placeholder.configure({
        placeholder: "Type '/' for blocks, or just start writing…",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ inline: false }),
      CodeBlock.configure({ lowlight }),
      Callout,
      UniqueId,
      SlashCommand.configure({
        suggestion: {
          items: ({ query }) =>
            filterSlashItems(getSlashItems({ onImage: openImagePicker }), query),
          render: createSlashRenderer(),
        },
      }),
    ],
    content: initialContent,
    editorProps: { attributes: { class: 'df-prose' } },
    onUpdate: ({ editor }) => {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(editor), 800);
    },
  });

  // Flush a pending save when unmounting (e.g. closing the peek).
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        if (editor) save(editor);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { url } = await api.uploadImage(file);
      editor?.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    }
  }

  return (
    <div>
      <EditorContent editor={editor} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}

/** Loads a task's description doc, then mounts the editor on it. */
export function BlockEditor({ taskId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['task-doc', taskId],
    queryFn: () => api.getTaskDoc(taskId),
    enabled: Boolean(taskId),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  return <EditorSurface key={data.docId} docId={data.docId} initialContent={data.snapshot} />;
}
