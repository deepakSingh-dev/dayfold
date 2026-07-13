'use client';

import { MoreHorizontal, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { TaskCheckbox } from '@/components/ui/task-checkbox';
import { DueChip, PriorityBadge, SubtaskCounter } from '@/components/tasks/task-chips';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** One task row in the List view. */
export function TaskRow({ task, onToggle, onOpen, onDelete }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(task.id);
      }}
      className="border-border/60 hover:bg-accent/40 group flex items-center gap-2 border-b px-2 py-1.5"
    >
      <TaskCheckbox
        checked={task.completed}
        onChange={(v) => onToggle(task, v)}
        label={`Mark “${task.title}” ${task.completed ? 'incomplete' : 'complete'}`}
      />

      <span
        className={cn(
          'flex-1 truncate text-sm',
          task.completed && 'text-muted-foreground line-through',
        )}
      >
        {task.title}
      </span>

      <div className="flex items-center gap-1.5">
        <SubtaskCounter total={task.subtaskTotal} done={task.subtaskDone} />
        <PriorityBadge priority={task.priority} />
        <DueChip dueDate={task.dueDate} completed={task.completed} />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Task actions"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:bg-accent rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            onSelect={() => onDelete(task.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
