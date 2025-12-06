// ASCII 3D Renderer
// Renders 3D models to ASCII art with shading

import type { Vector3, Matrix4 } from './math';
import type { Model3D } from './models';
import { rotation, transform, project, normalize, sub, dot, vec3 } from './math';

// ASCII character ramp for shading (from dark to bright)
const SHADE_CHARS = ' .:-=+*#%@';
const SHADE_CHARS_LIGHT = ' .:+#@';

// Braille-style dense characters for higher resolution
const BRAILLE_CHARS = ' ⠁⠃⠇⠏⠟⠿⡿⣿';

export interface RenderConfig {
  width: number;
  height: number;
  useColor?: boolean;
  useBraille?: boolean;
  lightDirection?: Vector3;
}

export interface RenderedFrame {
  lines: string[];
  width: number;
  height: number;
}

// Z-buffer cell
interface ZBufferCell {
  z: number;
  brightness: number;
}

// Render a 3D model to ASCII
export function renderModel(
  model: Model3D,
  rotationAngles: { rx: number; ry: number; rz: number },
  config: RenderConfig
): RenderedFrame {
  const { width, height, useBraille = false } = config;
  const lightDir = config.lightDirection ?? normalize(vec3(0.5, 1, 0.5));
  const chars = useBraille ? BRAILLE_CHARS : SHADE_CHARS;

  // Initialize z-buffer
  const zBuffer: (ZBufferCell | null)[][] = [];
  for (let y = 0; y < height; y++) {
    zBuffer[y] = [];
    for (let x = 0; x < width; x++) {
      zBuffer[y][x] = null;
    }
  }

  // Create rotation matrix
  const rotMatrix = rotation(rotationAngles.rx, rotationAngles.ry, rotationAngles.rz);

  // Transform and project all vertices
  const projectedVertices: { x: number; y: number; z: number }[] = [];
  const transformedVertices: Vector3[] = [];

  for (const vertex of model.vertices) {
    const transformed = transform(vertex, rotMatrix);
    transformedVertices.push(transformed);
    projectedVertices.push(project(transformed, width, height, 1.5, 3));
  }

  // Draw edges with z-buffering
  for (const [i1, i2] of model.edges) {
    const p1 = projectedVertices[i1];
    const p2 = projectedVertices[i2];

    // Simple line drawing with z-interpolation
    drawLine(
      Math.round(p1.x), Math.round(p1.y), p1.z,
      Math.round(p2.x), Math.round(p2.y), p2.z,
      zBuffer, width, height
    );
  }

  // Draw vertices as points (brighter)
  for (let i = 0; i < projectedVertices.length; i++) {
    const p = projectedVertices[i];
    const x = Math.round(p.x);
    const y = Math.round(p.y);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      const cell = zBuffer[y][x];
      if (!cell || p.z < cell.z) {
        // Calculate brightness based on z-depth
        const brightness = Math.max(0.3, 1 - (p.z - 2) * 0.3);
        zBuffer[y][x] = { z: p.z, brightness };
      }
    }
  }

  // Convert z-buffer to ASCII characters
  const lines: string[] = [];
  for (let y = 0; y < height; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const cell = zBuffer[y][x];
      if (cell) {
        const charIndex = Math.min(
          chars.length - 1,
          Math.floor(cell.brightness * (chars.length - 1))
        );
        line += chars[charIndex];
      } else {
        line += ' ';
      }
    }
    lines.push(line);
  }

  return { lines, width, height };
}

// Bresenham's line algorithm with z-interpolation
function drawLine(
  x0: number, y0: number, z0: number,
  x1: number, y1: number, z1: number,
  zBuffer: (ZBufferCell | null)[][],
  width: number, height: number
): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  const steps = Math.max(dx, dy);
  const dz = steps > 0 ? (z1 - z0) / steps : 0;
  let z = z0;
  let step = 0;

  while (true) {
    if (x0 >= 0 && x0 < width && y0 >= 0 && y0 < height) {
      const cell = zBuffer[y0][x0];
      if (!cell || z < cell.z) {
        // Brightness based on depth (closer = brighter)
        const brightness = Math.max(0.2, Math.min(0.7, 1 - (z - 2) * 0.25));
        zBuffer[y0][x0] = { z, brightness };
      }
    }

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
    z += dz;
    step++;
  }
}

// Animation state
export interface AnimationState {
  rx: number;
  ry: number;
  rz: number;
  time: number;
}

// Update animation state
export function updateAnimation(
  state: AnimationState,
  deltaTime: number,
  speed: number = 1
): AnimationState {
  const rotSpeed = 0.02 * speed;
  return {
    rx: state.rx + rotSpeed * 0.3 * deltaTime,
    ry: state.ry + rotSpeed * deltaTime,
    rz: state.rz + rotSpeed * 0.1 * deltaTime,
    time: state.time + deltaTime,
  };
}

// Create initial animation state
export function createAnimationState(): AnimationState {
  return { rx: 0.3, ry: 0, rz: 0, time: 0 };
}

// Pre-render a sequence of frames for storage
export function preRenderFrames(
  model: Model3D,
  config: RenderConfig,
  frameCount: number = 60
): string[] {
  const frames: string[] = [];
  let state = createAnimationState();

  for (let i = 0; i < frameCount; i++) {
    const frame = renderModel(model, {
      rx: state.rx,
      ry: state.ry,
      rz: state.rz,
    }, config);

    frames.push(frame.lines.join('\n'));
    state = updateAnimation(state, 1, 1);
  }

  return frames;
}

// Render frame to string with optional border
export function frameToString(frame: RenderedFrame, addBorder: boolean = false): string {
  if (!addBorder) {
    return frame.lines.join('\n');
  }

  const horizontal = '─'.repeat(frame.width);
  const bordered = [
    `┌${horizontal}┐`,
    ...frame.lines.map(line => `│${line.padEnd(frame.width)}│`),
    `└${horizontal}┘`,
  ];

  return bordered.join('\n');
}
