/**
 * useSwipeNavigation - Swipe-based phage navigation
 *
 * Enables horizontal swipe gestures to navigate between phages.
 * Provides visual feedback during the gesture and spring animation on release.
 */

import { useCallback, useMemo } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { usePhageStore } from '@phage-explorer/state';
import { useSwipe, type SwipeDirection } from './useGestures';
import { useReducedMotion } from './useReducedMotion';

// =============================================================================
// Types
// =============================================================================

export interface UseSwipeNavigationOptions {
  /** Whether swipe navigation is enabled (default: true) */
  enabled?: boolean;
  /** Minimum swipe distance to trigger navigation (default: 80) */
  threshold?: number;
  /** Minimum swipe velocity to trigger navigation (default: 0.4) */
  velocityThreshold?: number;
  /** Callback after navigation completes */
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export interface UseSwipeNavigationResult {
  /** Bind handlers to the swipeable element */
  bind: ReturnType<typeof useSwipe>;
  /** Spring styles for animated container */
  springStyle: {
    transform: string;
    opacity: number;
  };
  /** Animated div component from react-spring */
  AnimatedDiv: typeof animated.div;
  /** Whether at the first phage (can't go prev) */
  isFirst: boolean;
  /** Whether at the last phage (can't go next) */
  isLast: boolean;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for swipe-based phage navigation with spring physics.
 *
 * @example
 * ```tsx
 * function PhageViewer() {
 *   const { bind, springStyle, AnimatedDiv, isFirst, isLast } = useSwipeNavigation();
 *
 *   return (
 *     <AnimatedDiv {...bind()} style={springStyle} className="phage-container">
 *       <SequenceView />
 *       {isFirst && <div className="edge-indicator left" />}
 *       {isLast && <div className="edge-indicator right" />}
 *     </AnimatedDiv>
 *   );
 * }
 * ```
 */
export function useSwipeNavigation(
  options: UseSwipeNavigationOptions = {}
): UseSwipeNavigationResult {
  const {
    enabled = true,
    threshold = 80,
    velocityThreshold = 0.4,
    onNavigate,
  } = options;

  const reducedMotion = useReducedMotion();

  // Store selectors
  const nextPhage = usePhageStore((s) => s.nextPhage);
  const prevPhage = usePhageStore((s) => s.prevPhage);
  const currentPhageIndex = usePhageStore((s) => s.currentPhageIndex);
  const phagesCount = usePhageStore((s) => s.phages.length);

  // Derived state
  const isFirst = currentPhageIndex === 0;
  const isLast = currentPhageIndex >= phagesCount - 1;

  // Spring animation for smooth transitions
  const [spring, api] = useSpring(() => ({
    x: 0,
    opacity: 1,
    config: reducedMotion ? { duration: 0 } : config.stiff,
  }));

  // Handle successful swipe
  const handleSwipe = useCallback(
    ({ direction, velocity }: { direction: SwipeDirection; velocity: number }) => {
      if (!enabled) return;

      // Only handle horizontal swipes
      if (direction !== 'left' && direction !== 'right') return;

      const isGoingNext = direction === 'left';
      const isGoingPrev = direction === 'right';

      // Check bounds
      if (isGoingNext && isLast) {
        // Bounce back - at end
        api.start({
          x: 0,
          config: { tension: 400, friction: 30 },
        });
        return;
      }

      if (isGoingPrev && isFirst) {
        // Bounce back - at start
        api.start({
          x: 0,
          config: { tension: 400, friction: 30 },
        });
        return;
      }

      // Calculate slide distance based on velocity
      const slideDistance = Math.min(velocity * 100, 200);

      if (reducedMotion) {
        // Instant navigation for reduced motion
        if (isGoingNext) {
          nextPhage();
          onNavigate?.('next');
        } else {
          prevPhage();
          onNavigate?.('prev');
        }
        return;
      }

      // Animate out in swipe direction
      api.start({
        x: isGoingNext ? -slideDistance : slideDistance,
        opacity: 0.8,
        config: { tension: 300, friction: 30 },
        onRest: () => {
          // Navigate
          if (isGoingNext) {
            nextPhage();
            onNavigate?.('next');
          } else {
            prevPhage();
            onNavigate?.('prev');
          }

          // Reset position instantly
          api.set({ x: isGoingNext ? slideDistance : -slideDistance });

          // Animate in from opposite direction
          api.start({
            x: 0,
            opacity: 1,
            config: { tension: 400, friction: 35 },
          });
        },
      });
    },
    [enabled, isFirst, isLast, nextPhage, prevPhage, onNavigate, api, reducedMotion]
  );

  // Swipe gesture binding
  const bind = useSwipe({
    onSwipe: handleSwipe,
    threshold,
    velocityThreshold,
    axis: 'x',
    hapticFeedback: true,
  });

  // Spring style for animated component
  const springStyle = useMemo(
    () => ({
      transform: spring.x.to((x) => `translateX(${x}px)`),
      opacity: spring.opacity,
    }),
    [spring.x, spring.opacity]
  );

  return {
    bind: enabled ? bind : () => ({}),
    springStyle: springStyle as unknown as { transform: string; opacity: number },
    AnimatedDiv: animated.div,
    isFirst,
    isLast,
  };
}

export default useSwipeNavigation;
