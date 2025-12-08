/**
 * SequenceView Component
 *
 * A canvas-based genome sequence viewer with scroll support.
 * Displays DNA or amino acid sequences with diff highlighting.
 */

import React, { useCallback, useEffect } from 'react';
import { usePhageStore } from '@phage-explorer/state';
import { useTheme } from '../hooks/useTheme';
import { useSequenceGrid, useReducedMotion, useHotkeys } from '../hooks';
import { useWebPreferences } from '../store/createWebStore';

interface SequenceViewProps {
  /** The sequence to display */
  sequence: string;
  /** Optional diff reference sequence */
  diffSequence?: string | null;
  /** Custom class name */
  className?: string;
  /** Height of the canvas */
  height?: number | string;
}

export function SequenceView({
  sequence,
  diffSequence = null,
  className = '',
  height = 300,
}: SequenceViewProps): React.ReactElement {
  const { theme } = useTheme();
  const colors = theme.colors;
  const reducedMotion = useReducedMotion();

  // Store state
  const viewMode = usePhageStore((s) => s.viewMode);
  const readingFrame = usePhageStore((s) => s.readingFrame);
  const setViewMode = usePhageStore((s) => s.setViewMode);
  const setReadingFrame = usePhageStore((s) => s.setReadingFrame);
  const setScrollPosition = usePhageStore((s) => s.setScrollPosition);
  const diffEnabled = usePhageStore((s) => s.diffEnabled);

  // Web preferences
  const scanlines = useWebPreferences((s) => s.scanlines);
  const glow = useWebPreferences((s) => s.glow);

  // Sequence grid hook
  const {
    canvasRef,
    visibleRange,
    scrollToStart,
    scrollToEnd,
  } = useSequenceGrid({
    theme,
    sequence,
    viewMode,
    readingFrame,
    diffSequence,
    diffEnabled,
    scanlines,
    glow,
    reducedMotion,
    onVisibleRangeChange: (range) => {
      setScrollPosition(range.startIndex);
    },
  });

  // Toggle view mode (DNA/AA)
  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'dna' ? 'aa' : 'dna');
  }, [viewMode, setViewMode]);

  // Cycle reading frame
  const cycleReadingFrame = useCallback(() => {
    const frames: Array<0 | 1 | 2 | -1 | -2 | -3> = [0, 1, 2, -1, -2, -3];
    const currentIdx = frames.indexOf(readingFrame as typeof frames[number]);
    const nextIdx = (currentIdx + 1) % frames.length;
    setReadingFrame(frames[nextIdx]);
  }, [readingFrame, setReadingFrame]);

  // Register hotkeys
  useHotkeys([
    { combo: { key: 'v' }, description: 'Toggle DNA/AA view', action: toggleViewMode, modes: ['NORMAL'] },
    { combo: { key: 'f' }, description: 'Cycle reading frame', action: cycleReadingFrame, modes: ['NORMAL'] },
    { combo: { key: 'Home' }, description: 'Go to start', action: scrollToStart, modes: ['NORMAL'] },
    { combo: { key: 'End' }, description: 'Go to end', action: scrollToEnd, modes: ['NORMAL'] },
  ]);

  const viewModeLabel = viewMode === 'dna' ? 'DNA' : 'AA';
  const frameLabel = readingFrame === 0 ? '+1' : readingFrame > 0 ? `+${readingFrame + 1}` : `${readingFrame}`;

  return (
    <div
      className={`sequence-view ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        backgroundColor: colors.background,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.4rem 0.75rem',
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        <span style={{ color: colors.primary, fontWeight: 'bold', fontSize: '0.9rem' }}>
          Sequence
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* View mode badge */}
          <button
            onClick={toggleViewMode}
            style={{
              fontSize: '0.75rem',
              padding: '0.15rem 0.4rem',
              borderRadius: '3px',
              border: `1px solid ${colors.borderLight}`,
              background: viewMode === 'aa' ? colors.accent : colors.backgroundAlt,
              color: viewMode === 'aa' ? '#000' : colors.text,
              cursor: 'pointer',
            }}
            title="Toggle DNA/AA view (v)"
          >
            {viewModeLabel}
          </button>
          {/* Reading frame badge */}
          {viewMode === 'aa' && (
            <button
              onClick={cycleReadingFrame}
              style={{
                fontSize: '0.75rem',
                padding: '0.15rem 0.4rem',
                borderRadius: '3px',
                border: `1px solid ${colors.borderLight}`,
                background: colors.backgroundAlt,
                color: colors.text,
                cursor: 'pointer',
              }}
              title="Cycle reading frame (f)"
            >
              {frameLabel}
            </button>
          )}
          {/* Position indicator */}
          {visibleRange && (
            <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
              {visibleRange.startIndex.toLocaleString()} - {visibleRange.endIndex.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, minHeight: height, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
        {/* Empty state */}
        {!sequence && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textMuted,
            }}
          >
            No sequence loaded
          </div>
        )}
      </div>

      {/* Footer hints */}
      <div
        style={{
          padding: '0.25rem 0.5rem',
          borderTop: `1px solid ${colors.borderLight}`,
          fontSize: '0.7rem',
          color: colors.textMuted,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          <kbd style={{ backgroundColor: colors.backgroundAlt, padding: '0 0.2rem', borderRadius: '2px' }}>v</kbd>
          {' view'}
          {viewMode === 'aa' && (
            <>
              {' '}
              <kbd style={{ backgroundColor: colors.backgroundAlt, padding: '0 0.2rem', borderRadius: '2px' }}>f</kbd>
              {' frame'}
            </>
          )}
        </span>
        <span>scroll to navigate</span>
      </div>
    </div>
  );
}

export default SequenceView;
