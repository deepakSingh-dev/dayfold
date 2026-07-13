'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const COLORS = [
  '#8b5cf6',
  '#6366f1',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#84cc16',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#64748b',
  '#14b8a6',
];
const ICONS = [
  '🚀',
  '📋',
  '🎯',
  '💡',
  '📊',
  '🛠️',
  '📝',
  '🎨',
  '🔥',
  '⭐',
  '📁',
  '🧩',
  '🌱',
  '📦',
  '🏆',
  '💼',
];

/**
 * Create or edit a project. Controlled via `open`/`onOpenChange`. On create it
 * navigates to the new project; both modes refresh the server-rendered sidebar.
 */
export function ProjectDialog({ open, onOpenChange, mode = 'create', project }) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICONS[0]);
  const [saving, setSaving] = useState(false);

  // Seed fields when opening.
  useEffect(() => {
    if (!open) return;
    setName(isEdit ? (project?.name ?? '') : '');
    setColor(isEdit ? (project?.color ?? COLORS[0]) : COLORS[0]);
    setIcon(isEdit ? (project?.icon ?? ICONS[0]) : ICONS[0]);
  }, [open, isEdit, project]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await api.updateProject(project.id, { name: name.trim(), color, icon });
        toast.success('Project updated');
        router.refresh();
      } else {
        const { project: created } = await api.createProject({ name: name.trim(), color, icon });
        toast.success('Project created');
        router.refresh();
        router.push(`/projects/${created.id}`);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit project' : 'New project'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the name, color, and icon.' : 'Give your project a name and a look.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-end gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-md text-xl"
              style={{ backgroundColor: `${color}22` }}
            >
              {icon}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marketing site"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={cn(
                    'ring-offset-card size-6 rounded-full ring-offset-2 transition',
                    color === c && 'ring-ring ring-2',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setIcon(em)}
                  className={cn(
                    'hover:bg-accent flex size-8 items-center justify-center rounded-md text-lg transition',
                    icon === em && 'bg-accent ring-ring ring-1',
                  )}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {isEdit ? 'Save' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
