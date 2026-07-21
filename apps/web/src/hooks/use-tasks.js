'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api, queryKeys } from '@/lib/api';

/** Loads a project's List/Board payload. */
export function useProjectData(projectId) {
  return useQuery({
    queryKey: queryKeys.projectData(projectId),
    queryFn: () => api.projectData(projectId),
    enabled: Boolean(projectId),
  });
}

/**
 * Task mutations scoped to one project's cache, with optimistic updates +
 * rollback + error toasts. `invalidateExtra` lets callers also refresh
 * cross-cutting views (My Tasks) after settling.
 */
export function useTaskMutations(projectId) {
  const qc = useQueryClient();
  const key = queryKeys.projectData(projectId);

  const settle = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: queryKeys.myTasks });
  };

  const patchCache = (updater) => {
    const previous = qc.getQueryData(key);
    if (previous) {
      qc.setQueryData(key, { ...previous, tasks: updater(previous.tasks) });
    }
    return previous;
  };

  const updateTask = useMutation({
    mutationFn: ({ id, patch }) => api.updateTask(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = patchCache((tasks) =>
        tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error(err.message || 'Could not update task');
    },
    onSettled: settle,
  });

  const createTask = useMutation({
    mutationFn: (body) => api.createTask(body),
    onError: (err) => toast.error(err.message || 'Could not create task'),
    onSettled: settle,
  });

  const deleteTask = useMutation({
    mutationFn: (id) => api.deleteTask(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = patchCache((tasks) => tasks.filter((t) => t.id !== id));
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error(err.message || 'Could not delete task');
    },
    onSuccess: () => toast.success('Task moved to Trash'),
    onSettled: settle,
  });

  return { updateTask, createTask, deleteTask, invalidate: settle };
}
