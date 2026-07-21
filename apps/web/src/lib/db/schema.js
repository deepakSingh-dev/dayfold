import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

/*
 * Dayfold schema (Section 5 of the brief).
 *
 * Conventions:
 *  - Every table has id (uuid), created_at, updated_at.
 *  - Soft delete via deleted_at on projects, tasks, pages.
 *  - Fractional sort_order (numeric) wherever we reorder cheaply.
 *  - Auth tables (users/sessions/accounts/verifications) follow Better Auth's
 *    shape; Better Auth is configured to map onto them in Phase 1.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const workspacePlan = pgEnum('workspace_plan', ['free']);
export const memberRole = pgEnum('member_role', ['owner', 'admin', 'member']);
export const taskPriority = pgEnum('task_priority', ['low', 'medium', 'high']);
export const docKind = pgEnum('doc_kind', ['task_description', 'page']);
export const customFieldType = pgEnum('custom_field_type', ['text', 'number', 'select', 'date']);

// Shared timestamp columns.
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

// ---------------------------------------------------------------------------
// Auth (Better Auth compatible)
// ---------------------------------------------------------------------------

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  // Better Auth reads this field as `image`; the DB column stays `avatar_url`.
  image: text('avatar_url'),
  ...timestamps,
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
});

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  ...timestamps,
});

export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Workspaces & membership
// ---------------------------------------------------------------------------

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  plan: workspacePlan('plan').notNull().default('free'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  ...timestamps,
});

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: memberRole('role').notNull().default('member'),
    ...timestamps,
  },
  (t) => [unique('workspace_members_workspace_user_unique').on(t.workspaceId, t.userId)],
);

// ---------------------------------------------------------------------------
// Docs (Yjs-backed editor documents)
// ---------------------------------------------------------------------------

export const docs = pgTable('docs', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: docKind('kind').notNull(),
  // base64 of the Yjs binary update; stored as text for portability (bytea in spirit).
  yjsState: text('yjs_state'),
  snapshotJson: jsonb('snapshot_json'),
  snapshotText: text('snapshot_text'),
  version: integer('version').notNull().default(0),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Projects, sections, tasks
// ---------------------------------------------------------------------------

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#8b5cf6'),
  icon: text('icon'),
  description: text('description'),
  isArchived: boolean('is_archived').notNull().default(false),
  sortOrder: numeric('sort_order', { precision: 20, scale: 10 }).notNull().default('0'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
});

export const sections = pgTable('sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sortOrder: numeric('sort_order', { precision: 20, scale: 10 }).notNull().default('0'),
  ...timestamps,
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  sectionId: uuid('section_id').references(() => sections.id, { onDelete: 'set null' }),
  parentTaskId: uuid('parent_task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  dueDate: date('due_date'),
  startDate: date('start_date'),
  priority: taskPriority('priority'),
  sortOrder: numeric('sort_order', { precision: 20, scale: 10 }).notNull().default('0'),
  descriptionDocId: uuid('description_doc_id').references(() => docs.id, { onDelete: 'set null' }),
  sourcePageId: uuid('source_page_id').references(() => pages.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Pages (Notes app)
// ---------------------------------------------------------------------------

export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  parentPageId: uuid('parent_page_id').references(() => pages.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('Untitled'),
  icon: text('icon'),
  docId: uuid('doc_id')
    .notNull()
    .references(() => docs.id, { onDelete: 'cascade' }),
  sortOrder: numeric('sort_order', { precision: 20, scale: 10 }).notNull().default('0'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Custom fields
// ---------------------------------------------------------------------------

export const customFieldDefs = pgTable('custom_field_defs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: customFieldType('type').notNull(),
  options: jsonb('options'), // for select: [{ id, label, color }]
  sortOrder: numeric('sort_order', { precision: 20, scale: 10 }).notNull().default('0'),
  ...timestamps,
});

export const customFieldValues = pgTable(
  'custom_field_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    fieldDefId: uuid('field_def_id')
      .notNull()
      .references(() => customFieldDefs.id, { onDelete: 'cascade' }),
    value: jsonb('value'),
    ...timestamps,
  },
  (t) => [unique('custom_field_values_task_field_unique').on(t.taskId, t.fieldDefId)],
);

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------

export const taskDependencies = pgTable(
  'task_dependencies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    dependsOnTaskId: uuid('depends_on_task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [
    unique('task_dependencies_pair_unique').on(t.taskId, t.dependsOnTaskId),
    check('task_dependencies_no_self', sql`${t.taskId} <> ${t.dependsOnTaskId}`),
  ],
);

// ---------------------------------------------------------------------------
// Comments & attachments
// ---------------------------------------------------------------------------

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  ...timestamps,
});

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  uploaderId: uuid('uploader_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  mime: text('mime').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  storagePath: text('storage_path').notNull(),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Turn-into-task two-way sync links
// ---------------------------------------------------------------------------

export const taskDocLinks = pgTable(
  'task_doc_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    docId: uuid('doc_id')
      .notNull()
      .references(() => docs.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    blockId: text('block_id').notNull(),
    ...timestamps,
  },
  (t) => [unique('task_doc_links_doc_block_unique').on(t.docId, t.blockId)],
);

// ---------------------------------------------------------------------------
// Relations (for drizzle query API)
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(workspaceMembers),
  createdWorkspaces: many(workspaces),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  createdBy: one(users, { fields: [workspaces.createdBy], references: [users.id] }),
  members: many(workspaceMembers),
  projects: many(projects),
  pages: many(pages),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
  sections: many(sections),
  tasks: many(tasks),
  customFieldDefs: many(customFieldDefs),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  project: one(projects, { fields: [sections.projectId], references: [projects.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [tasks.workspaceId], references: [workspaces.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  section: one(sections, { fields: [tasks.sectionId], references: [sections.id] }),
  parent: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: 'subtasks',
  }),
  subtasks: many(tasks, { relationName: 'subtasks' }),
  assignee: one(users, { fields: [tasks.assigneeId], references: [users.id] }),
  descriptionDoc: one(docs, { fields: [tasks.descriptionDocId], references: [docs.id] }),
  comments: many(comments),
  attachments: many(attachments),
  fieldValues: many(customFieldValues),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [pages.workspaceId], references: [workspaces.id] }),
  parent: one(pages, {
    fields: [pages.parentPageId],
    references: [pages.id],
    relationName: 'childPages',
  }),
  children: many(pages, { relationName: 'childPages' }),
  doc: one(docs, { fields: [pages.docId], references: [docs.id] }),
}));

export const docsRelations = relations(docs, ({ many }) => ({
  links: many(taskDocLinks),
}));

export const customFieldDefsRelations = relations(customFieldDefs, ({ one, many }) => ({
  project: one(projects, { fields: [customFieldDefs.projectId], references: [projects.id] }),
  values: many(customFieldValues),
}));

export const customFieldValuesRelations = relations(customFieldValues, ({ one }) => ({
  task: one(tasks, { fields: [customFieldValues.taskId], references: [tasks.id] }),
  fieldDef: one(customFieldDefs, {
    fields: [customFieldValues.fieldDefId],
    references: [customFieldDefs.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  task: one(tasks, { fields: [attachments.taskId], references: [tasks.id] }),
  uploader: one(users, { fields: [attachments.uploaderId], references: [users.id] }),
}));

export const taskDocLinksRelations = relations(taskDocLinks, ({ one }) => ({
  doc: one(docs, { fields: [taskDocLinks.docId], references: [docs.id] }),
  task: one(tasks, { fields: [taskDocLinks.taskId], references: [tasks.id] }),
}));

export const taskDependenciesRelations = relations(taskDependencies, ({ one }) => ({
  task: one(tasks, {
    fields: [taskDependencies.taskId],
    references: [tasks.id],
    relationName: 'depDependent',
  }),
  dependsOn: one(tasks, {
    fields: [taskDependencies.dependsOnTaskId],
    references: [tasks.id],
    relationName: 'depBlocker',
  }),
}));
