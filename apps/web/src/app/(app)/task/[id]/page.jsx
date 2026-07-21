import { notFound, redirect } from 'next/navigation';
import { and, eq, isNull } from 'drizzle-orm';

import { db, schema } from '@/lib/db';
import { getActiveWorkspace, getSession } from '@/lib/session';

// Full-page task entry point (used by task-block "open task" links). For v1 it
// routes to the task's project view where the side-peek can be opened.
export default async function TaskPage({ params }) {
  const { id } = await params;
  const session = await getSession();
  const workspace = await getActiveWorkspace(session.user.id);

  const task = await db.query.tasks.findFirst({
    where: and(
      eq(schema.tasks.id, id),
      eq(schema.tasks.workspaceId, workspace.id),
      isNull(schema.tasks.deletedAt),
    ),
    columns: { projectId: true },
  });
  if (!task) notFound();

  redirect(`/projects/${task.projectId}?task=${id}`);
}
