import { describe, expect, test } from 'bun:test';
import {
  computeProteinSelfSimilarityMatrix,
  computeNovelty,
  nearestNeighbors,
  encodeFloat32VectorLE,
  decodeFloat32VectorLE,
  buildEmbeddingMap,
  attachEmbeddingInfo,
  type FoldEmbedding,
} from './fold-embeddings';
import type { GeneInfo } from './types';

// Note: cosineDistance is intentionally not exported; tests cover public APIs.

describe('fold-embeddings', () => {
  describe('computeProteinSelfSimilarityMatrix', () => {
    test('generates matrix for standard sequence', () => {
      // Repetitive sequence should show structure
      const seq = 'ABCDE'.repeat(10); // len 50
      const result = computeProteinSelfSimilarityMatrix(seq, { k: 2, bins: 5 });
      
      expect(result.bins).toBe(5);
      expect(result.matrix.length).toBe(25);
      
      // Diagonal should be 1.0
      expect(result.matrix[0]).toBeCloseTo(1.0);
      expect(result.matrix[6]).toBeCloseTo(1.0); // 1*5 + 1
    });

    test('handles short sequences gracefully (preventing blank matrix)', () => {
      // len 20, k=3. 
      // Before fix: bins=8 -> window=2.5 -> integer size 2 -> empty kmers -> blank matrix.
      // After fix: bins capped at floor(20/3) = 6. window=3.33 -> integer 3 -> works.
      const seq = 'ABCDEFGHIJKLMNOPQRST'; // len 20
      const result = computeProteinSelfSimilarityMatrix(seq, { k: 3 });
      
      expect(result.bins).toBeLessThanOrEqual(6); // 20/3
      expect(result.bins).toBeGreaterThan(0);
      
      // Should have non-zero values on diagonal (self-similarity)
      // Unless sequence is fully unique and k is large?
      // With k=3, window=3. 'ABC' vs 'ABC' -> 1.0.
      // So diagonal should be 1.0 (or close to it if sparse similarity allows)
      // countKmers('ABC', 3) -> {'ABC':1}. Cosine(a,a) = 1.
      expect(result.matrix[0]).toBeGreaterThan(0.9);
    });

    test('handles empty input', () => {
      const result = computeProteinSelfSimilarityMatrix('');
      expect(result.bins).toBe(0);
      expect(result.matrix.length).toBe(0);
    });
  });

  describe('computeNovelty', () => {
    test('computes novelty score', () => {
      const corpus: FoldEmbedding[] = [
        { geneId: 1, vector: [1, 0], length: 10, name: 'A', product: null },
        { geneId: 2, vector: [0, 1], length: 10, name: 'B', product: null },
      ];
      const target: FoldEmbedding = {
        geneId: 3, vector: [1, 0], length: 10, name: 'C', product: null
      };

      const result = computeNovelty(target, corpus, 1);
      // Closest is [1,0] (dist 0).
      expect(result.novelty).toBeCloseTo(0);
      expect(result.neighbors[0].geneId).toBe(1);
    });

    test('returns novelty 1 and note when no neighbors found', () => {
      const corpus: FoldEmbedding[] = [];
      const target: FoldEmbedding = {
        geneId: 1, vector: [1, 0], length: 10, name: 'Test', product: null
      };

      const result = computeNovelty(target, corpus);
      expect(result.novelty).toBe(1);
      expect(result.neighbors).toHaveLength(0);
      expect(result.note).toBe('No neighbors found');
    });

    test('returns high novelty for orthogonal vectors', () => {
      // Create corpus where all vectors are orthogonal to target
      const corpus: FoldEmbedding[] = [
        { geneId: 1, vector: [0, 1], length: 10, name: 'A', product: null },
        { geneId: 2, vector: [0, 1], length: 10, name: 'B', product: null },
      ];
      const target: FoldEmbedding = {
        geneId: 3, vector: [1, 0], length: 10, name: 'C', product: null
      };

      const result = computeNovelty(target, corpus);
      // Cosine distance for orthogonal vectors is 1
      expect(result.novelty).toBe(1);
    });
  });

  describe('nearestNeighbors', () => {
    test('returns k nearest neighbors sorted by distance', () => {
      const corpus: FoldEmbedding[] = [
        { geneId: 1, vector: [1, 0], length: 10, name: 'A', product: 'prod A' },
        { geneId: 2, vector: [0.9, 0.1], length: 10, name: 'B', product: 'prod B' },
        { geneId: 3, vector: [0, 1], length: 10, name: 'C', product: 'prod C' },
      ];
      const target: FoldEmbedding = {
        geneId: 99, vector: [1, 0], length: 10, name: 'T', product: null
      };

      const neighbors = nearestNeighbors(target, corpus, 2);
      expect(neighbors).toHaveLength(2);
      // Closest should be geneId 1 (identical vector)
      expect(neighbors[0].geneId).toBe(1);
      expect(neighbors[0].distance).toBeCloseTo(0);
      expect(neighbors[0].name).toBe('A');
      expect(neighbors[0].product).toBe('prod A');
      // Second closest is geneId 2
      expect(neighbors[1].geneId).toBe(2);
    });

    test('excludes target from neighbors', () => {
      const corpus: FoldEmbedding[] = [
        { geneId: 1, vector: [1, 0], length: 10, name: 'A', product: null },
        { geneId: 2, vector: [0.5, 0.5], length: 10, name: 'B', product: null },
      ];
      const target = corpus[0]; // Same object

      const neighbors = nearestNeighbors(target, corpus, 5);
      expect(neighbors.find(n => n.geneId === target.geneId)).toBeUndefined();
    });

    test('handles empty corpus', () => {
      const target: FoldEmbedding = {
        geneId: 1, vector: [1, 0], length: 10, name: 'T', product: null
      };

      const neighbors = nearestNeighbors(target, [], 5);
      expect(neighbors).toHaveLength(0);
    });

    test('filters out entries with empty vectors', () => {
      const corpus: FoldEmbedding[] = [
        { geneId: 1, vector: [], length: 10, name: 'A', product: null },
        { geneId: 2, vector: [1, 0], length: 10, name: 'B', product: null },
      ];
      const target: FoldEmbedding = {
        geneId: 99, vector: [1, 0], length: 10, name: 'T', product: null
      };

      const neighbors = nearestNeighbors(target, corpus, 5);
      expect(neighbors).toHaveLength(1);
      expect(neighbors[0].geneId).toBe(2);
    });
  });

  describe('encodeFloat32VectorLE / decodeFloat32VectorLE', () => {
    test('round-trips vector correctly', () => {
      const original = [1.5, -2.25, 0, 3.14159, -0.001];
      const encoded = encodeFloat32VectorLE(original);
      const decoded = decodeFloat32VectorLE(encoded);

      expect(decoded.length).toBe(original.length);
      for (let i = 0; i < original.length; i++) {
        expect(decoded[i]).toBeCloseTo(original[i], 5);
      }
    });

    test('encodes to correct byte length', () => {
      const vec = [1, 2, 3, 4, 5];
      const encoded = encodeFloat32VectorLE(vec);
      expect(encoded.byteLength).toBe(20); // 5 * 4 bytes
    });

    test('handles empty vector', () => {
      const encoded = encodeFloat32VectorLE([]);
      expect(encoded.byteLength).toBe(0);

      const decoded = decodeFloat32VectorLE(encoded);
      expect(decoded).toHaveLength(0);
    });

    test('decodes ArrayBuffer directly', () => {
      const original = [1, 2, 3];
      const encoded = encodeFloat32VectorLE(original);
      const decoded = decodeFloat32VectorLE(encoded.buffer as ArrayBuffer);

      expect(decoded.length).toBe(original.length);
      for (let i = 0; i < original.length; i++) {
        expect(decoded[i]).toBeCloseTo(original[i], 5);
      }
    });

    test('respects dims parameter', () => {
      const original = [1, 2, 3, 4, 5];
      const encoded = encodeFloat32VectorLE(original);
      const decoded = decodeFloat32VectorLE(encoded, 3); // Only decode first 3

      expect(decoded).toHaveLength(3);
      expect(decoded[0]).toBeCloseTo(1);
      expect(decoded[1]).toBeCloseTo(2);
      expect(decoded[2]).toBeCloseTo(3);
    });
  });

  describe('buildEmbeddingMap', () => {
    test('creates map keyed by geneId', () => {
      const embeddings: FoldEmbedding[] = [
        { geneId: 10, vector: [1, 0], length: 100, name: 'A', product: 'prod A' },
        { geneId: 20, vector: [0, 1], length: 200, name: 'B', product: 'prod B' },
        { geneId: 30, vector: [1, 1], length: 300, name: null, product: null },
      ];

      const map = buildEmbeddingMap(embeddings);

      expect(map.size).toBe(3);
      expect(map.get(10)?.name).toBe('A');
      expect(map.get(20)?.length).toBe(200);
      expect(map.get(30)?.name).toBeNull();
      expect(map.has(99)).toBe(false);
    });

    test('handles empty array', () => {
      const map = buildEmbeddingMap([]);
      expect(map.size).toBe(0);
    });

    test('later entries overwrite earlier with same geneId', () => {
      const embeddings: FoldEmbedding[] = [
        { geneId: 1, vector: [1, 0], length: 10, name: 'first', product: null },
        { geneId: 1, vector: [0, 1], length: 20, name: 'second', product: null },
      ];

      const map = buildEmbeddingMap(embeddings);
      expect(map.size).toBe(1);
      expect(map.get(1)?.name).toBe('second');
    });
  });

  describe('attachEmbeddingInfo', () => {
    test('attaches embeddings to matching genes', () => {
      const genes: GeneInfo[] = [
        { id: 1, name: 'gene1', locusTag: 'L1', startPos: 0, endPos: 100, strand: '+', product: 'p1', type: 'CDS' },
        { id: 2, name: 'gene2', locusTag: 'L2', startPos: 100, endPos: 200, strand: '-', product: 'p2', type: 'CDS' },
      ];
      const embeddings = new Map<number, FoldEmbedding>([
        [1, { geneId: 1, vector: [1, 0], length: 50, name: 'gene1', product: 'p1' }],
      ]);

      const result = attachEmbeddingInfo(genes, embeddings);

      expect(result).toHaveLength(2);
      expect(result[0].embedding).toBeDefined();
      expect(result[0].embedding?.geneId).toBe(1);
      expect(result[1].embedding).toBeUndefined();
    });

    test('preserves all gene properties', () => {
      const genes: GeneInfo[] = [
        { id: 5, name: 'testGene', locusTag: 'LT5', startPos: 50, endPos: 150, strand: '+', product: 'test prod', type: 'CDS' },
      ];
      const embeddings = new Map<number, FoldEmbedding>();

      const result = attachEmbeddingInfo(genes, embeddings);

      expect(result[0].id).toBe(5);
      expect(result[0].name).toBe('testGene');
      expect(result[0].locusTag).toBe('LT5');
      expect(result[0].startPos).toBe(50);
      expect(result[0].endPos).toBe(150);
      expect(result[0].strand).toBe('+');
      expect(result[0].product).toBe('test prod');
    });

    test('handles empty inputs', () => {
      expect(attachEmbeddingInfo([], new Map())).toHaveLength(0);
    });
  });
});
