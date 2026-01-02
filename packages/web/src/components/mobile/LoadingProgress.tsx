/**
 * LoadingProgress - Premium iOS-style top loading indicator
 *
 * A thin gradient progress bar with shimmer effect that appears
 * at the top of the screen during loading operations.
 *
 * Features:
 * - Gradient with shimmer animation
 * - Indeterminate and determinate modes
 * - Smooth entry/exit animations
 * - Respects reduced motion
 */

import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// =============================================================================
// Types
// =============================================================================

interface LoadingProgressProps {
  /** Whether the loading indicator is visible */
  isLoading: boolean;
  /** Progress value 0-100 for determinate mode (optional) */
  progress?: number;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function LoadingProgress({
  isLoading,
  progress,
  className = '',
}: LoadingProgressProps): React.ReactElement | null {
  const reducedMotion = useReducedMotion();
  const isDeterminate = typeof progress === 'number';

  // Spring for visibility
  const visibilitySpring = useSpring({
    opacity: isLoading ? 1 : 0,
    scaleY: isLoading ? 1 : 0,
    config: { tension: 400, friction: 30 },
    immediate: reducedMotion,
  });

  // Spring for progress (determinate mode)
  const progressSpring = useSpring({
    width: isDeterminate ? `${Math.min(100, Math.max(0, progress))}%` : '30%',
    config: { tension: 300, friction: 30 },
    immediate: reducedMotion,
  });

  return (
    <animated.div
      className={`loading-progress ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 'var(--z-toast, 800)',
        overflow: 'hidden',
        transformOrigin: 'top',
        opacity: visibilitySpring.opacity,
        transform: visibilitySpring.scaleY.to(s => `scaleY(${s})`),
        pointerEvents: 'none',
      }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={isDeterminate ? progress : undefined}
      aria-label="Loading"
    >
      {/* Background track */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--color-background-alt, #12121a)',
        }}
      />

      {/* Progress bar */}
      <animated.div
        className={`loading-progress__bar ${isDeterminate ? 'loading-progress__bar--determinate' : 'loading-progress__bar--indeterminate'}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: progressSpring.width,
          background: `linear-gradient(
            90deg,
            var(--color-primary, #22d3ee) 0%,
            var(--color-secondary, #c084fc) 50%,
            var(--color-primary, #22d3ee) 100%
          )`,
          backgroundSize: '200% 100%',
          borderRadius: '0 2px 2px 0',
          boxShadow: '0 0 8px var(--color-glow, rgba(34, 211, 238, 0.5))',
        }}
      />

      {/* Shimmer overlay for indeterminate mode */}
      {!isDeterminate && (
        <div
          className="loading-progress__shimmer"
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.3) 50%,
              transparent 100%
            )`,
            animation: reducedMotion ? 'none' : 'loading-shimmer 1.5s ease-in-out infinite',
          }}
        />
      )}
    </animated.div>
  );
}

export default LoadingProgress;
