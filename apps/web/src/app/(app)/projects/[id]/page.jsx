import { notFound } from 'next/navigation';
import { and, eq, isNull } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { getActiveWorkspace, getSession } from '@/lib/session';
import { ProjectView } from '@/components/projects/project-view';

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
    <ProjectView
      projectId={project.id}
      initialProject={{
        id: project.id,
        name: project.name,
        icon: project.icon,
        color: project.color,
        isArchived: project.isArchived,
      }}
    />
  );
}
