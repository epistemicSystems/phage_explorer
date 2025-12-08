import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const resolveFromRoot = (relativePath: string) =>
  path.resolve(__dirname, '..', relativePath);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@phage-explorer/core': resolveFromRoot('core/src'),
      '@phage-explorer/state': resolveFromRoot('state/src'),
      '@phage-explorer/renderer-3d': resolveFromRoot('renderer-3d/src'),
      '@phage-explorer/db-schema': resolveFromRoot('db-schema/src'),
      '@phage-explorer/db-runtime': resolveFromRoot('db-runtime/src'),
      '@phage-explorer/comparison': resolveFromRoot('comparison/src'),
      '@phage-explorer/data-pipeline': resolveFromRoot('data-pipeline/src'),
      '@phage-explorer/tui': resolveFromRoot('tui/src'),
      '@phage/wasm-compute': resolveFromRoot('wasm-compute/pkg/wasm_compute.js'),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-state': ['zustand', 'immer'],
          'vendor-worker': ['comlink'],
          'phage-core': ['@phage-explorer/core'],
          'phage-state': ['@phage-explorer/state'],
          // Group remaining smaller dependencies
          'vendor-utils': [], 
        },
      },
    },
  },
});

