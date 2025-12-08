import React, { useEffect, useRef } from 'react';
import type { PackagingMotorState } from '../../workers/types';
import { useTheme } from '../../hooks/useTheme';

interface PackagingMotorVisualizerProps {
  state: PackagingMotorState;
  width?: number;
  height?: number;
}

export function PackagingMotorVisualizer({
  state,
  width = 540,
  height = 260,
}: PackagingMotorVisualizerProps): React.ReactElement {
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

    // Gauge for fill fraction
    const fill = Math.max(0, Math.min(1, state.fillFraction ?? 0));
    const gaugeWidth = width - 120;
    const gaugeHeight = 20;
    const gaugeX = 60;
    const gaugeY = 40;

    ctx.strokeStyle = colors.borderLight;
    ctx.lineWidth = 2;
    ctx.strokeRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);
    ctx.fillStyle = colors.accent;
    ctx.fillRect(gaugeX, gaugeY, gaugeWidth * fill, gaugeHeight);
    ctx.fillStyle = colors.text;
    ctx.font = '12px monospace';
    ctx.fillText(`DNA packaged: ${(fill * 100).toFixed(1)}%`, gaugeX, gaugeY - 6);

    // Pressure / force bars
    const bar = (label: string, value: number, max: number, y: number, color: string) => {
      const pct = Math.max(0, Math.min(1, value / max));
      const barW = gaugeWidth;
      ctx.fillStyle = colors.backgroundAlt;
      ctx.fillRect(gaugeX, y, barW, gaugeHeight);
      ctx.fillStyle = color;
      ctx.fillRect(gaugeX, y, barW * pct, gaugeHeight);
      ctx.strokeStyle = colors.borderLight;
      ctx.strokeRect(gaugeX, y, barW, gaugeHeight);
      ctx.fillStyle = colors.text;
      ctx.fillText(`${label}: ${value.toFixed(1)} / ${max}`, gaugeX, y - 6);
    };

    bar('Pressure (atm)', state.pressure ?? 0, 80, gaugeY + 50, '#f97316');
    bar('Force (pN)', state.force ?? 0, 120, gaugeY + 90, '#22c55e');

    // Stall probability indicator
    const stall = Math.max(0, Math.min(1, state.stallProbability ?? 0));
    ctx.fillStyle = colors.textDim;
    ctx.fillText('Stall probability', gaugeX, gaugeY + 140);
    ctx.fillStyle = stall > 0.7 ? colors.error : stall > 0.3 ? colors.warning : colors.success;
    ctx.beginPath();
    ctx.arc(gaugeX + 130, gaugeY + 136, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.background;
    ctx.font = '10px monospace';
    ctx.fillText((stall * 100).toFixed(0) + '%', gaugeX + 124, gaugeY + 140);

    // Timeline / sparkline if history exists
    const history = (state as any).history as Array<{ time: number; fill: number; pressure: number; force: number }> | undefined;
    if (history && history.length > 1) {
      const pad = { left: 60, right: 20, top: gaugeY + 170, bottom: 20 };
      const w = width - pad.left - pad.right;
      const h = height - pad.top - pad.bottom;
      const maxTime = Math.max(...history.map(hp => hp.time));
      const maxPressure = Math.max(1, ...history.map(hp => hp.pressure));
      const xScale = (t: number) => pad.left + (t / maxTime) * w;
      const yScale = (v: number) => pad.top + h - (v / maxPressure) * h;

      ctx.strokeStyle = colors.borderLight;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, pad.top);
      ctx.lineTo(pad.left, pad.top + h);
      ctx.lineTo(pad.left + w, pad.top + h);
      ctx.stroke();

      const drawLine = (key: 'pressure' | 'force', color: string) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        history.forEach((p, i) => {
          const x = xScale(p.time);
          const y = yScale((p as any)[key]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      };

      drawLine('pressure', '#f97316');
      drawLine('force', '#22c55e');
      ctx.fillStyle = colors.textDim;
      ctx.fillText('Pressure / Force over time', pad.left, pad.top - 6);
    }
  }, [state, width, height, colors]);

  return <canvas ref={canvasRef} style={{ width: `${width}px`, height: `${height}px`, display: 'block' }} />;
}

export default PackagingMotorVisualizer;
