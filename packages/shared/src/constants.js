/**
 * Shared constant literals used across web + sync. Keep these in sync with the
 * Drizzle pgEnum definitions in apps/web/src/lib/db/schema.js.
 */

export const WORKSPACE_PLANS = ['free'];
export const MEMBER_ROLES = ['owner', 'admin', 'member'];
export const TASK_PRIORITIES = ['low', 'medium', 'high'];
export const DOC_KINDS = ['task_description', 'page'];
export const CUSTOM_FIELD_TYPES = ['text', 'number', 'select', 'date'];
export const PROJECT_VIEWS = ['list', 'board', 'calendar'];

/** Max upload size for attachments, in bytes (20 MB). */
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

/** Trash retention window in days (cleanup job is deferred; documented only). */
export const TRASH_RETENTION_DAYS = 30;
