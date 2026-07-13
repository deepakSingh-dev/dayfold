'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Archive, ArchiveRestore, List, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { api, queryKeys } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useProjectData } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectDialog } from '@/components/projects/project-dialog';
import { ListView } from '@/components/tasks/list-view';
import { TaskPeek } from '@/components/tasks/task-peek';

function ViewTab({ active, disabled, icon: Icon, children, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? 'Coming in a later phase' : undefined}
      className={cn(
        'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-primary text-foreground'
          : 'text-muted-foreground hover:text-foreground border-transparent',
        disabled && 'hover:text-muted-foreground cursor-not-allowed opacity-40',
      )}
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}

export function ProjectView({ projectId, initialProject }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useProjectData(projectId);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const project = data?.project ?? initialProject;

  async function onArchiveToggle() {
    const next = !project.isArchived;
    try {
      await api.updateProject(projectId, { isArchived: next });
      qc.invalidateQueries({ queryKey: queryKeys.projectData(projectId) });
      router.refresh();
      toast.success(next ? 'Project archived' : 'Project unarchived');
    } catch (err) {
      toast.error(err.message || 'Could not update project');
    }
  }

  async function onDelete() {
    if (!confirm(`Move “${project.name}” to Trash? Its tasks go too.`)) return;
    try {
      await api.deleteProject(projectId);
      toast.success('Project moved to Trash');
      router.refresh();
      router.push('/home');
    } catch (err) {
      toast.error(err.message || 'Could not delete project');
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar: project title + actions */}
      <header className="border-border flex h-14 items-center justify-between gap-3 border-b px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xl leading-none">{project?.icon || '📁'}</span>
          <h1 className="truncate text-lg font-semibold">{project?.name}</h1>
          {project?.isArchived && (
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
              Archived
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Project actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil /> Edit project
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onArchiveToggle}>
              {project?.isArchived ? <ArchiveRestore /> : <Archive />}
              {project?.isArchived ? 'Unarchive' : 'Archive'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 /> Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* View tabs */}
      <div className="border-border flex items-center gap-1 border-b px-4">
        <ViewTab active icon={List}>
          List
        </ViewTab>
        <ViewTab disabled icon={List}>
          Board
        </ViewTab>
        <ViewTab disabled icon={List}>
          Calendar
        </ViewTab>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <ListView
          projectId={projectId}
          data={data}
          isLoading={isLoading}
          onOpenTask={setOpenTaskId}
        />
      </div>

      <ProjectDialog mode="edit" open={editOpen} onOpenChange={setEditOpen} project={project} />

      {openTaskId && (
        <TaskPeek
          taskId={openTaskId}
          onClose={() => setOpenTaskId(null)}
          onOpenTask={setOpenTaskId}
        />
      )}
    </div>
  );
}
