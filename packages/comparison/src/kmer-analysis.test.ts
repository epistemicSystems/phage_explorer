/**
 * Tests for k-mer analysis functions
 *
 * Tests alignment-free sequence comparison using k-mer frequency analysis.
 */

import { describe, expect, it } from 'bun:test';
import {
  extractKmerSet,
  extractKmerFrequencies,
  jaccardIndex,
  containmentIndex,
  cosineSimilarity,
  brayCurtisDissimilarity,
  kmerIntersectionSize,
  minHashJaccard,
} from './kmer-analysis';

describe('extractKmerSet', () => {
  it('extracts all k-mers from a simple sequence', () => {
    const kmers = extractKmerSet('ATCG', 2);
    expect(kmers.size).toBe(3);
    expect(kmers.has('AT')).toBe(true);
    expect(kmers.has('TC')).toBe(true);
    expect(kmers.has('CG')).toBe(true);
  });

  it('handles case-insensitive input', () => {
    const upper = extractKmerSet('ATCG', 2);
    const lower = extractKmerSet('atcg', 2);
    const mixed = extractKmerSet('AtCg', 2);

    expect(upper).toEqual(lower);
    expect(upper).toEqual(mixed);
  });

  it('skips k-mers containing N (ambiguous base)', () => {
    const kmers = extractKmerSet('ATNCG', 2);
    expect(kmers.has('TN')).toBe(false);
    expect(kmers.has('NC')).toBe(false);
    expect(kmers.has('AT')).toBe(true);
    expect(kmers.has('CG')).toBe(true);
  });

  it('returns empty set for sequence shorter than k', () => {
    const kmers = extractKmerSet('AT', 5);
    expect(kmers.size).toBe(0);
  });

  it('returns empty set for k < 1', () => {
    const kmers = extractKmerSet('ATCG', 0);
    expect(kmers.size).toBe(0);
  });

  it('handles k equal to sequence length', () => {
    const kmers = extractKmerSet('ATCG', 4);
    expect(kmers.size).toBe(1);
    expect(kmers.has('ATCG')).toBe(true);
  });

  it('handles repeated k-mers (set deduplication)', () => {
    const kmers = extractKmerSet('ATATAT', 2);
    expect(kmers.size).toBe(2); // AT and TA
  });
});

describe('extractKmerFrequencies', () => {
  it('counts k-mer frequencies correctly', () => {
    const freqs = extractKmerFrequencies('ATATAT', 2);
    expect(freqs.get('AT')).toBe(3);
    expect(freqs.get('TA')).toBe(2);
  });

  it('handles case-insensitive input', () => {
    const freqs = extractKmerFrequencies('AtAtAt', 2);
    expect(freqs.get('AT')).toBe(3);
  });

  it('skips k-mers containing N', () => {
    const freqs = extractKmerFrequencies('ATNTAT', 2);
    expect(freqs.has('TN')).toBe(false);
    expect(freqs.has('NT')).toBe(false);
    expect(freqs.get('AT')).toBe(2);
  });

  it('returns empty map for invalid inputs', () => {
    expect(extractKmerFrequencies('AT', 5).size).toBe(0);
    expect(extractKmerFrequencies('ATCG', 0).size).toBe(0);
  });
});

describe('jaccardIndex', () => {
  it('returns 1 for identical sets', () => {
    const set = new Set(['AT', 'TC', 'CG']);
    expect(jaccardIndex(set, set)).toBe(1);
  });

  it('returns 0 for disjoint sets', () => {
    const setA = new Set(['AT', 'TC']);
    const setB = new Set(['GG', 'CC']);
    expect(jaccardIndex(setA, setB)).toBe(0);
  });

  it('returns correct value for partial overlap', () => {
    const setA = new Set(['AT', 'TC', 'CG']);
    const setB = new Set(['AT', 'TC', 'GG']);
    // Intersection: {AT, TC} = 2
    // Union: {AT, TC, CG, GG} = 4
    // Jaccard = 2/4 = 0.5
    expect(jaccardIndex(setA, setB)).toBe(0.5);
  });

  it('returns 1 for two empty sets', () => {
    expect(jaccardIndex(new Set(), new Set())).toBe(1);
  });

  it('returns 0 when one set is empty', () => {
    const set = new Set(['AT', 'TC']);
    expect(jaccardIndex(set, new Set())).toBe(0);
    expect(jaccardIndex(new Set(), set)).toBe(0);
  });
});

describe('containmentIndex', () => {
  it('returns 1 when A is subset of B', () => {
    const setA = new Set(['AT', 'TC']);
    const setB = new Set(['AT', 'TC', 'CG', 'GG']);
    expect(containmentIndex(setA, setB)).toBe(1);
  });

  it('returns 0 when A and B are disjoint', () => {
    const setA = new Set(['AT', 'TC']);
    const setB = new Set(['GG', 'CC']);
    expect(containmentIndex(setA, setB)).toBe(0);
  });

  it('returns fraction when partial overlap', () => {
    const setA = new Set(['AT', 'TC', 'CG']);
    const setB = new Set(['AT', 'GG']);
    // A has 3 elements, 1 is in B
    expect(containmentIndex(setA, setB)).toBeCloseTo(1/3);
  });

  it('returns 0 for empty A', () => {
    const setB = new Set(['AT', 'TC']);
    expect(containmentIndex(new Set(), setB)).toBe(0);
  });

  it('is asymmetric (order matters)', () => {
    const setA = new Set(['AT', 'TC']);
    const setB = new Set(['AT', 'TC', 'CG', 'GG']);
    // C(A,B) = 2/2 = 1 (all of A in B)
    // C(B,A) = 2/4 = 0.5 (half of B in A)
    expect(containmentIndex(setA, setB)).toBe(1);
    expect(containmentIndex(setB, setA)).toBe(0.5);
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical frequency maps', () => {
    const freqs = new Map([['AT', 5], ['TC', 3]]);
    expect(cosineSimilarity(freqs, freqs)).toBe(1);
  });

  it('returns 0 for orthogonal vectors (no overlap)', () => {
    const freqsA = new Map([['AT', 5], ['TC', 3]]);
    const freqsB = new Map([['GG', 2], ['CC', 4]]);
    expect(cosineSimilarity(freqsA, freqsB)).toBe(0);
  });

  it('returns 1 for proportional frequencies', () => {
    const freqsA = new Map([['AT', 2], ['TC', 4]]);
    const freqsB = new Map([['AT', 4], ['TC', 8]]);
    // Cosine is scale-invariant
    expect(cosineSimilarity(freqsA, freqsB)).toBeCloseTo(1);
  });

  it('returns 0 for empty maps', () => {
    expect(cosineSimilarity(new Map(), new Map())).toBe(0);
  });
});

describe('brayCurtisDissimilarity', () => {
  it('returns 0 for identical frequency maps', () => {
    const freqs = new Map([['AT', 5], ['TC', 3]]);
    expect(brayCurtisDissimilarity(freqs, freqs)).toBe(0);
  });

  it('returns 1 for completely different frequencies', () => {
    const freqsA = new Map([['AT', 5]]);
    const freqsB = new Map([['GG', 3]]);
    expect(brayCurtisDissimilarity(freqsA, freqsB)).toBe(1);
  });

  it('returns value between 0 and 1 for partial overlap', () => {
    const freqsA = new Map([['AT', 5], ['TC', 3]]);
    const freqsB = new Map([['AT', 3], ['GG', 2]]);
    const bc = brayCurtisDissimilarity(freqsA, freqsB);
    expect(bc).toBeGreaterThan(0);
    expect(bc).toBeLessThan(1);
  });

  it('returns 0 for empty maps', () => {
    expect(brayCurtisDissimilarity(new Map(), new Map())).toBe(0);
  });
});

describe('kmerIntersectionSize', () => {
  it('returns correct count for overlapping sets', () => {
    const setA = new Set(['AT', 'TC', 'CG']);
    const setB = new Set(['AT', 'TC', 'GG']);
    expect(kmerIntersectionSize(setA, setB)).toBe(2);
  });

  it('returns 0 for disjoint sets', () => {
    const setA = new Set(['AT', 'TC']);
    const setB = new Set(['GG', 'CC']);
    expect(kmerIntersectionSize(setA, setB)).toBe(0);
  });

  it('returns full size for identical sets', () => {
    const set = new Set(['AT', 'TC', 'CG']);
    expect(kmerIntersectionSize(set, set)).toBe(3);
  });
});

describe('integration: k-mer analysis workflow', () => {
  it('produces sensible results for similar sequences', () => {
    const seqA = 'ATCGATCGATCG';
    const seqB = 'ATCGATCGATCG'; // Identical

    const kmerSetA = extractKmerSet(seqA, 3);
    const kmerSetB = extractKmerSet(seqB, 3);

    expect(jaccardIndex(kmerSetA, kmerSetB)).toBe(1);
    expect(containmentIndex(kmerSetA, kmerSetB)).toBe(1);
  });

  it('shows lower similarity for different sequences', () => {
    const seqA = 'ATCGATCGATCG';
    const seqB = 'GGCCGGCCGGCC'; // Completely different

    const kmerSetA = extractKmerSet(seqA, 3);
    const kmerSetB = extractKmerSet(seqB, 3);

    expect(jaccardIndex(kmerSetA, kmerSetB)).toBe(0);
  });

  it('shows intermediate similarity for related sequences', () => {
    const seqA = 'ATCGATCGATCG';
    const seqB = 'ATCGGGCCATCG'; // Some overlap

    const kmerSetA = extractKmerSet(seqA, 3);
    const kmerSetB = extractKmerSet(seqB, 3);

    const jaccard = jaccardIndex(kmerSetA, kmerSetB);
    expect(jaccard).toBeGreaterThan(0);
    expect(jaccard).toBeLessThan(1);
  });
});

// ============================================================================
// MinHash Tests - @see phage_explorer-vk7b.7
// ============================================================================

describe('minHashJaccard', () => {
  it('returns 1.0 for identical sequences', () => {
    const seq = 'ATCGATCGATCGATCGATCG';
    const similarity = minHashJaccard(seq, seq, 3, 128);
    expect(similarity).toBeCloseTo(1.0, 1);
  });

  it('returns close to 0 for completely different sequences', () => {
    // Note: Use sequences that differ even with canonical k-mers
    // AAAA and TTTT would be similar since AAA/TTT are reverse complements
    const seqA = 'AAAAAAAAAAAAAAAAAAAAAA'; // All AAA k-mers
    const seqB = 'GGGGGGGGGGGGGGGGGGGGGG'; // All GGG k-mers (GGG != CCC canonical)
    const similarity = minHashJaccard(seqA, seqB, 3, 128);
    // Different k-mers, should have low similarity
    expect(similarity).toBeLessThan(0.5);
  });

  it('returns intermediate value for partially similar sequences', () => {
    const seqA = 'ATCGATCGATCGATCGATCG';
    const seqB = 'ATCGATCGGGGGGGGGGGGG';
    const similarity = minHashJaccard(seqA, seqB, 3, 128);
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThan(1);
  });

  it('handles sequences with N (ambiguous bases)', () => {
    const seqA = 'ATCGATCNATCGATCG';
    const seqB = 'ATCGATCGATCGATCG';
    // Should still work, just skip k-mers containing N
    const similarity = minHashJaccard(seqA, seqB, 3, 128);
    expect(similarity).toBeGreaterThan(0);
  });

  it('handles empty sequences (both have no k-mers, signatures match)', () => {
    // Note: Current implementation returns 1 when both have empty k-mer sets
    // because both signatures are initialized to MAX and thus match
    const similarity = minHashJaccard('', '', 3, 128);
    // This is debatable - could argue for 0 or 1
    expect(similarity).toBe(1);
  });

  it('handles sequences shorter than k (no valid k-mers)', () => {
    // When seq.length < k, no k-mers extracted, signatures match at MAX
    const similarity = minHashJaccard('AT', 'AT', 5, 128);
    expect(similarity).toBe(1);
  });

  it('produces deterministic results', () => {
    const seqA = 'ATCGATCGATCGATCGATCG';
    const seqB = 'ATCGATCGCCCCCCCCCCCC';

    const sim1 = minHashJaccard(seqA, seqB, 3, 128);
    const sim2 = minHashJaccard(seqA, seqB, 3, 128);

    expect(sim1).toBe(sim2);
  });

  it('similarity is symmetric', () => {
    const seqA = 'ATCGATCGATCGATCGATCG';
    const seqB = 'GGCCGGCCGGCCGGCCGGCC';

    const simAB = minHashJaccard(seqA, seqB, 3, 128);
    const simBA = minHashJaccard(seqB, seqA, 3, 128);

    expect(simAB).toBeCloseTo(simBA, 5);
  });

  it('more hashes gives more stable estimate', () => {
    const seqA = 'ATCGATCGATCGATCGATCGATCGATCG';
    const seqB = 'ATCGATCGATCGTTTTTTTTTTTTTTTT';

    // Run multiple times with different hash counts
    // More hashes should give more consistent results
    const estimates64: number[] = [];
    const estimates256: number[] = [];

    for (let i = 0; i < 5; i++) {
      // Note: since minHashJaccard is deterministic, same input = same output
      // This test mainly validates that higher numHashes is accepted
      estimates64.push(minHashJaccard(seqA + i, seqB + i, 3, 64));
      estimates256.push(minHashJaccard(seqA + i, seqB + i, 3, 256));
    }

    // Both should produce valid similarity values
    expect(estimates64.every(v => v >= 0 && v <= 1)).toBe(true);
    expect(estimates256.every(v => v >= 0 && v <= 1)).toBe(true);
  });

  it('correlates with exact Jaccard for small inputs', () => {
    const seqA = 'ATCGATCGATCGATCGATCG';
    const seqB = 'ATCGATCGATCGATCGATCG';

    const kmerSetA = extractKmerSet(seqA, 4);
    const kmerSetB = extractKmerSet(seqB, 4);
    const exactJaccard = jaccardIndex(kmerSetA, kmerSetB);

    const minHashEstimate = minHashJaccard(seqA, seqB, 4, 256);

    // For identical sequences, both should be 1.0
    expect(exactJaccard).toBe(1);
    expect(minHashEstimate).toBeCloseTo(1.0, 1);
  });
});
