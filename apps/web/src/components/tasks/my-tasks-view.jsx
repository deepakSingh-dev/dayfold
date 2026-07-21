'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api, queryKeys } from '@/lib/api';
import { cn } from '@/lib/utils';
import { isOverdue, isToday } from '@/lib/dates';
import { PageHeader } from '@/components/layout/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskCheckbox } from '@/components/ui/task-checkbox';
import { DueChip, PriorityBadge } from '@/components/tasks/task-chips';
import { TaskPeek } from '@/components/tasks/task-peek';

const GROUP_ORDER = [
  { key: 'overdue', label: 'Overdue', tone: 'text-destructive' },
  { key: 'today', label: 'Today', tone: 'text-foreground' },
  { key: 'upcoming', label: 'Upcoming', tone: 'text-foreground' },
  { key: 'none', label: 'No due date', tone: 'text-muted-foreground' },
];

function bucketOf(task) {
  if (!task.dueDate) return 'none';
  if (isOverdue(task.dueDate)) return 'overdue';
  if (isToday(task.dueDate)) return 'today';
  return 'upcoming';
}

export function MyTasksView() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: queryKeys.myTasks, queryFn: api.myTasks });
  const [openTaskId, setOpenTaskId] = useState(null);

  const complete = useMutation({
    mutationFn: (id) => api.updateTask(id, { completed: true }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.myTasks });
      const previous = qc.getQueryData(queryKeys.myTasks);
      if (previous) {
        qc.setQueryData(queryKeys.myTasks, {
          tasks: previous.tasks.filter((t) => t.id !== id),
        });
      }
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.myTasks, ctx.previous);
      toast.error(err.message || 'Could not complete task');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.myTasks }),
  });

  const groups = useMemo(() => {
    const map = { overdue: [], today: [], upcoming: [], none: [] };
    for (const t of data?.tasks ?? []) map[bucketOf(t)].push(t);
    return map;
  }, [data]);

  const isEmpty = !isLoading && (data?.tasks.length ?? 0) === 0;

  return (
    <>
      <PageHeader title="My Tasks" />
      <div className="mx-auto max-w-3xl px-6 py-6">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        )}

        {isEmpty && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">
              You&apos;re all caught up — no tasks assigned to you. 🎉
            </p>
          </div>
        )}

        {!isLoading &&
          GROUP_ORDER.map(({ key, label, tone }) => {
            const tasks = groups[key];
            if (!tasks.length) return null;
            return (
              <section key={key} className="mb-6">
                <h2 className={cn('mb-1 text-sm font-semibold', tone)}>
                  {label} <span className="text-muted-foreground">· {tasks.length}</span>
                </h2>
                <div className="divide-border/60 border-border divide-y rounded-md border">
                  {tasks.map((t) => (
                    <div
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenTaskId(t.id)}
                      onKeyDown={(e) => e.key === 'Enter' && setOpenTaskId(t.id)}
                      className="hover:bg-accent/40 flex items-center gap-2 px-3 py-2"
                    >
                      <TaskCheckbox checked={false} onChange={() => complete.mutate(t.id)} />
                      <span className="flex-1 truncate text-sm">{t.title}</span>
                      <span className="text-muted-foreground hidden text-xs sm:inline">
                        {t.projectIcon ? `${t.projectIcon} ` : ''}
                        {t.projectName}
                      </span>
                      <PriorityBadge priority={t.priority} />
                      <DueChip dueDate={t.dueDate} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
      </div>

      {openTaskId && (
        <TaskPeek
          taskId={openTaskId}
          onClose={() => setOpenTaskId(null)}
          onOpenTask={setOpenTaskId}
        />
      )}
    </>
  );
}
