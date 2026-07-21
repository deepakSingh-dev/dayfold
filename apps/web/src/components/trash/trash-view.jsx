'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckSquare, RotateCcw } from 'lucide-react';

import { api, queryKeys } from '@/lib/api';
import { timeAgo } from '@/lib/dates';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function TrashView() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: queryKeys.trash, queryFn: api.trash });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: queryKeys.trash });
    router.refresh();
  };

  const restoreProject = useMutation({
    mutationFn: (id) => api.restoreProject(id),
    onSuccess: () => {
      toast.success('Project restored');
      refresh();
    },
    onError: (err) => toast.error(err.message || 'Could not restore project'),
  });

  const restoreTask = useMutation({
    mutationFn: (id) => api.restoreTask(id),
    onSuccess: () => {
      toast.success('Task restored');
      qc.invalidateQueries({ queryKey: queryKeys.trash });
    },
    onError: (err) => toast.error(err.message || 'Could not restore task'),
  });

  const restorePage = useMutation({
    mutationFn: (id) => api.restorePage(id),
    onSuccess: () => {
      toast.success('Page restored');
      refresh();
      qc.invalidateQueries({ queryKey: queryKeys.pages });
    },
    onError: (err) => toast.error(err.message || 'Could not restore page'),
  });

  const projects = data?.projects ?? [];
  const tasks = data?.tasks ?? [];
  const pages = data?.pages ?? [];
  const isEmpty = !isLoading && projects.length === 0 && tasks.length === 0 && pages.length === 0;

  return (
    <>
      <PageHeader title="Trash" />
      <div className="mx-auto max-w-3xl px-6 py-6">
        <p className="text-muted-foreground mb-4 text-sm">
          Deleted items are kept here for 30 days. Restore anything you need.
        </p>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {isEmpty && (
          <div className="py-16 text-center">
            <p className="text-muted-foreground text-sm">Trash is empty.</p>
          </div>
        )}

        {projects.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-1 text-sm font-semibold">Projects</h2>
            <div className="divide-border/60 border-border divide-y rounded-md border">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="text-lg">{p.icon || '📁'}</span>
                  <span className="flex-1 truncate text-sm">{p.name}</span>
                  <span className="text-muted-foreground hidden text-xs sm:inline">
                    {timeAgo(p.deletedAt)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreProject.mutate(p.id)}
                    disabled={restoreProject.isPending}
                  >
                    <RotateCcw /> Restore
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {pages.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-1 text-sm font-semibold">Pages</h2>
            <div className="divide-border/60 border-border divide-y rounded-md border">
              {pages.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="text-lg">{p.icon || '📄'}</span>
                  <span className="flex-1 truncate text-sm">{p.title}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restorePage.mutate(p.id)}
                    disabled={restorePage.isPending}
                  >
                    <RotateCcw /> Restore
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {tasks.length > 0 && (
          <section>
            <h2 className="mb-1 text-sm font-semibold">Tasks</h2>
            <div className="divide-border/60 border-border divide-y rounded-md border">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2">
                  <CheckSquare className="text-muted-foreground size-4" />
                  <span className="flex-1 truncate text-sm">{t.title}</span>
                  <span className="text-muted-foreground hidden text-xs sm:inline">
                    {t.projectName}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreTask.mutate(t.id)}
                    disabled={restoreTask.isPending}
                  >
                    <RotateCcw /> Restore
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
