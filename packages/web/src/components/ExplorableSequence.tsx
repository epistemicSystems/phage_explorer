/**
 * ExplorableSequence Component
 *
 * Interactive DNA sequence viewer inspired by Ciechanowski's explorable explanations
 * Clean, minimal design with smooth animations and contextual interactions
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { tweenValue, duration } from '../lib/animate';
import * as d3 from 'd3';
import type { GeneInfo } from '@phage-explorer/core';

export interface ExplorableSequenceProps {
  sequence: string;
  genes?: GeneInfo[];
  onPositionChange?: (position: number) => void;
  onGeneSelect?: (gene: GeneInfo) => void;
  className?: string;
}

// Nucleotide colors - functional, not decorative
const nucleotideColors: Record<string, { bg: string; fg: string }> = {
  A: { bg: '#1e3a5f', fg: '#60a5fa' },
  T: { bg: '#4a1942', fg: '#f472b6' },
  G: { bg: '#1a3d2e', fg: '#4ade80' },
  C: { bg: '#4a3a1a', fg: '#facc15' },
  N: { bg: '#27272a', fg: '#71717a' },
};

export const ExplorableSequence: React.FC<ExplorableSequenceProps> = ({
  sequence,
  genes = [],
  onPositionChange,
  onGeneSelect,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [viewStart, setViewStart] = useState(0);
  const [viewEnd, setViewEnd] = useState(Math.min(100, sequence.length));
  const [hoveredBase, setHoveredBase] = useState<number | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isAnimatingRef = useRef(false);

  // Calculate visible window size based on container width
  const calculateVisibleBases = useCallback(() => {
    const container = containerRef.current;
    if (!container) return 60;
    const baseWidth = 16; // pixels per base
    return Math.floor(container.clientWidth / baseWidth);
  }, []);

  // Smoothly animate to a position
  const scrollToPosition = useCallback((position: number, shouldAnimate = true) => {
    const visibleBases = calculateVisibleBases();
    const newStart = Math.max(0, Math.min(position - Math.floor(visibleBases / 2), sequence.length - visibleBases));
    const newEnd = Math.min(sequence.length, newStart + visibleBases);

    if (!shouldAnimate || isAnimatingRef.current) {
      setViewStart(newStart);
      setViewEnd(newEnd);
      return;
    }

    // Animate using requestAnimationFrame
    isAnimatingRef.current = true;
    const startTime = performance.now();
    const dur = duration.slow;
    const startViewStart = viewStart;
    const startViewEnd = viewEnd;

    const animateFrame = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / dur, 1);
      // Ease out expo
      const eased = 1 - Math.pow(1 - progress, 3);

      setViewStart(Math.round(startViewStart + (newStart - startViewStart) * eased));
      setViewEnd(Math.round(startViewEnd + (newEnd - startViewEnd) * eased));

      if (progress < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        isAnimatingRef.current = false;
      }
    };

    requestAnimationFrame(animateFrame);
  }, [calculateVisibleBases, sequence.length, viewStart, viewEnd]);

  // Render sequence to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const container = containerRef.current;
    if (!container) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = 100 * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = '100px';
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#111113';
    ctx.fillRect(0, 0, rect.width, 100);

    // Calculate layout
    const visibleSequence = sequence.slice(viewStart, viewEnd);
    const baseWidth = rect.width / visibleSequence.length;
    const baseHeight = 40;
    const baseY = 30;

    // Draw bases
    ctx.font = `${Math.min(14, baseWidth * 0.7)}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    visibleSequence.split('').forEach((base, i) => {
      const x = i * baseWidth;
      const globalPos = viewStart + i;
      const colors = nucleotideColors[base.toUpperCase()] ?? nucleotideColors.N;

      // Background
      ctx.fillStyle = hoveredBase === globalPos ? colors.bg : '#18181b';
      ctx.fillRect(x, baseY, baseWidth - 1, baseHeight);

      // Border for hovered
      if (hoveredBase === globalPos) {
        ctx.strokeStyle = colors.fg;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, baseY + 1, baseWidth - 3, baseHeight - 2);
      }

      // Selected range highlight
      if (selectedRange && globalPos >= selectedRange.start && globalPos < selectedRange.end) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.fillRect(x, baseY, baseWidth - 1, baseHeight);
      }

      // Text
      ctx.fillStyle = colors.fg;
      ctx.fillText(base.toUpperCase(), x + baseWidth / 2, baseY + baseHeight / 2);
    });

    // Position indicator
    ctx.fillStyle = '#71717a';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${viewStart.toLocaleString()} bp`, 8, 20);
    ctx.textAlign = 'right';
    ctx.fillText(`${viewEnd.toLocaleString()} bp`, rect.width - 8, 20);

    // Genome position bar at bottom
    const barY = 80;
    const barHeight = 8;
    ctx.fillStyle = '#27272a';
    ctx.fillRect(0, barY, rect.width, barHeight);

    // Viewport indicator
    const viewportStart = (viewStart / sequence.length) * rect.width;
    const viewportWidth = ((viewEnd - viewStart) / sequence.length) * rect.width;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(viewportStart, barY, Math.max(2, viewportWidth), barHeight);
  }, [sequence, viewStart, viewEnd, hoveredBase, selectedRange]);

  // Handle mouse interactions
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const visibleBases = viewEnd - viewStart;
    const baseIndex = Math.floor((x / rect.width) * visibleBases);
    const globalPos = viewStart + baseIndex;

    if (globalPos >= 0 && globalPos < sequence.length) {
      setHoveredBase(globalPos);
      onPositionChange?.(globalPos);
    } else {
      setHoveredBase(null);
    }

    // Handle drag selection
    if (isDragging && selectedRange) {
      setSelectedRange({
        start: selectedRange.start,
        end: globalPos + 1,
      });
    }
  }, [isDragging, onPositionChange, selectedRange, sequence.length, viewEnd, viewStart]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const visibleBases = viewEnd - viewStart;
    const baseIndex = Math.floor((x / rect.width) * visibleBases);
    const globalPos = viewStart + baseIndex;

    setIsDragging(true);
    setSelectedRange({ start: globalPos, end: globalPos + 1 });
  }, [viewEnd, viewStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredBase(null);
    setIsDragging(false);
  }, []);

  // Wheel zoom/pan
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8;
      const center = (viewStart + viewEnd) / 2;
      const currentRange = viewEnd - viewStart;
      const newRange = Math.max(20, Math.min(sequence.length, currentRange * zoomFactor));
      const newStart = Math.max(0, center - newRange / 2);
      const newEnd = Math.min(sequence.length, newStart + newRange);
      setViewStart(Math.round(newStart));
      setViewEnd(Math.round(newEnd));
    } else {
      // Pan
      const panAmount = Math.round((viewEnd - viewStart) * (e.deltaY > 0 ? 0.1 : -0.1));
      const newStart = Math.max(0, Math.min(sequence.length - (viewEnd - viewStart), viewStart + panAmount));
      const newEnd = newStart + (viewEnd - viewStart);
      setViewStart(newStart);
      setViewEnd(newEnd);
    }
  }, [sequence.length, viewEnd, viewStart]);

  // Gene track (visible genes in current view)
  const visibleGenes = useMemo(() => {
    return genes.filter((gene) => gene.endPos >= viewStart && gene.startPos <= viewEnd);
  }, [genes, viewStart, viewEnd]);

  // Render gene track with D3
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Clear
    d3.select(track).selectAll('*').remove();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 40;

    const svg = d3.select(track)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('display', 'block');

    // Scale
    const xScale = d3.scaleLinear()
      .domain([viewStart, viewEnd])
      .range([0, width]);

    // Gene rectangles
    svg.selectAll('.gene')
      .data(visibleGenes)
      .enter()
      .append('rect')
      .attr('class', 'gene')
      .attr('x', (d) => xScale(Math.max(viewStart, d.startPos)))
      .attr('y', (d) => d.strand === '+' ? 5 : 20)
      .attr('width', (d) => Math.max(4, xScale(Math.min(viewEnd, d.endPos)) - xScale(Math.max(viewStart, d.startPos))))
      .attr('height', 14)
      .attr('rx', 3)
      .attr('fill', 'rgba(59, 130, 246, 0.3)')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.15s ease')
      .on('mouseenter', function () {
        d3.select(this)
          .attr('fill', 'rgba(59, 130, 246, 0.5)');
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('fill', 'rgba(59, 130, 246, 0.3)');
      })
      .on('click', function (_, d) {
        onGeneSelect?.(d);
        scrollToPosition(d.startPos, true);
      });

    // Gene labels (if space allows)
    svg.selectAll('.gene-label')
      .data(visibleGenes.filter((d) => xScale(Math.min(viewEnd, d.endPos)) - xScale(Math.max(viewStart, d.startPos)) > 40))
      .enter()
      .append('text')
      .attr('class', 'gene-label')
      .attr('x', (d) => xScale(Math.max(viewStart, d.startPos)) + 6)
      .attr('y', (d) => d.strand === '+' ? 15 : 30)
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-sans)')
      .attr('fill', '#a1a1aa')
      .text((d) => d.name ?? d.id)
      .style('pointer-events', 'none');
  }, [visibleGenes, viewStart, viewEnd, onGeneSelect, scrollToPosition]);

  return (
    <div ref={containerRef} className={`explorable-sequence ${className}`}>
      {/* Gene track */}
      <div ref={trackRef} className="explorable-sequence__track" />

      {/* Sequence canvas */}
      <canvas
        ref={canvasRef}
        className="explorable-sequence__canvas"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />

      {/* Position info */}
      {hoveredBase !== null && (
        <div className="explorable-sequence__tooltip">
          Position: {hoveredBase.toLocaleString()} bp
          <br />
          Base: {sequence[hoveredBase]?.toUpperCase() ?? '—'}
        </div>
      )}

      {/* Navigation controls */}
      <div className="explorable-sequence__nav">
        <button
          className="explorable-sequence__btn"
          onClick={() => scrollToPosition(0)}
          title="Go to start"
        >
          ⟨⟨
        </button>
        <button
          className="explorable-sequence__btn"
          onClick={() => scrollToPosition(viewStart - Math.floor((viewEnd - viewStart) / 2))}
          title="Previous"
        >
          ⟨
        </button>
        <span className="explorable-sequence__range">
          {viewStart.toLocaleString()} – {viewEnd.toLocaleString()} of {sequence.length.toLocaleString()} bp
        </span>
        <button
          className="explorable-sequence__btn"
          onClick={() => scrollToPosition(viewStart + Math.floor((viewEnd - viewStart) / 2))}
          title="Next"
        >
          ⟩
        </button>
        <button
          className="explorable-sequence__btn"
          onClick={() => scrollToPosition(sequence.length)}
          title="Go to end"
        >
          ⟩⟩
        </button>
      </div>

      <style>{`
        .explorable-sequence {
          position: relative;
          background: var(--c-bg-elevated, #18181b);
          border: 1px solid var(--c-border, #27272a);
          border-radius: var(--radius-lg, 8px);
          overflow: hidden;
        }

        .explorable-sequence__track {
          border-bottom: 1px solid var(--c-border-subtle, #1f1f23);
        }

        .explorable-sequence__canvas {
          display: block;
          width: 100%;
          cursor: crosshair;
        }

        .explorable-sequence__tooltip {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 6px 10px;
          background: rgba(17, 17, 19, 0.95);
          border: 1px solid var(--c-border, #27272a);
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--c-text-secondary, #a1a1aa);
          pointer-events: none;
        }

        .explorable-sequence__nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2, 0.5rem);
          padding: var(--space-3, 0.75rem);
          background: var(--c-bg, #111113);
          border-top: 1px solid var(--c-border-subtle, #1f1f23);
        }

        .explorable-sequence__btn {
          padding: 4px 12px;
          background: var(--c-bg-elevated, #18181b);
          border: 1px solid var(--c-border, #27272a);
          border-radius: var(--radius-md, 4px);
          color: var(--c-text-secondary, #a1a1aa);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .explorable-sequence__btn:hover {
          background: var(--c-bg-hover, #1f1f23);
          border-color: var(--c-border-strong, #3f3f46);
          color: var(--c-text, #fafafa);
        }

        .explorable-sequence__range {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--c-text-muted, #71717a);
          min-width: 200px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default ExplorableSequence;
