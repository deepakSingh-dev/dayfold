/**
 * Fractional sort-order for cheap reordering. Given the sort_order of the
 * neighbours a task lands between, return a new value that sorts between them.
 * sort_order is numeric(20,10) in Postgres, so midpoints have plenty of room
 * for typical use.
 *
 * @param {string|number|null|undefined} before  neighbour above (smaller)
 * @param {string|number|null|undefined} after   neighbour below (larger)
 * @returns {string}
 */
export function orderBetween(before, after) {
  const a = before == null ? null : Number(before);
  const b = after == null ? null : Number(after);

  if (a == null && b == null) return '1';
  if (a == null) return String(b - 1);
  if (b == null) return String(a + 1);
  return String((a + b) / 2);
}
