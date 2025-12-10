import React, { useMemo } from 'react';
import { translateSequence, reverseComplement } from '@phage-explorer/core';

const DISPLAY_BP = 120; // keep output compact for footer/card usage

type FrameRow = {
  label: string;
  aa: string;
};

function buildRows(sequence: string): FrameRow[] {
  const snippet = sequence.slice(0, DISPLAY_BP);

  const forwardFrames: FrameRow[] = [0, 1, 2].map(frame => ({
    label: `+${frame + 1}`,
    aa: translateSequence(snippet, frame as 0 | 1 | 2).slice(0, 40),
  }));

  const rc = reverseComplement(snippet);
  const reverseFrames: FrameRow[] = [0, 1, 2].map(frame => ({
    label: `-${frame + 1}`,
    aa: translateSequence(rc, frame as 0 | 1 | 2).slice(0, 40),
  }));

  return [...forwardFrames, ...reverseFrames];
}

export interface ReadingFrameVisualizerProps {
  sequence: string;
  title?: string;
}

export const ReadingFrameVisualizer: React.FC<ReadingFrameVisualizerProps> = ({
  sequence,
  title = 'Reading frame impact',
}) => {
  const rows = useMemo(() => buildRows(sequence), [sequence]);

  if (!sequence) return null;

  return (
    <div className="rfv-card">
      <div className="rfv-header">
        <div className="rfv-title">{title}</div>
        <div className="rfv-subtitle">Six-frame amino acid outputs · first {DISPLAY_BP} bp</div>
      </div>
      <div className="rfv-grid" role="table" aria-label="Reading frame amino acid outputs">
        {rows.map(row => (
          <div className="rfv-row" role="row" key={row.label}>
            <span className="rfv-label" role="rowheader">{row.label}</span>
            <span className="rfv-aa" role="cell">{row.aa || '—'}</span>
          </div>
        ))}
      </div>
      <div className="rfv-footnote">
        Frameshift changes every downstream codon. Start/stop positions shift per frame and strand.
      </div>
    </div>
  );
};

export default ReadingFrameVisualizer;
