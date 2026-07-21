'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api, queryKeys } from '@/lib/api';
import { useProjectData } from '@/hooks/use-tasks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const LAST_PROJECT_KEY = 'dayfold:lastProject';

/** Picks a project + section, then creates the linked task on confirm. */
export function TurnIntoTaskDialog({ open, onOpenChange, title, onConfirm }) {
  const projectsQuery = useQuery({ queryKey: queryKeys.projects, queryFn: api.listProjects });
  const projects = useMemo(() => projectsQuery.data?.projects ?? [], [projectsQuery.data]);

  const [projectId, setProjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [saving, setSaving] = useState(false);

  const projectData = useProjectData(projectId);
  const sections = projectData.data?.sections ?? [];

  // Default to the last-used project (or the first).
  useEffect(() => {
    if (!open || projectId || projects.length === 0) return;
    const last = typeof window !== 'undefined' ? localStorage.getItem(LAST_PROJECT_KEY) : null;
    const initial = projects.find((p) => p.id === last)?.id ?? projects[0].id;
    setProjectId(initial);
  }, [open, projects, projectId]);

  async function confirm() {
    if (!projectId) return;
    setSaving(true);
    try {
      if (typeof window !== 'undefined') localStorage.setItem(LAST_PROJECT_KEY, projectId);
      await onConfirm({ projectId, sectionId: sectionId || null });
      onOpenChange(false);
      setSectionId('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Turn into task</DialogTitle>
          <DialogDescription className="truncate">“{title}”</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Project</Label>
            <Select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setSectionId('');
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Section</Label>
            <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              <option value="">No section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={saving || !projectId}>
            Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
