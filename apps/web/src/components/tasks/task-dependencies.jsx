'use client';

import { useState } from 'react';
import { Ban, Plus, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Select } from '@/components/ui/select';
import { TaskCheckbox } from '@/components/ui/task-checkbox';

function DepRow({ dep, onRemove }) {
  return (
    <div className="group flex items-center gap-2 px-1 py-1 text-sm">
      <TaskCheckbox
        size="sm"
        checked={dep.completed}
        onChange={() => {}}
        className="pointer-events-none"
      />
      <span
        className={cn('flex-1 truncate', dep.completed && 'text-muted-foreground line-through')}
      >
        {dep.title}
      </span>
      <button
        type="button"
        aria-label="Remove"
        onClick={() => onRemove(dep.depId)}
        className="text-muted-foreground hover:bg-accent rounded p-0.5 opacity-0 group-hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/** "Blocked by" / "Blocking" lists + a picker to add blockers (same project). */
export function TaskDependencies({ taskId, blockedBy, blocking, projectTasks, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false);

  const excluded = new Set([taskId, ...blockedBy.map((d) => d.id), ...blocking.map((d) => d.id)]);
  const candidates = (projectTasks ?? []).filter((t) => !excluded.has(t.id));
  const openBlockers = blockedBy.filter((d) => !d.completed).length;

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <p className="text-muted-foreground text-xs font-medium">Dependencies</p>
        {openBlockers > 0 && (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Ban className="size-3" /> Blocked by {openBlockers}
          </span>
        )}
      </div>

      {blockedBy.length > 0 && (
        <div className="mb-1">
          <p className="text-muted-foreground px-1 text-[11px] uppercase tracking-wide">
            Blocked by
          </p>
          {blockedBy.map((d) => (
            <DepRow key={d.depId} dep={d} onRemove={onRemove} />
          ))}
        </div>
      )}
      {blocking.length > 0 && (
        <div className="mb-1">
          <p className="text-muted-foreground px-1 text-[11px] uppercase tracking-wide">Blocking</p>
          {blocking.map((d) => (
            <DepRow key={d.depId} dep={d} onRemove={onRemove} />
          ))}
        </div>
      )}

      {adding ? (
        <Select
          autoFocus
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onAdd(e.target.value);
            setAdding(false);
          }}
          onBlur={() => setAdding(false)}
        >
          <option value="">Select a blocking task…</option>
          {candidates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </Select>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 px-1 py-1 text-sm"
        >
          <Plus className="size-4" /> Add blocked-by
        </button>
      )}
    </div>
  );
}
