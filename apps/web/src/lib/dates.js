/**
 * Date helpers for due dates. Dates are stored/compared as 'YYYY-MM-DD' strings
 * in the user's local frame — no timezone math needed.
 */

/** Today as 'YYYY-MM-DD' in local time. */
export function todayStr() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  return dueDate < todayStr();
}

export function isToday(dueDate) {
  return Boolean(dueDate) && dueDate === todayStr();
}

/** Short, humane label like "Today", "Jul 14", or "Jul 14, 2027" if not this year. */
export function formatDueLabel(dueDate) {
  if (!dueDate) return '';
  if (isToday(dueDate)) return 'Today';
  // Parse as local date (avoid UTC shift from `new Date('YYYY-MM-DD')`).
  const [y, m, d] = dueDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  const opts =
    y === now.getFullYear()
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString(undefined, opts);
}

/** Relative timestamp like "2h ago" for comments/trash. */
export function timeAgo(input) {
  const then = new Date(input).getTime();
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(input).toLocaleDateString();
}
