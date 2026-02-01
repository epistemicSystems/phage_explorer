/**
 * Animation Utilities
 *
 * Smooth, purposeful animations using anime.js v4
 * Inspired by Ciechanowski's explorable explanations
 */

import { animate, stagger, createTimeline, JSAnimation, Timeline } from 'animejs';

export { animate, stagger, createTimeline };
export type { JSAnimation, Timeline };

/**
 * Ease functions for consistent motion design
 */
export const easing = {
  // Standard eases
  linear: 'linear' as const,
  easeIn: 'inQuad' as const,
  easeOut: 'outQuad' as const,
  easeInOut: 'inOutQuad' as const,

  // Expo eases
  expo: 'outExpo' as const,
  expoIn: 'inExpo' as const,
  expoInOut: 'inOutExpo' as const,

  // Cubic
  cubic: 'outCubic' as const,
  cubicIn: 'inCubic' as const,
  cubicInOut: 'inOutCubic' as const,

  // Smooth sine
  smooth: 'inOutSine' as const,

  // Spring-like (anime.js v4 uses spring())
  spring: 'outBack' as const,
};

/**
 * Duration presets in milliseconds
 */
export const duration = {
  instant: 50,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800,
};

/**
 * Simple animation wrapper that returns the animation instance
 */
export function animateElement(
  targets: string | Element | Element[] | NodeList,
  properties: Record<string, unknown>,
  options: {
    duration?: number;
    delay?: number;
    ease?: string;
    onUpdate?: () => void;
    onComplete?: () => void;
  } = {}
): JSAnimation {
  const params = {
    ...properties,
    duration: options.duration ?? duration.normal,
    delay: options.delay ?? 0,
    ease: options.ease ?? easing.easeOut,
  };

  // Add callbacks if provided (anime.js v4 has different callback signatures)
  if (options.onComplete) {
    (params as any).onComplete = options.onComplete;
  }

  return animate(targets, params as any);
}

/**
 * Fade in animation
 */
export function fadeIn(
  target: string | Element | Element[] | NodeList,
  options: {
    duration?: number;
    delay?: number;
    easing?: string;
  } = {}
): JSAnimation {
  return animate(target, {
    opacity: [0, 1],
    duration: options.duration ?? duration.normal,
    delay: options.delay ?? 0,
    ease: options.easing ?? easing.easeOut,
  });
}

/**
 * Fade out animation
 */
export function fadeOut(
  target: string | Element | Element[] | NodeList,
  options: {
    duration?: number;
    delay?: number;
    easing?: string;
  } = {}
): JSAnimation {
  return animate(target, {
    opacity: [1, 0],
    duration: options.duration ?? duration.normal,
    delay: options.delay ?? 0,
    ease: options.easing ?? easing.easeOut,
  });
}

/**
 * Slide in from direction
 */
export function slideIn(
  target: string | Element | Element[] | NodeList,
  options: {
    direction?: 'up' | 'down' | 'left' | 'right';
    distance?: number;
    duration?: number;
    delay?: number;
    easing?: string;
  } = {}
): JSAnimation {
  const dir = options.direction ?? 'up';
  const dist = options.distance ?? 20;

  const translateProp = dir === 'up' || dir === 'down' ? 'translateY' : 'translateX';
  const translateValue = dir === 'down' || dir === 'right' ? -dist : dist;

  return animate(target, {
    opacity: [0, 1],
    [translateProp]: [translateValue, 0],
    duration: options.duration ?? duration.normal,
    delay: options.delay ?? 0,
    ease: options.easing ?? easing.expo,
  });
}

/**
 * Stagger animation for lists
 */
export function staggerIn(
  targets: string | Element | Element[] | NodeList,
  options: {
    staggerDelay?: number;
    duration?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    easing?: string;
  } = {}
): JSAnimation {
  const dir = options.direction ?? 'up';
  const dist = 16;

  const translateProp = dir === 'up' || dir === 'down' ? 'translateY' : 'translateX';
  const translateValue = dir === 'down' || dir === 'right' ? -dist : dist;

  return animate(targets, {
    opacity: [0, 1],
    [translateProp]: [translateValue, 0],
    duration: options.duration ?? duration.normal,
    delay: stagger(options.staggerDelay ?? 50),
    ease: options.easing ?? easing.expo,
  });
}

/**
 * Scale animation for emphasis
 */
export function pulse(
  target: string | Element | Element[] | NodeList,
  options: {
    scale?: number;
    duration?: number;
  } = {}
): JSAnimation {
  return animate(target, {
    scale: [1, options.scale ?? 1.05, 1],
    duration: options.duration ?? duration.slow,
    ease: easing.smooth,
  });
}

/**
 * Number counter animation
 */
export function countTo(
  element: HTMLElement,
  endValue: number,
  options: {
    startValue?: number;
    duration?: number;
    decimals?: number;
    easing?: string;
  } = {}
): void {
  const decimals = options.decimals ?? 0;
  const startVal = options.startValue ?? 0;
  const dur = options.duration ?? duration.slow;

  // Use requestAnimationFrame for smooth counting
  const startTime = performance.now();
  const update = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / dur, 1);
    const value = startVal + (endValue - startVal) * progress;

    element.textContent = decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  };

  requestAnimationFrame(update);
}

/**
 * Progress bar animation
 */
export function animateProgress(
  element: HTMLElement,
  progress: number,
  options: {
    duration?: number;
    easing?: string;
  } = {}
): JSAnimation {
  return animate(element, {
    width: `${Math.min(100, Math.max(0, progress))}%`,
    duration: options.duration ?? duration.normal,
    ease: options.easing ?? easing.easeOut,
  });
}

/**
 * Scroll into view with animation
 */
export function scrollIntoView(
  element: HTMLElement,
  options: {
    offset?: number;
    duration?: number;
  } = {}
): void {
  const { offset = 0, duration: dur = 800 } = options;
  const targetY = element.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top: targetY,
    behavior: 'smooth',
  });
}

/**
 * Highlight animation (for drawing attention)
 */
export function highlight(
  target: string | Element | Element[] | NodeList,
  options: {
    color?: string;
    duration?: number;
  } = {}
): JSAnimation {
  const color = options.color ?? 'rgba(59, 130, 246, 0.3)';

  return animate(target, {
    backgroundColor: [color, 'transparent'],
    duration: options.duration ?? duration.slow,
    ease: easing.easeOut,
  });
}

/**
 * Path drawing animation (for SVG)
 */
export function drawPath(
  path: SVGPathElement,
  options: {
    duration?: number;
    delay?: number;
    easing?: string;
  } = {}
): JSAnimation {
  const length = path.getTotalLength();

  // Set initial state
  path.style.strokeDasharray = `${length}`;
  path.style.strokeDashoffset = `${length}`;

  return animate(path, {
    strokeDashoffset: [length, 0],
    duration: options.duration ?? 1000,
    delay: options.delay ?? 0,
    ease: options.easing ?? easing.smooth,
  });
}

/**
 * Animate a value over time (useful for canvas animations)
 */
export function tweenValue(
  from: number,
  to: number,
  onUpdate: (value: number) => void,
  options: {
    duration?: number;
    easing?: string;
  } = {}
): void {
  const dur = options.duration ?? duration.normal;
  const startTime = performance.now();

  const update = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / dur, 1);
    const value = from + (to - from) * progress;

    onUpdate(value);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  };

  requestAnimationFrame(update);
}

/**
 * Create smooth value interpolation for interactive controls
 */
export class SmoothValue {
  private current: number;
  private target: number;
  private rafId: number | null = null;

  constructor(initial: number) {
    this.current = initial;
    this.target = initial;
  }

  get value(): number {
    return this.current;
  }

  set(newTarget: number, immediate = false): void {
    this.target = newTarget;

    if (immediate) {
      this.current = newTarget;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      return;
    }

    if (this.rafId) return; // Already animating

    const startTime = performance.now();
    const startValue = this.current;
    const dur = duration.normal;

    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / dur, 1);
      this.current = startValue + (this.target - startValue) * progress;

      if (progress < 1) {
        this.rafId = requestAnimationFrame(update);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(update);
  }
}
