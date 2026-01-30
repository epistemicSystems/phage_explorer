/**
 * useScrollRestoration - Preserves and restores scroll position across navigations
 *
 * Uses a module-scoped Map for session-only persistence (no localStorage).
 * rAF-throttled scroll listener saves position. useLayoutEffect restores on mount.
 */

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

/** Session-only scroll position cache keyed by route/identifier */
const scrollPositionCache = new Map<string, number>();

/** Maximum entries to prevent unbounded memory growth */
const MAX_CACHE_ENTRIES = 50;

/** Evict oldest entries if cache exceeds max size (simple FIFO) */
function evictIfNeeded(): void {
  if (scrollPositionCache.size <= MAX_CACHE_ENTRIES) return;
  // Map iteration order is insertion order - delete oldest entries
  const keysToDelete = scrollPositionCache.size - MAX_CACHE_ENTRIES;
  let deleted = 0;
  for (const key of scrollPositionCache.keys()) {
    if (deleted >= keysToDelete) break;
    scrollPositionCache.delete(key);
    deleted++;
  }
}

export interface UseScrollRestorationOptions {
  /** Unique key for this scroll context (e.g. route path, list id) */
  key: string;
  /** Whether restoration is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Attach to a scrollable element ref to preserve and restore scroll position.
 *
 * @example
 * ```tsx
 * const listRef = useRef<HTMLDivElement>(null);
 * useScrollRestoration(listRef, { key: 'phage-list' });
 * ```
 */
export function useScrollRestoration(
  ref: RefObject<HTMLElement | null>,
  options: UseScrollRestorationOptions
): void {
  const { key, enabled = true } = options;
  const rafIdRef = useRef<number | null>(null);

  // Restore scroll position on mount
  useLayoutEffect(() => {
    if (!enabled || !ref.current) return;
    const saved = scrollPositionCache.get(key);
    if (saved != null && saved > 0) {
      ref.current.scrollTop = saved;
    }
  }, [key, enabled, ref]);

  // Save scroll position on scroll (rAF-throttled)
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (el) {
          scrollPositionCache.set(key, el.scrollTop);
          evictIfNeeded();
        }
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [key, enabled, ref]);
}
