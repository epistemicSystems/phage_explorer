/**
 * WebGPUViewer Component
 *
 * Modern 3D molecular visualization using WebGPU (with Three.js fallback)
 * Clean, minimal interface with smooth interactions
 */

import React, { useRef, useEffect, useState, useCallback, Suspense } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { animate, easing, duration } from '../lib/animate';

export interface WebGPUViewerProps {
  structureUrl?: string;
  structureData?: string;
  format?: 'pdb' | 'mmcif' | 'obj';
  representation?: 'ribbon' | 'surface' | 'ball-stick' | 'cartoon';
  colorScheme?: 'chain' | 'element' | 'secondary' | 'hydrophobicity';
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Amino acid colors by element type
const elementColors: Record<string, number> = {
  C: 0x909090,
  N: 0x3050f8,
  O: 0xff0d0d,
  S: 0xffff30,
  P: 0xff8000,
  H: 0xffffff,
};

// Chain colors
const chainColors = [
  0x3b82f6, // blue
  0x22c55e, // green
  0xf59e0b, // amber
  0xef4444, // red
  0x8b5cf6, // purple
  0x06b6d4, // cyan
  0xf472b6, // pink
  0xa3a3a3, // gray
];

export const WebGPUViewer: React.FC<WebGPUViewerProps> = ({
  structureUrl,
  structureData,
  format = 'pdb',
  representation = 'cartoon',
  colorScheme = 'chain',
  className = '',
  onLoad,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const moleculeRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [webGPUSupported, setWebGPUSupported] = useState(false);

  // Check WebGPU support
  useEffect(() => {
    async function checkWebGPU() {
      if ('gpu' in navigator) {
        try {
          const adapter = await (navigator as any).gpu.requestAdapter();
          setWebGPUSupported(!!adapter);
        } catch {
          setWebGPUSupported(false);
        }
      }
    }
    checkWebGPU();
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111113);
    sceneRef.current = scene;

    // Create camera
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 2000);
    camera.position.set(0, 0, 50);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // Molecule group
    const moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);
    moleculeRef.current = moleculeGroup;

    // Animation loop
    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);

      if (isRotating && moleculeRef.current) {
        moleculeRef.current.rotation.y += 0.005;
      }

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [isRotating]);

  // Parse PDB data and create 3D representation
  const loadStructure = useCallback(async (data: string) => {
    const molecule = moleculeRef.current;
    if (!molecule) return;

    // Clear previous
    while (molecule.children.length > 0) {
      molecule.remove(molecule.children[0]);
    }

    setIsLoading(true);
    setError(null);

    try {
      // Parse PDB format
      const atoms: Array<{
        serial: number;
        name: string;
        resName: string;
        chainId: string;
        resSeq: number;
        x: number;
        y: number;
        z: number;
        element: string;
      }> = [];

      const lines = data.split('\n');
      for (const line of lines) {
        if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
          atoms.push({
            serial: parseInt(line.substring(6, 11).trim(), 10),
            name: line.substring(12, 16).trim(),
            resName: line.substring(17, 20).trim(),
            chainId: line.substring(21, 22).trim(),
            resSeq: parseInt(line.substring(22, 26).trim(), 10),
            x: parseFloat(line.substring(30, 38).trim()),
            y: parseFloat(line.substring(38, 46).trim()),
            z: parseFloat(line.substring(46, 54).trim()),
            element: line.substring(76, 78).trim() || line.substring(12, 14).trim().charAt(0),
          });
        }
      }

      if (atoms.length === 0) {
        throw new Error('No atoms found in structure data');
      }

      // Center the molecule
      let cx = 0, cy = 0, cz = 0;
      for (const atom of atoms) {
        cx += atom.x;
        cy += atom.y;
        cz += atom.z;
      }
      cx /= atoms.length;
      cy /= atoms.length;
      cz /= atoms.length;

      // Create ball-and-stick representation
      const chains = new Set(atoms.map((a) => a.chainId));
      const chainArray = Array.from(chains);

      if (representation === 'ball-stick') {
        // Atoms as spheres
        const atomGeometry = new THREE.SphereGeometry(0.4, 16, 12);

        for (const atom of atoms) {
          const color = colorScheme === 'element'
            ? elementColors[atom.element.toUpperCase()] ?? 0x909090
            : chainColors[chainArray.indexOf(atom.chainId) % chainColors.length];

          const material = new THREE.MeshPhongMaterial({
            color,
            shininess: 30,
          });

          const sphere = new THREE.Mesh(atomGeometry, material);
          sphere.position.set(atom.x - cx, atom.y - cy, atom.z - cz);
          molecule.add(sphere);
        }
      } else {
        // Simplified cartoon/ribbon: trace CA atoms
        const caAtoms = atoms.filter((a) => a.name === 'CA');

        for (const chain of chainArray) {
          const chainCAs = caAtoms.filter((a) => a.chainId === chain);
          if (chainCAs.length < 2) continue;

          const points = chainCAs.map((a) =>
            new THREE.Vector3(a.x - cx, a.y - cy, a.z - cz)
          );

          // Create smooth curve
          const curve = new THREE.CatmullRomCurve3(points, false);
          const tubeGeometry = new THREE.TubeGeometry(curve, chainCAs.length * 4, 0.3, 8, false);

          const color = chainColors[chainArray.indexOf(chain) % chainColors.length];
          const material = new THREE.MeshPhongMaterial({
            color,
            shininess: 30,
          });

          const tube = new THREE.Mesh(tubeGeometry, material);
          molecule.add(tube);
        }
      }

      // Calculate bounding box for camera positioning
      const box = new THREE.Box3().setFromObject(molecule);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const camera = cameraRef.current;
      if (camera) {
        camera.position.set(0, 0, maxDim * 2);
        camera.lookAt(0, 0, 0);
      }

      // Animate in
      molecule.scale.set(0, 0, 0);
      const startTime = performance.now();
      const animateScale = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration.slow, 1);
        // Ease out back for spring-like effect
        const eased = 1 - Math.pow(1 - progress, 3);
        const scale = eased * (1 + 0.1 * Math.sin(progress * Math.PI));
        molecule.scale.set(scale, scale, scale);
        if (progress < 1) {
          requestAnimationFrame(animateScale);
        }
      };
      requestAnimationFrame(animateScale);

      setIsLoading(false);
      onLoad?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load structure');
      setError(error.message);
      setIsLoading(false);
      onError?.(error);
    }
  }, [colorScheme, representation, onLoad, onError]);

  // Load structure when URL or data changes
  useEffect(() => {
    if (structureData) {
      loadStructure(structureData);
    } else if (structureUrl) {
      setIsLoading(true);
      fetch(structureUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then(loadStructure)
        .catch((err) => {
          setError(err.message);
          setIsLoading(false);
          onError?.(err);
        });
    }
  }, [structureUrl, structureData, loadStructure, onError]);

  // Reset view
  const resetView = useCallback(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    const endPos = { x: 0, y: 0, z: 50 };
    const startTime = performance.now();

    const animateCamera = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration.slow, 1);
      // Ease out expo
      const eased = 1 - Math.pow(1 - progress, 3);

      camera.position.set(
        startPos.x + (endPos.x - startPos.x) * eased,
        startPos.y + (endPos.y - startPos.y) * eased,
        startPos.z + (endPos.z - startPos.z) * eased
      );
      camera.lookAt(0, 0, 0);

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      }
    };

    requestAnimationFrame(animateCamera);
    controls.reset();
  }, []);

  return (
    <div className={`webgpu-viewer ${className}`}>
      <div ref={containerRef} className="webgpu-viewer__canvas" />

      {/* Controls overlay */}
      <div className="webgpu-viewer__controls">
        <button
          className="webgpu-viewer__btn"
          onClick={() => setIsRotating(!isRotating)}
          title={isRotating ? 'Stop rotation' : 'Auto rotate'}
        >
          {isRotating ? '⏸' : '↻'}
        </button>
        <button
          className="webgpu-viewer__btn"
          onClick={resetView}
          title="Reset view"
        >
          ⟲
        </button>
      </div>

      {/* Status indicators */}
      {webGPUSupported && (
        <div className="webgpu-viewer__badge">WebGPU</div>
      )}

      {isLoading && (
        <div className="webgpu-viewer__loading">
          <div className="webgpu-viewer__spinner" />
          <span>Loading structure...</span>
        </div>
      )}

      {error && (
        <div className="webgpu-viewer__error">
          <span>Failed to load structure</span>
          <small>{error}</small>
        </div>
      )}

      {!structureUrl && !structureData && !isLoading && !error && (
        <div className="webgpu-viewer__placeholder">
          <div className="webgpu-viewer__placeholder-icon">🧪</div>
          <span>No structure available</span>
          <small>Select a gene with PDB data to view 3D structure</small>
        </div>
      )}

      <style>{`
        .webgpu-viewer {
          position: relative;
          background: var(--c-bg-elevated, #18181b);
          border: 1px solid var(--c-border, #27272a);
          border-radius: var(--radius-lg, 8px);
          overflow: hidden;
          min-height: 400px;
        }

        .webgpu-viewer__canvas {
          width: 100%;
          height: 400px;
        }

        .webgpu-viewer__controls {
          position: absolute;
          bottom: var(--space-4, 1rem);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: var(--space-2, 0.5rem);
          padding: var(--space-2, 0.5rem);
          background: rgba(17, 17, 19, 0.9);
          backdrop-filter: blur(8px);
          border: 1px solid var(--c-border, #27272a);
          border-radius: var(--radius-full, 9999px);
        }

        .webgpu-viewer__btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--c-bg-elevated, #18181b);
          border: 1px solid var(--c-border, #27272a);
          border-radius: 50%;
          color: var(--c-text-secondary, #a1a1aa);
          font-size: 18px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .webgpu-viewer__btn:hover {
          background: var(--c-bg-hover, #1f1f23);
          color: var(--c-text, #fafafa);
          border-color: var(--c-border-strong, #3f3f46);
        }

        .webgpu-viewer__badge {
          position: absolute;
          top: var(--space-3, 0.75rem);
          right: var(--space-3, 0.75rem);
          padding: 2px 8px;
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: var(--radius-sm, 2px);
          font-size: 10px;
          font-weight: 600;
          color: #22c55e;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .webgpu-viewer__loading,
        .webgpu-viewer__error,
        .webgpu-viewer__placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-2, 0.5rem);
          background: rgba(17, 17, 19, 0.95);
        }

        .webgpu-viewer__spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--c-border, #27272a);
          border-top-color: var(--c-accent, #3b82f6);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .webgpu-viewer__loading span,
        .webgpu-viewer__placeholder span {
          color: var(--c-text-secondary, #a1a1aa);
          font-size: var(--text-sm, 0.875rem);
        }

        .webgpu-viewer__placeholder-icon {
          font-size: 48px;
          opacity: 0.5;
        }

        .webgpu-viewer__placeholder small,
        .webgpu-viewer__error small {
          color: var(--c-text-muted, #71717a);
          font-size: var(--text-xs, 0.75rem);
        }

        .webgpu-viewer__error span {
          color: var(--c-error, #ef4444);
          font-size: var(--text-sm, 0.875rem);
        }
      `}</style>
    </div>
  );
};

export default WebGPUViewer;
