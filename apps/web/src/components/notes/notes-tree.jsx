'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, Trash2 } from 'lucide-react';

import { api, queryKeys } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Build a parent→children map and the list of roots. */
function buildTree(pages) {
  const byParent = new Map();
  for (const p of pages) {
    const key = p.parentPageId ?? 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(p);
  }
  return byParent;
}

function NoteRow({
  page,
  depth,
  byParent,
  expanded,
  toggle,
  activeId,
  onAddChild,
  onRename,
  onDelete,
}) {
  const children = byParent.get(page.id) ?? [];
  const hasChildren = children.length > 0;
  const isOpen = expanded.has(page.id);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(page.title);

  const { setNodeRef: dragRef, listeners, attributes, isDragging } = useDraggable({ id: page.id });
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: page.id });

  function setRefs(el) {
    dragRef(el);
    dropRef(el);
  }
  function submitRename(e) {
    e.preventDefault();
    const n = name.trim();
    if (n && n !== page.title) onRename(page.id, n);
    setRenaming(false);
  }

  return (
    <div>
      <div
        ref={setRefs}
        {...attributes}
        {...listeners}
        className={cn(
          'group/note flex items-center gap-1 rounded-md py-1 pr-1 text-sm transition-colors',
          activeId === page.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
          isOver && 'ring-ring ring-1',
          isDragging && 'opacity-50',
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          onClick={() => toggle(page.id)}
          className={cn('text-muted-foreground shrink-0', !hasChildren && 'invisible')}
          aria-label={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>

        {renaming ? (
          <form onSubmit={submitRename} className="flex-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={submitRename}
              className="border-input bg-background w-full rounded border px-1 text-sm focus:outline-none"
            />
          </form>
        ) : (
          <Link href={`/notes/${page.id}`} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="text-base leading-none">{page.icon || '📄'}</span>
            <span className="truncate">{page.title}</span>
          </Link>
        )}

        <button
          type="button"
          aria-label="New sub-page"
          onClick={() => onAddChild(page.id)}
          className="text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 rounded p-0.5 opacity-0 group-hover/note:opacity-100"
        >
          <Plus className="size-3.5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Page actions"
              className="text-muted-foreground hover:bg-accent shrink-0 rounded p-0.5 opacity-0 group-hover/note:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRenaming(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddChild(page.id)}>Add sub-page</DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onDelete(page.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isOpen &&
        children.map((child) => (
          <NoteRow
            key={child.id}
            page={child}
            depth={depth + 1}
            byParent={byParent}
            expanded={expanded}
            toggle={toggle}
            activeId={activeId}
            onAddChild={onAddChild}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

export function NotesTree() {
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useQuery({ queryKey: queryKeys.pages, queryFn: api.listPages });

  const [expanded, setExpanded] = useState(new Set());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const byParent = useMemo(() => buildTree(data?.pages ?? []), [data]);
  const roots = byParent.get('root') ?? [];
  const activeId = pathname.startsWith('/notes/') ? pathname.split('/')[2] : null;

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.pages });
  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const createPage = useMutation({
    mutationFn: (parentPageId) => api.createPage({ parentPageId }),
    onSuccess: ({ page }) => {
      invalidate();
      if (page.parentPageId) setExpanded((p) => new Set(p).add(page.parentPageId));
      router.push(`/notes/${page.id}`);
    },
    onError: (err) => toast.error(err.message || 'Could not create page'),
  });

  async function onRename(id, title) {
    try {
      await api.updatePage(id, { title });
      invalidate();
    } catch (err) {
      toast.error(err.message || 'Could not rename');
    }
  }
  async function onDelete(id) {
    if (!confirm('Move this page (and its sub-pages) to Trash?')) return;
    try {
      await api.deletePage(id);
      invalidate();
      toast.success('Page moved to Trash');
      if (activeId === id) router.push('/home');
    } catch (err) {
      toast.error(err.message || 'Could not delete');
    }
  }
  async function onDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    try {
      await api.updatePage(active.id, { parentPageId: over.id });
      setExpanded((p) => new Set(p).add(over.id));
      invalidate();
    } catch (err) {
      toast.error(err.message || 'Could not move page');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between px-2 pb-1 pt-4">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          Notes
        </span>
        <button
          type="button"
          aria-label="New page"
          title="New page"
          onClick={() => createPage.mutate(null)}
          className="text-muted-foreground hover:bg-accent hover:text-foreground rounded p-0.5"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex flex-col">
          {roots.length === 0 && (
            <p className="text-muted-foreground px-2 py-1 text-sm">No pages yet</p>
          )}
          {roots.map((page) => (
            <NoteRow
              key={page.id}
              page={page}
              depth={0}
              byParent={byParent}
              expanded={expanded}
              toggle={toggle}
              activeId={activeId}
              onAddChild={(pid) => createPage.mutate(pid)}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
