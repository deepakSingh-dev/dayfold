import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto max-w-xl space-y-6">
        <span className="border-border bg-secondary text-muted-foreground inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
          Phase 0 · Scaffold
        </span>
        <h1 className="text-5xl font-bold tracking-tight">
          Day<span className="text-primary">fold</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          A project management app with Asana&apos;s structure and Notion&apos;s soul. Every task
          opens into a rich block-editor page, with a full nested-pages Notes app alongside.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
        <p className="text-muted-foreground pt-4 text-xs">
          Auth and the app shell land in Phase 1. The links above are placeholders for now.
        </p>
      </div>
    </main>
  );
}
