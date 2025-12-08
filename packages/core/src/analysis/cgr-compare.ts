/**
 * CGR Comparison Metrics
 *
 * Compares two CGR fingerprints using various distance metrics.
 */

import type { CGRResult } from './cgr';

export interface CGRDistance {
  euclidean: number;
  pearson: number;
  cosine: number;
  jaccard: number;
}

/**
 * Compute multiple distance metrics between two CGR grids
 * Assumes both grids have the same resolution (k-mer size)
 */
export function compareCGR(a: CGRResult, b: CGRResult): CGRDistance {
  if (a.resolution !== b.resolution) {
    throw new Error(`Resolution mismatch: ${a.resolution} vs ${b.resolution}`);
  }

  const n = a.grid.length;
  let sumSqDiff = 0;
  let sumA = 0, sumB = 0;
  let sumASq = 0, sumBSq = 0;
  let sumAB = 0;
  let intersection = 0, union = 0;

  // Normalize counts to frequencies for comparison
  const freqA = new Float32Array(n);
  const freqB = new Float32Array(n);
  
  for (let i = 0; i < n; i++) {
    freqA[i] = a.totalPoints > 0 ? a.grid[i] / a.totalPoints : 0;
    freqB[i] = b.totalPoints > 0 ? b.grid[i] / b.totalPoints : 0;
  }

  // Calculate stats in one pass
  for (let i = 0; i < n; i++) {
    const valA = freqA[i];
    const valB = freqB[i];

    // Euclidean
    const diff = valA - valB;
    sumSqDiff += diff * diff;

    // Pearson / Cosine components
    sumA += valA;
    sumB += valB;
    sumASq += valA * valA;
    sumBSq += valB * valB;
    sumAB += valA * valB;

    // Jaccard (min/max)
    intersection += Math.min(valA, valB);
    union += Math.max(valA, valB);
  }

  // Euclidean Distance
  const euclidean = Math.sqrt(sumSqDiff);

  // Pearson Correlation
  const meanA = sumA / n;
  const meanB = sumB / n;
  const numerator = sumAB - n * meanA * meanB;
  const denA = Math.sqrt(sumASq - n * meanA * meanA);
  const denB = Math.sqrt(sumBSq - n * meanB * meanB);
  const pearson = (denA > 0 && denB > 0) ? numerator / (denA * denB) : 0;

  // Cosine Similarity
  const cosine = (sumASq > 0 && sumBSq > 0) 
    ? sumAB / (Math.sqrt(sumASq) * Math.sqrt(sumBSq)) 
    : 0;

  // Jaccard Index
  const jaccard = union > 0 ? intersection / union : 0;

  return {
    euclidean,
    pearson,
    cosine,
    jaccard
  };
}
