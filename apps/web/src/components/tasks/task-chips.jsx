import { CalendarDays } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatDueLabel, isOverdue } from '@/lib/dates';
import { Badge } from '@/components/ui/badge';

const PRIORITY_STYLES = {
  high: 'bg-red-500/15 text-red-500 dark:text-red-400',
  medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  low: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
};

const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };

export function PriorityBadge({ priority, className }) {
  if (!priority) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium',
        PRIORITY_STYLES[priority],
        className,
      )}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function DueChip({ dueDate, completed, className }) {
  if (!dueDate) return null;
  const overdue = !completed && isOverdue(dueDate);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium',
        overdue ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <CalendarDays className="size-3" />
      {formatDueLabel(dueDate)}
    </span>
  );
}

export function SubtaskCounter({ total, done, className }) {
  if (!total) return null;
  return (
    <Badge variant="muted" className={cn('gap-1', className)}>
      {done}/{total}
    </Badge>
  );
}
