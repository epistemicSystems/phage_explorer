/**
 * Haptics Utility - Native-Feeling Touch Feedback
 *
 * Provides tactile feedback patterns similar to iOS/Android native apps.
 * Gracefully degrades on devices without vibration support.
 *
 * Design inspired by Apple's Human Interface Guidelines and
 * Android's Material Design haptic patterns.
 */

export type HapticPattern =
  | 'light'      // Subtle tap - selecting items, toggles
  | 'medium'     // Standard confirmation - button press
  | 'heavy'      // Strong feedback - important actions
  | 'success'    // Positive outcome - task complete
  | 'warning'    // Caution - destructive action available
  | 'error'      // Negative outcome - error occurred
  | 'selection'  // Quick selection change - picker, slider
  | 'impact';    // Physical impact feel - drag drop

// Vibration patterns in milliseconds [vibrate, pause, vibrate, ...]
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [15, 50, 25],       // Short-pause-longer
  warning: [30, 80, 30],       // Alert pattern
  error: [50, 100, 50, 100, 50], // Triple buzz
  selection: 5,                 // Barely perceptible
  impact: 35,
};

// Check if device supports vibration
function supportsVibration(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

function hasUserActivation(): boolean {
  if (typeof navigator === 'undefined') return false;

  const activation = (navigator as unknown as { userActivation?: { hasBeenActive?: boolean } }).userActivation;
  if (activation && typeof activation.hasBeenActive === 'boolean') {
    return activation.hasBeenActive;
  }

  // If the browser doesn't expose user activation state, assume OK.
  return true;
}

// Check if user prefers reduced motion
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Trigger haptic feedback with specified pattern
 */
export function haptic(pattern: HapticPattern = 'medium'): void {
  // Skip if user prefers reduced motion
  if (prefersReducedMotion()) return;

  // Skip if device doesn't support vibration
  if (!supportsVibration()) return;

  // Skip until user interacts with the page (avoids noisy console errors in Chromium)
  if (!hasUserActivation()) return;

  try {
    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    navigator.vibrate(vibrationPattern);
  } catch {
    // Silently fail - haptics are non-critical
  }
}

/**
 * Light tap - for toggles, selections, minor interactions
 */
export function hapticLight(): void {
  haptic('light');
}

/**
 * Medium tap - for button presses, confirmations
 */
export function hapticMedium(): void {
  haptic('medium');
}

/**
 * Heavy tap - for important actions, navigation
 */
export function hapticHeavy(): void {
  haptic('heavy');
}

/**
 * Success pattern - for completed actions
 */
export function hapticSuccess(): void {
  haptic('success');
}

/**
 * Warning pattern - for destructive action warnings
 */
export function hapticWarning(): void {
  haptic('warning');
}

/**
 * Error pattern - for failed actions
 */
export function hapticError(): void {
  haptic('error');
}

/**
 * Selection pattern - for quick selections (pickers, sliders)
 */
export function hapticSelection(): void {
  haptic('selection');
}

/**
 * Impact pattern - for drag/drop, physical interactions
 */
export function hapticImpact(): void {
  haptic('impact');
}

/**
 * Custom vibration pattern
 * @param pattern - Array of [vibrate, pause, vibrate, ...] in ms
 */
export function hapticCustom(pattern: number[]): void {
  if (prefersReducedMotion()) return;
  if (!supportsVibration()) return;
  if (!hasUserActivation()) return;

  try {
    navigator.vibrate(pattern);
  } catch {
    // Silently fail
  }
}

/**
 * Cancel any ongoing vibration
 */
export function hapticCancel(): void {
  if (!supportsVibration()) return;

  try {
    navigator.vibrate(0);
  } catch {
    // Silently fail
  }
}

// =============================================================================
// CONTEXTUAL HAPTIC SEQUENCES
// Premium multi-step haptic patterns for complex interactions
// =============================================================================

/**
 * Navigation complete - satisfying double-tap confirmation
 * Use when: navigating to a new view, completing a swipe action
 */
export function hapticNavigationComplete(): void {
  hapticLight();
  setTimeout(() => hapticLight(), 100);
}

/**
 * Long press buildup - increasing intensity as threshold approaches
 * Use when: long-press is progressing toward activation
 * @param progress - 0 to 1 indicating how close to activation
 */
export function hapticLongPressBuildup(progress: number): void {
  if (progress > 0.7) {
    hapticMedium();
  } else if (progress > 0.4) {
    hapticLight();
  } else if (progress > 0.2) {
    hapticSelection();
  }
}

/**
 * Success celebration - multi-step positive feedback
 * Use when: completing an important action, achieving a goal
 */
export function hapticSuccessCelebration(): void {
  hapticSuccess();
  setTimeout(() => hapticLight(), 150);
  setTimeout(() => hapticLight(), 300);
}

/**
 * Error rhythm - emphatic negative feedback
 * Use when: action failed, validation error
 */
export function hapticErrorRhythm(): void {
  hapticError();
  setTimeout(() => hapticLight(), 200);
}

/**
 * Boundary hit - physical edge feedback
 * Use when: reaching scroll boundary, limit of draggable area
 */
export function hapticBoundaryHit(): void {
  hapticImpact();
}

/**
 * Tick haptic for scrubbing interactions
 * Use when: moving through discrete values (sliders, pickers)
 * @param value - current value
 * @param tickInterval - interval between ticks
 * @param lastTickRef - mutable ref to track last tick (pass { current: 0 })
 * @returns true if tick was triggered
 */
export function hapticTick(
  value: number,
  tickInterval: number,
  lastTickRef: { current: number }
): boolean {
  const currentTick = Math.floor(value / tickInterval);
  if (currentTick !== lastTickRef.current) {
    hapticSelection();
    lastTickRef.current = currentTick;
    return true;
  }
  return false;
}

/**
 * React hook helper - returns haptic functions
 * Usage: const { tap, success } = useHaptics();
 */
export const haptics = {
  light: hapticLight,
  medium: hapticMedium,
  heavy: hapticHeavy,
  success: hapticSuccess,
  warning: hapticWarning,
  error: hapticError,
  selection: hapticSelection,
  impact: hapticImpact,
  cancel: hapticCancel,
  custom: hapticCustom,
  // Contextual sequences
  navigationComplete: hapticNavigationComplete,
  longPressBuildup: hapticLongPressBuildup,
  successCelebration: hapticSuccessCelebration,
  errorRhythm: hapticErrorRhythm,
  boundaryHit: hapticBoundaryHit,
  tick: hapticTick,
};

export default haptics;
