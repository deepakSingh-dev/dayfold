import * as schema from '../lib/db/schema.js';

/**
 * Creates a fresh user's starter content so the app never looks empty:
 * a personal workspace (+owner membership), one sample project with three
 * sections and a few seed tasks, and one sample notes page.
 *
 * Takes an explicit `db` so it can be reused by both the web app (Better Auth
 * signup hook) and the standalone seed script.
 *
 * @param {import('drizzle-orm/node-postgres').NodePgDatabase<typeof schema>} db
 * @param {{ userId: string, userName?: string }} params
 * @returns {Promise<{ workspaceId: string, projectId: string }>}
 */
export async function bootstrapUserWorkspace(db, { userId, userName }) {
  const displayName = userName?.trim() || 'My';

  const [workspace] = await db
    .insert(schema.workspaces)
    .values({ name: `${displayName}'s Workspace`, plan: 'free', createdBy: userId })
    .returning();
  if (!workspace) throw new Error('Failed to create workspace');

  await db.insert(schema.workspaceMembers).values({
    workspaceId: workspace.id,
    userId,
    role: 'owner',
  });

  const [project] = await db
    .insert(schema.projects)
    .values({
      workspaceId: workspace.id,
      name: 'Product Launch',
      color: '#8b5cf6',
      icon: '🚀',
      description: 'A sample project to get you started.',
      sortOrder: '1',
    })
    .returning();
  if (!project) throw new Error('Failed to create project');

  const sectionRows = await db
    .insert(schema.sections)
    .values([
      { projectId: project.id, name: 'To Do', sortOrder: '1' },
      { projectId: project.id, name: 'In Progress', sortOrder: '2' },
      { projectId: project.id, name: 'Done', sortOrder: '3' },
    ])
    .returning();
  const [todo, inProgress, done] = sectionRows;
  if (!todo || !inProgress || !done) throw new Error('Failed to create sections');

  const inDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  await db.insert(schema.tasks).values([
    {
      workspaceId: workspace.id,
      projectId: project.id,
      sectionId: todo.id,
      title: 'Write launch announcement',
      priority: 'high',
      dueDate: inDays(3),
      assigneeId: userId,
      sortOrder: '1',
    },
    {
      workspaceId: workspace.id,
      projectId: project.id,
      sectionId: todo.id,
      title: 'Design social media assets',
      priority: 'medium',
      dueDate: inDays(5),
      assigneeId: userId,
      sortOrder: '2',
    },
    {
      workspaceId: workspace.id,
      projectId: project.id,
      sectionId: inProgress.id,
      title: 'Finalize pricing page',
      priority: 'high',
      dueDate: inDays(1),
      assigneeId: userId,
      sortOrder: '1',
    },
    {
      workspaceId: workspace.id,
      projectId: project.id,
      sectionId: done.id,
      title: 'Set up analytics',
      priority: 'low',
      completed: true,
      completedAt: new Date(),
      assigneeId: userId,
      sortOrder: '1',
    },
  ]);

  // Sample notes page with its own editor doc.
  const welcomeText = 'Welcome to Dayfold! This is your first note. Press "/" for blocks.';
  const [pageDoc] = await db
    .insert(schema.docs)
    .values({
      kind: 'page',
      snapshotJson: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: welcomeText }] }],
      },
      snapshotText: welcomeText,
    })
    .returning();
  if (!pageDoc) throw new Error('Failed to create page doc');

  await db.insert(schema.pages).values({
    workspaceId: workspace.id,
    title: 'Welcome to Dayfold',
    icon: '👋',
    docId: pageDoc.id,
    sortOrder: '1',
  });

  return { workspaceId: workspace.id, projectId: project.id };
}
