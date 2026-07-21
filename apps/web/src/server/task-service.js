import { and, asc, eq, inArray, isNull } from 'drizzle-orm';

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
  const [sections, allTasks, fields] = await Promise.all([
    db.query.sections.findMany({
      where: eq(schema.sections.projectId, project.id),
      orderBy: asc(schema.sections.sortOrder),
    }),
    db.query.tasks.findMany({
      where: and(eq(schema.tasks.projectId, project.id), isNull(schema.tasks.deletedAt)),
      orderBy: asc(schema.tasks.sortOrder),
    }),
    db.query.customFieldDefs.findMany({
      where: eq(schema.customFieldDefs.projectId, project.id),
      orderBy: asc(schema.customFieldDefs.sortOrder),
    }),
  ]);

  const taskIds = allTasks.map((t) => t.id);
  const [values, deps] = await Promise.all([
    taskIds.length
      ? db.query.customFieldValues.findMany({
          where: inArray(schema.customFieldValues.taskId, taskIds),
        })
      : [],
    taskIds.length
      ? db.query.taskDependencies.findMany({
          where: inArray(schema.taskDependencies.taskId, taskIds),
        })
      : [],
  ]);

  // fieldValues per task: { fieldDefId: value }
  const valuesByTask = new Map();
  for (const v of values) {
    if (!valuesByTask.has(v.taskId)) valuesByTask.set(v.taskId, {});
    valuesByTask.get(v.taskId)[v.fieldDefId] = v.value;
  }

  // Incomplete-blocker count per task, for the "Blocked by N" indicator.
  const completedMap = new Map(allTasks.map((t) => [t.id, t.completed]));
  const blockedCount = new Map();
  for (const d of deps) {
    if (completedMap.get(d.dependsOnTaskId) === false) {
      blockedCount.set(d.taskId, (blockedCount.get(d.taskId) ?? 0) + 1);
    }
  }

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
      return serializeTask(t, {
        subtaskTotal: c.total,
        subtaskDone: c.done,
        fieldValues: valuesByTask.get(t.id) ?? {},
        blockedBy: blockedCount.get(t.id) ?? 0,
      });
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
    fields: fields.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      options: f.options ?? [],
    })),
    tasks,
  };
}

/** Full task for the side-peek: subtasks, project/section, field values, deps. */
export async function getFullTask(task) {
  const [subtasks, project, section, fields, values, blockedByDeps, blockingDeps] =
    await Promise.all([
      db.query.tasks.findMany({
        where: and(eq(schema.tasks.parentTaskId, task.id), isNull(schema.tasks.deletedAt)),
        orderBy: asc(schema.tasks.sortOrder),
      }),
      db.query.projects.findFirst({ where: eq(schema.projects.id, task.projectId) }),
      task.sectionId
        ? db.query.sections.findFirst({ where: eq(schema.sections.id, task.sectionId) })
        : Promise.resolve(null),
      db.query.customFieldDefs.findMany({
        where: eq(schema.customFieldDefs.projectId, task.projectId),
        orderBy: asc(schema.customFieldDefs.sortOrder),
      }),
      db.query.customFieldValues.findMany({
        where: eq(schema.customFieldValues.taskId, task.id),
      }),
      // Tasks this one is blocked by.
      db.query.taskDependencies.findMany({
        where: eq(schema.taskDependencies.taskId, task.id),
        with: { dependsOn: { columns: { id: true, title: true, completed: true } } },
      }),
      // Tasks this one blocks.
      db.query.taskDependencies.findMany({
        where: eq(schema.taskDependencies.dependsOnTaskId, task.id),
        with: { task: { columns: { id: true, title: true, completed: true } } },
      }),
    ]);

  const attachments = await db.query.attachments.findMany({
    where: eq(schema.attachments.taskId, task.id),
    orderBy: asc(schema.attachments.createdAt),
  });

  const fieldValues = {};
  for (const v of values) fieldValues[v.fieldDefId] = v.value;

  return serializeTask(task, {
    projectName: project?.name ?? null,
    sectionName: section?.name ?? null,
    subtasks: subtasks.map((s) => serializeTask(s)),
    fields: fields.map((f) => ({ id: f.id, name: f.name, type: f.type, options: f.options ?? [] })),
    fieldValues,
    blockedBy: blockedByDeps.map((d) => ({ depId: d.id, ...d.dependsOn })),
    blocking: blockingDeps.map((d) => ({ depId: d.id, ...d.task })),
    attachments: attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      mime: a.mime,
      sizeBytes: a.sizeBytes,
      url: `/api/files/${encodeURIComponent(a.storagePath)}`,
      isImage: a.mime?.startsWith('image/'),
    })),
  });
}
