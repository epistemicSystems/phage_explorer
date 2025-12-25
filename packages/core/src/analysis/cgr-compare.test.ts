/**
 * Unit tests for CGR Comparison Metrics
 */

import { describe, it, expect } from 'bun:test';
import { compareCGR, type CGRDistance } from './cgr-compare';
import type { CGRResult } from './cgr';

// Helper to create a mock CGRResult
function makeCGR(
  grid: number[],
  options: Partial<Omit<CGRResult, 'grid'>> = {}
): CGRResult {
  const resolution = options.resolution ?? 4;
  const totalPoints = options.totalPoints ?? grid.reduce((a, b) => a + b, 0);
  return {
    grid: new Float32Array(grid),
    resolution,
    k: options.k ?? 2,
    maxCount: options.maxCount ?? Math.max(...grid),
    totalPoints,
    entropy: options.entropy ?? 0,
  };
}

describe('compareCGR', () => {
  describe('identical CGRs', () => {
    it('returns zero euclidean distance for identical grids', () => {
      const cgr = makeCGR([1, 2, 3, 4]);
      const result = compareCGR(cgr, cgr);

      expect(result.euclidean).toBe(0);
    });

    it('returns perfect pearson correlation for identical grids', () => {
      const cgr = makeCGR([1, 2, 3, 4]);
      const result = compareCGR(cgr, cgr);

      expect(result.pearson).toBeCloseTo(1, 5);
    });

    it('returns perfect cosine similarity for identical grids', () => {
      const cgr = makeCGR([1, 2, 3, 4]);
      const result = compareCGR(cgr, cgr);

      expect(result.cosine).toBeCloseTo(1, 5);
    });

    it('returns perfect jaccard for identical grids', () => {
      const cgr = makeCGR([1, 2, 3, 4]);
      const result = compareCGR(cgr, cgr);

      expect(result.jaccard).toBeCloseTo(1, 5);
    });
  });

  describe('different CGRs', () => {
    it('returns positive euclidean distance for different grids', () => {
      const a = makeCGR([1, 2, 3, 4]);
      const b = makeCGR([4, 3, 2, 1]);
      const result = compareCGR(a, b);

      expect(result.euclidean).toBeGreaterThan(0);
    });

    it('returns lower pearson for anti-correlated grids', () => {
      const a = makeCGR([1, 2, 3, 4, 5]);
      const b = makeCGR([5, 4, 3, 2, 1]);
      const result = compareCGR(a, b);

      expect(result.pearson).toBeLessThan(0);
    });

    it('returns lower cosine for orthogonal grids', () => {
      const a = makeCGR([1, 0, 0, 0]);
      const b = makeCGR([0, 1, 0, 0]);
      const result = compareCGR(a, b);

      expect(result.cosine).toBe(0);
    });

    it('returns lower jaccard for non-overlapping grids', () => {
      const a = makeCGR([1, 0, 0, 0]);
      const b = makeCGR([0, 0, 0, 1]);
      const result = compareCGR(a, b);

      expect(result.jaccard).toBe(0);
    });
  });

  describe('resolution mismatch', () => {
    it('throws error when resolutions differ', () => {
      const a = makeCGR([1, 2, 3, 4], { resolution: 4 });
      const b = makeCGR([1, 2, 3, 4], { resolution: 8 });

      expect(() => compareCGR(a, b)).toThrow('Resolution mismatch');
    });
  });

  describe('empty grids', () => {
    it('handles zero total points gracefully', () => {
      const a = makeCGR([0, 0, 0, 0], { totalPoints: 0 });
      const b = makeCGR([0, 0, 0, 0], { totalPoints: 0 });
      const result = compareCGR(a, b);

      expect(result.euclidean).toBe(0);
      expect(result.pearson).toBe(0);
      expect(result.cosine).toBe(0);
      expect(result.jaccard).toBe(0);
    });

    it('handles one empty grid', () => {
      const a = makeCGR([1, 2, 3, 4]);
      const b = makeCGR([0, 0, 0, 0], { totalPoints: 0 });
      const result = compareCGR(a, b);

      expect(result.euclidean).toBeGreaterThan(0);
      expect(result.jaccard).toBe(0);
    });
  });

  describe('scaling invariance', () => {
    it('cosine is invariant to uniform scaling', () => {
      const a = makeCGR([1, 2, 3, 4]);
      const b = makeCGR([2, 4, 6, 8]);
      const result = compareCGR(a, b);

      // After normalization, these should be identical
      expect(result.cosine).toBeCloseTo(1, 5);
    });

    it('euclidean changes with scaling', () => {
      const a = makeCGR([1, 2, 3, 4]);
      const b = makeCGR([2, 4, 6, 8]);

      // Compare a to itself
      const sameResult = compareCGR(a, a);
      // Compare a to scaled b (but normalized by totalPoints)
      const scaledResult = compareCGR(a, b);

      // After normalization, euclidean should be 0
      expect(scaledResult.euclidean).toBeCloseTo(0, 5);
    });
  });

  describe('metric properties', () => {
    it('euclidean is symmetric', () => {
      const a = makeCGR([1, 2, 3, 4]);
      const b = makeCGR([4, 1, 2, 5]);

      const ab = compareCGR(a, b);
      const ba = compareCGR(b, a);

      expect(ab.euclidean).toBeCloseTo(ba.euclidean, 10);
    });

    it('pearson is symmetric', () => {
      const a = makeCGR([1, 2, 3, 4]);
      const b = makeCGR([4, 1, 2, 5]);

      const ab = compareCGR(a, b);
      const ba = compareCGR(b, a);

      expect(ab.pearson).toBeCloseTo(ba.pearson, 10);
    });

    it('cosine is symmetric', () => {
      const a = makeCGR([1, 2, 3, 4]);
      const b = makeCGR([4, 1, 2, 5]);

      const ab = compareCGR(a, b);
      const ba = compareCGR(b, a);

      expect(ab.cosine).toBeCloseTo(ba.cosine, 10);
    });

    it('jaccard is symmetric', () => {
      const a = makeCGR([1, 2, 3, 4]);
      const b = makeCGR([4, 1, 2, 5]);

      const ab = compareCGR(a, b);
      const ba = compareCGR(b, a);

      expect(ab.jaccard).toBeCloseTo(ba.jaccard, 10);
    });
  });

  describe('metric ranges', () => {
    it('euclidean is non-negative', () => {
      const a = makeCGR([1, 2, 3, 4]);
      const b = makeCGR([5, 6, 7, 8]);
      const result = compareCGR(a, b);

      expect(result.euclidean).toBeGreaterThanOrEqual(0);
    });

    it('pearson is between -1 and 1', () => {
      const a = makeCGR([1, 2, 3, 4]);
      const b = makeCGR([5, 6, 7, 8]);
      const result = compareCGR(a, b);

      expect(result.pearson).toBeGreaterThanOrEqual(-1);
      expect(result.pearson).toBeLessThanOrEqual(1);
    });

    it('cosine is between 0 and 1 for non-negative values', () => {
      const a = makeCGR([1, 2, 3, 4]);
      const b = makeCGR([5, 6, 7, 8]);
      const result = compareCGR(a, b);

      expect(result.cosine).toBeGreaterThanOrEqual(0);
      expect(result.cosine).toBeLessThanOrEqual(1);
    });

    it('jaccard is between 0 and 1', () => {
      const a = makeCGR([1, 2, 3, 4]);
      const b = makeCGR([5, 6, 7, 8]);
      const result = compareCGR(a, b);

      expect(result.jaccard).toBeGreaterThanOrEqual(0);
      expect(result.jaccard).toBeLessThanOrEqual(1);
    });
  });

  describe('realistic scenarios', () => {
    it('similar sequences have high similarity scores', () => {
      // Simulating two similar phage genomes
      const a = makeCGR([10, 20, 15, 25, 8, 12, 18, 22, 5, 7, 9, 11, 14, 16, 19, 21]);
      const b = makeCGR([11, 19, 14, 26, 9, 13, 17, 21, 6, 8, 10, 12, 13, 15, 20, 22]);
      const result = compareCGR(a, b);

      expect(result.pearson).toBeGreaterThan(0.9);
      expect(result.cosine).toBeGreaterThan(0.9);
      expect(result.jaccard).toBeGreaterThan(0.8);
    });

    it('dissimilar sequences have low similarity scores', () => {
      // Simulating two very different phage genomes
      const a = makeCGR([100, 0, 0, 0, 50, 0, 0, 0, 25, 0, 0, 0, 10, 0, 0, 0]);
      const b = makeCGR([0, 100, 0, 0, 0, 50, 0, 0, 0, 25, 0, 0, 0, 10, 0, 0]);
      const result = compareCGR(a, b);

      expect(result.pearson).toBeLessThan(0);
      expect(result.jaccard).toBeLessThan(0.5);
    });
  });
});
