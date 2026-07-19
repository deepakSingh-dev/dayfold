import { z } from 'zod';
import { CUSTOM_FIELD_TYPES, DOC_KINDS, MEMBER_ROLES, TASK_PRIORITIES } from './constants.js';

/**
 * Zod schemas shared across API boundaries. Web route handlers and the sync
 * service both validate against these so the contract stays in one place.
 */

export const uuid = z.string().uuid();

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

export const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const prioritySchema = z.enum(TASK_PRIORITIES);
export const memberRoleSchema = z.enum(MEMBER_ROLES);
export const docKindSchema = z.enum(DOC_KINDS);
export const customFieldTypeSchema = z.enum(CUSTOM_FIELD_TYPES);

/** Payload the sync service verifies when a client connects to a doc room. */
export const syncTokenClaimsSchema = z.object({
  userId: uuid,
  workspaceId: uuid,
  docId: uuid,
  exp: z.number().int(),
});

/** Body of the internal task-block update endpoint on the sync service. */
export const updateTaskBlockSchema = z.object({
  blockId: z.string().min(1),
  title: z.string().optional(),
  completed: z.boolean().optional(),
  deleted: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Projects / sections / tasks (Phase 2)
// ---------------------------------------------------------------------------

const hexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Color must be a hex value like #8b5cf6');
// A single emoji-ish icon (kept permissive; UI offers a preset picker).
const iconSchema = z.string().min(1).max(8);
const nullableDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .nullable();

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  color: hexColor.optional(),
  icon: iconSchema.optional(),
  description: z.string().max(2000).optional(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    color: hexColor,
    icon: iconSchema.nullable(),
    description: z.string().max(2000).nullable(),
    isArchived: z.boolean(),
  })
  .partial();

export const createSectionSchema = z.object({
  projectId: uuid,
  name: z.string().trim().min(1, 'Name is required').max(120),
});

export const updateSectionSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    sortOrder: z.string(),
  })
  .partial();

export const createTaskSchema = z.object({
  projectId: uuid,
  sectionId: uuid.nullable().optional(),
  parentTaskId: uuid.nullable().optional(),
  title: z.string().trim().min(1, 'Title is required').max(500),
  priority: prioritySchema.nullable().optional(),
  dueDate: nullableDate.optional(),
});

/** Save payload for an editor document snapshot (JSON + plaintext for search). */
export const saveDocSchema = z.object({
  snapshotJson: z.any(),
  snapshotText: z.string().max(500_000).default(''),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(500),
    completed: z.boolean(),
    sectionId: uuid.nullable(),
    projectId: uuid,
    priority: prioritySchema.nullable(),
    dueDate: nullableDate,
    startDate: nullableDate,
    sortOrder: z.string(),
  })
  .partial();
