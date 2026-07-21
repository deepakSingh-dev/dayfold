'use client';

import './editor.css';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import Collaboration from '@tiptap/extension-collaboration';
import { common, createLowlight } from 'lowlight';
import { toast } from 'sonner';

import { api, queryKeys } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { CodeBlock } from '@/components/editor/extensions/code-block';
import { Callout } from '@/components/editor/extensions/callout';
import { Toggle } from '@/components/editor/extensions/toggle';
import { PageLink } from '@/components/editor/extensions/page-link';
import { TaskBlock } from '@/components/editor/extensions/task-block';
import { SlashCommand } from '@/components/editor/extensions/slash-command';
import { EditorBubbleMenu } from '@/components/editor/bubble-menu';
import { TurnIntoTaskDialog } from '@/components/editor/turn-into-task-dialog';
import { acquireProvider, releaseProvider } from '@/components/editor/y-provider';
import {
  createSlashRenderer,
  filterSlashItems,
  getSlashItems,
} from '@/components/editor/slash-menu';

const lowlight = createLowlight(common);

/** Small colored avatars for everyone currently connected to the doc. */
function PresenceAvatars({ provider }) {
  const [peers, setPeers] = useState([]);
  useEffect(() => {
    if (!provider) return undefined;
    const aw = provider.awareness;
    const update = () => {
      const seen = new Map();
      for (const state of aw.getStates().values()) {
        if (state.user) seen.set(`${state.user.name}:${state.user.color}`, state.user);
      }
      setPeers(Array.from(seen.values()));
    };
    aw.on('change', update);
    update();
    return () => aw.off('change', update);
  }, [provider]);

  // Always render the container (never null) so appearing avatars don't force a
  // DOM insertBefore against the editor's ProseMirror-owned tree.
  return (
    <div className="mb-2 flex min-h-[1.5rem] items-center gap-1">
      {peers.length > 1 &&
        peers.map((u) => (
          <span
            key={`${u.name}:${u.color}`}
            title={u.name}
            className="ring-card flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2"
            style={{ backgroundColor: u.color }}
          >
            {(u.name || '?').slice(0, 1).toUpperCase()}
          </span>
        ))}
    </div>
  );
}

function EditorSurface({ sync, onCreateSubPage, sourcePageId }) {
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const openImagePicker = useCallback(() => fileInputRef.current?.click(), []);
  const docId = sync.room.replace('doc:', '');
  const [taskDialog, setTaskDialog] = useState(null);

  // Toggle the real task when a task-block checkbox is clicked.
  const onToggleTask = useCallback(
    (taskId, completed) => {
      if (!taskId) return;
      api
        .updateTask(taskId, { completed })
        .then(() => {
          qc.invalidateQueries({ queryKey: queryKeys.myTasks });
          qc.invalidateQueries({ queryKey: ['project-data'] });
        })
        .catch((err) => toast.error(err.message || 'Could not update task'));
    },
    [qc],
  );

  // One stable provider + doc per room (StrictMode-safe, ref-counted).
  const { ydoc, provider } = useMemo(
    () =>
      acquireProvider({
        room: sync.room,
        wsUrl: sync.wsUrl,
        token: sync.token,
        user: sync.user,
      }),
    [sync.room, sync.wsUrl, sync.token, sync.user],
  );

  useEffect(() => () => releaseProvider(sync.room), [sync.room]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // History is provided by Collaboration; disable StarterKit's.
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false, history: false }),
      Placeholder.configure({ placeholder: "Type '/' for blocks, or just start writing…" }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ inline: false }),
      CodeBlock.configure({ lowlight }),
      Callout,
      Toggle,
      PageLink,
      TaskBlock.configure({ onToggle: onToggleTask }),
      SlashCommand.configure({
        suggestion: {
          items: ({ query }) =>
            filterSlashItems(getSlashItems({ onImage: openImagePicker, onCreateSubPage }), query),
          render: createSlashRenderer(),
        },
      }),
      Collaboration.configure({ document: ydoc }),
    ],
    editorProps: { attributes: { class: 'df-prose' } },
  });

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

  // "Turn into → Task": capture the current block's text + range, open picker.
  function onTurnIntoTask() {
    if (!editor) return;
    const { $from } = editor.state.selection;
    const depth = $from.depth;
    const from = $from.before(depth);
    const to = $from.after(depth);
    const text = ($from.node(depth)?.textContent || '').trim() || 'New task';
    setTaskDialog({ text, from, to });
  }

  async function confirmTurnIntoTask({ projectId, sectionId }) {
    if (!editor || !taskDialog) return;
    const blockId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `blk-${Date.now()}`;
    try {
      const { task } = await api.createTaskBlock({
        docId,
        blockId,
        projectId,
        sectionId,
        title: taskDialog.text,
        sourcePageId: sourcePageId ?? null,
      });
      editor
        .chain()
        .focus()
        .insertContentAt(
          { from: taskDialog.from, to: taskDialog.to },
          {
            type: 'taskBlock',
            attrs: { blockId, taskId: task.id, title: taskDialog.text, completed: false },
          },
        )
        .run();
      qc.invalidateQueries({ queryKey: queryKeys.projectData(projectId) });
      qc.invalidateQueries({ queryKey: queryKeys.myTasks });
      toast.success('Task created');
    } catch (err) {
      toast.error(err.message || 'Could not create task');
    }
  }

  return (
    <div>
      <PresenceAvatars provider={provider} />
      {editor && <EditorBubbleMenu editor={editor} onTurnIntoTask={onTurnIntoTask} />}
      <EditorContent editor={editor} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <TurnIntoTaskDialog
        open={Boolean(taskDialog)}
        onOpenChange={(o) => !o && setTaskDialog(null)}
        title={taskDialog?.text ?? ''}
        onConfirm={confirmTurnIntoTask}
      />
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className={cn('space-y-2')}>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/** Mounts the collaborative editor for a given doc id. */
export function BlockEditor({ docId, onCreateSubPage, sourcePageId }) {
  const { data: sync } = useQuery({
    queryKey: ['sync-token', docId],
    queryFn: () => api.syncToken(docId),
    enabled: Boolean(docId),
    staleTime: 50 * 60 * 1000,
  });
  if (!sync) return <EditorSkeleton />;
  return (
    <EditorSurface
      key={docId}
      sync={sync}
      onCreateSubPage={onCreateSubPage}
      sourcePageId={sourcePageId}
    />
  );
}

/** Resolves a task's description doc (lazily created), then mounts the editor. */
export function TaskDescriptionEditor({ taskId }) {
  const { data: doc } = useQuery({
    queryKey: ['task-doc', taskId],
    queryFn: () => api.getTaskDoc(taskId),
    enabled: Boolean(taskId),
  });
  if (!doc) return <EditorSkeleton />;
  return <BlockEditor docId={doc.docId} />;
}
