'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, Paperclip, Trash2, Upload } from 'lucide-react';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskAttachments({ taskId, attachments = [], onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadAttachment(taskId, file);
      onChange?.();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(id) {
    try {
      await api.deleteAttachment(id);
      onChange?.();
    } catch (err) {
      toast.error(err.message || 'Could not delete');
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-medium">Attachments</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload /> {uploading ? 'Uploading…' : 'Add'}
        </Button>
        <input ref={inputRef} type="file" className="hidden" onChange={onFile} />
      </div>

      {attachments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No attachments.</p>
      ) : (
        <div className="space-y-1.5">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="border-border group flex items-center gap-2 rounded-md border p-1.5"
            >
              {a.isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt={a.filename} className="size-10 rounded object-cover" />
              ) : (
                <span className="bg-muted flex size-10 items-center justify-center rounded">
                  <Paperclip className="text-muted-foreground size-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{a.filename}</p>
                <p className="text-muted-foreground text-xs">{formatBytes(a.sizeBytes)}</p>
              </div>
              <a
                href={a.url}
                download={a.filename}
                className="text-muted-foreground hover:bg-accent rounded p-1"
                aria-label="Download"
              >
                <Download className="size-4" />
              </a>
              <button
                type="button"
                onClick={() => onDelete(a.id)}
                aria-label="Delete attachment"
                className="text-muted-foreground hover:bg-accent rounded p-1 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
