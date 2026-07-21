'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/dates';
import { Button } from '@/components/ui/button';

/** Render text with clickable URLs (plain-text comments, linkified). */
function Linkified({ text }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary underline underline-offset-2"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function CommentRow({ comment, isMine, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.body);
  const initials = (comment.authorName || '?').slice(0, 1).toUpperCase();

  return (
    <div className="group flex gap-2">
      <div className="bg-primary text-primary-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{comment.authorName}</span>
          <span className="text-muted-foreground text-[11px]">
            {timeAgo(comment.createdAt)}
            {comment.editedAt && ' · edited'}
          </span>
        </div>
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = text.trim();
              if (t) onEdit(comment.id, t);
              setEditing(false);
            }}
          >
            <textarea
              autoFocus
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="border-input bg-background focus:ring-ring mt-1 w-full resize-none rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2"
            />
            <div className="mt-1 flex gap-2">
              <Button type="submit" size="sm">
                Save
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm">
            <Linkified text={comment.body} />
          </p>
        )}
        {isMine && !editing && (
          <div className="mt-0.5 flex gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => {
                setText(comment.body);
                setEditing(true);
              }}
              className="text-muted-foreground hover:text-foreground text-[11px]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="text-muted-foreground hover:text-destructive text-[11px]"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskComments({ taskId }) {
  const qc = useQueryClient();
  const meQuery = useQuery({ queryKey: ['me'], queryFn: api.me, staleTime: Infinity });
  const { data } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => api.listComments(taskId),
  });
  const comments = data?.comments ?? [];
  const [text, setText] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['comments', taskId] });

  const add = useMutation({
    mutationFn: (body) => api.addComment(taskId, body),
    onSuccess: () => {
      setText('');
      invalidate();
    },
    onError: (err) => toast.error(err.message || 'Could not post comment'),
  });
  const edit = useMutation({
    mutationFn: ({ id, body }) => api.updateComment(id, body),
    onSuccess: invalidate,
    onError: (err) => toast.error(err.message || 'Could not edit'),
  });
  const remove = useMutation({
    mutationFn: (id) => api.deleteComment(id),
    onSuccess: invalidate,
    onError: (err) => toast.error(err.message || 'Could not delete'),
  });

  return (
    <div>
      <p className="text-muted-foreground mb-2 text-xs font-medium">Comments</p>
      <div className="space-y-3">
        {comments.length === 0 && <p className="text-muted-foreground text-sm">No comments yet.</p>}
        {comments.map((c) => (
          <CommentRow
            key={c.id}
            comment={c}
            isMine={c.authorId === meQuery.data?.id}
            onEdit={(id, body) => edit.mutate({ id, body })}
            onDelete={(id) => remove.mutate(id)}
          />
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim();
          if (t) add.mutate(t);
        }}
        className="mt-3"
      >
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          className={cn(
            'border-input bg-background focus:ring-ring w-full resize-none rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2',
          )}
        />
        {text.trim() && (
          <Button type="submit" size="sm" className="mt-1" disabled={add.isPending}>
            Comment
          </Button>
        )}
      </form>
    </div>
  );
}
