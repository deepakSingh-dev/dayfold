'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { BoardCard } from '@/components/board/board-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** One board column = one section (or the "No section" catch-all, id "none"). */
export function BoardColumn({
  column,
  fields,
  onToggle,
  onOpen,
  onAddTask,
  onRenameSection,
  onDeleteSection,
}) {
  const isCatchAll = column.id === 'none';
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column' } });

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(column.name);

  function submitTask(e) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    onAddTask(t, isCatchAll ? null : column.id);
    setTitle('');
  }
  function submitRename(e) {
    e.preventDefault();
    const n = name.trim();
    if (n && n !== column.name) onRenameSection(column.id, n);
    setRenaming(false);
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      <div className="group/col mb-2 flex items-center gap-1.5 px-1">
        {renaming ? (
          <form onSubmit={submitRename} className="flex-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={submitRename}
              className="border-input bg-background focus:ring-ring w-full rounded border px-1.5 py-0.5 text-sm font-semibold focus:outline-none focus:ring-2"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => !isCatchAll && setRenaming(true)}
            className={cn('text-sm font-semibold', isCatchAll && 'cursor-default')}
          >
            {column.name}
          </button>
        )}
        <span className="text-muted-foreground text-xs">{column.tasks.length}</span>
        <div className="flex-1" />
        {!isCatchAll && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Section actions"
                className="text-muted-foreground hover:bg-accent rounded p-0.5 opacity-0 group-hover/col:opacity-100"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenaming(true)}>Rename</DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onDeleteSection(column.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 /> Delete section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'bg-muted/40 flex flex-1 flex-col gap-2 overflow-y-auto rounded-md border border-transparent p-2',
          isOver && 'border-ring bg-accent/40 border-dashed',
        )}
      >
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <BoardCard
              key={task.id}
              task={task}
              fields={fields}
              containerId={column.id}
              onToggle={onToggle}
              onOpen={onOpen}
            />
          ))}
        </SortableContext>

        {adding ? (
          <form onSubmit={submitTask}>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (!title.trim()) setAdding(false);
              }}
              placeholder="Task name, press Enter"
              className="border-input bg-background focus:ring-ring w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2"
            />
          </form>
        ) : (
          !isCatchAll && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm"
            >
              <Plus className="size-4" /> Add task
            </button>
          )
        )}
      </div>
    </div>
  );
}
