/**
 * Self-homology dot plot computation.
 *
 * Downsamples the genome into bins and measures window identity for
 * direct and inverted (reverse-complement) comparisons.
 *
 * Designed to be light enough for TUI rendering (O(bins^2 * window)).
 */

const RC_MAP: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G', N: 'N' };

function revComp(seq: string): string {
  let out = '';
  for (let i = seq.length - 1; i >= 0; i--) {
    const c = seq[i].toUpperCase();
    out += RC_MAP[c] ?? 'N';
  }
  return out;
}

function identity(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let same = 0;
  for (let i = 0; i < len; i++) {
    if (a[i] === b[i]) same++;
  }
  return same / len;
}

export interface DotCell {
  direct: number;   // 0..1 identity
  inverted: number; // 0..1 identity vs rev-comp
}

export interface DotPlotResult {
  grid: DotCell[][];
  bins: number;
  window: number;
}

export interface DotPlotConfig {
  bins?: number;      // resolution of plot (default 120)
  window?: number;    // window size per bin (default seqLen / bins)
}

export function computeDotPlot(sequence: string, config: DotPlotConfig = {}): DotPlotResult {
  const bins = config.bins ?? 120;
  const window = config.window ?? Math.max(20, Math.floor(sequence.length / bins));
  const len = sequence.length;
  const starts = Array.from({ length: bins }, (_, i) => Math.min(len - window, Math.floor((i / bins) * len)));

  const grid: DotCell[][] = Array.from({ length: bins }, () =>
    Array.from({ length: bins }, () => ({ direct: 0, inverted: 0 }))
  );

  for (let i = 0; i < bins; i++) {
    const a = sequence.slice(starts[i], starts[i] + window);
    const aRc = revComp(a);
    for (let j = 0; j < bins; j++) {
      const b = sequence.slice(starts[j], starts[j] + window);
      const dir = identity(a, b);
      const inv = identity(aRc, b);
      grid[i][j] = { direct: dir, inverted: inv };
    }
  }

  return { grid, bins, window };
}
