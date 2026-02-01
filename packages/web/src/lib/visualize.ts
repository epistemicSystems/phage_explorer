/**
 * Visualization Utilities
 *
 * D3-powered visualizations with Ciechanowski-style interactivity
 * Clean, functional, and explorable
 */

import * as d3 from 'd3';
import { duration } from './animate';

export { d3 };

/**
 * Color scales for biological data
 */
export const colorScales = {
  nucleotide: d3.scaleOrdinal<string>()
    .domain(['A', 'T', 'G', 'C', 'N'])
    .range(['#60a5fa', '#f472b6', '#4ade80', '#facc15', '#71717a']),

  gcContent: d3.scaleSequential(d3.interpolateRdYlBu)
    .domain([0.3, 0.7]),

  expression: d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([0, 1]),

  diverging: d3.scaleDiverging(d3.interpolateRdBu)
    .domain([-1, 0, 1]),
};

/**
 * Linear genome track visualization
 */
export interface GeneTrackConfig {
  container: HTMLElement | SVGElement;
  width?: number;
  height?: number;
  genomeLength: number;
  genes: Array<{
    id: string;
    start: number;
    end: number;
    strand: '+' | '-';
    name?: string;
    product?: string;
    color?: string;
  }>;
  onGeneClick?: (gene: GeneTrackConfig['genes'][0]) => void;
  onGeneHover?: (gene: GeneTrackConfig['genes'][0] | null) => void;
}

export function createGeneTrack(config: GeneTrackConfig): {
  update: (genes: GeneTrackConfig['genes']) => void;
  zoomTo: (start: number, end: number) => void;
  destroy: () => void;
} {
  const { container, genomeLength, onGeneClick, onGeneHover } = config;
  const width = config.width ?? container.clientWidth ?? 800;
  const height = config.height ?? 80;
  const margin = { top: 10, right: 20, bottom: 20, left: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Clear container
  d3.select(container).selectAll('*').remove();

  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('display', 'block');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Scale
  let xScale = d3.scaleLinear()
    .domain([0, genomeLength])
    .range([0, innerWidth]);

  // Axis
  const xAxis = d3.axisBottom(xScale)
    .ticks(8)
    .tickFormat((d) => `${d3.format('.2s')(d as number)}bp`);

  const axisGroup = g.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis);

  axisGroup.selectAll('text')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '11px')
    .style('fill', 'var(--c-text-muted)');

  axisGroup.selectAll('line, path')
    .style('stroke', 'var(--c-border)');

  // Gene track background
  g.append('rect')
    .attr('class', 'track-bg')
    .attr('x', 0)
    .attr('y', 5)
    .attr('width', innerWidth)
    .attr('height', innerHeight - 25)
    .attr('rx', 4)
    .style('fill', 'var(--c-bg-elevated)');

  // Center line
  const centerY = (innerHeight - 25) / 2 + 5;
  g.append('line')
    .attr('class', 'center-line')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', centerY)
    .attr('y2', centerY)
    .style('stroke', 'var(--c-border)')
    .style('stroke-width', 1);

  // Genes group
  const genesGroup = g.append('g').attr('class', 'genes');

  // Tooltip
  const tooltip = d3.select(container)
    .append('div')
    .attr('class', 'gene-tooltip')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('background', 'var(--c-bg-deep)')
    .style('border', '1px solid var(--c-border)')
    .style('border-radius', '6px')
    .style('padding', '8px 12px')
    .style('font-size', '13px')
    .style('z-index', '100')
    .style('max-width', '250px');

  function renderGenes(genes: GeneTrackConfig['genes']) {
    const geneHeight = 16;

    const geneElements = genesGroup
      .selectAll<SVGGElement, typeof genes[0]>('.gene')
      .data(genes, (d) => d.id);

    // Exit
    geneElements.exit()
      .transition()
      .duration(duration.fast)
      .style('opacity', 0)
      .remove();

    // Enter + Update
    const geneEnter = geneElements.enter()
      .append('g')
      .attr('class', 'gene')
      .style('cursor', 'pointer')
      .style('opacity', 0);

    geneEnter.append('rect')
      .attr('class', 'gene-body')
      .attr('rx', 3)
      .attr('ry', 3);

    geneEnter.append('polygon')
      .attr('class', 'gene-arrow');

    const allGenes = geneEnter.merge(geneElements);

    allGenes
      .transition()
      .duration(duration.normal)
      .style('opacity', 1)
      .attr('transform', (d) => {
        const x = xScale(d.start);
        const y = d.strand === '+' ? centerY - geneHeight - 2 : centerY + 2;
        return `translate(${x},${y})`;
      });

    allGenes.select('.gene-body')
      .transition()
      .duration(duration.normal)
      .attr('width', (d) => Math.max(4, xScale(d.end) - xScale(d.start)))
      .attr('height', geneHeight)
      .style('fill', (d) => d.color ?? 'var(--c-accent)');

    // Add arrow indicator
    allGenes.select('.gene-arrow')
      .attr('points', (d) => {
        const w = Math.max(4, xScale(d.end) - xScale(d.start));
        const h = geneHeight;
        if (d.strand === '+') {
          return `${w - 6},0 ${w},${h / 2} ${w - 6},${h}`;
        } else {
          return `6,0 0,${h / 2} 6,${h}`;
        }
      })
      .style('fill', (d) => d.color ?? 'var(--c-accent)')
      .style('opacity', 0.8);

    // Interactions
    allGenes
      .on('mouseenter', function (event, d) {
        d3.select(this).select('.gene-body')
          .transition()
          .duration(duration.fast)
          .style('filter', 'brightness(1.2)');

        tooltip
          .html(`
            <div style="font-weight: 600; margin-bottom: 4px;">${d.name ?? d.id}</div>
            ${d.product ? `<div style="color: var(--c-text-secondary); margin-bottom: 4px;">${d.product}</div>` : ''}
            <div style="font-family: var(--font-mono); font-size: 11px; color: var(--c-text-muted);">
              ${d.start.toLocaleString()} - ${d.end.toLocaleString()} (${d.strand})
            </div>
          `)
          .style('left', `${event.offsetX + 10}px`)
          .style('top', `${event.offsetY - 10}px`)
          .transition()
          .duration(duration.fast)
          .style('opacity', 1);

        onGeneHover?.(d);
      })
      .on('mousemove', function (event) {
        tooltip
          .style('left', `${event.offsetX + 10}px`)
          .style('top', `${event.offsetY - 10}px`);
      })
      .on('mouseleave', function () {
        d3.select(this).select('.gene-body')
          .transition()
          .duration(duration.fast)
          .style('filter', 'brightness(1)');

        tooltip
          .transition()
          .duration(duration.fast)
          .style('opacity', 0);

        onGeneHover?.(null);
      })
      .on('click', function (_, d) {
        onGeneClick?.(d);
      });
  }

  // Initial render
  renderGenes(config.genes);

  return {
    update: renderGenes,
    zoomTo: (start: number, end: number) => {
      xScale.domain([start, end]);
      axisGroup.transition().duration(duration.slow).call(xAxis);
      renderGenes(config.genes);
    },
    destroy: () => {
      svg.remove();
      tooltip.remove();
    },
  };
}

/**
 * GC Content plot
 */
export interface GCPlotConfig {
  container: HTMLElement | SVGElement;
  width?: number;
  height?: number;
  data: Array<{ position: number; gc: number }>;
  windowSize?: number;
}

export function createGCPlot(config: GCPlotConfig): {
  update: (data: GCPlotConfig['data']) => void;
  destroy: () => void;
} {
  const { container, data } = config;
  const width = config.width ?? container.clientWidth ?? 600;
  const height = config.height ?? 120;
  const margin = { top: 10, right: 20, bottom: 30, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  d3.select(container).selectAll('*').remove();

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('display', 'block');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Scales
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, (d) => d.position) ?? 1000])
    .range([0, innerWidth]);

  const yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([innerHeight, 0]);

  // Axes
  const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat((d) => `${d3.format('.2s')(d as number)}bp`);
  const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat((d) => `${(d as number) * 100}%`);

  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis)
    .selectAll('text')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px')
    .style('fill', 'var(--c-text-muted)');

  g.append('g')
    .call(yAxis)
    .selectAll('text')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px')
    .style('fill', 'var(--c-text-muted)');

  // 50% reference line
  g.append('line')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', yScale(0.5))
    .attr('y2', yScale(0.5))
    .style('stroke', 'var(--c-border)')
    .style('stroke-dasharray', '4,4');

  // Area generator
  const area = d3.area<{ position: number; gc: number }>()
    .x((d) => xScale(d.position))
    .y0(innerHeight)
    .y1((d) => yScale(d.gc))
    .curve(d3.curveMonotoneX);

  // Line generator
  const line = d3.line<{ position: number; gc: number }>()
    .x((d) => xScale(d.position))
    .y((d) => yScale(d.gc))
    .curve(d3.curveMonotoneX);

  // Gradient
  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'gc-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');

  gradient.append('stop')
    .attr('offset', '0%')
    .style('stop-color', 'var(--c-accent)')
    .style('stop-opacity', 0.3);

  gradient.append('stop')
    .attr('offset', '100%')
    .style('stop-color', 'var(--c-accent)')
    .style('stop-opacity', 0);

  // Area
  const areaPath = g.append('path')
    .datum(data)
    .attr('fill', 'url(#gc-gradient)')
    .attr('d', area);

  // Line
  const linePath = g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'var(--c-accent)')
    .attr('stroke-width', 2)
    .attr('d', line);

  // Animate in
  const pathLength = linePath.node()?.getTotalLength() ?? 0;
  linePath
    .attr('stroke-dasharray', pathLength)
    .attr('stroke-dashoffset', pathLength)
    .transition()
    .duration(1000)
    .ease(d3.easeQuadOut)
    .attr('stroke-dashoffset', 0);

  return {
    update: (newData) => {
      xScale.domain([0, d3.max(newData, (d) => d.position) ?? 1000]);
      areaPath.datum(newData).transition().duration(duration.normal).attr('d', area);
      linePath.datum(newData).transition().duration(duration.normal).attr('d', line);
    },
    destroy: () => {
      svg.remove();
    },
  };
}

/**
 * Sparkline for inline data display
 */
export function createSparkline(
  container: HTMLElement,
  data: number[],
  options: {
    width?: number;
    height?: number;
    color?: string;
    strokeWidth?: number;
  } = {}
): { update: (data: number[]) => void; destroy: () => void } {
  const width = options.width ?? 100;
  const height = options.height ?? 24;
  const color = options.color ?? 'var(--c-accent)';
  const strokeWidth = options.strokeWidth ?? 1.5;

  d3.select(container).selectAll('*').remove();

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('display', 'block');

  const xScale = d3.scaleLinear()
    .domain([0, data.length - 1])
    .range([2, width - 2]);

  const yScale = d3.scaleLinear()
    .domain([d3.min(data) ?? 0, d3.max(data) ?? 1])
    .range([height - 2, 2]);

  const line = d3.line<number>()
    .x((_, i) => xScale(i))
    .y((d) => yScale(d))
    .curve(d3.curveMonotoneX);

  const path = svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', strokeWidth)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .attr('d', line);

  return {
    update: (newData) => {
      xScale.domain([0, newData.length - 1]);
      yScale.domain([d3.min(newData) ?? 0, d3.max(newData) ?? 1]);
      path.datum(newData).transition().duration(duration.normal).attr('d', line);
    },
    destroy: () => {
      svg.remove();
    },
  };
}

/**
 * Interactive dot plot for sequence comparison
 */
export interface DotPlotConfig {
  container: HTMLElement;
  width?: number;
  height?: number;
  seq1Length: number;
  seq2Length: number;
  matches: Array<{ x: number; y: number; length: number }>;
  onMatchClick?: (match: DotPlotConfig['matches'][0]) => void;
}

export function createDotPlot(config: DotPlotConfig): {
  update: (matches: DotPlotConfig['matches']) => void;
  destroy: () => void;
} {
  const { container, seq1Length, seq2Length, onMatchClick } = config;
  const width = config.width ?? 400;
  const height = config.height ?? 400;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  d3.select(container).selectAll('*').remove();

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('display', 'block');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Background
  g.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .attr('fill', 'var(--c-bg-elevated)');

  // Scales
  const xScale = d3.scaleLinear().domain([0, seq1Length]).range([0, innerWidth]);
  const yScale = d3.scaleLinear().domain([0, seq2Length]).range([innerHeight, 0]);

  // Axes
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(5))
    .selectAll('text')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px')
    .style('fill', 'var(--c-text-muted)');

  g.append('g')
    .call(d3.axisLeft(yScale).ticks(5))
    .selectAll('text')
    .style('font-family', 'var(--font-mono)')
    .style('font-size', '10px')
    .style('fill', 'var(--c-text-muted)');

  // Matches group
  const matchesGroup = g.append('g').attr('class', 'matches');

  function renderMatches(matches: DotPlotConfig['matches']) {
    const dots = matchesGroup
      .selectAll<SVGLineElement, typeof matches[0]>('.match')
      .data(matches);

    dots.exit().remove();

    const dotsEnter = dots.enter()
      .append('line')
      .attr('class', 'match')
      .style('stroke', 'var(--c-accent)')
      .style('stroke-width', 2)
      .style('stroke-linecap', 'round')
      .style('cursor', 'pointer')
      .style('opacity', 0);

    dotsEnter.merge(dots)
      .transition()
      .duration(duration.normal)
      .style('opacity', 0.7)
      .attr('x1', (d) => xScale(d.x))
      .attr('y1', (d) => yScale(d.y))
      .attr('x2', (d) => xScale(d.x + d.length))
      .attr('y2', (d) => yScale(d.y + d.length));

    dotsEnter
      .on('mouseenter', function () {
        d3.select(this)
          .transition()
          .duration(duration.fast)
          .style('opacity', 1)
          .style('stroke-width', 3);
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(duration.fast)
          .style('opacity', 0.7)
          .style('stroke-width', 2);
      })
      .on('click', function (_, d) {
        onMatchClick?.(d);
      });
  }

  renderMatches(config.matches);

  return {
    update: renderMatches,
    destroy: () => {
      svg.remove();
    },
  };
}

/**
 * Create a smooth zooming/panning container
 */
export function createZoomContainer(
  container: HTMLElement,
  options: {
    minZoom?: number;
    maxZoom?: number;
    onZoom?: (transform: d3.ZoomTransform) => void;
  } = {}
): {
  zoomTo: (x: number, y: number, scale: number, duration?: number) => void;
  reset: () => void;
  destroy: () => void;
} {
  const { minZoom = 0.5, maxZoom = 10, onZoom } = options;

  const svg = d3.select(container).select('svg');
  const g = svg.select('g');

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([minZoom, maxZoom])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
      onZoom?.(event.transform);
    });

  svg.call(zoom as any);

  return {
    zoomTo: (x, y, scale, dur = duration.slow) => {
      svg.transition()
        .duration(dur)
        .call(
          zoom.transform as any,
          d3.zoomIdentity.translate(x, y).scale(scale)
        );
    },
    reset: () => {
      svg.transition()
        .duration(duration.slow)
        .call(zoom.transform as any, d3.zoomIdentity);
    },
    destroy: () => {
      svg.on('.zoom', null);
    },
  };
}
