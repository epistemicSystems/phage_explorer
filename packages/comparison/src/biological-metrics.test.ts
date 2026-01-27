/**
 * Tests for Biological Metrics Module
 *
 * Tests GC content, ANI estimation, codon usage, amino acid composition,
 * gene content comparison, and dinucleotide bias analysis.
 */

import { describe, test, expect } from 'bun:test';
import {
  calculateGCContent,
  estimateANI,
  analyzeBiologicalMetrics,
  calculateRSCU,
  compareCodonUsage,
  compareAminoAcidUsage,
  compareGeneContent,
  compareDinucleotideBias,
} from './biological-metrics';
import type { GeneInfo } from '@phage-explorer/core';

describe('calculateGCContent', () => {
  test('calculates correct GC content for pure G/C sequence', () => {
    expect(calculateGCContent('GGCC')).toBeCloseTo(100, 1);
    expect(calculateGCContent('GCGC')).toBeCloseTo(100, 1);
  });

  test('calculates correct GC content for pure A/T sequence', () => {
    expect(calculateGCContent('AATT')).toBeCloseTo(0, 1);
    expect(calculateGCContent('TATA')).toBeCloseTo(0, 1);
  });

  test('calculates correct GC content for 50% sequence', () => {
    expect(calculateGCContent('ATGC')).toBeCloseTo(50, 1);
    expect(calculateGCContent('ACGT')).toBeCloseTo(50, 1);
  });

  test('handles lowercase sequences', () => {
    expect(calculateGCContent('atgc')).toBeCloseTo(50, 1);
    expect(calculateGCContent('ATgc')).toBeCloseTo(50, 1);
  });

  test('ignores non-ATGC characters', () => {
    expect(calculateGCContent('ATNCGN')).toBeCloseTo(50, 1); // Only counts ATCG
  });

  test('returns 0 for empty sequence', () => {
    expect(calculateGCContent('')).toBe(0);
  });

  test('returns 0 for all-N sequence', () => {
    expect(calculateGCContent('NNNN')).toBe(0);
  });
});

describe('estimateANI', () => {
  test('returns 100 for identical sequences', () => {
    const seq = 'ATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGC';
    expect(estimateANI(seq, seq)).toBeCloseTo(100, 0);
  });

  test('returns lower value for different sequences', () => {
    const seqA = 'ATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGC';
    const seqB = 'CGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT';
    const ani = estimateANI(seqA, seqB);
    expect(ani).toBeLessThan(100);
    expect(ani).toBeGreaterThanOrEqual(0);
  });

  test('returns 0 for completely different sequences', () => {
    const seqA = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const seqB = 'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT';
    const ani = estimateANI(seqA, seqB);
    // Very low ANI expected
    expect(ani).toBeLessThan(50);
  });

  test('is symmetric', () => {
    const seqA = 'ATGCATGCATGCATGCATGCATGCATGCATGC';
    const seqB = 'ATGCATGCATGCATGCTTTTTTTTTTTTTTTT';
    expect(estimateANI(seqA, seqB)).toBeCloseTo(estimateANI(seqB, seqA), 5);
  });
});

describe('analyzeBiologicalMetrics', () => {
  test('returns all expected fields', () => {
    const seqA = 'ATGCATGCATGCATGC';
    const seqB = 'GCTAGCTAGCTAGCTA';
    const result = analyzeBiologicalMetrics(seqA, seqB);

    expect(result).toHaveProperty('aniScore');
    expect(result).toHaveProperty('aniMethod');
    expect(result).toHaveProperty('gcContentA');
    expect(result).toHaveProperty('gcContentB');
    expect(result).toHaveProperty('gcDifference');
    expect(result).toHaveProperty('gcRatio');
    expect(result).toHaveProperty('lengthA');
    expect(result).toHaveProperty('lengthB');
    expect(result).toHaveProperty('lengthRatio');
    expect(result).toHaveProperty('lengthDifference');
  });

  test('calculates correct lengths', () => {
    const seqA = 'ATGCATGC'; // 8bp
    const seqB = 'ATGCATGCATGC'; // 12bp
    const result = analyzeBiologicalMetrics(seqA, seqB);

    expect(result.lengthA).toBe(8);
    expect(result.lengthB).toBe(12);
    expect(result.lengthDifference).toBe(4);
    expect(result.lengthRatio).toBeCloseTo(8 / 12, 5);
  });

  test('returns method as kmer', () => {
    const result = analyzeBiologicalMetrics('ATGC', 'GCTA');
    expect(result.aniMethod).toBe('kmer');
  });
});

describe('calculateRSCU', () => {
  test('returns RSCU values for all codons', () => {
    const codonCounts = {
      TTT: 10, // Phe
      TTC: 10, // Phe
    };
    const rscu = calculateRSCU(codonCounts);

    // Both Phe codons used equally, RSCU should be 1.0
    expect(rscu.TTT).toBeCloseTo(1.0, 5);
    expect(rscu.TTC).toBeCloseTo(1.0, 5);
  });

  test('handles biased codon usage', () => {
    const codonCounts = {
      TTT: 20, // Phe
      TTC: 0,  // Phe (not used)
    };
    const rscu = calculateRSCU(codonCounts);

    // TTT used exclusively: RSCU = observed/expected = 20/(20/2) = 2.0
    expect(rscu.TTT).toBeCloseTo(2.0, 5);
    expect(rscu.TTC).toBe(0);
  });

  test('handles empty codon counts', () => {
    const rscu = calculateRSCU({});
    expect(rscu.TTT).toBe(0);
    expect(rscu.ATG).toBe(0);
  });
});

describe('compareCodonUsage', () => {
  test('returns all expected fields', () => {
    const countsA = { ATG: 10, TTT: 5, TTC: 5 };
    const countsB = { ATG: 10, TTT: 5, TTC: 5 };
    const result = compareCodonUsage(countsA, countsB);

    expect(result).toHaveProperty('rscuDistanceEuclidean');
    expect(result).toHaveProperty('rscuDistanceManhattan');
    expect(result).toHaveProperty('rscuCosineSimilarity');
    expect(result).toHaveProperty('chiSquareStatistic');
    expect(result).toHaveProperty('chiSquarePValue');
    expect(result).toHaveProperty('degreesOfFreedom');
    expect(result).toHaveProperty('caiA');
    expect(result).toHaveProperty('caiB');
    expect(result).toHaveProperty('caiCorrelation');
    expect(result).toHaveProperty('topDifferentCodons');
  });

  test('identical usage has zero distance', () => {
    const counts = { ATG: 10, TTT: 5, TTC: 5, TAA: 1 };
    const result = compareCodonUsage(counts, counts);

    expect(result.rscuDistanceEuclidean).toBeCloseTo(0, 5);
    expect(result.rscuCosineSimilarity).toBeCloseTo(1, 5);
  });

  test('different usage has non-zero distance', () => {
    const countsA = { TTT: 20, TTC: 0 };  // Biased toward TTT
    const countsB = { TTT: 0, TTC: 20 };  // Biased toward TTC
    const result = compareCodonUsage(countsA, countsB);

    expect(result.rscuDistanceEuclidean).toBeGreaterThan(0);
  });

  test('topDifferentCodons is sorted by difference', () => {
    const countsA = { TTT: 100, TTC: 0, ATG: 50 };
    const countsB = { TTT: 0, TTC: 100, ATG: 50 };
    const result = compareCodonUsage(countsA, countsB);

    const diffs = result.topDifferentCodons.map(c => c.difference);
    for (let i = 1; i < diffs.length; i++) {
      expect(diffs[i]).toBeLessThanOrEqual(diffs[i - 1]);
    }
  });
});

describe('compareAminoAcidUsage', () => {
  test('returns all expected fields', () => {
    const seqA = 'ATGATGATGATG'; // Met-Met-Met-Met
    const seqB = 'ATGATGATGATG';
    const result = compareAminoAcidUsage(seqA, seqB);

    expect(result).toHaveProperty('euclideanDistance');
    expect(result).toHaveProperty('cosineSimilarity');
    expect(result).toHaveProperty('correlationCoefficient');
    expect(result).toHaveProperty('hydrophobicSimilarity');
    expect(result).toHaveProperty('polarSimilarity');
    expect(result).toHaveProperty('chargedSimilarity');
    expect(result).toHaveProperty('topDifferentAAs');
  });

  test('identical sequences have perfect similarity', () => {
    const seq = 'ATGATGATGATGATGATGATGATGATGATG';
    const result = compareAminoAcidUsage(seq, seq);

    expect(result.euclideanDistance).toBeCloseTo(0, 5);
    expect(result.cosineSimilarity).toBeCloseTo(1, 5);
  });

  test('topDifferentAAs contains amino acid info', () => {
    const seqA = 'ATGATGATGATG';
    const seqB = 'TTTTTTTTTTTTTTT';
    const result = compareAminoAcidUsage(seqA, seqB);

    expect(result.topDifferentAAs.length).toBeGreaterThan(0);
    expect(result.topDifferentAAs[0]).toHaveProperty('aminoAcid');
    expect(result.topDifferentAAs[0]).toHaveProperty('name');
    expect(result.topDifferentAAs[0]).toHaveProperty('property');
  });
});

describe('compareGeneContent', () => {
  let geneId = 0;
  const makeGene = (name: string, start: number, end: number): GeneInfo => ({
    id: ++geneId,
    name,
    locusTag: name,
    startPos: start,
    endPos: end,
    strand: '+',
    product: 'test product',
    type: 'CDS',
  });

  test('returns all expected fields', () => {
    const genesA = [makeGene('gene1', 0, 100), makeGene('gene2', 200, 300)];
    const genesB = [makeGene('gene1', 0, 100), makeGene('gene3', 200, 300)];
    const result = compareGeneContent(genesA, genesB, 1000, 1000);

    expect(result).toHaveProperty('genesA');
    expect(result).toHaveProperty('genesB');
    expect(result).toHaveProperty('sharedGeneNames');
    expect(result).toHaveProperty('uniqueToA');
    expect(result).toHaveProperty('uniqueToB');
    expect(result).toHaveProperty('geneDensityA');
    expect(result).toHaveProperty('geneDensityB');
    expect(result).toHaveProperty('geneNameJaccard');
    expect(result).toHaveProperty('avgGeneLengthA');
    expect(result).toHaveProperty('avgGeneLengthB');
  });

  test('correctly counts shared and unique genes', () => {
    const genesA = [makeGene('shared', 0, 100), makeGene('uniqueA', 200, 300)];
    const genesB = [makeGene('shared', 0, 100), makeGene('uniqueB', 200, 300)];
    const result = compareGeneContent(genesA, genesB, 1000, 1000);

    expect(result.sharedGeneNames).toBe(1);
    expect(result.uniqueToA).toBe(1);
    expect(result.uniqueToB).toBe(1);
  });

  test('calculates correct gene densities', () => {
    const genesA = [makeGene('g1', 0, 100)];
    const result = compareGeneContent(genesA, [], 1000, 1000);

    // 1 gene per 1kb = 1.0 genes/kb
    expect(result.geneDensityA).toBeCloseTo(1.0, 5);
    expect(result.geneDensityB).toBe(0);
  });

  test('calculates correct average gene lengths', () => {
    const genesA = [
      makeGene('g1', 0, 100),   // length 100
      makeGene('g2', 200, 400), // length 200
    ];
    const result = compareGeneContent(genesA, [], 1000, 1000);

    // Average: (100 + 200) / 2 = 150
    expect(result.avgGeneLengthA).toBeCloseTo(150, 5);
  });

  test('handles empty gene lists', () => {
    const result = compareGeneContent([], [], 1000, 1000);

    expect(result.genesA).toBe(0);
    expect(result.genesB).toBe(0);
    expect(result.sharedGeneNames).toBe(0);
    expect(result.geneNameJaccard).toBe(0);
  });

  test('calculates correct Jaccard index', () => {
    const genesA = [makeGene('a', 0, 100), makeGene('b', 0, 100)];
    const genesB = [makeGene('b', 0, 100), makeGene('c', 0, 100)];
    const result = compareGeneContent(genesA, genesB, 1000, 1000);

    // Shared: {b}, Union: {a, b, c} = 3, Jaccard = 1/3
    expect(result.geneNameJaccard).toBeCloseTo(1 / 3, 5);
  });
});

describe('compareDinucleotideBias', () => {
  test('returns all expected fields', () => {
    const seqA = 'ATGCATGCATGCATGC';
    const seqB = 'GCTAGCTAGCTAGCTA';
    const result = compareDinucleotideBias(seqA, seqB);

    expect(result).toHaveProperty('dinucleotideCorrelation');
    expect(result).toHaveProperty('cpgRatioA');
    expect(result).toHaveProperty('cpgRatioB');
    expect(result).toHaveProperty('mostDifferentDinucs');
  });

  test('identical sequences have perfect correlation', () => {
    const seq = 'ATGCATGCATGCATGCATGCATGCATGCATGC';
    const result = compareDinucleotideBias(seq, seq);

    expect(result.dinucleotideCorrelation).toBeCloseTo(1.0, 5);
  });

  test('mostDifferentDinucs is sorted by difference', () => {
    const seqA = 'ATATATAT'; // AT-heavy
    const seqB = 'GCGCGCGC'; // GC-heavy
    const result = compareDinucleotideBias(seqA, seqB);

    const diffs = result.mostDifferentDinucs.map(d => d.diff);
    for (let i = 1; i < diffs.length; i++) {
      expect(diffs[i]).toBeLessThanOrEqual(diffs[i - 1]);
    }
  });

  test('calculates CpG ratio', () => {
    // CG-rich sequence
    const seq = 'CGCGCGCGCGCGCGCGCGCG';
    const result = compareDinucleotideBias(seq, seq);

    // Should have high CpG ratio
    expect(result.cpgRatioA).toBeGreaterThan(0);
    expect(typeof result.cpgRatioB).toBe('number');
  });

  test('handles empty sequences', () => {
    const result = compareDinucleotideBias('', '');

    expect(result.dinucleotideCorrelation).toBe(0);
    expect(result.cpgRatioA).toBe(0);
    expect(result.cpgRatioB).toBe(0);
  });
});
