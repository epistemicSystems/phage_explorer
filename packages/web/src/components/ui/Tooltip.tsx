import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { ExperienceLevel } from '@phage-explorer/state';
import { useExperienceLevel } from '@phage-explorer/state';

/**
 * Hint types for experience-level-aware tooltips.
 * Different hint types appear at different experience levels.
 */
export type HintType =
  | 'definition'    // Glossary term definitions - always available
  | 'shortcut'      // Keyboard shortcut hints - novice/intermediate only
  | 'feature'       // Feature discovery hints - novice only
  | 'advanced'      // Advanced feature hints - never auto-show, on-demand only
  | 'always';       // Always show regardless of level

/**
 * Configuration for which hints show at which experience levels.
 * Empty array means never auto-show (but still available on demand).
 */
const HINT_VISIBILITY: Record<HintType, ExperienceLevel[]> = {
  definition: ['novice', 'intermediate', 'power'],  // Always available
  shortcut: ['novice', 'intermediate'],              // Power users know shortcuts
  feature: ['novice'],                               // Only for beginners discovering features
  advanced: [],                                      // Never auto-show, on-demand only
  always: ['novice', 'intermediate', 'power'],       // Always visible
};

/**
 * Determine if a hint should be shown based on experience level.
 * @param level Current experience level
 * @param hintType Type of hint being displayed
 * @returns true if the hint should auto-show, false otherwise
 */
export function shouldShowHint(level: ExperienceLevel, hintType: HintType): boolean {
  return HINT_VISIBILITY[hintType].includes(level);
}

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  isVisible?: boolean; // Control visibility externally if needed
  /**
   * Hint type for experience-level gating. If provided, tooltip only
   * auto-shows when the user's experience level qualifies.
   * Defaults to 'always' (no gating).
   */
  hintType?: HintType;
  /**
   * Force show regardless of experience level. Useful for on-demand tooltips.
   */
  forceShow?: boolean;
}

/** Viewport margin in px for flip detection */
const FLIP_MARGIN = 12;

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  className = '',
  isVisible: externalVisible,
  hintType = 'always',
  forceShow = false,
}) => {
  const [internalVisible, setVisible] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const experienceLevel = useExperienceLevel() as ExperienceLevel;

  // Check if this hint should show based on experience level
  const shouldShow = useMemo(() => {
    if (forceShow) return true;
    return shouldShowHint(experienceLevel, hintType);
  }, [experienceLevel, hintType, forceShow]);

  // Cleanup timeout on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const show = useCallback(() => {
    if (!shouldShow) return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setVisible(true), delay);
  }, [shouldShow, delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setVisible(false);
    setFlipped(false);
  }, []);

  const visible = (externalVisible ?? internalVisible) && shouldShow;

  // Viewport boundary detection: flip tooltip if it would overflow
  useEffect(() => {
    if (!visible || !tooltipRef.current) return;

    const el = tooltipRef.current;
    const rect = el.getBoundingClientRect();

    let needsFlip = false;
    if (position === 'top' && rect.top < FLIP_MARGIN) {
      needsFlip = true;
    } else if (position === 'bottom' && rect.bottom > window.innerHeight - FLIP_MARGIN) {
      needsFlip = true;
    } else if (position === 'left' && rect.left < FLIP_MARGIN) {
      needsFlip = true;
    } else if (position === 'right' && rect.right > window.innerWidth - FLIP_MARGIN) {
      needsFlip = true;
    }

    setFlipped(needsFlip);
  }, [visible, position]);

  const tooltipClassName = [
    'tooltip-content',
    `tooltip-${position}`,
    flipped ? 'tooltip-flipped' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={`tooltip-container ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          className={tooltipClassName}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
};
