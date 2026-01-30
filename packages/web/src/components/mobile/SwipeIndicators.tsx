/**
 * SwipeIndicators - Visual hints for swipe navigation on mobile
 *
 * Displays subtle arrow indicators on left/right edges to hint that
 * users can swipe to navigate between phages. Features:
 * - Pulse animation for new users (first visit)
 * - Subtle mode for learned users
 * - Hides at navigation boundaries (first/last phage)
 * - Respects reduced motion preferences
 * - Clickable for fallback navigation
 */

import React from 'react';

interface SwipeIndicatorsProps {
  /** Hide left arrow (at first phage) */
  isFirst: boolean;
  /** Hide right arrow (at last phage) */
  isLast: boolean;
  /** Master visibility toggle */
  isVisible: boolean;
  /** Show attention-grabbing pulse animation for new users */
  showPulse?: boolean;
  /** Subtle mode for users who have learned the gesture */
  isSubtle?: boolean;
  /** Handler for previous phage navigation */
  onPrev?: () => void;
  /** Handler for next phage navigation */
  onNext?: () => void;
}

/**
 * Left chevron SVG icon
 */
function ChevronLeft(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

/**
 * Right chevron SVG icon
 */
function ChevronRight(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function SwipeIndicators({
  isFirst,
  isLast,
  isVisible,
  showPulse = false,
  isSubtle = false,
  onPrev,
  onNext,
}: SwipeIndicatorsProps): React.ReactElement | null {
  // Don't render if not visible (desktop or no phages)
  if (!isVisible) {
    return null;
  }

  // Build class names for left indicator
  // Only add styling modifiers (subtle/pulse) when not hidden
  const leftClasses = [
    'swipe-indicator',
    'swipe-indicator--left',
    isFirst && 'swipe-indicator--hidden',
    !isFirst && isSubtle && 'swipe-indicator--subtle',
    !isFirst && showPulse && 'swipe-indicator--pulse',
  ]
    .filter(Boolean)
    .join(' ');

  // Build class names for right indicator
  const rightClasses = [
    'swipe-indicator',
    'swipe-indicator--right',
    isLast && 'swipe-indicator--hidden',
    !isLast && isSubtle && 'swipe-indicator--subtle',
    !isLast && showPulse && 'swipe-indicator--pulse',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* Left arrow - swipe right (or tap) to go to previous phage */}
      <button
        type="button"
        className={leftClasses}
        onClick={onPrev}
        disabled={isFirst}
        aria-label="Previous phage"
      >
        <div className="swipe-indicator__arrow">
          <ChevronLeft />
        </div>
      </button>

      {/* Right arrow - swipe left (or tap) to go to next phage */}
      <button
        type="button"
        className={rightClasses}
        onClick={onNext}
        disabled={isLast}
        aria-label="Next phage"
      >
        <div className="swipe-indicator__arrow">
          <ChevronRight />
        </div>
      </button>
    </>
  );
}

export default SwipeIndicators;