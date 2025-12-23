/**
 * Unit tests for 3D Math utilities
 */

import { describe, it, expect } from 'bun:test';
import {
  vec3,
  add,
  sub,
  scale,
  dot,
  cross,
  length,
  normalize,
  identity,
  rotationX,
  rotationY,
  rotationZ,
  multiply,
  transform,
  rotation,
  project,
  type Vector3,
  type Matrix4,
} from './math';

// Helper to compare floating point vectors
function expectVec3Close(actual: Vector3, expected: Vector3, precision = 6): void {
  expect(actual.x).toBeCloseTo(expected.x, precision);
  expect(actual.y).toBeCloseTo(expected.y, precision);
  expect(actual.z).toBeCloseTo(expected.z, precision);
}

// Helper to compare matrices
function expectMatrixClose(actual: Matrix4, expected: Matrix4, precision = 6): void {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      expect(actual.m[i][j]).toBeCloseTo(expected.m[i][j], precision);
    }
  }
}

describe('vec3', () => {
  it('creates zero vector with no arguments', () => {
    const v = vec3();
    expectVec3Close(v, { x: 0, y: 0, z: 0 });
  });

  it('creates vector with specified components', () => {
    const v = vec3(1, 2, 3);
    expectVec3Close(v, { x: 1, y: 2, z: 3 });
  });

  it('creates vector with partial arguments', () => {
    const v = vec3(5);
    expectVec3Close(v, { x: 5, y: 0, z: 0 });
  });
});

describe('add', () => {
  it('adds two vectors', () => {
    const a = vec3(1, 2, 3);
    const b = vec3(4, 5, 6);
    expectVec3Close(add(a, b), { x: 5, y: 7, z: 9 });
  });

  it('handles negative values', () => {
    const a = vec3(1, -2, 3);
    const b = vec3(-1, 2, -3);
    expectVec3Close(add(a, b), { x: 0, y: 0, z: 0 });
  });

  it('handles zero vector', () => {
    const a = vec3(1, 2, 3);
    const zero = vec3();
    expectVec3Close(add(a, zero), a);
  });
});

describe('sub', () => {
  it('subtracts two vectors', () => {
    const a = vec3(5, 7, 9);
    const b = vec3(1, 2, 3);
    expectVec3Close(sub(a, b), { x: 4, y: 5, z: 6 });
  });

  it('subtracting same vector gives zero', () => {
    const a = vec3(1, 2, 3);
    expectVec3Close(sub(a, a), { x: 0, y: 0, z: 0 });
  });
});

describe('scale', () => {
  it('scales vector by scalar', () => {
    const v = vec3(1, 2, 3);
    expectVec3Close(scale(v, 2), { x: 2, y: 4, z: 6 });
  });

  it('scales by zero gives zero vector', () => {
    const v = vec3(1, 2, 3);
    expectVec3Close(scale(v, 0), { x: 0, y: 0, z: 0 });
  });

  it('scales by negative', () => {
    const v = vec3(1, 2, 3);
    expectVec3Close(scale(v, -1), { x: -1, y: -2, z: -3 });
  });

  it('scales by fraction', () => {
    const v = vec3(2, 4, 6);
    expectVec3Close(scale(v, 0.5), { x: 1, y: 2, z: 3 });
  });
});

describe('dot', () => {
  it('computes dot product of orthogonal vectors', () => {
    const a = vec3(1, 0, 0);
    const b = vec3(0, 1, 0);
    expect(dot(a, b)).toBe(0);
  });

  it('computes dot product of parallel vectors', () => {
    const a = vec3(1, 0, 0);
    const b = vec3(2, 0, 0);
    expect(dot(a, b)).toBe(2);
  });

  it('computes dot product of arbitrary vectors', () => {
    const a = vec3(1, 2, 3);
    const b = vec3(4, 5, 6);
    expect(dot(a, b)).toBe(32); // 1*4 + 2*5 + 3*6
  });

  it('dot product with itself gives squared length', () => {
    const v = vec3(3, 4, 0);
    expect(dot(v, v)).toBe(25); // 9 + 16
  });
});

describe('cross', () => {
  it('computes cross product of X and Y axis', () => {
    const x = vec3(1, 0, 0);
    const y = vec3(0, 1, 0);
    expectVec3Close(cross(x, y), { x: 0, y: 0, z: 1 });
  });

  it('computes cross product of Y and X axis (reversed)', () => {
    const x = vec3(1, 0, 0);
    const y = vec3(0, 1, 0);
    expectVec3Close(cross(y, x), { x: 0, y: 0, z: -1 });
  });

  it('cross product of parallel vectors is zero', () => {
    const a = vec3(1, 2, 3);
    const b = vec3(2, 4, 6);
    expectVec3Close(cross(a, b), { x: 0, y: 0, z: 0 });
  });

  it('cross product with itself is zero', () => {
    const v = vec3(1, 2, 3);
    expectVec3Close(cross(v, v), { x: 0, y: 0, z: 0 });
  });
});

describe('length', () => {
  it('computes length of unit vectors', () => {
    expect(length(vec3(1, 0, 0))).toBe(1);
    expect(length(vec3(0, 1, 0))).toBe(1);
    expect(length(vec3(0, 0, 1))).toBe(1);
  });

  it('computes length of 3-4-5 right triangle', () => {
    expect(length(vec3(3, 4, 0))).toBe(5);
  });

  it('computes length of 3D vector', () => {
    // sqrt(1 + 4 + 9) = sqrt(14)
    expect(length(vec3(1, 2, 3))).toBeCloseTo(Math.sqrt(14), 6);
  });

  it('length of zero vector is zero', () => {
    expect(length(vec3())).toBe(0);
  });
});

describe('normalize', () => {
  it('normalizes unit vectors to themselves', () => {
    const unit = vec3(1, 0, 0);
    expectVec3Close(normalize(unit), unit);
  });

  it('normalizes arbitrary vector to unit length', () => {
    const v = vec3(3, 4, 0);
    const n = normalize(v);
    expect(length(n)).toBeCloseTo(1, 6);
    expectVec3Close(n, { x: 0.6, y: 0.8, z: 0 });
  });

  it('handles zero vector (returns zero)', () => {
    expectVec3Close(normalize(vec3()), { x: 0, y: 0, z: 0 });
  });

  it('preserves direction', () => {
    const v = vec3(10, 20, 30);
    const n = normalize(v);
    // Normalized should be proportional
    const ratio = v.x / n.x;
    expect(v.y / n.y).toBeCloseTo(ratio, 6);
    expect(v.z / n.z).toBeCloseTo(ratio, 6);
  });
});

describe('identity', () => {
  it('creates 4x4 identity matrix', () => {
    const I = identity();
    expect(I.m[0]).toEqual([1, 0, 0, 0]);
    expect(I.m[1]).toEqual([0, 1, 0, 0]);
    expect(I.m[2]).toEqual([0, 0, 1, 0]);
    expect(I.m[3]).toEqual([0, 0, 0, 1]);
  });
});

describe('rotationX', () => {
  it('creates identity for zero rotation', () => {
    expectMatrixClose(rotationX(0), identity());
  });

  it('rotates 90 degrees correctly', () => {
    const R = rotationX(Math.PI / 2);
    // Y axis should map to Z axis
    const y = vec3(0, 1, 0);
    const rotated = transform(y, R);
    expectVec3Close(rotated, { x: 0, y: 0, z: 1 });
  });

  it('rotates 180 degrees correctly', () => {
    const R = rotationX(Math.PI);
    const y = vec3(0, 1, 0);
    const rotated = transform(y, R);
    expectVec3Close(rotated, { x: 0, y: -1, z: 0 });
  });
});

describe('rotationY', () => {
  it('creates identity for zero rotation', () => {
    expectMatrixClose(rotationY(0), identity());
  });

  it('rotates 90 degrees correctly', () => {
    const R = rotationY(Math.PI / 2);
    // X axis should map to -Z axis
    const x = vec3(1, 0, 0);
    const rotated = transform(x, R);
    expectVec3Close(rotated, { x: 0, y: 0, z: -1 });
  });
});

describe('rotationZ', () => {
  it('creates identity for zero rotation', () => {
    expectMatrixClose(rotationZ(0), identity());
  });

  it('rotates 90 degrees correctly', () => {
    const R = rotationZ(Math.PI / 2);
    // X axis should map to Y axis
    const x = vec3(1, 0, 0);
    const rotated = transform(x, R);
    expectVec3Close(rotated, { x: 0, y: 1, z: 0 });
  });
});

describe('multiply', () => {
  it('identity times identity is identity', () => {
    const I = identity();
    expectMatrixClose(multiply(I, I), I);
  });

  it('identity times matrix is same matrix', () => {
    const I = identity();
    const R = rotationX(Math.PI / 4);
    expectMatrixClose(multiply(I, R), R);
    expectMatrixClose(multiply(R, I), R);
  });

  it('rotation composition works', () => {
    const R1 = rotationX(Math.PI / 4);
    const R2 = rotationX(Math.PI / 4);
    const R = multiply(R1, R2);
    // Should equal 90 degree rotation
    expectMatrixClose(R, rotationX(Math.PI / 2));
  });
});

describe('transform', () => {
  it('identity transform preserves vector', () => {
    const v = vec3(1, 2, 3);
    expectVec3Close(transform(v, identity()), v);
  });

  it('rotation transforms vector correctly', () => {
    const v = vec3(1, 0, 0);
    const R = rotationZ(Math.PI / 2);
    expectVec3Close(transform(v, R), { x: 0, y: 1, z: 0 });
  });
});

describe('rotation', () => {
  it('combined rotation with all zeros is identity', () => {
    expectMatrixClose(rotation(0, 0, 0), identity());
  });

  it('combined rotation equals sequential rotations', () => {
    const rx = Math.PI / 6;
    const ry = Math.PI / 4;
    const rz = Math.PI / 3;

    const combined = rotation(rx, ry, rz);
    const sequential = multiply(multiply(rotationX(rx), rotationY(ry)), rotationZ(rz));

    expectMatrixClose(combined, sequential);
  });
});

describe('project', () => {
  it('projects center point to screen center', () => {
    const v = vec3(0, 0, 0);
    const p = project(v, 80, 24);
    expect(p.x).toBeCloseTo(40, 0); // Center of 80-width screen
    expect(p.y).toBeCloseTo(12, 0); // Center of 24-height screen
  });

  it('projects point further from camera with less scale', () => {
    const near = project(vec3(1, 0, 0), 80, 24, 1.5, 3);
    const far = project(vec3(1, 0, 5), 80, 24, 1.5, 3);
    // Near point should be further from center than far point
    expect(Math.abs(near.x - 40)).toBeGreaterThan(Math.abs(far.x - 40));
  });

  it('preserves z for depth sorting', () => {
    const v = vec3(1, 2, 5);
    const p = project(v, 80, 24, 1.5, 3);
    expect(p.z).toBe(8); // z + distance = 5 + 3
  });

  it('handles points behind camera safely', () => {
    const v = vec3(1, 0, -10); // Behind camera
    const p = project(v, 80, 24, 1.5, 3);
    // Should not crash or produce NaN
    expect(Number.isFinite(p.x)).toBe(true);
    expect(Number.isFinite(p.y)).toBe(true);
  });

  it('respects screen dimensions', () => {
    const v = vec3(0, 0, 0);
    const p1 = project(v, 80, 24);
    const p2 = project(v, 160, 48);

    // Centers should be proportional
    expect(p1.x).toBeCloseTo(40, 0);
    expect(p2.x).toBeCloseTo(80, 0);
    expect(p1.y).toBeCloseTo(12, 0);
    expect(p2.y).toBeCloseTo(24, 0);
  });
});
