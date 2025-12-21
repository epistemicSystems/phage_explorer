/**
 * PromoterOverlay - Regulatory Signal Detection
 *
 * Displays predicted promoters (σ70, σ32, σ54), terminators, and RBS sites
 * using the sophisticated detection algorithms from @phage-explorer/core.
 */

import React, { useEffect, useMemo, useState, useRef } from 'react';
import type { PhageFull } from '@phage-explorer/core';
import {
  detectPromoters,
  detectTerminators,
  type PromoterHit,
  type TerminatorHit,
} from '@phage-explorer/core';
import type { PhageRepository } from '../../db';
import { useTheme } from '../../hooks/useTheme';
import { useHotkey } from '../../hooks';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import { AnalysisPanelSkeleton } from '../ui/Skeleton';

interface PromoterOverlayProps {
  repository: PhageRepository | null;
  currentPhage: PhageFull | null;
}

interface RegulatoryAnalysis {
  promoters: PromoterHit[];
  terminators: TerminatorHit[];
}

function analyzeRegulatory(sequence: string): RegulatoryAnalysis {
  if (!sequence || sequence.length < 100) {
    return { promoters: [], terminators: [] };
  }
  const promoters = detectPromoters(sequence);
  const terminators = detectTerminators(sequence);
  return { promoters, terminators };
}

export function PromoterOverlay({
  repository,
  currentPhage,
}: PromoterOverlayProps): React.ReactElement | null {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { isOpen, toggle } = useOverlay();
  const sequenceCache = useRef<Map<number, string>>(new Map());
  const [sequence, setSequence] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Hotkey to toggle overlay
  useHotkey(
    { key: 'p' },
    'Promoter & RBS Sites',
    () => toggle('promoter'),
    { modes: ['NORMAL'], category: 'Analysis', minLevel: 'intermediate' }
  );

  // Fetch sequence when overlay opens
  useEffect(() => {
    if (!isOpen('promoter')) return;
    if (!repository || !currentPhage) {
      setSequence('');
      setLoading(false);
      return;
    }

    const phageId = currentPhage.id;

    // Check cache
    if (sequenceCache.current.has(phageId)) {
      setSequence(sequenceCache.current.get(phageId) ?? '');
      setLoading(false);
      return;
    }

    setLoading(true);
    repository
      .getFullGenomeLength(phageId)
      .then((length: number) => repository.getSequenceWindow(phageId, 0, length))
      .then((seq: string) => {
        sequenceCache.current.set(phageId, seq);
        setSequence(seq);
      })
      .catch(() => setSequence(''))
      .finally(() => setLoading(false));
  }, [isOpen, repository, currentPhage]);

  const analysis = useMemo(() => analyzeRegulatory(sequence), [sequence]);

  // Separate RBS from other promoter types
  const promoters = analysis.promoters.filter(p => p.motif !== 'RBS');
  const rbsSites = analysis.promoters.filter(p => p.motif === 'RBS');
  const terminators = analysis.terminators;

  if (!isOpen('promoter')) {
    return null;
  }

  return (
    <Overlay
      id="promoter"
      title="REGULATORY SIGNALS"
      hotkey="p"
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Loading State */}
        {loading && (
          <AnalysisPanelSkeleton message="Loading sequence data..." rows={3} />
        )}

        {/* Description */}
        {!loading && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: colors.backgroundAlt,
            borderRadius: '4px',
            color: colors.textDim,
            fontSize: '0.9rem',
          }}>
            <strong style={{ color: colors.primary }}>Regulatory Signal Detection</strong> identifies promoters
            (σ70, σ32, σ54 motifs), ribosome binding sites (Shine-Dalgarno sequences), and intrinsic terminators
            (rho-independent hairpin + poly-U).
          </div>
        )}

        {/* Stats */}
        {!loading && sequence.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
          }}>
            <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: colors.backgroundAlt, borderRadius: '4px' }}>
              <div style={{ color: colors.success, fontSize: '0.75rem' }}>Promoters (σ70/σ32/σ54)</div>
              <div style={{ color: colors.text, fontFamily: 'monospace', fontSize: '1.5rem' }}>{promoters.length}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: colors.backgroundAlt, borderRadius: '4px' }}>
              <div style={{ color: colors.info, fontSize: '0.75rem' }}>RBS Sites</div>
              <div style={{ color: colors.text, fontFamily: 'monospace', fontSize: '1.5rem' }}>{rbsSites.length}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: colors.backgroundAlt, borderRadius: '4px' }}>
              <div style={{ color: colors.warning, fontSize: '0.75rem' }}>Terminators</div>
              <div style={{ color: colors.text, fontFamily: 'monospace', fontSize: '1.5rem' }}>{terminators.length}</div>
            </div>
          </div>
        )}

        {/* Sites table */}
        {!loading && sequence.length > 0 && (() => {
          // Combine all sites into unified display structure
          type DisplaySite = {
            kind: 'promoter' | 'rbs' | 'terminator';
            pos: number;
            strand: '+' | '-';
            motif: string;
            score: number;
          };

          const allSites: DisplaySite[] = [
            ...promoters.map(p => ({
              kind: 'promoter' as const,
              pos: p.pos,
              strand: p.strand,
              motif: p.motif,
              score: p.strength,
            })),
            ...rbsSites.map(r => ({
              kind: 'rbs' as const,
              pos: r.pos,
              strand: r.strand,
              motif: r.motif,
              score: r.strength,
            })),
            ...terminators.map(t => ({
              kind: 'terminator' as const,
              pos: t.pos,
              strand: t.strand,
              motif: t.motif,
              score: t.efficiency,
            })),
          ].sort((a, b) => a.pos - b.pos);

          const getColor = (kind: DisplaySite['kind']) => {
            switch (kind) {
              case 'promoter': return colors.success;
              case 'rbs': return colors.info;
              case 'terminator': return colors.warning;
            }
          };

          const getIcon = (kind: DisplaySite['kind']) => {
            switch (kind) {
              case 'promoter': return '◉';
              case 'rbs': return '◎';
              case 'terminator': return '◇';
            }
          };

          const getLabel = (kind: DisplaySite['kind']) => {
            switch (kind) {
              case 'promoter': return 'Promoter';
              case 'rbs': return 'RBS';
              case 'terminator': return 'Terminator';
            }
          };

          return (
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: `1px solid ${colors.borderLight}`,
              borderRadius: '4px',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: colors.backgroundAlt, position: 'sticky', top: 0 }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: colors.textDim }}>Type</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: colors.textDim }}>Position</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', color: colors.textDim }}>Strand</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', color: colors.textDim }}>Motif</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', color: colors.textDim }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {allSites.map((site, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderTop: `1px solid ${colors.borderLight}`,
                        backgroundColor: idx % 2 === 0 ? 'transparent' : colors.backgroundAlt,
                      }}
                    >
                      <td style={{ padding: '0.5rem' }}>
                        <span style={{ color: getColor(site.kind), fontWeight: 'bold' }}>
                          {getIcon(site.kind)} {getLabel(site.kind)}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace', color: colors.text }}>
                        {site.pos.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', fontFamily: 'monospace', color: colors.accent }}>
                        {site.strand}
                      </td>
                      <td style={{ padding: '0.5rem', color: colors.textDim }}>
                        {site.motif}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: `rgba(${site.score > 0.7 ? '92, 184, 92' : '240, 173, 78'}, 0.2)`,
                          color: site.score > 0.7 ? colors.success : colors.warning,
                          fontSize: '0.8rem',
                        }}>
                          {(site.score * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {allSites.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>
                        No regulatory sites found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}

        {!loading && sequence.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>
            No sequence data available. Select a phage to analyze.
          </div>
        )}
      </div>
    </Overlay>
  );
}

export default PromoterOverlay;
