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
