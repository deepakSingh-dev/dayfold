'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Archive,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Home,
  LogOut,
  Plus,
  Trash2,
} from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Wordmark } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { ProjectDialog } from '@/components/projects/project-dialog';

function NavLink({ href, icon: Icon, label, active }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-sidebar-foreground hover:bg-accent/60',
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SectionHeading({ children, action }) {
  return (
    <div className="flex items-center justify-between px-2 pb-1 pt-4">
      <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
        {children}
      </span>
      {action}
    </div>
  );
}

function ProjectLink({ project, active }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-sidebar-foreground hover:bg-accent/60',
      )}
    >
      <span className="text-base leading-none">{project.icon || '📁'}</span>
      <span className="truncate">{project.name}</span>
    </Link>
  );
}

/**
 * Left app-shell sidebar. Receives already-loaded, serializable data from the
 * (app) layout server component.
 */
export function Sidebar({ user, workspace, projects, archivedProjects = [], pages }) {
  const pathname = usePathname();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  async function onLogout() {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  const initials =
    (user?.name || user?.email || '?')
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return (
    <>
      <ProjectDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
      <aside className="border-border bg-sidebar flex h-screen w-64 shrink-0 flex-col border-r">
        {/* Brand + workspace switcher (stub) */}
        <div className="flex flex-col gap-2 p-3">
          <Link href="/home" className="px-1">
            <Wordmark size="sm" />
          </Link>
          <button
            type="button"
            className="border-border bg-background/50 hover:bg-accent/60 flex items-center justify-between rounded-md border px-2 py-1.5 text-sm"
            title="Workspace switching arrives with teams"
          >
            <span className="truncate font-medium">{workspace?.name ?? 'Workspace'}</span>
            <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="flex flex-col gap-0.5">
            <NavLink href="/home" icon={Home} label="Home" active={pathname === '/home'} />
            <NavLink
              href="/my-tasks"
              icon={CheckSquare}
              label="My Tasks"
              active={pathname.startsWith('/my-tasks')}
            />
          </div>

          <SectionHeading
            action={
              <button
                type="button"
                aria-label="New project"
                title="New project"
                onClick={() => setCreateOpen(true)}
                className="text-muted-foreground hover:bg-accent hover:text-foreground rounded p-0.5"
              >
                <Plus className="size-4" />
              </button>
            }
          >
            Projects
          </SectionHeading>
          <div className="flex flex-col gap-0.5">
            {projects.length === 0 && (
              <p className="text-muted-foreground px-2 py-1 text-sm">No projects yet</p>
            )}
            {projects.map((p) => (
              <ProjectLink
                key={p.id}
                project={p}
                active={pathname.startsWith(`/projects/${p.id}`)}
              />
            ))}
          </div>

          {archivedProjects.length > 0 && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setShowArchived((s) => !s)}
                className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1 px-2 py-1 text-xs font-medium"
              >
                {showArchived ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
                <Archive className="size-3.5" />
                Archived ({archivedProjects.length})
              </button>
              {showArchived && (
                <div className="flex flex-col gap-0.5">
                  {archivedProjects.map((p) => (
                    <ProjectLink
                      key={p.id}
                      project={p}
                      active={pathname.startsWith(`/projects/${p.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <SectionHeading>Notes</SectionHeading>
          <div className="flex flex-col gap-0.5">
            {pages.length === 0 && (
              <p className="text-muted-foreground px-2 py-1 text-sm">No pages yet</p>
            )}
            {pages.map((page) => {
              const active = pathname.startsWith(`/notes/${page.id}`);
              return (
                <Link
                  key={page.id}
                  href={`/notes/${page.id}`}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    active
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-accent/60',
                  )}
                >
                  <span className="text-base leading-none">{page.icon || '📄'}</span>
                  <span className="truncate">{page.title}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-0.5">
            <NavLink
              href="/trash"
              icon={Trash2}
              label="Trash"
              active={pathname.startsWith('/trash')}
            />
          </div>
        </nav>

        {/* Footer: user + theme + logout */}
        <div className="border-border flex items-center gap-2 border-t p-3">
          <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Log out"
            title="Log out"
            onClick={onLogout}
          >
            <LogOut />
          </Button>
        </div>
      </aside>
    </>
  );
}
