/**
 * WASM Support Detection
 *
 * Provides utilities for detecting WebAssembly support and streaming compilation capabilities.
 *
 * NOTE: This module is kept for backwards compatibility. New code should import from
 * `../lib/browser-capabilities` which provides a more comprehensive and centralized
 * feature detection API.
 *
 * @see ../lib/browser-capabilities.ts for the centralized capability detection
 * @see phage_explorer-8qk2.7 for the browser feature matrix bead
 *
 * Browser capability tiers (progressive enhancement):
 * - Tier A (best): WASM + `crossOriginIsolated` + `SharedArrayBuffer` → enable zero-copy paths.
 * - Tier B: WASM but no SAB/COOP/COEP → use transferable `ArrayBuffer` for large binary payloads.
 * - Tier C: no WASM → fall back to JS implementations (must remain correct).
 */

// Re-export from centralized module for consistency
export {
  canUseWasm,
  canUseSharedArrayBuffer as canUseSharedArrayBufferNew,
  canUseWasmSimd,
  isCrossOriginIsolated,
  getBrowserCapabilities,
  getWasmLoadingStrategy,
  getSequenceTransportStrategy,
  getBestMemoryTransport,
  type BrowserCapabilities,
  type WasmCapabilities,
  type MemoryCapabilities,
  type WorkerCapabilities,
} from '../lib/browser-capabilities';

export type WASMSupport =
  | { supported: false; reason: string }
  | {
      supported: true;
      features: {
        basic: boolean;
        streaming: boolean;
        bigInt: boolean;
        threads: boolean;
        simd: boolean;
      };
    };

let wasmSupportPromise: Promise<WASMSupport> | null = null;

/**
 * Cached feature detection (avoid recompiling probe modules repeatedly).
 * @deprecated Use `getBrowserCapabilities()` from `../lib/browser-capabilities` instead
 */
export function detectWASMCached(): Promise<WASMSupport> {
  if (!wasmSupportPromise) wasmSupportPromise = detectWASM();
  return wasmSupportPromise;
}

/**
 * SharedArrayBuffer requires cross-origin isolation (COOP/COEP) in modern browsers.
 * We also sanity-check that SAB is constructible in the current execution context.
 * @deprecated Use `canUseSharedArrayBuffer()` from `../lib/browser-capabilities` instead
 */
export function canUseSharedArrayBuffer(): boolean {
  const isolated = (globalThis as unknown as { crossOriginIsolated?: boolean }).crossOriginIsolated === true;
  if (!isolated) return false;

  try {
    if (typeof SharedArrayBuffer === 'undefined') return false;
    // Some environments expose the symbol but disallow construction.
    const test = new SharedArrayBuffer(1);
    return test.byteLength === 1;
  } catch {
    return false;
  }
}

/**
 * Detects WebAssembly support and available features.
 * No side effects - only checks for capability presence.
 */
export async function detectWASM(): Promise<WASMSupport> {
  // Check basic WASM support
  if (typeof WebAssembly === 'undefined') {
    return { supported: false, reason: 'WebAssembly not available' };
  }

  // Verify core functions exist
  if (
    typeof WebAssembly.compile !== 'function' ||
    typeof WebAssembly.instantiate !== 'function'
  ) {
    return { supported: false, reason: 'WebAssembly.compile or instantiate not available' };
  }

  try {
    // Try to compile a minimal valid WASM module
    // This is the smallest valid WASM module: magic number + version
    const minimalModule = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
    await WebAssembly.compile(minimalModule);
  } catch (error) {
    return { supported: false, reason: `WASM compilation failed: ${String(error)}` };
  }

  // Check for streaming compilation support
  const streaming = typeof WebAssembly.compileStreaming === 'function';

  // Check for BigInt support (needed for i64 values)
  const bigInt = typeof BigInt !== 'undefined';

  // Check for threads support (SharedArrayBuffer)
  let threads = false;
  try {
    threads = canUseSharedArrayBuffer() && typeof Atomics !== 'undefined';
  } catch {
    // SharedArrayBuffer may throw in some contexts
  }

  // Check for SIMD support by attempting to compile a SIMD instruction
  let simd = false;
  try {
    // Minimal WASM with v128 type (SIMD)
    // This module declares a v128 global which requires SIMD support
    const simdModule = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, // magic
      0x01, 0x00, 0x00, 0x00, // version
      0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b, // type section: func () -> v128
      0x03, 0x02, 0x01, 0x00, // function section
      0x0a, 0x0a, 0x01, 0x08, 0x00, 0xfd, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x0b, // code: v128.const
    ]);
    await WebAssembly.compile(simdModule);
    simd = true;
  } catch {
    // SIMD not supported
  }

  return {
    supported: true,
    features: {
      basic: true,
      streaming,
      bigInt,
      threads,
      simd,
    },
  };
}

/**
 * Synchronously check if basic WASM is supported.
 * Use this for quick guards; use detectWASM() for full feature detection.
 */
export function isWASMSupported(): boolean {
  return (
    typeof WebAssembly !== 'undefined' &&
    typeof WebAssembly.compile === 'function' &&
    typeof WebAssembly.instantiate === 'function'
  );
}
