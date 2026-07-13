import { cn } from '@/lib/utils';

/** The Dayfold text wordmark. `size` picks a couple of preset scales. */
export function Wordmark({ className, size = 'md' }) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };
  return (
    <span className={cn('font-bold tracking-tight', sizes[size], className)}>
      Day<span className="text-primary">fold</span>
    </span>
  );
}
