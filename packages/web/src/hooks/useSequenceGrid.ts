/**
 * useSequenceGrid Hook
 *
 * React hook for integrating the CanvasSequenceGridRenderer with React components.
 * Handles canvas ref, resize events, and state updates.
 */

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import type React from 'react';
import type { Theme, ViewMode, ReadingFrame } from '@phage-explorer/core';
import { translateSequence, reverseComplement } from '@phage-explorer/core';
import { CanvasSequenceGridRenderer, type VisibleRange, type ZoomLevel, type ZoomPreset } from '../rendering';

/** Post-processing pipeline type (placeholder for future WebGL effects) */
type PostProcessPipeline = unknown;

export interface UseSequenceGridOptions {
  theme: Theme;
  sequence: string;
  viewMode?: ViewMode;
  readingFrame?: ReadingFrame;
  diffSequence?: string | null;
  diffEnabled?: boolean;
  diffMask?: Uint8Array | null;
  diffPositions?: number[];
  scanlines?: boolean;
  glow?: boolean;
  postProcess?: PostProcessPipeline;
  reducedMotion?: boolean;
  /** Initial zoom scale (0.1 to 4.0, default 1.0) */
  initialZoomScale?: number;
  /** Enable pinch-to-zoom on touch devices */
  enablePinchZoom?: boolean;
  onVisibleRangeChange?: (range: VisibleRange) => void;
  /** Callback when zoom changes */
  onZoomChange?: (scale: number, preset: ZoomPreset) => void;
}

export interface UseSequenceGridResult {
  /** Ref to attach to canvas element */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Current visible range */
  visibleRange: VisibleRange | null;
  /** Current scroll position (index in sequence) */
  scrollPosition: number;
  /** Scroll to a specific position */
  scrollToPosition: (position: number) => void;
  /** Scroll to start */
  scrollToStart: () => void;
  /** Scroll to end */
  scrollToEnd: () => void;
  /** Jump to next/previous diff; returns target index or null if none */
  jumpToDiff: (direction: 'next' | 'prev') => number | null;
  /** Get index at viewport coordinates */
  getIndexAtPoint: (x: number, y: number) => number | null;
  /** Force re-render */
  refresh: () => void;
  /** Current zoom scale (0.1 to 4.0) */
  zoomScale: number;
  /** Current zoom preset info */
  zoomPreset: ZoomPreset | null;
  /** Set zoom scale directly */
  setZoomScale: (scale: number) => void;
  /** Zoom in by factor */
  zoomIn: (factor?: number) => void;
  /** Zoom out by factor */
  zoomOut: (factor?: number) => void;
  /** Set zoom to a preset level */
  setZoomLevel: (level: ZoomLevel) => void;
}

export function useSequenceGrid(options: UseSequenceGridOptions): UseSequenceGridResult {
  const {
    theme,
    sequence,
    viewMode = 'dna',
    readingFrame = 0,
    diffSequence = null,
    diffEnabled = false,
    diffMask = null,
    diffPositions = [],
    scanlines = true,
    glow = false,
    postProcess,
    reducedMotion = false,
    initialZoomScale = 1.0,
    enablePinchZoom = true,
    onVisibleRangeChange,
    onZoomChange,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasSequenceGridRenderer | null>(null);
  const [visibleRange, setVisibleRange] = useState<VisibleRange | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [zoomScale, setZoomScaleState] = useState(initialZoomScale);
  const [zoomPreset, setZoomPreset] = useState<ZoomPreset | null>(null);

  // Handle zoom change callback from renderer
  const handleZoomChange = useCallback((scale: number, preset: ZoomPreset) => {
    setZoomScaleState(scale);
    setZoomPreset(preset);
    if (onZoomChange) {
      onZoomChange(scale, preset);
    }
  }, [onZoomChange]);

  // Initialize renderer when canvas is available
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create renderer with zoom options
    const renderer = new CanvasSequenceGridRenderer({
      canvas,
      theme,
      scanlines,
      glow,
      postProcess,
      reducedMotion,
      zoomScale: initialZoomScale,
      enablePinchZoom,
      onZoomChange: handleZoomChange,
    });

    rendererRef.current = renderer;

    // Initialize zoom preset state
    setZoomPreset(renderer.getZoomPreset());

    // Handle resize
    const handleResize = () => {
      renderer.resize();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    // Handle wheel events
    const handleWheel = (e: WheelEvent) => {
      renderer.handleWheel(e);
      setScrollPosition(renderer.getScrollPosition());
      setVisibleRange(renderer.getVisibleRange());
    };

    // Handle touch events for mobile scrolling
    const handleTouchStart = (e: TouchEvent) => {
      renderer.handleTouchStart(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      renderer.handleTouchMove(e);
      setScrollPosition(renderer.getScrollPosition());
      setVisibleRange(renderer.getVisibleRange());
    };

    const handleTouchEnd = (e: TouchEvent) => {
      renderer.handleTouchEnd(e);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [scanlines, glow, postProcess, reducedMotion, initialZoomScale, enablePinchZoom, handleZoomChange]); // Recreate when visual pipeline changes

  // Update theme
  useEffect(() => {
    rendererRef.current?.setTheme(theme);
  }, [theme]);

  // Compute the display sequence: DNA as-is, or translated to amino acids
  const displaySequence = useMemo(() => {
    if (!sequence) return '';
    if (viewMode === 'dna') return sequence;

    // AA mode: translate DNA to amino acids
    // Positive frames (0, 1, 2) use forward strand
    // Negative frames (-1, -2, -3) use reverse complement
    if (readingFrame >= 0) {
      const frame = readingFrame as 0 | 1 | 2;
      return translateSequence(sequence, frame);
    } else {
      // Negative frame: use reverse complement
      const revComp = reverseComplement(sequence);
      const frame = (Math.abs(readingFrame) - 1) as 0 | 1 | 2;
      return translateSequence(revComp, frame);
    }
  }, [sequence, viewMode, readingFrame]);

  // Update sequence
  useEffect(() => {
    rendererRef.current?.setSequence(displaySequence, viewMode, readingFrame);
  }, [displaySequence, viewMode, readingFrame]);

  // Update diff mode
  useEffect(() => {
    rendererRef.current?.setDiffMode(diffSequence, diffEnabled, diffMask ?? null);
  }, [diffSequence, diffEnabled, diffMask]);

  // Notify visible range changes
  useEffect(() => {
    if (visibleRange && onVisibleRangeChange) {
      onVisibleRangeChange(visibleRange);
    }
  }, [visibleRange, onVisibleRangeChange]);

  // Update reduced motion flag without reconstructing renderer
  useEffect(() => {
    rendererRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  // Update post-process pipeline without reconstructing renderer
  useEffect(() => {
    rendererRef.current?.setPostProcess(postProcess);
  }, [postProcess]);

  // Scroll methods
  const scrollToPosition = useCallback((position: number) => {
    rendererRef.current?.scrollToPosition(position);
    if (rendererRef.current) {
      setScrollPosition(rendererRef.current.getScrollPosition());
      setVisibleRange(rendererRef.current.getVisibleRange());
    }
  }, []);

  const scrollToStart = useCallback(() => {
    rendererRef.current?.scrollToStart();
    setScrollPosition(0);
    if (rendererRef.current) {
      setVisibleRange(rendererRef.current.getVisibleRange());
    }
  }, []);

  const scrollToEnd = useCallback(() => {
    rendererRef.current?.scrollToEnd();
    if (rendererRef.current) {
      setScrollPosition(rendererRef.current.getScrollPosition());
      setVisibleRange(rendererRef.current.getVisibleRange());
    }
  }, []);

  const getIndexAtPoint = useCallback((x: number, y: number): number | null => {
    return rendererRef.current?.getIndexAtPoint(x, y) ?? null;
  }, []);

  const refresh = useCallback(() => {
    rendererRef.current?.markDirty();
  }, []);

  const jumpToDiff = useCallback(
    (direction: 'next' | 'prev'): number | null => {
      if (!diffPositions || diffPositions.length === 0) return null;
      const current = rendererRef.current?.getScrollPosition() ?? 0;
      const sorted = diffPositions;
      if (direction === 'next') {
        const target = sorted.find((pos) => pos > current);
        const selected = target ?? sorted[0];
        scrollToPosition(selected);
        return selected;
      }
      // prev
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (sorted[i] < current) {
          scrollToPosition(sorted[i]);
          return sorted[i];
        }
      }
      const fallback = sorted[sorted.length - 1];
      scrollToPosition(fallback);
      return fallback;
    },
    [diffPositions, scrollToPosition]
  );

  // Zoom methods
  const setZoomScale = useCallback((scale: number) => {
    rendererRef.current?.setZoomScale(scale);
  }, []);

  const zoomIn = useCallback((factor = 1.3) => {
    rendererRef.current?.zoomIn(factor);
  }, []);

  const zoomOut = useCallback((factor = 1.3) => {
    rendererRef.current?.zoomOut(factor);
  }, []);

  const setZoomLevel = useCallback((level: ZoomLevel) => {
    rendererRef.current?.setZoomLevel(level);
  }, []);

  return {
    canvasRef,
    visibleRange,
    scrollPosition,
    scrollToPosition,
    scrollToStart,
    scrollToEnd,
    jumpToDiff,
    getIndexAtPoint,
    refresh,
    zoomScale,
    zoomPreset,
    setZoomScale,
    zoomIn,
    zoomOut,
    setZoomLevel,
  };
}

export default useSequenceGrid;
