/**
 * WASM Module Loader - Worker-safe cached initialization
 *
 * Provides a single, reusable pattern for loading the wasm-compute module
 * that works in both main thread and workers.
 *
 * Features:
 * - One-time initialization with cached result
 * - Safe for concurrent callers (deduplicates in-flight loads)
 * - Works in main thread and module workers
 * - Clear error messages and fallback behavior
 * - Dev-only structured logging
 *
 * ## Usage
 *
 * ```ts
 * import { getWasmCompute, isWasmComputeAvailable } from './lib/wasm-loader';
 *
 * // Quick sync check (after first load attempt)
 * if (isWasmComputeAvailable()) {
 *   // WASM is ready
 * }
 *
 * // Get the module (async, cached)
 * const wasm = await getWasmCompute();
 * if (wasm) {
 *   // Use WASM functions
 *   const result = wasm.compute_gc_skew(sequence, windowSize);
 * } else {
 *   // Fall back to JS implementation
 * }
 * ```
 *
 * ## Worker Usage
 *
 * The loader is designed to work identically in workers:
 *
 * ```ts
 * // In a worker file
 * import { getWasmCompute } from '../lib/wasm-loader';
 *
 * async function processData(data: Uint8Array) {
 *   const wasm = await getWasmCompute();
 *   if (wasm) {
 *     return wasm.some_function(data);
 *   }
 *   return fallbackJsImplementation(data);
 * }
 * ```
 *
 * @module wasm-loader
 * @see phage_explorer-8qk2.2
 */

import { canUseWasm } from './browser-capabilities';

// ============================================================================
// Types
// ============================================================================

/**
 * The wasm-compute module type.
 * This is the dynamic import type of '@phage/wasm-compute'.
 */
export type WasmComputeModule = typeof import('@phage/wasm-compute');

/**
 * Result of attempting to load the WASM module.
 */
export type WasmLoadResult =
  | { ok: true; module: WasmComputeModule }
  | { ok: false; error: string };

/**
 * Loading state for the WASM module.
 */
export type WasmLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; module: WasmComputeModule }
  | { status: 'failed'; error: string };

// ============================================================================
// State
// ============================================================================

/** Current load state */
let loadState: WasmLoadState = { status: 'idle' };

/** In-flight load promise (for deduplication) */
let loadPromise: Promise<WasmLoadResult> | null = null;

// ============================================================================
// Logging (dev-only)
// ============================================================================

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;

function log(message: string, data?: Record<string, unknown>): void {
  if (!isDev) return;
  if (data) {
    console.log(`[wasm-loader] ${message}`, data);
  } else {
    console.log(`[wasm-loader] ${message}`);
  }
}

function warn(message: string, error?: unknown): void {
  if (!isDev) return;
  if (error) {
    console.warn(`[wasm-loader] ${message}`, error);
  } else {
    console.warn(`[wasm-loader] ${message}`);
  }
}

// ============================================================================
// Core Loading Logic
// ============================================================================

/**
 * Attempt to load the wasm-compute module.
 * This is the internal implementation that does the actual work.
 */
async function loadWasmModule(): Promise<WasmLoadResult> {
  // Quick check: is WASM even supported?
  if (!canUseWasm()) {
    const error = 'WebAssembly not supported in this environment';
    warn(error);
    return { ok: false, error };
  }

  try {
    log('Loading wasm-compute module...');
    const startTime = performance.now();

    // Dynamic import of the WASM module
    const wasm = await import('@phage/wasm-compute');

    // Initialize the module if it has an init function
    // Some wasm-bindgen outputs require explicit init, others auto-init
    try {
      // Try to call init if it exists (wasm-bindgen --target web style)
      const maybeInit = (wasm as unknown as { default?: () => Promise<void> }).default;
      if (typeof maybeInit === 'function') {
        await maybeInit();
        log('WASM init() called successfully');
      }
    } catch (initError) {
      // Init may not be needed or may have already been called
      // This is not a fatal error - the module may still work
      log('WASM init() not needed or already initialized');
    }

    // Initialize panic hook for better error messages (if available)
    try {
      if (typeof wasm.init_panic_hook === 'function') {
        wasm.init_panic_hook();
        log('WASM panic hook initialized');
      }
    } catch {
      // Panic hook is optional
    }

    const elapsed = performance.now() - startTime;
    log('WASM module loaded successfully', { elapsed: `${elapsed.toFixed(1)}ms` });

    return { ok: true, module: wasm };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    warn('Failed to load WASM module', error);
    return { ok: false, error: errorMessage };
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get the wasm-compute module, loading it if necessary.
 *
 * This function is safe to call from multiple places concurrently.
 * It will deduplicate in-flight loads and cache the result.
 *
 * @returns The WASM module if available, null if loading failed
 *
 * @example
 * ```ts
 * const wasm = await getWasmCompute();
 * if (wasm) {
 *   const skew = wasm.compute_gc_skew(sequence, 100);
 * }
 * ```
 */
export async function getWasmCompute(): Promise<WasmComputeModule | null> {
  // Fast path: already loaded
  if (loadState.status === 'ready') {
    return loadState.module;
  }

  // Fast path: already failed
  if (loadState.status === 'failed') {
    return null;
  }

  // Check if there's an in-flight load to share
  if (loadPromise) {
    const result = await loadPromise;
    return result.ok ? result.module : null;
  }

  // Start a new load
  loadState = { status: 'loading' };
  loadPromise = loadWasmModule();

  try {
    const result = await loadPromise;

    if (result.ok) {
      loadState = { status: 'ready', module: result.module };
      return result.module;
    } else {
      loadState = { status: 'failed', error: result.error };
      return null;
    }
  } finally {
    loadPromise = null;
  }
}

/**
 * Get the wasm-compute module with detailed result info.
 *
 * Use this when you need to know the specific error or want to
 * handle the loading state explicitly.
 *
 * @returns Detailed load result
 */
export async function getWasmComputeResult(): Promise<WasmLoadResult> {
  // Fast path: already loaded
  if (loadState.status === 'ready') {
    return { ok: true, module: loadState.module };
  }

  // Fast path: already failed
  if (loadState.status === 'failed') {
    return { ok: false, error: loadState.error };
  }

  // Load if needed
  const module = await getWasmCompute();

  if (loadState.status === 'ready') {
    return { ok: true, module: loadState.module };
  } else if (loadState.status === 'failed') {
    return { ok: false, error: loadState.error };
  }

  // Should not happen, but handle edge case
  return { ok: false, error: 'Unexpected load state' };
}

/**
 * Check if the WASM module is available.
 *
 * This is a synchronous check that returns true only if the module
 * has already been loaded successfully. Use this for quick guards
 * after the initial load.
 *
 * @returns true if WASM is ready to use
 */
export function isWasmComputeAvailable(): boolean {
  return loadState.status === 'ready';
}

/**
 * Check if WASM loading has failed.
 *
 * @returns true if WASM loading was attempted and failed
 */
export function isWasmComputeFailed(): boolean {
  return loadState.status === 'failed';
}

/**
 * Get the current load state.
 *
 * Useful for debugging and status display.
 *
 * @returns Current load state
 */
export function getWasmLoadState(): WasmLoadState {
  return loadState;
}

/**
 * Get the failure reason if loading failed.
 *
 * @returns Error message if failed, undefined otherwise
 */
export function getWasmFailureReason(): string | undefined {
  return loadState.status === 'failed' ? loadState.error : undefined;
}

/**
 * Preload the WASM module without waiting for the result.
 *
 * Call this early (e.g., during app init) to start loading in the background.
 * Subsequent calls to getWasmCompute() will return the cached result.
 *
 * @example
 * ```ts
 * // In App.tsx or similar
 * useEffect(() => {
 *   preloadWasmCompute();
 * }, []);
 * ```
 */
export function preloadWasmCompute(): void {
  if (loadState.status === 'idle') {
    // Fire and forget - the load will be cached
    void getWasmCompute();
  }
}

// ============================================================================
// Reset (for testing)
// ============================================================================

/**
 * Reset the loader state. For testing only.
 * @internal
 */
export function _resetWasmLoader(): void {
  loadState = { status: 'idle' };
  loadPromise = null;
}
