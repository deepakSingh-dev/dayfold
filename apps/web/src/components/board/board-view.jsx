'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';

import { api } from '@/lib/api';
import { useColumnsDnd } from '@/hooks/use-columns-dnd';
import { Skeleton } from '@/components/ui/skeleton';
import { BoardColumn } from '@/components/board/board-column';
import { BoardCardBody } from '@/components/board/board-card';

function BoardSkeleton() {
  return (
    <div className="flex gap-4 p-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-72 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  );
}

export function BoardView({ projectId, data, isLoading, onOpenTask }) {
  const { columns, activeTask, sensors, dndHandlers, mutations, invalidate } = useColumnsDnd({
    data,
    projectId,
  });
  const [addingSection, setAddingSection] = useState(false);
  const [sectionName, setSectionName] = useState('');

  const onToggle = (t, completed) =>
    mutations.updateTask.mutate({ id: t.id, patch: { completed } });
  const onAddTask = (title, sectionId) =>
    mutations.createTask.mutate({ projectId, sectionId, title });

  async function onRenameSection(id, name) {
    try {
      await api.updateSection(id, { name });
      invalidate();
    } catch (err) {
      toast.error(err.message || 'Could not rename section');
    }
  }
  async function onDeleteSection(id) {
    if (!confirm('Delete this section? Its tasks move to “No section”.')) return;
    try {
      await api.deleteSection(id);
      invalidate();
      toast.success('Section deleted');
    } catch (err) {
      toast.error(err.message || 'Could not delete section');
    }
  }
  async function onAddSection(e) {
    e.preventDefault();
    const name = sectionName.trim();
    if (!name) {
      setAddingSection(false);
      return;
    }
    try {
      await api.createSection({ projectId, name });
      setSectionName('');
      setAddingSection(false);
      invalidate();
    } catch (err) {
      toast.error(err.message || 'Could not add section');
    }
  }

  if (isLoading && !data) return <BoardSkeleton />;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} {...dndHandlers}>
      <div className="flex h-full items-start gap-4 overflow-x-auto p-6">
        {columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            onToggle={onToggle}
            onOpen={onOpenTask}
            onAddTask={onAddTask}
            onRenameSection={onRenameSection}
            onDeleteSection={onDeleteSection}
          />
        ))}

        <div className="w-72 shrink-0">
          {addingSection ? (
            <form onSubmit={onAddSection} className="px-1">
              <input
                autoFocus
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                onBlur={onAddSection}
                placeholder="Section name, press Enter"
                className="border-input bg-background focus:ring-ring w-full rounded-md border px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingSection(true)}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm"
            >
              <Plus className="size-4" /> Add section
            </button>
          )}
        </div>
      </div>

      <DragOverlay>{activeTask ? <BoardCardBody task={activeTask} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}
