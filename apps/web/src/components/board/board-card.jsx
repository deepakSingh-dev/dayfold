'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/lib/utils';
import { TaskCheckbox } from '@/components/ui/task-checkbox';
import {
  BlockedBadge,
  DueChip,
  FieldBadges,
  PriorityBadge,
  SubtaskCounter,
} from '@/components/tasks/task-chips';

/** Presentational card (also used inside the DragOverlay). */
export function BoardCardBody({ task, fields, onToggle, onOpen, dragging }) {
  return (
    <div
      className={cn(
        'border-border bg-card rounded-md border p-2.5 shadow-sm transition-shadow',
        dragging ? 'ring-ring shadow-lg ring-1' : 'hover:border-muted-foreground/30',
      )}
    >
      <div className="flex items-start gap-2">
        {onToggle && (
          <TaskCheckbox
            size="sm"
            checked={task.completed}
            onChange={(v) => onToggle(task, v)}
            className="mt-0.5"
          />
        )}
        <button
          type="button"
          onClick={() => onOpen?.(task.id)}
          className={cn(
            'flex-1 text-left text-sm',
            task.completed && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-6 empty:mt-0">
        <FieldBadges fields={fields} values={task.fieldValues} />
        <BlockedBadge count={task.blockedBy} />
        <PriorityBadge priority={task.priority} />
        <DueChip dueDate={task.dueDate} completed={task.completed} />
        <SubtaskCounter total={task.subtaskTotal} done={task.subtaskDone} />
      </div>
    </div>
  );
}

/** Sortable wrapper around a board card. */
export function BoardCard({ task, fields, containerId, onToggle, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'card', containerId },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <BoardCardBody task={task} fields={fields} onToggle={onToggle} onOpen={onOpen} />
    </div>
  );
}
