import { notFound } from 'next/navigation';
import { and, eq, isNull } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { getActiveWorkspace, getSession } from '@/lib/session';
import { NotesPageView } from '@/components/notes/notes-page-view';

export default async function NotePage({ params }) {
  const { id } = await params;
  const session = await getSession();
  const workspace = await getActiveWorkspace(session.user.id);

  const page = await db.query.pages.findFirst({
    where: and(
      eq(schema.pages.id, id),
      eq(schema.pages.workspaceId, workspace.id),
      isNull(schema.pages.deletedAt),
    ),
    columns: { id: true },
  });
  if (!page) notFound();

  return <NotesPageView pageId={id} />;
}
