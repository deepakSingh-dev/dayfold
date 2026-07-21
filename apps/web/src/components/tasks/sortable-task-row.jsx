'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { TaskRow } from '@/components/tasks/task-row';

/** A List-view task row made draggable/sortable. A 5px activation distance keeps clicks working. */
export function SortableTaskRow({ task, fields, containerId, onToggle, onOpen, onDelete }) {
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
      <TaskRow
        task={task}
        fields={fields}
        onToggle={onToggle}
        onOpen={onOpen}
        onDelete={onDelete}
      />
    </div>
  );
}
