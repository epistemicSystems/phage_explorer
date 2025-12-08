export interface NonBStructure {
  type: 'G4' | 'Z-DNA' | 'Cruciform' | 'Triplex';
  start: number;
  end: number;
  strand: '+' | '-' | 'both';
  score: number; // 0-10 scale usually, or specific score
  sequence: string;
  details?: string; // e.g. "G3L1-7" for G4
}

export interface NonBStructureReport {
  structures: NonBStructure[];
  g4Count: number;
  zDnaCount: number;
  density: number; // structures per kb
}

// Z-DNA dinucleotide propensity (approximate from literature)
const Z_PROPENSITY: Record<string, number> = {
  'CG': 1.0, 'GC': 0.8,
  'CA': 0.5, 'TG': 0.5, 'AC': 0.5, 'GT': 0.5,
  'AT': -0.1, 'TA': -0.1,
  'AA': -0.5, 'TT': -0.5, 'GG': -0.5, 'CC': -0.5,
  'GA': -0.2, 'TC': -0.2, 'AG': -0.2, 'CT': -0.2,
};

function calculateG4Hunter(seq: string, window: number = 25, threshold: number = 1.2): NonBStructure[] {
  const structures: NonBStructure[] = [];
  const upper = seq.toUpperCase();
  
  // Simple G4Hunter implementation
  // Score is average of scores in window
  // G scores: G=1, GG=2, GGG=3, GGGG+=4
  // C scores: C=-1, CC=-2, CCC=-3, CCCC+=-4 (for antisense)
  
  const scores = new Float32Array(upper.length);
  
  for (let i = 0; i < upper.length; i++) {
    let score = 0;
    if (upper[i] === 'G') {
      let run = 1;
      while (i + run < upper.length && upper[i + run] === 'G' && run < 4) run++;
      score = run; // Assign score to first G, or distribute?
      // G4Hunter usually sums scores. Let's assign to each base for sliding window.
    } else if (upper[i] === 'C') {
      let run = 1;
      while (i + run < upper.length && upper[i + run] === 'C' && run < 4) run++;
      score = -run;
    }
    scores[i] = score;
  }
  
  // Refined scoring: calculate runs properly
  // Iterate again, assigning run values to all positions in run
  let i = 0;
  while (i < upper.length) {
    if (upper[i] === 'G') {
      let run = 0;
      let j = i;
      while (j < upper.length && upper[j] === 'G') { run++; j++; }
      const val = Math.min(4, run); // Cap at 4
      for (let k = i; k < j; k++) scores[k] = val;
      i = j;
    } else if (upper[i] === 'C') {
      let run = 0;
      let j = i;
      while (j < upper.length && upper[j] === 'C') { run++; j++; }
      const val = -Math.min(4, run);
      for (let k = i; k < j; k++) scores[k] = val;
      i = j;
    } else {
      scores[i] = 0;
      i++;
    }
  }

  // Sliding window average
  for (let i = 0; i <= upper.length - window; i++) {
    let sum = 0;
    for (let j = 0; j < window; j++) sum += scores[i + j];
    const avg = sum / window;
    
    if (Math.abs(avg) >= threshold) {
      // Found a candidate
      // Determine strand and extend to find peak/boundaries
      // Simplified: just record window
      structures.push({
        type: 'G4',
        start: i,
        end: i + window,
        strand: avg > 0 ? '+' : '-',
        score: Math.abs(avg),
        sequence: upper.slice(i, i + window),
      });
      // Skip ahead to avoid overlaps? Or merge later.
      i += 5; 
    }
  }
  
  return mergeStructures(structures);
}

function calculateZDNA(seq: string, window: number = 12, threshold: number = 0.4): NonBStructure[] {
  const structures: NonBStructure[] = [];
  const upper = seq.toUpperCase();
  
  for (let i = 0; i <= upper.length - window; i += 2) {
    let scoreSum = 0;
    for (let j = 0; j < window; j += 2) {
      const dinuc = upper.slice(i + j, i + j + 2);
      scoreSum += Z_PROPENSITY[dinuc] ?? 0;
    }
    const avg = scoreSum / (window / 2); // Average per dinucleotide
    
    if (avg >= threshold) {
      structures.push({
        type: 'Z-DNA',
        start: i,
        end: i + window,
        strand: 'both', // Z-DNA involves both strands
        score: avg,
        sequence: upper.slice(i, i + window),
      });
      i += 2;
    }
  }
  
  return mergeStructures(structures);
}

function mergeStructures(raw: NonBStructure[]): NonBStructure[] {
  if (raw.length === 0) return [];
  const sorted = raw.sort((a, b) => a.start - b.start);
  const merged: NonBStructure[] = [];
  
  let current = sorted[0];
  
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    // Overlap or adjacent (within 5bp)
    if (next.start <= current.end + 5 && next.type === current.type && next.strand === current.strand) {
      // Merge
      const newEnd = Math.max(current.end, next.end);
      const len1 = current.end - current.start;
      const len2 = next.end - next.start;
      // Weighted score average
      const newScore = (current.score * len1 + next.score * len2) / (len1 + len2);
      
      current = {
        ...current,
        end: newEnd,
        score: newScore,
        sequence: current.sequence + next.sequence.slice(current.end - next.start), // Rough concat
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);
  return merged;
}

export function analyzeNonBStructures(sequence: string): NonBStructureReport {
  const g4 = calculateG4Hunter(sequence);
  const zDna = calculateZDNA(sequence);
  
  const all = [...g4, ...zDna].sort((a, b) => a.start - b.start);
  
  return {
    structures: all,
    g4Count: g4.length,
    zDnaCount: zDna.length,
    density: all.length / (sequence.length / 1000),
  };
}
