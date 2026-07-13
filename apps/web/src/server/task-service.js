import { and, asc, eq, isNull } from 'drizzle-orm';

import { db, schema } from '@/lib/db';

/** Serialises a task row into the shape the client expects. */
export function serializeTask(t, extra = {}) {
  return {
    id: t.id,
    projectId: t.projectId,
    sectionId: t.sectionId,
    parentTaskId: t.parentTaskId,
    title: t.title,
    completed: t.completed,
    completedAt: t.completedAt,
    assigneeId: t.assigneeId,
    dueDate: t.dueDate,
    startDate: t.startDate,
    priority: t.priority,
    sortOrder: t.sortOrder,
    descriptionDocId: t.descriptionDocId,
    ...extra,
  };
}

/**
 * Loads a project's List/Board payload: the project, its sections (ordered),
 * and its top-level tasks (each with subtask progress counts).
 */
export async function getProjectData(project) {
  const [sections, allTasks] = await Promise.all([
    db.query.sections.findMany({
      where: eq(schema.sections.projectId, project.id),
      orderBy: asc(schema.sections.sortOrder),
    }),
    db.query.tasks.findMany({
      where: and(eq(schema.tasks.projectId, project.id), isNull(schema.tasks.deletedAt)),
      orderBy: asc(schema.tasks.sortOrder),
    }),
  ]);

  // Aggregate subtask counts per parent.
  const counts = new Map();
  for (const t of allTasks) {
    if (!t.parentTaskId) continue;
    const c = counts.get(t.parentTaskId) ?? { total: 0, done: 0 };
    c.total += 1;
    if (t.completed) c.done += 1;
    counts.set(t.parentTaskId, c);
  }

  const tasks = allTasks
    .filter((t) => !t.parentTaskId)
    .map((t) => {
      const c = counts.get(t.id) ?? { total: 0, done: 0 };
      return serializeTask(t, { subtaskTotal: c.total, subtaskDone: c.done });
    });

  return {
    project: {
      id: project.id,
      name: project.name,
      color: project.color,
      icon: project.icon,
      description: project.description,
      isArchived: project.isArchived,
    },
    sections: sections.map((s) => ({ id: s.id, name: s.name, sortOrder: s.sortOrder })),
    tasks,
  };
}

/** Full task for the side-peek: task + its (ordered) subtasks + project/section names. */
export async function getFullTask(task) {
  const [subtasks, project, section] = await Promise.all([
    db.query.tasks.findMany({
      where: and(eq(schema.tasks.parentTaskId, task.id), isNull(schema.tasks.deletedAt)),
      orderBy: asc(schema.tasks.sortOrder),
    }),
    db.query.projects.findFirst({ where: eq(schema.projects.id, task.projectId) }),
    task.sectionId
      ? db.query.sections.findFirst({ where: eq(schema.sections.id, task.sectionId) })
      : Promise.resolve(null),
  ]);

  return serializeTask(task, {
    projectName: project?.name ?? null,
    sectionName: section?.name ?? null,
    subtasks: subtasks.map((s) => serializeTask(s)),
  });
}
