import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/session';

export default async function LandingPage() {
  const session = await getSession();
  if (session?.user) redirect('/home');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto max-w-xl space-y-6">
        <span className="border-border bg-secondary text-muted-foreground inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
          Phase 1 · Auth &amp; workspace
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
          Try the demo: <span className="text-foreground">demo@demo.dev</span> /{' '}
          <span className="text-foreground">demo1234</span>
        </p>
      </div>
    </main>
  );
}
