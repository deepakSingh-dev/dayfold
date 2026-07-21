'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, X } from 'lucide-react';

import { api, queryKeys } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const OPTION_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b'];
const uid = () => Math.random().toString(36).slice(2, 8);

/** Manage a project's custom field definitions (per project). */
export function FieldsDialog({ open, onOpenChange, projectId }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['fields', projectId],
    queryFn: () => api.listFields(projectId),
    enabled: open,
  });
  const fields = data?.fields ?? [];

  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [options, setOptions] = useState([]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['fields', projectId] });
    qc.invalidateQueries({ queryKey: queryKeys.projectData(projectId) });
  };

  async function addField() {
    if (!name.trim()) return;
    try {
      await api.createField(projectId, {
        name: name.trim(),
        type,
        options: type === 'select' ? options : undefined,
      });
      setName('');
      setType('text');
      setOptions([]);
      refresh();
    } catch (err) {
      toast.error(err.message || 'Could not add field');
    }
  }
  async function removeField(id) {
    try {
      await api.deleteField(id);
      refresh();
    } catch (err) {
      toast.error(err.message || 'Could not delete field');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Custom fields</DialogTitle>
          <DialogDescription>Add fields shown on tasks in this project.</DialogDescription>
        </DialogHeader>

        {fields.length > 0 && (
          <div className="divide-border border-border divide-y rounded-md border">
            {fields.map((f) => (
              <div key={f.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1 truncate font-medium">{f.name}</span>
                <span className="text-muted-foreground text-xs">{f.type}</span>
                <button
                  type="button"
                  aria-label="Delete field"
                  onClick={() => removeField(f.id)}
                  className="text-muted-foreground hover:bg-accent rounded p-1"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-border space-y-3 rounded-md border border-dashed p-3">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>Field name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Status" />
            </div>
            <div className="w-32 space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Select</option>
              </Select>
            </div>
          </div>

          {type === 'select' && (
            <div className="space-y-1.5">
              <Label>Options</Label>
              {options.map((o, i) => (
                <div key={o.id} className="flex items-center gap-2">
                  <span
                    className="size-4 rounded-full"
                    style={{ backgroundColor: o.color }}
                    title={o.color}
                  />
                  <Input
                    value={o.label}
                    onChange={(e) =>
                      setOptions((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                      )
                    }
                    placeholder="Option label"
                  />
                  <button
                    type="button"
                    aria-label="Remove option"
                    onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:bg-accent rounded p-1"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setOptions((prev) => [
                    ...prev,
                    {
                      id: uid(),
                      label: '',
                      color: OPTION_COLORS[prev.length % OPTION_COLORS.length],
                    },
                  ])
                }
              >
                <Plus /> Add option
              </Button>
            </div>
          )}

          <Button
            type="button"
            onClick={addField}
            disabled={
              !name.trim() || (type === 'select' && options.filter((o) => o.label).length === 0)
            }
          >
            Add field
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
