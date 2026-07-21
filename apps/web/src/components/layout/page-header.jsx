import { cn } from '@/lib/utils';

/** Simple top bar used at the head of app pages. */
export function PageHeader({ title, children, className }) {
  return (
    <header
      className={cn(
        'border-border flex h-14 items-center justify-between gap-3 border-b px-6',
        className,
      )}
    >
      <h1 className="truncate text-lg font-semibold">{title}</h1>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </header>
  );
}
