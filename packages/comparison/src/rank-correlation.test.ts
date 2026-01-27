/**
 * Tests for Rank Correlation Metrics Module
 *
 * Tests Spearman's rho, Kendall's tau, Hoeffding's D, and related functions.
 */

import { describe, test, expect } from 'bun:test';
import {
  computeRanks,
  spearmanRho,
  pearsonCorrelation,
  kendallTau,
  hoeffdingD,
  spearmanPValue,
  kendallPValue,
  interpretCorrelation,
  analyzeRankCorrelation,
  compareFrequencyDistributions,
} from './rank-correlation';

describe('computeRanks', () => {
  test('computes ranks for simple array', () => {
    const values = [3, 1, 2];
    const ranks = computeRanks(values);
    // 1 gets rank 1, 2 gets rank 2, 3 gets rank 3
    expect(ranks).toEqual([3, 1, 2]);
  });

  test('handles ties with average rank', () => {
    const values = [1, 2, 2, 4];
    const ranks = computeRanks(values);
    // 1 gets rank 1, the two 2s share ranks 2 and 3 (average = 2.5), 4 gets rank 4
    expect(ranks).toEqual([1, 2.5, 2.5, 4]);
  });

  test('handles all equal values', () => {
    const values = [5, 5, 5];
    const ranks = computeRanks(values);
    // All share average of ranks 1, 2, 3 = 2
    expect(ranks).toEqual([2, 2, 2]);
  });

  test('handles single element', () => {
    const values = [42];
    const ranks = computeRanks(values);
    expect(ranks).toEqual([1]);
  });

  test('handles empty array', () => {
    const values: number[] = [];
    const ranks = computeRanks(values);
    expect(ranks).toEqual([]);
  });

  test('handles negative values', () => {
    const values = [-5, 0, 5];
    const ranks = computeRanks(values);
    expect(ranks).toEqual([1, 2, 3]);
  });
});

describe('spearmanRho', () => {
  test('perfect positive correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [1, 2, 3, 4, 5];
    expect(spearmanRho(x, y)).toBeCloseTo(1.0, 10);
  });

  test('perfect negative correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [5, 4, 3, 2, 1];
    expect(spearmanRho(x, y)).toBeCloseTo(-1.0, 10);
  });

  test('no correlation', () => {
    // Values arranged to have zero correlation
    const x = [1, 2, 3, 4];
    const y = [2, 4, 1, 3];
    const rho = spearmanRho(x, y);
    expect(Math.abs(rho)).toBeLessThan(0.3);
  });

  test('handles tied values', () => {
    const x = [1, 2, 2, 3];
    const y = [1, 2, 2, 3];
    const rho = spearmanRho(x, y);
    expect(rho).toBeCloseTo(1.0, 5);
  });

  test('throws on mismatched lengths', () => {
    const x = [1, 2, 3];
    const y = [1, 2];
    expect(() => spearmanRho(x, y)).toThrow('Arrays must have same length');
  });

  test('returns 0 for single element', () => {
    const x = [1];
    const y = [5];
    expect(spearmanRho(x, y)).toBe(0);
  });

  test('returns 0 for empty arrays', () => {
    const x: number[] = [];
    const y: number[] = [];
    expect(spearmanRho(x, y)).toBe(0);
  });
});

describe('pearsonCorrelation', () => {
  test('perfect positive correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    expect(pearsonCorrelation(x, y)).toBeCloseTo(1.0, 10);
  });

  test('perfect negative correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2];
    expect(pearsonCorrelation(x, y)).toBeCloseTo(-1.0, 10);
  });

  test('no correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [3, 3, 3, 3, 3]; // constant, so variance = 0
    expect(pearsonCorrelation(x, y)).toBe(0);
  });

  test('returns 0 for single element', () => {
    expect(pearsonCorrelation([1], [1])).toBe(0);
  });
});

describe('kendallTau', () => {
  test('perfect positive correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [1, 2, 3, 4, 5];
    expect(kendallTau(x, y)).toBeCloseTo(1.0, 10);
  });

  test('perfect negative correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [5, 4, 3, 2, 1];
    expect(kendallTau(x, y)).toBeCloseTo(-1.0, 10);
  });

  test('handles ties', () => {
    const x = [1, 2, 2, 3];
    const y = [1, 2, 2, 3];
    const tau = kendallTau(x, y);
    // With ties, tau should still be high positive
    expect(tau).toBeGreaterThan(0.8);
  });

  test('throws on mismatched lengths', () => {
    const x = [1, 2, 3];
    const y = [1, 2];
    expect(() => kendallTau(x, y)).toThrow('Arrays must have same length');
  });

  test('returns 0 for single element', () => {
    expect(kendallTau([1], [1])).toBe(0);
  });

  test('partial correlation', () => {
    // 3 concordant pairs: (1,1)-(2,2), (1,1)-(3,3), (2,2)-(3,3)
    // 1 discordant pair: (2,2)-(3,1), (1,1)-(3,1)
    const x = [1, 2, 3];
    const y = [1, 2, 1];
    const tau = kendallTau(x, y);
    expect(tau).toBeGreaterThan(-1);
    expect(tau).toBeLessThan(1);
  });
});

describe('hoeffdingD', () => {
  test('returns a value for correlated data', () => {
    // Hoeffding's D can detect non-monotonic dependence
    const x = [1, 2, 3, 4, 5, 6, 7, 8];
    const y = [1, 2, 3, 4, 5, 6, 7, 8];
    const d = hoeffdingD(x, y);
    // Just verify it returns a numeric value
    expect(typeof d).toBe('number');
    expect(Number.isFinite(d)).toBe(true);
  });

  test('returns 0 for small samples', () => {
    // Need at least 5 observations
    const x = [1, 2, 3, 4];
    const y = [1, 2, 3, 4];
    expect(hoeffdingD(x, y)).toBe(0);
  });

  test('throws on mismatched lengths', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [1, 2, 3];
    expect(() => hoeffdingD(x, y)).toThrow('Arrays must have same length');
  });

  test('handles exactly 5 elements', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [1, 2, 3, 4, 5];
    const d = hoeffdingD(x, y);
    expect(Number.isFinite(d)).toBe(true);
  });
});

describe('p-value functions', () => {
  test('spearmanPValue returns 1 for n < 3', () => {
    expect(spearmanPValue(0.5, 2)).toBe(1);
  });

  test('spearmanPValue returns 0 for perfect correlation', () => {
    expect(spearmanPValue(1.0, 10)).toBe(0);
    expect(spearmanPValue(-1.0, 10)).toBe(0);
  });

  test('spearmanPValue returns a value for strong correlation', () => {
    const p = spearmanPValue(0.9, 20);
    // P-value should be a non-negative number
    expect(typeof p).toBe('number');
    expect(Number.isFinite(p)).toBe(true);
  });

  test('kendallPValue returns 1 for n < 3', () => {
    expect(kendallPValue(0.5, 2)).toBe(1);
  });

  test('kendallPValue returns 0 for perfect correlation', () => {
    expect(kendallPValue(1.0, 10)).toBe(0);
    expect(kendallPValue(-1.0, 10)).toBe(0);
  });

  test('kendallPValue returns a value for strong correlation', () => {
    const p = kendallPValue(0.9, 20);
    // P-value should be a non-negative number
    expect(typeof p).toBe('number');
    expect(Number.isFinite(p)).toBe(true);
  });
});

describe('interpretCorrelation', () => {
  test('classifies perfect correlation', () => {
    expect(interpretCorrelation(1.0)).toBe('perfect');
    expect(interpretCorrelation(-1.0)).toBe('perfect');
  });

  test('classifies very strong correlation', () => {
    expect(interpretCorrelation(0.95)).toBe('very_strong');
    expect(interpretCorrelation(-0.92)).toBe('very_strong');
  });

  test('classifies strong correlation', () => {
    expect(interpretCorrelation(0.8)).toBe('strong');
    expect(interpretCorrelation(-0.75)).toBe('strong');
  });

  test('classifies moderate correlation', () => {
    expect(interpretCorrelation(0.6)).toBe('moderate');
    expect(interpretCorrelation(-0.55)).toBe('moderate');
  });

  test('classifies weak correlation', () => {
    expect(interpretCorrelation(0.4)).toBe('weak');
    expect(interpretCorrelation(-0.35)).toBe('weak');
  });

  test('classifies negligible correlation', () => {
    expect(interpretCorrelation(0.1)).toBe('negligible');
    expect(interpretCorrelation(0)).toBe('negligible');
    expect(interpretCorrelation(-0.2)).toBe('negligible');
  });
});

describe('analyzeRankCorrelation', () => {
  test('returns complete metrics for correlated data', () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const result = analyzeRankCorrelation(x, y);

    expect(result.spearmanRho).toBeCloseTo(1.0, 5);
    expect(result.kendallTau).toBeCloseTo(1.0, 5);
    expect(typeof result.hoeffdingD).toBe('number');
    expect(typeof result.spearmanPValue).toBe('number');
    expect(typeof result.kendallPValue).toBe('number');
    expect(result.spearmanStrength).toBe('perfect');
    expect(result.kendallStrength).toBe('perfect');
  });

  test('returns all expected fields', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [5, 4, 3, 2, 1];

    const result = analyzeRankCorrelation(x, y);

    expect(result).toHaveProperty('spearmanRho');
    expect(result).toHaveProperty('spearmanPValue');
    expect(result).toHaveProperty('kendallTau');
    expect(result).toHaveProperty('kendallPValue');
    expect(result).toHaveProperty('hoeffdingD');
    expect(result).toHaveProperty('spearmanStrength');
    expect(result).toHaveProperty('kendallStrength');
  });

  test('negative correlation gives negative coefficients', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [5, 4, 3, 2, 1];

    const result = analyzeRankCorrelation(x, y);

    expect(result.spearmanRho).toBeCloseTo(-1.0, 5);
    expect(result.kendallTau).toBeCloseTo(-1.0, 5);
  });
});

describe('compareFrequencyDistributions', () => {
  test('compares identical distributions', () => {
    const freqsA = new Map([
      ['ATG', 10],
      ['TGA', 5],
      ['TAA', 3],
    ]);
    const freqsB = new Map([
      ['ATG', 10],
      ['TGA', 5],
      ['TAA', 3],
    ]);

    const result = compareFrequencyDistributions(freqsA, freqsB);
    expect(result.spearmanRho).toBeCloseTo(1.0, 5);
  });

  test('handles missing keys in one distribution', () => {
    const freqsA = new Map([
      ['ATG', 10],
      ['TGA', 5],
    ]);
    const freqsB = new Map([
      ['ATG', 10],
      ['TAA', 3],
    ]);

    const result = compareFrequencyDistributions(freqsA, freqsB);
    // With missing keys filled as 0, correlation should be positive but not perfect
    expect(result.spearmanRho).toBeGreaterThan(-1);
    expect(result.spearmanRho).toBeLessThan(1);
  });

  test('compares proportional distributions', () => {
    const freqsA = new Map([
      ['A', 10],
      ['B', 20],
      ['C', 30],
    ]);
    const freqsB = new Map([
      ['A', 100],
      ['B', 200],
      ['C', 300],
    ]);

    const result = compareFrequencyDistributions(freqsA, freqsB);
    // Proportional distributions should have perfect rank correlation
    expect(result.spearmanRho).toBeCloseTo(1.0, 5);
  });

  test('handles empty distributions', () => {
    const freqsA = new Map<string, number>();
    const freqsB = new Map<string, number>();

    const result = compareFrequencyDistributions(freqsA, freqsB);
    expect(result.spearmanRho).toBe(0);
  });
});
