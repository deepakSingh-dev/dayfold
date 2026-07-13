'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Round completion checkbox used on task rows and in the peek. Dependency-free
 * (a styled button) so it's easy to size and color.
 */
export function TaskCheckbox({
  checked,
  onChange,
  className,
  size = 'md',
  label = 'Toggle complete',
}) {
  const sizes = { sm: 'size-4', md: 'size-5' };
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.(!checked);
      }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border transition-colors',
        sizes[size],
        checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-muted-foreground/40 hover:border-primary text-transparent',
        className,
      )}
    >
      <Check className="size-3" strokeWidth={3} />
    </button>
  );
}
