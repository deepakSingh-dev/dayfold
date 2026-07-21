'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronRight } from 'lucide-react';

import { api, queryKeys } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { BlockEditor } from '@/components/editor/block-editor';

const ICONS = ['📄', '📝', '📚', '💡', '🗒️', '📌', '🎯', '🚀', '🔖', '🧠', '📓', '⭐'];

function IconPicker({ icon, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="hover:bg-accent rounded-md px-1 text-4xl leading-none"
        aria-label="Change page icon"
      >
        {icon || '📄'}
      </button>
      {open && (
        <div className="border-border bg-popover absolute z-20 mt-1 grid w-max grid-cols-6 gap-1 rounded-md border p-2 shadow-md">
          {ICONS.map((e) => (
            <button
              key={e}
              type="button"
              className="hover:bg-accent rounded p-1 text-xl"
              onClick={() => {
                onChange(e);
                setOpen(false);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function NotesPageView({ pageId }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.page(pageId),
    queryFn: () => api.getPage(pageId),
  });
  const page = data?.page;
  const breadcrumbs = data?.breadcrumbs ?? [];

  const [title, setTitle] = useState('');
  const titleRef = useRef(null);
  useEffect(() => {
    if (page) setTitle(page.title);
  }, [page]);

  async function savePage(patch) {
    try {
      await api.updatePage(pageId, patch);
      qc.invalidateQueries({ queryKey: queryKeys.page(pageId) });
      qc.invalidateQueries({ queryKey: queryKeys.pages });
    } catch (err) {
      toast.error(err.message || 'Could not save');
    }
  }

  async function onCreateSubPage() {
    try {
      const { page: child } = await api.createPage({ parentPageId: pageId });
      qc.invalidateQueries({ queryKey: queryKeys.pages });
      return child;
    } catch (err) {
      toast.error(err.message || 'Could not create sub-page');
      return null;
    }
  }

  if (isLoading || !page) {
    return (
      <div className="mx-auto max-w-3xl px-8 py-10">
        <Skeleton className="mb-4 h-10 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-6">
      {/* Breadcrumbs */}
      <nav className="text-muted-foreground mb-4 flex items-center gap-1 text-sm">
        {breadcrumbs.map((b, i) => (
          <span key={b.id} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5" />}
            {i < breadcrumbs.length - 1 ? (
              <Link href={`/notes/${b.id}`} className="hover:text-foreground truncate">
                {b.icon} {b.title}
              </Link>
            ) : (
              <span className="text-foreground truncate">
                {b.icon} {b.title}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Icon + title */}
      <div className="mb-4 flex items-start gap-2">
        <IconPicker icon={page.icon} onChange={(icon) => savePage({ icon })} />
        <textarea
          ref={titleRef}
          rows={1}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            const t = title.trim() || 'Untitled';
            if (t !== page.title) savePage({ title: t });
            if (!title.trim()) setTitle(t);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              titleRef.current?.blur();
            }
          }}
          placeholder="Untitled"
          className="mt-1 flex-1 resize-none bg-transparent text-3xl font-bold focus:outline-none"
        />
      </div>

      {/* Body editor */}
      <BlockEditor docId={page.docId} onCreateSubPage={onCreateSubPage} sourcePageId={pageId} />
    </div>
  );
}
