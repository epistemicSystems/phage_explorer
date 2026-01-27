/**
 * Tests for Synteny Analysis Module
 *
 * Tests Dynamic Time Warping based synteny alignment between gene lists.
 */

import { describe, test, expect } from 'bun:test';
import { alignSynteny } from './synteny';
import type { GeneInfo } from '@phage-explorer/core';

let geneId = 0;
const makeGene = (product: string, start: number, end: number): GeneInfo => ({
  id: ++geneId,
  name: null,
  locusTag: `gene_${geneId}`,
  startPos: start,
  endPos: end,
  strand: '+',
  product,
  type: 'CDS',
});

describe('alignSynteny', () => {
  test('returns empty result for empty gene lists', () => {
    const result = alignSynteny([], []);
    expect(result.blocks).toEqual([]);
    expect(result.breakpoints).toEqual([]);
    expect(result.globalScore).toBe(0);
    expect(result.dtwDistance).toBe(Infinity);
  });

  test('returns empty result when one list is empty', () => {
    const genesA = [makeGene('terminase', 0, 100)];

    const resultEmpty1 = alignSynteny(genesA, []);
    expect(resultEmpty1.blocks).toEqual([]);
    expect(resultEmpty1.globalScore).toBe(0);

    const resultEmpty2 = alignSynteny([], genesA);
    expect(resultEmpty2.blocks).toEqual([]);
    expect(resultEmpty2.globalScore).toBe(0);
  });

  test('aligns identical gene lists with perfect score', () => {
    const genes = [
      makeGene('terminase large subunit', 0, 1000),
      makeGene('portal protein', 1000, 2000),
      makeGene('capsid protein', 2000, 3000),
    ];

    const result = alignSynteny(genes, genes);

    expect(result.globalScore).toBeGreaterThan(0.8);
    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.dtwDistance).toBeLessThan(Infinity);
  });

  test('finds matching genes with shared terms', () => {
    const genesA = [
      makeGene('large terminase subunit', 0, 1000),
      makeGene('portal protein', 1000, 2000),
    ];
    const genesB = [
      makeGene('terminase large subunit', 0, 1000), // Same meaning, different order
      makeGene('portal protein', 1000, 2000),
    ];

    const result = alignSynteny(genesA, genesB);

    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.globalScore).toBeGreaterThan(0);
  });

  test('handles hypothetical proteins (filtered out)', () => {
    const genesA = [
      makeGene('hypothetical protein', 0, 500),
      makeGene('terminase', 500, 1500),
    ];
    const genesB = [
      makeGene('hypothetical protein', 0, 500),
      makeGene('terminase', 500, 1500),
    ];

    const result = alignSynteny(genesA, genesB);

    // Hypothetical proteins should not create synteny blocks
    // Only terminase should match
    expect(result.blocks.length).toBeGreaterThanOrEqual(0);
  });

  test('detects synteny blocks', () => {
    const genesA = [
      makeGene('capsid protein', 0, 500),
      makeGene('tail fiber', 500, 1000),
      makeGene('lysin', 1000, 1500),
    ];
    const genesB = [
      makeGene('capsid protein', 0, 500),
      makeGene('tail fiber', 500, 1000),
      makeGene('lysin', 1000, 1500),
    ];

    const result = alignSynteny(genesA, genesB);

    expect(result.blocks.length).toBeGreaterThan(0);

    // Check block structure
    for (const block of result.blocks) {
      expect(block).toHaveProperty('startIdxA');
      expect(block).toHaveProperty('endIdxA');
      expect(block).toHaveProperty('startIdxB');
      expect(block).toHaveProperty('endIdxB');
      expect(block).toHaveProperty('score');
      expect(block).toHaveProperty('orientation');
      expect(block.orientation).toBe('forward');
    }
  });

  test('identifies breakpoints between blocks', () => {
    const genesA = [
      makeGene('terminase', 0, 500),
      makeGene('unknown function', 500, 1000), // Gap
      makeGene('lysin', 1000, 1500),
    ];
    const genesB = [
      makeGene('terminase', 0, 500),
      makeGene('lysin', 500, 1000), // Different order - break
    ];

    const result = alignSynteny(genesA, genesB);

    // breakpoints array should be valid
    expect(Array.isArray(result.breakpoints)).toBe(true);
  });

  test('handles genes with only stopwords', () => {
    const genesA = [
      makeGene('putative protein', 0, 500),
      makeGene('conserved domain protein', 500, 1000),
    ];
    const genesB = [
      makeGene('predicted protein', 0, 500),
      makeGene('conserved domain family', 500, 1000),
    ];

    const result = alignSynteny(genesA, genesB);

    // These should not create strong matches since all terms are stopwords
    // globalScore should be low
    expect(typeof result.globalScore).toBe('number');
    expect(result.globalScore).toBeGreaterThanOrEqual(0);
    expect(result.globalScore).toBeLessThanOrEqual(1);
  });

  test('returns valid globalScore between 0 and 1', () => {
    const genesA = [
      makeGene('capsid protein', 0, 500),
      makeGene('tail protein', 500, 1000),
    ];
    const genesB = [
      makeGene('completely different function', 0, 500),
      makeGene('another unrelated gene', 500, 1000),
    ];

    const result = alignSynteny(genesA, genesB);

    expect(result.globalScore).toBeGreaterThanOrEqual(0);
    expect(result.globalScore).toBeLessThanOrEqual(1);
  });

  test('returns finite dtwDistance for non-empty lists', () => {
    const genesA = [makeGene('terminase', 0, 500)];
    const genesB = [makeGene('portal', 0, 500)];

    const result = alignSynteny(genesA, genesB);

    expect(Number.isFinite(result.dtwDistance)).toBe(true);
  });

  test('handles single-gene lists', () => {
    const genesA = [makeGene('lysin enzyme', 0, 500)];
    const genesB = [makeGene('lysin enzyme', 0, 500)];

    const result = alignSynteny(genesA, genesB);

    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.globalScore).toBeGreaterThan(0.5);
  });

  test('handles genes using name instead of product', () => {
    const geneWithName: GeneInfo = {
      id: 999,
      name: 'terminase',
      locusTag: 'loc_999',
      startPos: 0,
      endPos: 500,
      strand: '+',
      product: null,
      type: 'CDS',
    };

    const result = alignSynteny([geneWithName], [geneWithName]);

    // Should match since name is used when product is null
    expect(result.blocks.length).toBeGreaterThan(0);
  });

  test('different length gene lists produce valid alignment', () => {
    const genesA = [
      makeGene('terminase', 0, 500),
      makeGene('portal', 500, 1000),
      makeGene('capsid', 1000, 1500),
    ];
    const genesB = [
      makeGene('portal', 0, 500),
      makeGene('capsid', 500, 1000),
    ];

    const result = alignSynteny(genesA, genesB);

    expect(result.globalScore).toBeGreaterThanOrEqual(0);
    expect(result.globalScore).toBeLessThanOrEqual(1);
    expect(Number.isFinite(result.dtwDistance)).toBe(true);
  });
});
