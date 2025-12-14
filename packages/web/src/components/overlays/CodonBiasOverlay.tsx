/**
 * CodonBiasOverlay - Codon Usage Bias Analysis
 *
 * Visualizes Relative Synonymous Codon Usage (RSCU) and other
 * codon bias metrics to understand translational selection.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { PhageFull } from '@phage-explorer/core';
import type { PhageRepository } from '../../db';
import { useTheme } from '../../hooks/useTheme';
import { useHotkey } from '../../hooks';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import { AnalysisPanelSkeleton } from '../ui/Skeleton';
import {
  analyzeCodonBias,
  CODON_FAMILIES,
} from '@phage-explorer/core';
import type { CodonBiasAnalysis, RSCUResult } from '@phage-explorer/core';

// Color for RSCU value (green = preferred, red = avoided)
function rscuColor(rscu: number): string {
  if (rscu >= 1.5) return '#22c55e'; // Strong preference
  if (rscu >= 1.0) return '#86efac'; // Slight preference
  if (rscu >= 0.5) return '#fde047'; // Slight avoidance
  return '#ef4444'; // Strong avoidance
}

// Color intensity based on count
function countOpacity(count: number, maxCount: number): number {
  return Math.max(0.3, Math.min(1, count / (maxCount * 0.5)));
}

interface CodonBiasOverlayProps {
  repository: PhageRepository | null;
  currentPhage: PhageFull | null;
}

// RSCU bar component
function RSCUBar({
  rscu,
  count,
  maxCount,
  colors,
}: {
  rscu: RSCUResult;
  count: number;
  maxCount: number;
  colors: { textMuted: string; backgroundAlt: string };
}): React.ReactElement {
  const barWidth = Math.min(100, (rscu.rscu / 2) * 100); // Max at RSCU=2
  const color = rscuColor(rscu.rscu);
  const opacity = countOpacity(count, maxCount);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
      <span style={{ fontFamily: 'monospace', width: '32px', color: colors.textMuted }}>
        {rscu.codon}
      </span>
      <div
        style={{
          flex: 1,
          height: '12px',
          backgroundColor: colors.backgroundAlt,
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: '100%',
            backgroundColor: color,
            opacity,
            transition: 'width 0.2s',
          }}
        />
      </div>
      <span style={{ width: '36px', textAlign: 'right', color: colors.textMuted }}>
        {rscu.rscu.toFixed(2)}
      </span>
      <span style={{ width: '32px', textAlign: 'right', color: colors.textMuted, fontSize: '0.65rem' }}>
        ({count})
      </span>
    </div>
  );
}

// Amino acid family component
function AminoAcidFamily({
  aminoAcid,
  codons,
  rscuMap,
  maxCount,
  colors,
}: {
  aminoAcid: string;
  codons: string[];
  rscuMap: Map<string, RSCUResult>;
  maxCount: number;
  colors: { text: string; textMuted: string; backgroundAlt: string; borderLight: string };
}): React.ReactElement {
  return (
    <div
      style={{
        padding: '0.5rem',
        backgroundColor: colors.backgroundAlt,
        borderRadius: '4px',
        border: `1px solid ${colors.borderLight}`,
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          marginBottom: '0.25rem',
          color: colors.text,
          fontSize: '0.8rem',
        }}
      >
        {aminoAcid} ({codons.length} codons)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {codons.map(codon => {
          const rscu = rscuMap.get(codon);
          if (!rscu) return null;
          return (
            <RSCUBar
              key={codon}
              rscu={rscu}
              count={rscu.count}
              maxCount={maxCount}
              colors={colors}
            />
          );
        })}
      </div>
    </div>
  );
}

export function CodonBiasOverlay({
  repository,
  currentPhage,
}: CodonBiasOverlayProps): React.ReactElement | null {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { isOpen, toggle } = useOverlay();

  const sequenceCache = useRef<Map<number, string>>(new Map());
  const [sequence, setSequence] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // View options
  const [viewMode, setViewMode] = useState<'family' | 'ranked'>('family');
  const [filterFamily, setFilterFamily] = useState<string | null>(null);

  // Hotkey to toggle overlay (Alt+U for Usage)
  useHotkey(
    { key: 'u', modifiers: { alt: true } },
    'Codon Usage Bias',
    () => toggle('codonBias'),
    { modes: ['NORMAL'], category: 'Analysis' }
  );

  // Fetch sequence when overlay opens
  useEffect(() => {
    if (!isOpen('codonBias')) return;
    if (!repository || !currentPhage) {
      setSequence('');
      return;
    }

    const phageId = currentPhage.id;

    // Check cache
    if (sequenceCache.current.has(phageId)) {
      setSequence(sequenceCache.current.get(phageId) ?? '');
      return;
    }

    setLoading(true);
    repository
      .getFullGenomeLength(phageId)
      .then(length => repository.getSequenceWindow(phageId, 0, length))
      .then(seq => {
        sequenceCache.current.set(phageId, seq);
        setSequence(seq);
      })
      .catch(() => setSequence(''))
      .finally(() => setLoading(false));
  }, [isOpen, repository, currentPhage]);

  // Compute codon bias analysis
  const analysis = useMemo((): CodonBiasAnalysis | null => {
    if (!sequence || sequence.length < 300) return null;
    return analyzeCodonBias(sequence);
  }, [sequence]);

  // Build RSCU map for quick lookup
  const rscuMap = useMemo(() => {
    if (!analysis) return new Map<string, RSCUResult>();
    return new Map(analysis.rscu.map(r => [r.codon, r]));
  }, [analysis]);

  // Max count for bar scaling
  const maxCount = useMemo(() => {
    if (!analysis) return 1;
    return Math.max(...analysis.rscu.map(r => r.count));
  }, [analysis]);

  // Filtered families based on view
  const displayFamilies = useMemo(() => {
    const families = Object.entries(CODON_FAMILIES)
      .filter(([aa]) => aa !== '*') // Skip stop codons
      .filter(([aa]) => !filterFamily || aa === filterFamily);

    return families;
  }, [filterFamily]);

  // Ranked codons
  const rankedCodons = useMemo(() => {
    if (!analysis) return [];
    return [...analysis.rscu]
      .filter(r => r.aminoAcid !== '*' && r.familySize > 1)
      .sort((a, b) => b.rscu - a.rscu);
  }, [analysis]);

  if (!isOpen('codonBias')) return null;

  return (
    <Overlay
      id="codonBias"
      title="CODON USAGE BIAS (RSCU Analysis)"
      hotkey="Alt+U"
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Description */}
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: colors.backgroundAlt,
            borderRadius: '4px',
            color: colors.textDim,
            fontSize: '0.85rem',
          }}
        >
          <strong style={{ color: colors.accent }}>Codon Usage Bias</strong>:
          Relative Synonymous Codon Usage (RSCU) reveals translational selection.
          RSCU &gt; 1.0 indicates preferred codons; RSCU &lt; 1.0 indicates avoided codons.
          Strong bias suggests adaptation to host tRNA pools.
        </div>

        {loading ? (
          <AnalysisPanelSkeleton />
        ) : !analysis ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>
            {!sequence ? 'No sequence loaded' : 'Sequence too short for analysis'}
          </div>
        ) : (
          <>
            {/* Summary metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '0.5rem',
                fontSize: '0.8rem',
              }}
            >
              <div
                style={{
                  padding: '0.5rem',
                  backgroundColor: colors.backgroundAlt,
                  borderRadius: '4px',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: colors.textMuted }}>Total Codons</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.text }}>
                  {analysis.totalCodons.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  padding: '0.5rem',
                  backgroundColor: colors.backgroundAlt,
                  borderRadius: '4px',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: colors.textMuted }}>GC Content</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.text }}>
                  {(analysis.gcContent * 100).toFixed(1)}%
                </div>
              </div>
              <div
                style={{
                  padding: '0.5rem',
                  backgroundColor: colors.backgroundAlt,
                  borderRadius: '4px',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: colors.textMuted }}>GC3 Content</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.text }}>
                  {(analysis.gc3Content * 100).toFixed(1)}%
                </div>
              </div>
              <div
                style={{
                  padding: '0.5rem',
                  backgroundColor: colors.backgroundAlt,
                  borderRadius: '4px',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: colors.textMuted }}>Nc (Bias)</div>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: analysis.effectiveNumberOfCodons < 40 ? '#22c55e' : colors.text,
                  }}
                >
                  {analysis.effectiveNumberOfCodons.toFixed(1)}
                </div>
              </div>
              <div
                style={{
                  padding: '0.5rem',
                  backgroundColor: colors.backgroundAlt,
                  borderRadius: '4px',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: colors.textMuted }}>Bias Score</div>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: analysis.biasScore > 0.5 ? '#22c55e' : colors.text,
                  }}
                >
                  {(analysis.biasScore * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Controls */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                fontSize: '0.8rem',
              }}
            >
              <label style={{ color: colors.textMuted }}>
                View:
                <select
                  value={viewMode}
                  onChange={e => setViewMode(e.target.value as typeof viewMode)}
                  style={{
                    marginLeft: '0.5rem',
                    padding: '0.25rem',
                    backgroundColor: colors.backgroundAlt,
                    color: colors.text,
                    border: `1px solid ${colors.borderLight}`,
                    borderRadius: '3px',
                  }}
                >
                  <option value="family">By Amino Acid</option>
                  <option value="ranked">Ranked by RSCU</option>
                </select>
              </label>

              {viewMode === 'family' && (
                <label style={{ color: colors.textMuted }}>
                  Filter:
                  <select
                    value={filterFamily || ''}
                    onChange={e => setFilterFamily(e.target.value || null)}
                    style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem',
                      backgroundColor: colors.backgroundAlt,
                      color: colors.text,
                      border: `1px solid ${colors.borderLight}`,
                      borderRadius: '3px',
                    }}
                  >
                    <option value="">All Amino Acids</option>
                    {Object.keys(CODON_FAMILIES)
                      .filter(aa => aa !== '*')
                      .map(aa => (
                        <option key={aa} value={aa}>
                          {aa} ({CODON_FAMILIES[aa].length})
                        </option>
                      ))}
                  </select>
                </label>
              )}

              <span style={{ color: colors.textMuted }}>
                Preferred: {analysis.preferredCodons.length} |
                Avoided: {analysis.avoidedCodons.length}
              </span>
            </div>

            {/* RSCU visualization */}
            {viewMode === 'family' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '0.5rem',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                {displayFamilies.map(([aa, codons]) => (
                  <AminoAcidFamily
                    key={aa}
                    aminoAcid={aa}
                    codons={codons}
                    rscuMap={rscuMap}
                    maxCount={maxCount}
                    colors={colors}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  backgroundColor: colors.backgroundAlt,
                  borderRadius: '4px',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.25rem 1rem',
                  }}
                >
                  {rankedCodons.map(rscu => (
                    <RSCUBar
                      key={rscu.codon}
                      rscu={rscu}
                      count={rscu.count}
                      maxCount={maxCount}
                      colors={colors}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                fontSize: '0.75rem',
                color: colors.textMuted,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#22c55e', borderRadius: '2px' }} />
                <span>Strong Preference (RSCU &gt; 1.5)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#86efac', borderRadius: '2px' }} />
                <span>Slight Preference (1.0-1.5)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#fde047', borderRadius: '2px' }} />
                <span>Slight Avoidance (0.5-1.0)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '2px' }} />
                <span>Strong Avoidance (&lt; 0.5)</span>
              </div>
            </div>

            {/* Interpretation */}
            <div
              style={{
                padding: '0.5rem',
                backgroundColor: colors.backgroundAlt,
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: colors.textDim,
              }}
            >
              <strong>Interpretation:</strong> Nc (Effective Number of Codons) ranges from 20
              (extreme bias) to 61 (uniform). Values &lt; 40 suggest selection for translational
              efficiency. GC3 ≠ GC suggests selection overrides mutational pressure. Preferred
              codons often match abundant host tRNAs.
            </div>
          </>
        )}
      </div>
    </Overlay>
  );
}

export default CodonBiasOverlay;
