/**
 * PhageList Component
 *
 * A keyboard-navigable list of phages with windowed scrolling.
 * Displays phage name, host organism, and genome length.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { usePhageStore } from '@phage-explorer/state';
import { useTheme } from '../hooks/useTheme';
import { useHotkeys } from '../hooks';

interface PhageListProps {
  /** Number of visible items */
  visibleCount?: number;
  /** Callback when a phage is selected */
  onSelect?: (index: number) => void;
  /** Custom class name */
  className?: string;
}

// Format genome size with appropriate suffix
function formatSize(bp: number | null | undefined): string {
  if (!bp) return '?';
  if (bp >= 100_000) return `${(bp / 1000).toFixed(0)}k`;
  if (bp >= 10_000) return `${(bp / 1000).toFixed(1)}k`;
  return `${(bp / 1000).toFixed(1)}k`;
}

// Truncate host name intelligently
function abbreviateHost(host: string | null | undefined): string {
  if (!host) return '';
  const first = host.split(/[\s,.]+/)[0];
  if (first.length <= 8) return first;
  // Common abbreviations
  const lower = first.toLowerCase();
  if (lower.startsWith('escherichia')) return 'E.coli';
  if (lower.startsWith('salmonella')) return 'Sal.';
  if (lower.startsWith('pseudomonas')) return 'Psd.';
  if (lower.startsWith('bacillus')) return 'Bac.';
  if (lower.startsWith('staphylococcus')) return 'Staph.';
  if (lower.startsWith('streptococcus')) return 'Strep.';
  return first.substring(0, 6) + '.';
}

export function PhageList({
  visibleCount = 15,
  onSelect,
  className = '',
}: PhageListProps): React.ReactElement {
  const { theme } = useTheme();
  const colors = theme.colors;
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // State from store
  const phages = usePhageStore((s) => s.phages);
  const currentIndex = usePhageStore((s) => s.currentPhageIndex);
  const setCurrentPhageIndex = usePhageStore((s) => s.setCurrentPhageIndex);

  // Calculate visible window
  const halfWindow = Math.floor(visibleCount / 2);
  let startIndex = Math.max(0, currentIndex - halfWindow);
  const endIndex = Math.min(phages.length, startIndex + visibleCount);

  // Adjust if we're near the end
  if (endIndex - startIndex < visibleCount && startIndex > 0) {
    startIndex = Math.max(0, endIndex - visibleCount);
  }

  const visiblePhages = phages.slice(startIndex, endIndex);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (phages.length === 0) return;
    const nextIndex = (currentIndex + 1) % phages.length;
    setCurrentPhageIndex(nextIndex);
    onSelect?.(nextIndex);
  }, [currentIndex, phages.length, setCurrentPhageIndex, onSelect]);

  const handlePrev = useCallback(() => {
    if (phages.length === 0) return;
    const prevIndex = (currentIndex - 1 + phages.length) % phages.length;
    setCurrentPhageIndex(prevIndex);
    onSelect?.(prevIndex);
  }, [currentIndex, phages.length, setCurrentPhageIndex, onSelect]);

  const handleFirst = useCallback(() => {
    if (phages.length === 0) return;
    setCurrentPhageIndex(0);
    onSelect?.(0);
  }, [phages.length, setCurrentPhageIndex, onSelect]);

  const handleLast = useCallback(() => {
    if (phages.length === 0) return;
    const lastIndex = phages.length - 1;
    setCurrentPhageIndex(lastIndex);
    onSelect?.(lastIndex);
  }, [phages.length, setCurrentPhageIndex, onSelect]);

  // Page navigation
  const handlePageDown = useCallback(() => {
    if (phages.length === 0) return;
    const nextIndex = Math.min(currentIndex + visibleCount, phages.length - 1);
    setCurrentPhageIndex(nextIndex);
    onSelect?.(nextIndex);
  }, [currentIndex, phages.length, visibleCount, setCurrentPhageIndex, onSelect]);

  const handlePageUp = useCallback(() => {
    if (phages.length === 0) return;
    const prevIndex = Math.max(currentIndex - visibleCount, 0);
    setCurrentPhageIndex(prevIndex);
    onSelect?.(prevIndex);
  }, [currentIndex, visibleCount, setCurrentPhageIndex, onSelect]);

  // Select by click
  const handleClick = useCallback(
    (index: number) => {
      setCurrentPhageIndex(index);
      onSelect?.(index);
    },
    [setCurrentPhageIndex, onSelect]
  );

  // Register navigation hotkeys
  // Note: j/k are registered in App.tsx for global navigation with data loading
  // Only register keys that aren't handled globally
  useHotkeys([
    { combo: { key: 'ArrowDown' }, description: 'Next phage', action: handleNext, modes: ['NORMAL'] },
    { combo: { key: 'ArrowUp' }, description: 'Previous phage', action: handlePrev, modes: ['NORMAL'] },
    { combo: { sequence: ['g', 'g'] }, description: 'Go to first', action: handleFirst, modes: ['NORMAL'] },
    { combo: { key: 'G', modifiers: { shift: true } }, description: 'Go to last', action: handleLast, modes: ['NORMAL'] },
    { combo: { key: 'PageDown' }, description: 'Page down', action: handlePageDown, modes: ['NORMAL'] },
    { combo: { key: 'PageUp' }, description: 'Page up', action: handlePageUp, modes: ['NORMAL'] },
  ]);

  // Scroll selected item into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentIndex]);

  const hasMore = phages.length > visibleCount;
  const showTopIndicator = startIndex > 0;
  const showBottomIndicator = endIndex < phages.length;

  return (
    <div
      ref={listRef}
      className={`phage-list ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        backgroundColor: colors.background,
        overflow: 'hidden',
      }}
      role="listbox"
      aria-label="Phage list"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.5rem 0.75rem',
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        <span style={{ color: colors.primary, fontWeight: 'bold' }}>Phages</span>
        <span
          style={{
            fontSize: '0.8rem',
            color: colors.textMuted,
            backgroundColor: colors.backgroundAlt,
            padding: '0.1rem 0.4rem',
            borderRadius: '4px',
          }}
        >
          {phages.length}
        </span>
      </div>

      {/* Scroll indicator (top) */}
      {hasMore && (
        <div
          style={{
            textAlign: 'center',
            padding: '0.2rem',
            fontSize: '0.75rem',
            color: showTopIndicator ? colors.accent : colors.backgroundAlt,
          }}
          aria-hidden="true"
        >
          {showTopIndicator ? '▲ more' : '\u00A0'}
        </div>
      )}

      {/* Phage items */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.25rem',
        }}
      >
        {visiblePhages.map((phage, i) => {
          const actualIndex = startIndex + i;
          const isSelected = actualIndex === currentIndex;
          const hostAbbr = abbreviateHost(phage.host);
          const sizeStr = formatSize(phage.genomeLength);

          return (
            <button
              key={phage.id}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => handleClick(actualIndex)}
              role="option"
              aria-selected={isSelected}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '0.4rem 0.5rem',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: isSelected ? colors.backgroundAlt : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = `${colors.backgroundAlt}80`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                {/* Selection indicator */}
                <span
                  style={{
                    color: isSelected ? colors.accent : 'transparent',
                    fontWeight: 'bold',
                    width: '1rem',
                    flexShrink: 0,
                  }}
                >
                  ▶
                </span>
                {/* Name */}
                <span
                  style={{
                    color: isSelected ? colors.text : colors.textDim,
                    fontWeight: isSelected ? 'bold' : 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {phage.name}
                </span>
              </div>

              {/* Metadata */}
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, fontSize: '0.85rem' }}>
                {hostAbbr && (
                  <span style={{ color: colors.textMuted }}>{hostAbbr}</span>
                )}
                <span style={{ color: isSelected ? colors.info : colors.textMuted }}>
                  {sizeStr}
                </span>
              </div>
            </button>
          );
        })}

        {/* Empty state */}
        {phages.length === 0 && (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: colors.textMuted,
            }}
          >
            Loading phages...
          </div>
        )}
      </div>

      {/* Scroll indicator (bottom) */}
      {hasMore && (
        <div
          style={{
            textAlign: 'center',
            padding: '0.2rem',
            fontSize: '0.75rem',
            color: showBottomIndicator ? colors.accent : colors.backgroundAlt,
          }}
          aria-hidden="true"
        >
          {showBottomIndicator ? '▼ more' : '\u00A0'}
        </div>
      )}

      {/* Navigation hint */}
      <div
        style={{
          padding: '0.3rem 0.5rem',
          borderTop: `1px solid ${colors.borderLight}`,
          fontSize: '0.7rem',
          color: colors.textMuted,
          textAlign: 'center',
        }}
      >
        <kbd style={{ backgroundColor: colors.backgroundAlt, padding: '0 0.3rem', borderRadius: '2px' }}>j</kbd>
        /
        <kbd style={{ backgroundColor: colors.backgroundAlt, padding: '0 0.3rem', borderRadius: '2px' }}>k</kbd>
        {' navigate'}
      </div>
    </div>
  );
}

export default PhageList;
