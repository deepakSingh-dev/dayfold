'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SortableTaskRow } from '@/components/tasks/sortable-task-row';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * A collapsible, droppable section in the List view. `column` is { id, name,
 * tasks } — id "none" is the "No section" catch-all (no rename/delete/add).
 */
export function ListSection({
  column,
  fields,
  onToggle,
  onOpen,
  onDelete,
  onAddTask,
  onRenameSection,
  onDeleteSection,
}) {
  const isCatchAll = column.id === 'none';
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'column' } });

  const [collapsed, setCollapsed] = useState(false);
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
    <div className="mb-4">
      <div className="group/section flex items-center gap-1 px-2 py-1">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? 'Expand section' : 'Collapse section'}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {renaming ? (
          <form onSubmit={submitRename}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={submitRename}
              className="border-input bg-background focus:ring-ring rounded border px-1.5 py-0.5 text-sm font-semibold focus:outline-none focus:ring-2"
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

        {!isCatchAll && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Section actions"
                className="text-muted-foreground hover:bg-accent ml-1 rounded p-0.5 opacity-0 group-hover/section:opacity-100"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
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
          'border-t-border/60 rounded-md border border-t border-transparent',
          isOver && 'border-ring bg-accent/20 border-dashed',
        )}
      >
        {!collapsed && (
          <>
            <SortableContext
              items={column.tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {column.tasks.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  fields={fields}
                  containerId={column.id}
                  onToggle={onToggle}
                  onOpen={onOpen}
                  onDelete={onDelete}
                />
              ))}
            </SortableContext>

            {adding ? (
              <form onSubmit={submitTask} className="flex items-center gap-2 px-2 py-1.5">
                <span className="border-muted-foreground/40 size-5 shrink-0 rounded-full border border-dashed" />
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => {
                    if (!title.trim()) setAdding(false);
                  }}
                  placeholder="Task name, press Enter"
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </form>
            ) : (
              !isCatchAll && (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 px-2 py-1.5 text-sm"
                >
                  <Plus className="size-4" /> Add task
                </button>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
