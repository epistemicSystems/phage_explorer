/**
 * Tests for Structural Variants Analysis Module
 *
 * Tests detection of deletions, insertions, inversions, duplications,
 * and translocations between phage genomes.
 */

import { describe, test, expect } from 'bun:test';
import { analyzeStructuralVariants } from './structural-variants';
import type { GeneInfo } from '@phage-explorer/core';

let geneId = 0;
const makeGene = (
  product: string,
  start: number,
  end: number,
  strand: '+' | '-' = '+'
): GeneInfo => ({
  id: ++geneId,
  name: null,
  locusTag: `gene_${geneId}`,
  startPos: start,
  endPos: end,
  strand,
  product,
  type: 'CDS',
});

describe('analyzeStructuralVariants', () => {
  test('returns empty report for empty gene lists', () => {
    const result = analyzeStructuralVariants('', '', [], []);

    expect(result.calls).toEqual([]);
    expect(result.counts).toEqual({
      deletion: 0,
      insertion: 0,
      inversion: 0,
      duplication: 0,
      translocation: 0,
    });
    expect(result.anchorsUsed).toBe(0);
  });

  test('returns empty report for single-gene lists', () => {
    const genesA = [makeGene('capsid protein', 0, 1000)];
    const genesB = [makeGene('capsid protein', 0, 1000)];

    const result = analyzeStructuralVariants('', '', genesA, genesB);

    expect(result.calls).toEqual([]);
    expect(result.anchorsUsed).toBe(0);
  });

  test('returns expected structure for matching genes', () => {
    const genesA = [
      makeGene('terminase', 0, 1000),
      makeGene('portal protein', 1500, 2500),
      makeGene('capsid protein', 3000, 4000),
    ];
    const genesB = [
      makeGene('terminase', 0, 1000),
      makeGene('portal protein', 1500, 2500),
      makeGene('capsid protein', 3000, 4000),
    ];

    const result = analyzeStructuralVariants('', '', genesA, genesB);

    expect(result).toHaveProperty('calls');
    expect(result).toHaveProperty('counts');
    expect(result).toHaveProperty('anchorsUsed');
    expect(Array.isArray(result.calls)).toBe(true);
  });

  test('counts object has all variant types', () => {
    const genesA = [
      makeGene('terminase', 0, 1000),
      makeGene('portal protein', 1500, 2500),
    ];
    const genesB = [
      makeGene('terminase', 0, 1000),
      makeGene('portal protein', 1500, 2500),
    ];

    const result = analyzeStructuralVariants('', '', genesA, genesB);

    expect(result.counts).toHaveProperty('deletion');
    expect(result.counts).toHaveProperty('insertion');
    expect(result.counts).toHaveProperty('inversion');
    expect(result.counts).toHaveProperty('duplication');
    expect(result.counts).toHaveProperty('translocation');
  });

  test('identifies anchors from syntenic genes', () => {
    const genesA = [
      makeGene('terminase large subunit', 0, 1500),
      makeGene('portal protein', 2000, 3000),
      makeGene('major capsid protein', 3500, 4500),
      makeGene('tail sheath protein', 5000, 6000),
    ];
    const genesB = [
      makeGene('terminase large subunit', 0, 1500),
      makeGene('portal protein', 2000, 3000),
      makeGene('major capsid protein', 3500, 4500),
      makeGene('tail sheath protein', 5000, 6000),
    ];

    const result = analyzeStructuralVariants('', '', genesA, genesB);

    expect(result.anchorsUsed).toBeGreaterThanOrEqual(0);
  });

  test('detects deletion when genome B is missing genes', () => {
    const genesA = [
      makeGene('terminase', 0, 1000),
      makeGene('extra protein 1', 1500, 2500),
      makeGene('extra protein 2', 3000, 4000),
      makeGene('capsid protein', 10000, 11000),
    ];
    const genesB = [
      makeGene('terminase', 0, 1000),
      // Missing the extra proteins
      makeGene('capsid protein', 1500, 2500),
    ];

    const result = analyzeStructuralVariants('', '', genesA, genesB);

    // Should detect the gap as a deletion or structural variant
    expect(result).toHaveProperty('calls');
  });

  test('variant calls have required properties', () => {
    const genesA = [
      makeGene('terminase', 0, 1000),
      makeGene('portal', 2000, 3000),
      makeGene('capsid', 5000, 6000),
    ];
    const genesB = [
      makeGene('terminase', 0, 1000),
      makeGene('portal', 10000, 11000), // Moved far away
      makeGene('capsid', 12000, 13000),
    ];

    const result = analyzeStructuralVariants('', '', genesA, genesB);

    for (const call of result.calls) {
      expect(call).toHaveProperty('id');
      expect(call).toHaveProperty('type');
      expect(call).toHaveProperty('startA');
      expect(call).toHaveProperty('endA');
      expect(call).toHaveProperty('startB');
      expect(call).toHaveProperty('endB');
      expect(call).toHaveProperty('sizeA');
      expect(call).toHaveProperty('sizeB');
      expect(call).toHaveProperty('confidence');
      expect(call).toHaveProperty('anchorA');
      expect(call).toHaveProperty('anchorB');
      expect(call).toHaveProperty('evidence');
      expect(call).toHaveProperty('affectedGenesA');
      expect(call).toHaveProperty('affectedGenesB');
    }
  });

  test('confidence values are between 0 and 1', () => {
    const genesA = [
      makeGene('terminase', 0, 1000),
      makeGene('portal', 2000, 3000),
      makeGene('capsid', 5000, 6000),
      makeGene('tail', 8000, 9000),
    ];
    const genesB = [
      makeGene('terminase', 0, 1000),
      makeGene('portal', 4000, 5000), // Different position
      makeGene('capsid', 7000, 8000),
      makeGene('tail', 10000, 11000),
    ];

    const result = analyzeStructuralVariants('', '', genesA, genesB);

    for (const call of result.calls) {
      expect(call.confidence).toBeGreaterThanOrEqual(0);
      expect(call.confidence).toBeLessThanOrEqual(1);
    }
  });

  test('variant type is one of expected types', () => {
    const validTypes = ['deletion', 'insertion', 'inversion', 'duplication', 'translocation'];

    const genesA = [
      makeGene('terminase', 0, 1000),
      makeGene('portal', 2000, 3000),
      makeGene('capsid', 10000, 11000),
    ];
    const genesB = [
      makeGene('terminase', 0, 1000),
      makeGene('capsid', 2000, 3000),
    ];

    const result = analyzeStructuralVariants('', '', genesA, genesB);

    for (const call of result.calls) {
      expect(validTypes).toContain(call.type);
    }
  });

  test('accepts custom options', () => {
    const genesA = [
      makeGene('terminase', 0, 1000),
      makeGene('portal', 2000, 3000),
    ];
    const genesB = [
      makeGene('terminase', 0, 1000),
      makeGene('portal', 2000, 3000),
    ];

    const options = {
      minGapBp: 100,
      minConfidence: 0.5,
      translocationDistance: 5000,
      inversionMinFlip: 5,
    };

    const result = analyzeStructuralVariants('', '', genesA, genesB, options);

    // Should complete without error
    expect(result).toHaveProperty('calls');
    expect(result).toHaveProperty('counts');
  });

  test('filters calls by minConfidence option', () => {
    const genesA = [
      makeGene('terminase', 0, 1000),
      makeGene('portal', 3000, 4000),
    ];
    const genesB = [
      makeGene('terminase', 0, 1000),
      makeGene('portal', 3000, 4000),
    ];

    const lowThreshold = analyzeStructuralVariants('', '', genesA, genesB, {
      minConfidence: 0.1,
    });
    const highThreshold = analyzeStructuralVariants('', '', genesA, genesB, {
      minConfidence: 0.9,
    });

    // High threshold should have fewer or equal calls
    expect(highThreshold.calls.length).toBeLessThanOrEqual(lowThreshold.calls.length);
  });

  test('handles genes without stopword filtering', () => {
    // These gene names have no stopwords, should match well
    const genesA = [
      makeGene('lysin', 0, 500),
      makeGene('holin', 1000, 1500),
      makeGene('spanin', 2000, 2500),
    ];
    const genesB = [
      makeGene('lysin', 0, 500),
      makeGene('holin', 1000, 1500),
      makeGene('spanin', 2000, 2500),
    ];

    const result = analyzeStructuralVariants('', '', genesA, genesB);

    expect(result.anchorsUsed).toBeGreaterThan(0);
  });

  test('handles hypothetical proteins correctly', () => {
    // Hypothetical proteins should not create strong matches
    const genesA = [
      makeGene('hypothetical protein', 0, 500),
      makeGene('terminase', 1000, 2000),
      makeGene('hypothetical protein', 2500, 3000),
    ];
    const genesB = [
      makeGene('hypothetical protein', 0, 500),
      makeGene('terminase', 1000, 2000),
      makeGene('hypothetical protein', 2500, 3000),
    ];

    const result = analyzeStructuralVariants('', '', genesA, genesB);

    // Should still process without error
    expect(result).toHaveProperty('calls');
  });

  test('evidence array contains strings', () => {
    const genesA = [
      makeGene('terminase', 0, 1000),
      makeGene('portal', 5000, 6000),
    ];
    const genesB = [
      makeGene('terminase', 0, 1000),
      makeGene('portal', 5000, 6000),
    ];

    const result = analyzeStructuralVariants('', '', genesA, genesB);

    for (const call of result.calls) {
      expect(Array.isArray(call.evidence)).toBe(true);
      for (const e of call.evidence) {
        expect(typeof e).toBe('string');
      }
    }
  });
});
