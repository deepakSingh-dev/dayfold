import { notFound } from 'next/navigation';
import { and, eq, isNull } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { getActiveWorkspace, getSession } from '@/lib/session';
import { PageHeader } from '@/components/layout/page-header';
import { ComingSoon } from '@/components/layout/coming-soon';

export default async function NotePage({ params }) {
  const { id } = await params;
  const session = await getSession();
  const workspace = await getActiveWorkspace(session.user.id);

  // Authorization: the page must belong to the user's active workspace.
  const page = await db.query.pages.findFirst({
    where: and(
      eq(schema.pages.id, id),
      eq(schema.pages.workspaceId, workspace.id),
      isNull(schema.pages.deletedAt),
    ),
  });

  if (!page) notFound();

  return (
    <>
      <PageHeader title={`${page.icon ? `${page.icon} ` : ''}${page.title}`} />
      <ComingSoon title={page.title} phase="Phase 4 & 6">
        The collaborative block editor and the nested Notes app are on the way.
      </ComingSoon>
    </>
  );
}
