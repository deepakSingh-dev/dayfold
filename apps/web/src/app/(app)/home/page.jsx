import Link from 'next/link';
import { FolderKanban, FileText } from 'lucide-react';

import {
  getActiveWorkspace,
  getSession,
  getWorkspacePages,
  getWorkspaceProjects,
} from '@/lib/session';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = { title: 'Home · Dayfold' };

export default async function HomePage() {
  const session = await getSession();
  const workspace = await getActiveWorkspace(session.user.id);
  const [projects, pages] = await Promise.all([
    getWorkspaceProjects(workspace.id),
    getWorkspacePages(workspace.id),
  ]);

  const firstName = (session.user.name || 'there').split(' ')[0];

  return (
    <>
      <PageHeader title="Home" />
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
        <div>
          <h2 className="text-2xl font-semibold">Good to see you, {firstName} 👋</h2>
          <p className="text-muted-foreground mt-1">
            This is <span className="text-foreground font-medium">{workspace.name}</span>. Jump back
            into your projects or notes.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-md">
                <FolderKanban className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{projects.length}</p>
                <p className="text-muted-foreground text-sm">
                  {projects.length === 1 ? 'Project' : 'Projects'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-md">
                <FileText className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{pages.length}</p>
                <p className="text-muted-foreground text-sm">
                  {pages.length === 1 ? 'Note' : 'Notes'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {projects.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
              Your projects
            </h3>
            <div className="flex flex-col gap-1">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="border-border hover:bg-accent/60 flex items-center gap-3 rounded-md border px-4 py-3 transition-colors"
                >
                  <span className="text-lg">{p.icon || '📁'}</span>
                  <span className="font-medium">{p.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
