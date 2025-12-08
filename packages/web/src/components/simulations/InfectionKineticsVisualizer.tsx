import React, { useEffect, useRef } from 'react';
import type { InfectionKineticsState } from '../../workers/types';
import { useTheme } from '../../hooks/useTheme';

interface InfectionKineticsVisualizerProps {
  state: InfectionKineticsState;
  width?: number;
  height?: number;
}

export function InfectionKineticsVisualizer({
  state,
  width = 540,
  height = 260,
}: InfectionKineticsVisualizerProps): React.ReactElement {
  const { theme } = useTheme();
  const colors = theme.colors;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    const history = (state as any).history as Array<{ time: number; bacteria: number; infected: number; phage: number }> | undefined;
    const series = history && history.length > 0 ? history : [
      { time: state.time, bacteria: state.bacteria, infected: state.infected, phage: state.phage },
    ];

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxVal = Math.max(
      1,
      ...series.flatMap(p => [p.bacteria, p.infected, p.phage]).map(Math.abs),
    );
    const maxTime = Math.max(1, ...series.map(p => p.time));

    const xScale = (t: number) => padding.left + (t / maxTime) * chartW;
    const yScale = (v: number) => padding.top + chartH - (v / maxVal) * chartH;

    const drawSeries = (key: 'bacteria' | 'infected' | 'phage', color: string) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      series.forEach((p, i) => {
        const x = xScale(p.time);
        const y = yScale((p as any)[key]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    // Axes
    ctx.strokeStyle = colors.borderLight;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    ctx.fillStyle = colors.textDim;
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('0', padding.left - 6, height - padding.bottom);
    ctx.fillText(maxVal.toFixed(0), padding.left - 6, padding.top + 10);
    ctx.textAlign = 'center';
    ctx.fillText('Time', width / 2, height - 8);

    drawSeries('bacteria', '#22c55e');
    drawSeries('infected', '#eab308');
    drawSeries('phage', '#6366f1');

    // Legend
    ctx.fillStyle = '#22c55e'; ctx.fillText('Bacteria', padding.left + 20, padding.top + 12);
    ctx.fillStyle = '#eab308'; ctx.fillText('Infected', padding.left + 90, padding.top + 12);
    ctx.fillStyle = '#6366f1'; ctx.fillText('Phage', padding.left + 160, padding.top + 12);
  }, [state, width, height, colors]);

  return <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px`, display: 'block' }} />;
}

export default InfectionKineticsVisualizer;
