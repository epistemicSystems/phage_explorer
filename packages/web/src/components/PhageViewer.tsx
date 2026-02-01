/**
 * PhageViewer Component
 *
 * Main phage visualization panel with Ciechanowski-inspired design
 * Clean, explorable, content-focused
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { animate, easing, duration } from '../lib/animate';
import type { GeneInfo, PhageFull } from '@phage-explorer/core';

export interface PhageViewerProps {
  phage: PhageFull | null;
  sequence: string;
  onGeneSelect?: (gene: GeneInfo | null) => void;
  selectedGene?: GeneInfo | null;
  className?: string;
}

export const PhageViewer: React.FC<PhageViewerProps> = ({
  phage,
  sequence,
  onGeneSelect,
  selectedGene,
  className = '',
}) => {
  const circularRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'circular' | 'linear'>('circular');
  const [hoveredGene, setHoveredGene] = useState<GeneInfo | null>(null);

  // Render circular genome map
  useEffect(() => {
    if (!phage || !circularRef.current || viewMode !== 'circular') return;

    const container = circularRef.current;
    const width = Math.min(container.clientWidth, 500);
    const height = width;
    const radius = width / 2 - 40;
    const innerRadius = radius - 30;

    // Clear previous
    d3.select(container).selectAll('svg').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('display', 'block')
      .style('margin', '0 auto');

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Background circle
    g.append('circle')
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', 'var(--c-border, #27272a)')
      .attr('stroke-width', 1);

    g.append('circle')
      .attr('r', innerRadius)
      .attr('fill', 'none')
      .attr('stroke', 'var(--c-border-subtle, #1f1f23)')
      .attr('stroke-width', 1);

    // Scale for position to angle
    const genomeLength = phage.genomeLength ?? sequence.length ?? 1;
    const angleScale = d3.scaleLinear()
      .domain([0, genomeLength])
      .range([0, 2 * Math.PI]);

    // Arc generator
    const arc = d3.arc<GeneInfo>()
      .innerRadius(innerRadius + 2)
      .outerRadius(radius - 2)
      .startAngle((d) => angleScale(d.startPos ?? 0) - Math.PI / 2)
      .endAngle((d) => angleScale(d.endPos ?? 0) - Math.PI / 2)
      .padAngle(0.005)
      .cornerRadius(2);

    // Color scale for genes
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['CDS', 'promoter', 'terminator', 'tRNA', 'other'])
      .range(['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#71717a']);

    // Render genes
    const genes = phage.genes ?? [];
    const geneArcs = g.selectAll<SVGPathElement, GeneInfo>('.gene-arc')
      .data(genes)
      .enter()
      .append('path')
      .attr('class', 'gene-arc')
      .attr('d', (d: GeneInfo) => arc(d) ?? '')
      .attr('fill', (d: GeneInfo) => {
        if (selectedGene?.id === d.id) return '#60a5fa';
        return colorScale(d.type ?? 'CDS');
      })
      .attr('fill-opacity', (d: GeneInfo) => hoveredGene?.id === d.id || selectedGene?.id === d.id ? 0.9 : 0.6)
      .attr('stroke', (d: GeneInfo) => {
        if (selectedGene?.id === d.id) return '#93c5fd';
        if (hoveredGene?.id === d.id) return '#60a5fa';
        return 'none';
      })
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .style('transition', 'fill-opacity 0.15s ease, stroke 0.15s ease');

    // Interactions
    geneArcs
      .on('mouseenter', function (_event: MouseEvent, d: GeneInfo) {
        setHoveredGene(d);
        d3.select(this)
          .attr('fill-opacity', 0.9)
          .attr('stroke', '#60a5fa');
      })
      .on('mouseleave', function (_event: MouseEvent, d: GeneInfo) {
        setHoveredGene(null);
        d3.select(this)
          .attr('fill-opacity', selectedGene?.id === d.id ? 0.9 : 0.6)
          .attr('stroke', selectedGene?.id === d.id ? '#93c5fd' : 'none');
      })
      .on('click', (_event: MouseEvent, d: GeneInfo) => {
        onGeneSelect?.(selectedGene?.id === d.id ? null : d);
      });

    // Center info
    const centerG = g.append('g').attr('class', 'center-info');

    centerG.append('text')
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'var(--font-sans)')
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .attr('fill', 'var(--c-text, #fafafa)')
      .text(phage.name ?? 'Unknown Phage');

    centerG.append('text')
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '12px')
      .attr('fill', 'var(--c-text-muted, #71717a)')
      .text(`${genomeLength.toLocaleString()} bp`);

    // Tick marks (every 10kb)
    const tickInterval = genomeLength > 100000 ? 20000 : genomeLength > 50000 ? 10000 : 5000;
    const ticks = d3.range(0, genomeLength, tickInterval);

    g.selectAll('.tick')
      .data(ticks)
      .enter()
      .append('line')
      .attr('class', 'tick')
      .attr('x1', (d) => (radius + 5) * Math.cos(angleScale(d) - Math.PI / 2))
      .attr('y1', (d) => (radius + 5) * Math.sin(angleScale(d) - Math.PI / 2))
      .attr('x2', (d) => (radius + 12) * Math.cos(angleScale(d) - Math.PI / 2))
      .attr('y2', (d) => (radius + 12) * Math.sin(angleScale(d) - Math.PI / 2))
      .attr('stroke', 'var(--c-text-muted, #71717a)')
      .attr('stroke-width', 1);

    g.selectAll('.tick-label')
      .data(ticks)
      .enter()
      .append('text')
      .attr('class', 'tick-label')
      .attr('x', (d) => (radius + 25) * Math.cos(angleScale(d) - Math.PI / 2))
      .attr('y', (d) => (radius + 25) * Math.sin(angleScale(d) - Math.PI / 2))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '9px')
      .attr('fill', 'var(--c-text-subtle, #52525b)')
      .text((d) => `${d / 1000}k`);

    // Animate in
    geneArcs
      .attr('fill-opacity', 0)
      .transition()
      .duration(duration.slow)
      .delay((_: GeneInfo, i: number) => i * 5)
      .attr('fill-opacity', (d: GeneInfo) => selectedGene?.id === d.id ? 0.9 : 0.6);

  }, [phage, sequence, viewMode, selectedGene, hoveredGene, onGeneSelect]);

  if (!phage) {
    return (
      <div className={`phage-viewer phage-viewer--empty ${className}`}>
        <div className="phage-viewer__empty">
          <div className="phage-viewer__empty-icon">🧬</div>
          <p>Select a phage to explore</p>
        </div>

        <style>{phageViewerStyles}</style>
      </div>
    );
  }

  return (
    <div className={`phage-viewer ${className}`}>
      {/* Header with phage info */}
      <header className="phage-viewer__header">
        <div className="phage-viewer__info">
          <h2 className="phage-viewer__name">{phage.name}</h2>
          <p className="phage-viewer__meta">
            {phage.family ?? 'Unknown family'} · {phage.lifecycle ?? 'Unknown lifecycle'}
          </p>
        </div>
        <div className="phage-viewer__actions">
          <button
            className={`phage-viewer__mode-btn ${viewMode === 'circular' ? 'active' : ''}`}
            onClick={() => setViewMode('circular')}
          >
            Circular
          </button>
          <button
            className={`phage-viewer__mode-btn ${viewMode === 'linear' ? 'active' : ''}`}
            onClick={() => setViewMode('linear')}
          >
            Linear
          </button>
        </div>
      </header>

      {/* Stats row */}
      <div className="phage-viewer__stats">
        <div className="phage-viewer__stat">
          <span className="phage-viewer__stat-label">Genome</span>
          <span className="phage-viewer__stat-value">
            {(phage.genomeLength ?? sequence.length).toLocaleString()} bp
          </span>
        </div>
        <div className="phage-viewer__stat">
          <span className="phage-viewer__stat-label">GC Content</span>
          <span className="phage-viewer__stat-value">
            {phage.gcContent != null ? `${phage.gcContent.toFixed(1)}%` : '—'}
          </span>
        </div>
        <div className="phage-viewer__stat">
          <span className="phage-viewer__stat-label">Genes</span>
          <span className="phage-viewer__stat-value">
            {phage.genes?.length ?? 0}
          </span>
        </div>
        <div className="phage-viewer__stat">
          <span className="phage-viewer__stat-label">Baltimore</span>
          <span className="phage-viewer__stat-value">
            {phage.baltimoreGroup ?? '—'}
          </span>
        </div>
      </div>

      {/* Circular/Linear view */}
      <div className="phage-viewer__visualization">
        {viewMode === 'circular' && (
          <div ref={circularRef} className="phage-viewer__circular" />
        )}
        {viewMode === 'linear' && (
          <div className="phage-viewer__linear">
            {/* Linear view implementation */}
            <p className="phage-viewer__placeholder">Linear view coming soon</p>
          </div>
        )}
      </div>

      {/* Hovered/Selected gene info */}
      {(hoveredGene || selectedGene) && (
        <div className="phage-viewer__gene-info">
          <div className="phage-viewer__gene-name">
            {(hoveredGene ?? selectedGene)?.name ?? (hoveredGene ?? selectedGene)?.locusTag ?? 'Unknown gene'}
          </div>
          {(hoveredGene ?? selectedGene)?.product && (
            <div className="phage-viewer__gene-product">
              {(hoveredGene ?? selectedGene)?.product}
            </div>
          )}
          <div className="phage-viewer__gene-position">
            {(hoveredGene ?? selectedGene)?.startPos?.toLocaleString()} – {(hoveredGene ?? selectedGene)?.endPos?.toLocaleString()} bp
            ({(hoveredGene ?? selectedGene)?.strand === '+' ? 'forward' : 'reverse'} strand)
          </div>
        </div>
      )}

      <style>{phageViewerStyles}</style>
    </div>
  );
};

const phageViewerStyles = `
  .phage-viewer {
    background: var(--c-bg-elevated, #18181b);
    border: 1px solid var(--c-border, #27272a);
    border-radius: var(--radius-xl, 12px);
    overflow: hidden;
  }

  .phage-viewer--empty {
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .phage-viewer__empty {
    text-align: center;
    color: var(--c-text-muted, #71717a);
  }

  .phage-viewer__empty-icon {
    font-size: 48px;
    margin-bottom: var(--space-4, 1rem);
    opacity: 0.5;
  }

  .phage-viewer__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: var(--space-6, 1.5rem);
    border-bottom: 1px solid var(--c-border-subtle, #1f1f23);
  }

  .phage-viewer__info {
    flex: 1;
  }

  .phage-viewer__name {
    font-family: var(--font-sans);
    font-size: var(--text-2xl, 1.5rem);
    font-weight: var(--font-semibold, 600);
    color: var(--c-text, #fafafa);
    margin: 0 0 var(--space-1, 0.25rem) 0;
  }

  .phage-viewer__meta {
    font-size: var(--text-sm, 0.875rem);
    color: var(--c-text-muted, #71717a);
    margin: 0;
  }

  .phage-viewer__actions {
    display: flex;
    gap: 1px;
    background: var(--c-border, #27272a);
    border-radius: var(--radius-md, 4px);
    overflow: hidden;
  }

  .phage-viewer__mode-btn {
    padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
    background: var(--c-bg, #111113);
    border: none;
    color: var(--c-text-secondary, #a1a1aa);
    font-size: var(--text-sm, 0.875rem);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .phage-viewer__mode-btn:hover {
    color: var(--c-text, #fafafa);
    background: var(--c-bg-hover, #1f1f23);
  }

  .phage-viewer__mode-btn.active {
    color: var(--c-text, #fafafa);
    background: var(--c-bg-elevated, #18181b);
  }

  .phage-viewer__stats {
    display: flex;
    gap: var(--space-8, 2rem);
    padding: var(--space-5, 1.25rem) var(--space-6, 1.5rem);
    background: var(--c-bg, #111113);
    border-bottom: 1px solid var(--c-border-subtle, #1f1f23);
    flex-wrap: wrap;
  }

  .phage-viewer__stat {
    display: flex;
    flex-direction: column;
    gap: var(--space-1, 0.25rem);
  }

  .phage-viewer__stat-label {
    font-size: var(--text-xs, 0.75rem);
    color: var(--c-text-muted, #71717a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .phage-viewer__stat-value {
    font-family: var(--font-mono);
    font-size: var(--text-lg, 1.125rem);
    font-weight: var(--font-medium, 500);
    color: var(--c-text, #fafafa);
  }

  .phage-viewer__visualization {
    padding: var(--space-6, 1.5rem);
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .phage-viewer__circular {
    width: 100%;
    max-width: 500px;
  }

  .phage-viewer__linear {
    width: 100%;
  }

  .phage-viewer__placeholder {
    color: var(--c-text-muted, #71717a);
    text-align: center;
  }

  .phage-viewer__gene-info {
    padding: var(--space-4, 1rem) var(--space-6, 1.5rem);
    background: rgba(59, 130, 246, 0.1);
    border-top: 1px solid rgba(59, 130, 246, 0.2);
  }

  .phage-viewer__gene-name {
    font-weight: var(--font-semibold, 600);
    color: var(--c-text, #fafafa);
    margin-bottom: var(--space-1, 0.25rem);
  }

  .phage-viewer__gene-product {
    color: var(--c-text-secondary, #a1a1aa);
    font-size: var(--text-sm, 0.875rem);
    margin-bottom: var(--space-1, 0.25rem);
  }

  .phage-viewer__gene-position {
    font-family: var(--font-mono);
    font-size: var(--text-xs, 0.75rem);
    color: var(--c-text-muted, #71717a);
  }

  @media (max-width: 768px) {
    .phage-viewer__header {
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .phage-viewer__stats {
      gap: var(--space-4, 1rem);
    }

    .phage-viewer__stat-value {
      font-size: var(--text-base, 1rem);
    }
  }
`;

export default PhageViewer;
