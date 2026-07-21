'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { todayStr } from '@/lib/dates';
import { useTaskMutations } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const PRIORITY_DOT = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-sky-500' };

function ymd(date) {
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60_000).toISOString().slice(0, 10);
}

/** 42 day cells (6 weeks) covering the given month, starting on Sunday. */
function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function TaskChip({ task, onOpen }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      onClick={() => onOpen(task.id)}
      className={cn(
        'flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-xs',
        task.completed ? 'text-muted-foreground line-through' : 'bg-accent/60 hover:bg-accent',
        isDragging && 'opacity-50',
      )}
    >
      {task.priority && (
        <span className={cn('size-1.5 shrink-0 rounded-full', PRIORITY_DOT[task.priority])} />
      )}
      <span className="truncate">{task.title}</span>
    </button>
  );
}

function DayCell({ date, inMonth, isToday, tasks, onOpen, onAdd }) {
  const dateStr = ymd(date);
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group/day border-border flex min-h-[92px] flex-col gap-0.5 border-b border-r p-1',
        !inMonth && 'bg-muted/30 text-muted-foreground',
        isOver && 'bg-accent/40',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-xs',
            isToday &&
              'bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full',
          )}
        >
          {date.getDate()}
        </span>
        <button
          type="button"
          aria-label="Add task"
          onClick={() => onAdd(dateStr)}
          className="text-muted-foreground hover:text-foreground rounded opacity-0 group-hover/day:opacity-100"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {tasks.map((t) => (
          <TaskChip key={t.id} task={t} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

export function CalendarView({ projectId, data, isLoading, onOpenTask }) {
  const { updateTask, createTask } = useTaskMutations(projectId);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const cells = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
  const today = todayStr();

  const byDate = useMemo(() => {
    const map = new Map();
    for (const t of data?.tasks ?? []) {
      if (!t.dueDate) continue;
      if (!map.has(t.dueDate)) map.set(t.dueDate, []);
      map.get(t.dueDate).push(t);
    }
    return map;
  }, [data]);

  if (isLoading && !data) return <Skeleton className="m-6 h-[600px]" />;

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const shift = (delta) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  function onDragEnd(event) {
    const { active, over } = event;
    if (!over) return;
    const task = (data?.tasks ?? []).find((t) => t.id === active.id);
    if (task && task.dueDate !== over.id) {
      updateTask.mutate({ id: active.id, patch: { dueDate: over.id } });
    }
  }

  function onAdd(dateStr) {
    const sectionId = data?.sections?.[0]?.id ?? null;
    createTask.mutate(
      { projectId, sectionId, title: 'New task', dueDate: dateStr },
      { onSuccess: ({ task }) => onOpenTask(task.id) },
    );
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => shift(-1)} aria-label="Previous month">
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="sm" onClick={() => shift(1)} aria-label="Next month">
          <ChevronRight />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const d = new Date();
            setCursor({ year: d.getFullYear(), month: d.getMonth() });
          }}
        >
          Today
        </Button>
        <h2 className="ml-2 text-lg font-semibold">{monthLabel}</h2>
      </div>

      <div className="border-border text-muted-foreground grid grid-cols-7 border-l border-t text-center text-xs font-medium">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="border-border border-b border-r py-1">
            {d}
          </div>
        ))}
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="border-border grid grid-cols-7 border-l">
          {cells.map((date) => (
            <DayCell
              key={ymd(date)}
              date={date}
              inMonth={date.getMonth() === cursor.month}
              isToday={ymd(date) === today}
              tasks={byDate.get(ymd(date)) ?? []}
              onOpen={onOpenTask}
              onAdd={onAdd}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
