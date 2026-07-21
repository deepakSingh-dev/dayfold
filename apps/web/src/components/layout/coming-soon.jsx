/** Friendly placeholder for surfaces delivered in a later phase. */
export function ComingSoon({ title, phase, children }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        {children ?? 'This part of Dayfold is on the way.'}
      </p>
      {phase && (
        <span className="border-border bg-secondary text-muted-foreground mt-1 rounded-full border px-3 py-1 text-xs">
          Coming in {phase}
        </span>
      )}
    </div>
  );
}
