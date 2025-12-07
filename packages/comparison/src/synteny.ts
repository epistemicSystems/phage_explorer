import type { GeneInfo } from '@phage-explorer/core';

export interface SyntenyBlock {
  startIdxA: number; // Gene index in A
  endIdxA: number;
  startIdxB: number; // Gene index in B
  endIdxB: number;
  score: number; // Similarity/Conservation score
  orientation: 'forward' | 'reverse';
}

export interface SyntenyAnalysis {
  blocks: SyntenyBlock[];
  breakpoints: number[]; // Indices in A where synteny breaks
  globalScore: number; // 0-1
  dtwDistance: number;
}

// Simple heuristic to compare two genes
// In a real scenario, this would check protein family IDs (clusters)
function geneDistance(g1: GeneInfo, g2: GeneInfo): number {
  // 0 = identical, 1 = completely different
  
  // If we have names, use string similarity (simplified)
  const n1 = (g1.product || g1.name || '').toLowerCase();
  const n2 = (g2.product || g2.name || '').toLowerCase();
  
  if (!n1 || !n2) return 1.0; // Penalize unknown genes
  
  if (n1 === n2) return 0.0;
  if (n1.includes(n2) || n2.includes(n1)) return 0.2;
  
  // Check common terms
  const terms1 = n1.split(/[\s-]+/);
  const terms2 = n2.split(/[\s-]+/);
  const common = terms1.filter(t => t.length > 3 && terms2.includes(t));
  
  if (common.length > 0) return 0.5;
  
  return 1.0;
}

// Dynamic Time Warping for gene lists
export function alignSynteny(genesA: GeneInfo[], genesB: GeneInfo[]): SyntenyAnalysis {
  const n = genesA.length;
  const m = genesB.length;
  
  if (n === 0 || m === 0) {
    return { blocks: [], breakpoints: [], globalScore: 0, dtwDistance: Infinity };
  }

  // Initialize DTW matrix
  const dtw = Array(n + 1).fill(0).map(() => Array(m + 1).fill(Infinity));
  dtw[0][0] = 0;

  // Fill matrix
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = geneDistance(genesA[i - 1], genesB[j - 1]);
      dtw[i][j] = cost + Math.min(
        dtw[i - 1][j],      // Insertion
        dtw[i][j - 1],      // Deletion
        dtw[i - 1][j - 1]   // Match
      );
    }
  }

  // Traceback
  let i = n;
  let j = m;
  const path: [number, number][] = [];
  
  while (i > 0 || j > 0) {
    path.push([i - 1, j - 1]);
    
    if (i === 0) { j--; continue; }
    if (j === 0) { i--; continue; }

    const minPrev = Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1]);

    if (Math.abs(dtw[i - 1][j - 1] - minPrev) < 0.001) { // Match
      i--; j--;
    } else if (Math.abs(dtw[i - 1][j] - minPrev) < 0.001) { // Insertion
      i--;
    } else { // Deletion
      j--;
    }
  }

  path.reverse();

  // Extract blocks
  // A block is a sequence of diagonal moves (matches/mismatches) in the traceback
  const blocks: SyntenyBlock[] = [];
  let currentBlock: Partial<SyntenyBlock> | null = null;

  for (const [idxA, idxB] of path) {
    if (idxA < 0 || idxB < 0) continue; // Skip boundary pads if any

    const isMatch = geneDistance(genesA[idxA], genesB[idxB]) < 0.8; // Threshold for "related"

    if (isMatch) {
      if (!currentBlock) {
        currentBlock = {
          startIdxA: idxA,
          endIdxA: idxA,
          startIdxB: idxB,
          endIdxB: idxB,
          score: 1.0 - geneDistance(genesA[idxA], genesB[idxB]),
          orientation: 'forward' // Simplified: DTW typically assumes monotonic, need Smith-Waterman for inversions
        };
      } else {
        // Extend block
        // Check if contiguous (indices increment by 1)
        const isContiguousA = idxA === currentBlock.endIdxA! + 1;
        const isContiguousB = idxB === currentBlock.endIdxB! + 1;

        if (isContiguousA && isContiguousB) {
            currentBlock.endIdxA = idxA;
            currentBlock.endIdxB = idxB;
            // Update average score? Keep simple for now
        } else {
            // End current block, start new
            blocks.push(currentBlock as SyntenyBlock);
            currentBlock = {
                startIdxA: idxA,
                endIdxA: idxA,
                startIdxB: idxB,
                endIdxB: idxB,
                score: 1.0 - geneDistance(genesA[idxA], genesB[idxB]),
                orientation: 'forward'
            };
        }
      }
    } else {
        // Gap or Mismatch -> End current block
        if (currentBlock) {
            blocks.push(currentBlock as SyntenyBlock);
            currentBlock = null;
        }
    }
  }
  
  if (currentBlock) {
    blocks.push(currentBlock as SyntenyBlock);
  }

  // Identify breakpoints (indices in A where we switch blocks)
  const breakpoints = blocks.slice(1).map(b => b.startIdxA);

  // Global score: coverage of A by syntenic blocks
  const coverageA = blocks.reduce((sum, b) => sum + (b.endIdxA - b.startIdxA + 1), 0);
  
  return {
    blocks,
    breakpoints,
    globalScore: coverageA / n,
    dtwDistance: dtw[n][m]
  };
}
