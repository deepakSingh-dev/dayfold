'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, EyeOff, Plus } from 'lucide-react';

import { api, queryKeys } from '@/lib/api';
import { useTaskMutations } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionGroup } from '@/components/tasks/section-group';

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

export function ListView({ projectId, data, isLoading, onOpenTask }) {
  const qc = useQueryClient();
  const { updateTask, createTask, deleteTask } = useTaskMutations(projectId);
  const [showCompleted, setShowCompleted] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [sectionName, setSectionName] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.projectData(projectId) });

  // Group tasks by section, preserving section order; add a "No section" group last.
  const groups = useMemo(() => {
    if (!data) return [];
    const bySection = new Map();
    for (const s of data.sections) bySection.set(s.id, []);
    const orphans = [];
    for (const t of data.tasks) {
      if (t.sectionId && bySection.has(t.sectionId)) bySection.get(t.sectionId).push(t);
      else orphans.push(t);
    }
    const result = data.sections.map((s) => ({ section: s, tasks: bySection.get(s.id) }));
    if (orphans.length) result.push({ section: null, tasks: orphans });
    return result;
  }, [data]);

  if (isLoading && !data) return <ListSkeleton />;

  const totalTasks = data?.tasks.length ?? 0;

  const onToggle = (task, completed) => updateTask.mutate({ id: task.id, patch: { completed } });
  const onAddTask = (title, sectionId) => createTask.mutate({ projectId, sectionId, title });
  const onDelete = (id) => deleteTask.mutate(id);

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

  return (
    <div className="mx-auto max-w-4xl px-6 py-4">
      <div className="mb-2 flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={() => setShowCompleted((s) => !s)}>
          {showCompleted ? <EyeOff /> : <Eye />}
          {showCompleted ? 'Hide completed' : 'Show completed'}
        </Button>
      </div>

      {totalTasks === 0 && groups.every((g) => g.tasks.length === 0) && (
        <p className="text-muted-foreground px-2 py-6 text-sm">
          No tasks yet. Add one below to get started.
        </p>
      )}

      {groups.map((g) => {
        const visible = showCompleted ? g.tasks : g.tasks.filter((t) => !t.completed);
        return (
          <SectionGroup
            key={g.section?.id ?? 'no-section'}
            section={g.section}
            tasks={visible}
            onToggle={onToggle}
            onOpen={onOpenTask}
            onDelete={onDelete}
            onAddTask={onAddTask}
            onRenameSection={onRenameSection}
            onDeleteSection={onDeleteSection}
          />
        );
      })}

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
