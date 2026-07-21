'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import { queryKeys } from '@/lib/api';
import { orderBetween } from '@/lib/ordering';
import { useTaskMutations } from '@/hooks/use-tasks';

/** Build columns (one per section + optional "No section" catch-all) from project data. */
export function buildColumns(data) {
  if (!data) return [];
  const bySection = new Map();
  for (const s of data.sections) bySection.set(s.id, []);
  const orphans = [];
  for (const t of data.tasks) {
    if (t.sectionId && bySection.has(t.sectionId)) bySection.get(t.sectionId).push(t);
    else orphans.push(t);
  }
  const cols = data.sections.map((s) => ({ id: s.id, name: s.name, tasks: bySection.get(s.id) }));
  if (orphans.length) cols.push({ id: 'none', name: 'No section', tasks: orphans });
  return cols;
}

/**
 * Multi-container drag engine shared by the Board and List views. Manages a
 * local `columns` copy for smooth dragging, re-syncs from server data when idle,
 * and persists a moved task's new section + fractional sort_order.
 */
export function useColumnsDnd({ data, projectId }) {
  const qc = useQueryClient();
  const mutations = useTaskMutations(projectId);
  const { updateTask } = mutations;

  const [columns, setColumns] = useState(() => buildColumns(data));
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!activeId) setColumns(buildColumns(data));
  }, [data, activeId]);

  const colIds = useMemo(() => columns.map((c) => c.id), [columns]);
  const findContainer = (id) =>
    colIds.includes(id) ? id : columns.find((c) => c.tasks.some((t) => t.id === id))?.id;

  const activeTask = activeId
    ? columns.flatMap((c) => c.tasks).find((t) => t.id === activeId)
    : null;

  function onDragStart(event) {
    setActiveId(event.active.id);
  }

  function onDragOver(event) {
    const { active, over } = event;
    if (!over) return;
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const activeCol = prev.find((c) => c.id === activeContainer);
      const overCol = prev.find((c) => c.id === overContainer);
      if (!activeCol || !overCol) return prev;
      const moved = activeCol.tasks.find((t) => t.id === active.id);
      if (!moved) return prev;

      const overIsColumn = prev.some((c) => c.id === over.id);
      const overIndex = overIsColumn
        ? overCol.tasks.length
        : overCol.tasks.findIndex((t) => t.id === over.id);
      const insertAt = overIndex < 0 ? overCol.tasks.length : overIndex;

      return prev.map((c) => {
        if (c.id === activeContainer)
          return { ...c, tasks: c.tasks.filter((t) => t.id !== active.id) };
        if (c.id === overContainer) {
          const next = [...c.tasks];
          next.splice(insertAt, 0, moved);
          return { ...c, tasks: next };
        }
        return c;
      });
    });
  }

  function onDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = colIds.includes(over.id) ? over.id : findContainer(over.id);
    if (!activeContainer || !overContainer) return;

    let finalCols = columns;
    if (activeContainer === overContainer) {
      const ci = columns.findIndex((c) => c.id === overContainer);
      const col = columns[ci];
      const oldIndex = col.tasks.findIndex((t) => t.id === active.id);
      const overIndex = colIds.includes(over.id)
        ? col.tasks.length - 1
        : col.tasks.findIndex((t) => t.id === over.id);
      if (oldIndex !== overIndex && overIndex >= 0) {
        const newTasks = arrayMove(col.tasks, oldIndex, overIndex);
        finalCols = columns.map((c, i) => (i === ci ? { ...c, tasks: newTasks } : c));
        setColumns(finalCols);
      }
    }

    const destCol = finalCols.find((c) => c.id === overContainer);
    const idx = destCol.tasks.findIndex((t) => t.id === active.id);
    if (idx < 0) return;
    const task = destCol.tasks[idx];
    const sectionId = overContainer === 'none' ? null : overContainer;
    const sortOrder = orderBetween(
      destCol.tasks[idx - 1]?.sortOrder,
      destCol.tasks[idx + 1]?.sortOrder,
    );

    if (task.sectionId === sectionId && String(task.sortOrder) === sortOrder) return;

    updateTask.mutate(
      { id: active.id, patch: { sectionId, sortOrder } },
      { onError: () => setColumns(buildColumns(data)) },
    );
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.projectData(projectId) });
    qc.invalidateQueries({ queryKey: queryKeys.myTasks });
  };

  return {
    columns,
    setColumns,
    activeTask,
    sensors,
    dndHandlers: { onDragStart, onDragOver, onDragEnd },
    mutations,
    invalidate,
  };
}
