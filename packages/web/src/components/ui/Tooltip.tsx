import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  const timeoutRef = useRef<number | null>(null);
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

  const show = () => {
    if (!shouldShow) return; // Don't show if experience level doesn't qualify
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const visible = (externalVisible ?? internalVisible) && shouldShow;

  return (
    <div
      className={`tooltip-container ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {children}
      {visible && (
        <div
          className={`tooltip-content tooltip-${position}`}
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 1000,
            padding: '0.5rem',
            background: 'var(--color-background-alt, #333)',
            color: 'var(--color-text, #fff)',
            border: '1px solid var(--color-border, #555)',
            borderRadius: '4px',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            ...getPositionStyle(position),
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

function getPositionStyle(position: 'top' | 'bottom' | 'left' | 'right'): React.CSSProperties {
  switch (position) {
    case 'top':
      return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '0.5rem' };
    case 'bottom':
      return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '0.5rem' };
    case 'left':
      return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '0.5rem' };
    case 'right':
      return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '0.5rem' };
  }
}
