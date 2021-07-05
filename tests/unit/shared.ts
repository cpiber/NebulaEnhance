/// <reference path="../../src/types/global.d.ts"/>
import { dot, norm } from '../../src/scripts/_shared';

describe('dot product operations', () => {
  test('fail on unequal length', () => {
    expect(dot([], [0])).toBe(false);
  });

  test('single item', () => {
    expect(dot([5], [4])).toBe(5 * 4);
  });

  test('multi-dimensional', () => {
    const a1 = [1,2,3];
    const a2 = [3,2,1];
    const d = a1[0] * a2[0] + a1[1] * a2[1] + a1[2] * a2[2];
    expect(dot(a1, a2)).toBeCloseTo(d);
  });
});

describe('norm (vector square-length)', () => {
  test('empty array', () => {
    expect(norm([])).toBe(0);
  });

  test('1 value', () => {
    expect(norm([7])).toBe(7);
  });

  test('multi-dimensional', () => {
    expect(norm([1, 2, 3])).toBeCloseTo(Math.sqrt(1 * 1 + 2 * 2 + 3 * 3));
  });
});

describe('array occurence', () => {
  test('empty with empty input', () => {
    expect([].occurence()).toEqual({ values: [], occurences: [] });
  });

  test('only one value', () => {
    expect([1, 1, 1].occurence()).toEqual({ values: [1], occurences: [3] });
  });

  test('only one value each', () => {
    expect([1, 2, 3].occurence()).toEqual({ values: [1, 2, 3], occurences: [1, 1, 1] });
  });

  test('interleaving values', () => {
    expect([3, 1, 2, 1, 3, 3, 2].occurence()).toEqual({ values: [1, 2, 3], occurences: [2, 2, 3] });
  });
});

describe('array equality', () => {
  test('different length', () => {
    expect([].equals([1])).toBe(false);
  });

  test('different items', () => {
    expect([1].equals([2])).toBe(false);
    expect([1,2,3].equals([2,1,3])).toBe(false);
  });

  test('same values', () => {
    expect([1, 2, 3].equals([1, 2, 3])).toBe(true);
  });
});

describe('number pad', () => {
  test('strange length', () => {
    expect((5).pad(-5)).toBe("5");
    expect((5).pad(0)).toBe("5");
  });

  test('shorter', () => {
    expect((5).pad(2)).toBe("05");
    expect((50).pad(5)).toBe("00050");
  });

  test('exact', () => {
    expect((5).pad(1)).toBe("5");
    expect((50).pad(2)).toBe("50");
  });

  test('longer', () => {
    expect((50).pad(1)).toBe("50");
  });
});
