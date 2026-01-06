import { describe, expect, test } from 'bun:test';
import {
  computeProteinSelfSimilarityMatrix,
  computeNovelty,
  type FoldEmbedding,
} from './fold-embeddings';

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
  });
});
