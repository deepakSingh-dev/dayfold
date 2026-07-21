'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Plus } from 'lucide-react';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';

import { api } from '@/lib/api';
import { useColumnsDnd } from '@/hooks/use-columns-dnd';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListSection } from '@/components/tasks/list-section';
import { TaskRow } from '@/components/tasks/task-row';

function ListSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}

const noop = () => {};

export function ListView({ projectId, data, isLoading, onOpenTask }) {
  const { columns, activeTask, sensors, dndHandlers, mutations, invalidate } = useColumnsDnd({
    data,
    projectId,
  });
  const fields = data?.fields ?? [];
  const [showCompleted, setShowCompleted] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [sectionName, setSectionName] = useState('');

  const onToggle = (t, completed) =>
    mutations.updateTask.mutate({ id: t.id, patch: { completed } });
  const onAddTask = (title, sectionId) =>
    mutations.createTask.mutate({ projectId, sectionId, title });
  const onDelete = (id) => mutations.deleteTask.mutate(id);

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

  if (isLoading && !data) return <ListSkeleton />;

  const totalVisible = columns.reduce(
    (n, c) => n + (showCompleted ? c.tasks.length : c.tasks.filter((t) => !t.completed).length),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-4">
      <div className="mb-2 flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={() => setShowCompleted((s) => !s)}>
          {showCompleted ? <EyeOff /> : <Eye />}
          {showCompleted ? 'Hide completed' : 'Show completed'}
        </Button>
      </div>

      {totalVisible === 0 && (
        <p className="text-muted-foreground px-2 py-6 text-sm">
          No tasks yet. Add one below to get started.
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCorners} {...dndHandlers}>
        {columns.map((col) => {
          const visible = showCompleted ? col.tasks : col.tasks.filter((t) => !t.completed);
          return (
            <ListSection
              key={col.id}
              column={{ ...col, tasks: visible }}
              fields={fields}
              onToggle={onToggle}
              onOpen={onOpenTask}
              onDelete={onDelete}
              onAddTask={onAddTask}
              onRenameSection={onRenameSection}
              onDeleteSection={onDeleteSection}
            />
          );
        })}

        <DragOverlay>
          {activeTask ? (
            <div className="border-border bg-card rounded-md border shadow-lg">
              <TaskRow
                task={activeTask}
                fields={fields}
                onToggle={noop}
                onOpen={noop}
                onDelete={noop}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {addingSection ? (
        <form onSubmit={onAddSection} className="px-2">
          <input
            autoFocus
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            onBlur={onAddSection}
            placeholder="Section name, press Enter"
            className="border-input bg-background focus:ring-ring rounded border px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAddingSection(true)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 px-2 py-1.5 text-sm"
        >
          <Plus className="size-4" /> Add section
        </button>
      )}
    </div>
  );
}
