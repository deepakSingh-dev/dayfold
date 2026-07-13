import { notFound } from 'next/navigation';
import { and, eq, isNull } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { getActiveWorkspace, getSession } from '@/lib/session';
import { PageHeader } from '@/components/layout/page-header';
import { ComingSoon } from '@/components/layout/coming-soon';

export default async function ProjectPage({ params }) {
  const { id } = await params;
  const session = await getSession();
  const workspace = await getActiveWorkspace(session.user.id);

  // Authorization: the project must belong to the user's active workspace.
  const project = await db.query.projects.findFirst({
    where: and(
      eq(schema.projects.id, id),
      eq(schema.projects.workspaceId, workspace.id),
      isNull(schema.projects.deletedAt),
    ),
  });

  if (!project) notFound();

  return (
    <>
      <PageHeader title={`${project.icon ? `${project.icon} ` : ''}${project.name}`} />
      <ComingSoon title={project.name} phase="Phase 2">
        List, Board, and Calendar views for this project are coming next.
      </ComingSoon>
    </>
  );
}
