'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2, X } from 'lucide-react';

import { api, queryKeys } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useProjectData } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskCheckbox } from '@/components/ui/task-checkbox';
import { BlockEditor } from '@/components/editor/block-editor';

function Field({ label, children }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <div>{children}</div>
    </div>
  );
}

/**
 * Right-hand task side-peek. Fetches its own full task, edits fields with
 * optimistic updates, manages subtasks, and invalidates the list/my-tasks caches
 * so other views stay in sync. Description is a disabled placeholder until Phase 4.
 */
export function TaskPeek({ taskId, onClose, onOpenTask }) {
  const qc = useQueryClient();
  const key = queryKeys.task(taskId);

  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => api.getTask(taskId) });
  const task = data?.task;

  const projectsQuery = useQuery({ queryKey: queryKeys.projects, queryFn: api.listProjects });
  const projectData = useProjectData(task?.projectId);
  const sections = projectData.data?.sections ?? [];

  const [title, setTitle] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const titleRef = useRef(null);

  useEffect(() => {
    if (task) setTitle(task.title);
  }, [task]);

  // Close on Escape; toggle complete on Cmd/Ctrl+Enter.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && task) {
        patch.mutate({ completed: !task.completed });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  const settle = () => {
    qc.invalidateQueries({ queryKey: key });
    if (task?.projectId) {
      qc.invalidateQueries({ queryKey: queryKeys.projectData(task.projectId) });
    }
    qc.invalidateQueries({ queryKey: queryKeys.myTasks });
  };

  const patch = useMutation({
    mutationFn: (body) => api.updateTask(taskId, body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);
      if (previous?.task) {
        qc.setQueryData(key, { task: { ...previous.task, ...body } });
      }
      return { previous };
    },
    onError: (err, _b, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error(err.message || 'Could not update task');
    },
    onSettled: settle,
  });

  const addSubtask = useMutation({
    mutationFn: (t) =>
      api.createTask({ projectId: task.projectId, parentTaskId: taskId, title: t }),
    onError: (err) => toast.error(err.message || 'Could not add subtask'),
    onSettled: settle,
  });
  const updateSubtask = useMutation({
    mutationFn: ({ id, body }) => api.updateTask(id, body),
    onSettled: settle,
  });
  const deleteSubtask = useMutation({
    mutationFn: (id) => api.deleteTask(id),
    onSettled: settle,
  });

  const removeTask = useMutation({
    mutationFn: () => api.deleteTask(taskId),
    onSuccess: () => {
      toast.success('Task moved to Trash');
      settle();
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Could not delete task'),
  });

  function commitTitle() {
    const t = title.trim();
    if (t && t !== task?.title) patch.mutate({ title: t });
    else if (!t) setTitle(task?.title ?? '');
  }

  const subtasks = task?.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.completed).length;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />
      <aside
        className="border-border bg-card fixed right-0 top-0 z-50 flex h-screen w-full min-w-[380px] max-w-[46%] flex-col border-l shadow-xl"
        role="dialog"
        aria-label="Task details"
      >
        <div className="border-border flex items-center justify-between border-b px-4 py-2">
          <span className="text-muted-foreground text-xs">
            {task?.projectName ?? ''}
            {task?.sectionName ? ` · ${task.sectionName}` : ''}
          </span>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X />
          </Button>
        </div>

        {isLoading || !task ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            {/* Title + complete */}
            <div className="flex items-start gap-3">
              <TaskCheckbox
                checked={task.completed}
                onChange={(v) => patch.mutate({ completed: v })}
              />
              <textarea
                ref={titleRef}
                rows={1}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    titleRef.current?.blur();
                  }
                }}
                className={cn(
                  'flex-1 resize-none bg-transparent text-lg font-semibold focus:outline-none',
                  task.completed && 'text-muted-foreground line-through',
                )}
              />
            </div>

            {/* Meta */}
            <div className="space-y-2">
              <Field label="Due date">
                <input
                  type="date"
                  value={task.dueDate ?? ''}
                  onChange={(e) => patch.mutate({ dueDate: e.target.value || null })}
                  className="border-input bg-background focus:ring-ring h-8 rounded-md border px-2 text-sm focus:outline-none focus:ring-2"
                />
              </Field>
              <Field label="Priority">
                <Select
                  value={task.priority ?? ''}
                  onChange={(e) => patch.mutate({ priority: e.target.value || null })}
                >
                  <option value="">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </Field>
              <Field label="Project">
                <Select
                  value={task.projectId}
                  onChange={(e) => patch.mutate({ projectId: e.target.value, sectionId: null })}
                >
                  {(projectsQuery.data?.projects ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Section">
                <Select
                  value={task.sectionId ?? ''}
                  onChange={(e) => patch.mutate({ sectionId: e.target.value || null })}
                >
                  <option value="">No section</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* Description — rich block editor */}
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium">Description</p>
              <div className="border-border rounded-md border p-3">
                <BlockEditor taskId={task.id} />
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-medium">Subtasks</p>
                {subtasks.length > 0 && (
                  <span className="text-muted-foreground text-xs">
                    {doneCount}/{subtasks.length}
                  </span>
                )}
              </div>
              <div className="divide-border/60 border-border divide-y rounded-md border">
                {subtasks.length === 0 && (
                  <p className="text-muted-foreground px-3 py-2 text-sm">No subtasks yet</p>
                )}
                {subtasks.map((s) => (
                  <div key={s.id} className="group flex items-center gap-2 px-3 py-1.5">
                    <TaskCheckbox
                      size="sm"
                      checked={s.completed}
                      onChange={(v) => updateSubtask.mutate({ id: s.id, body: { completed: v } })}
                    />
                    <button
                      type="button"
                      onClick={() => onOpenTask(s.id)}
                      className={cn(
                        'flex-1 truncate text-left text-sm hover:underline',
                        s.completed && 'text-muted-foreground line-through',
                      )}
                    >
                      {s.title}
                    </button>
                    <button
                      type="button"
                      aria-label="Delete subtask"
                      onClick={() => deleteSubtask.mutate(s.id)}
                      className="text-muted-foreground hover:bg-accent rounded p-1 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const t = subtaskTitle.trim();
                    if (!t) return;
                    addSubtask.mutate(t);
                    setSubtaskTitle('');
                  }}
                  className="px-3 py-1.5"
                >
                  <input
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask…"
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                </form>
              </div>
            </div>
          </div>
        )}

        {task && (
          <div className="border-border border-t p-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => removeTask.mutate()}
            >
              <Trash2 /> Delete task
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
