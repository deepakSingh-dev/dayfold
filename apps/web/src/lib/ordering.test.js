import { describe, expect, it } from 'vitest';

import { orderBetween } from './ordering.js';

describe('orderBetween', () => {
  it('returns 1 for an empty list', () => {
    expect(orderBetween(null, null)).toBe('1');
  });

  it('places before the first item', () => {
    expect(orderBetween(null, 1)).toBe('0');
    expect(orderBetween(null, '5')).toBe('4');
  });

  it('places after the last item', () => {
    expect(orderBetween(2, null)).toBe('3');
    expect(orderBetween('9', null)).toBe('10');
  });

  it('returns the midpoint between two neighbours', () => {
    expect(orderBetween(1, 2)).toBe('1.5');
    expect(orderBetween('1', '1.5')).toBe('1.25');
  });

  it('keeps strict ordering across repeated midpoint inserts', () => {
    let before = '1';
    const after = '2';
    for (let i = 0; i < 20; i += 1) {
      const mid = orderBetween(before, after);
      expect(Number(before)).toBeLessThan(Number(mid));
      expect(Number(mid)).toBeLessThan(Number(after));
      before = mid;
    }
  });
});
