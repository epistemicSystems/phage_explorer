/**
 * Phage Explorer - New App Entry Point
 *
 * Minimalist, content-first design inspired by Ciechanowski
 * Clean architecture with modern visualization
 */

import React, { Suspense, lazy, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { initializeStorePersistence } from './store';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Import new design system
import './styles/ciechanowski.css';

// Lazy load the explorer for code splitting
const Explorer = lazy(() => import('./pages/Explorer'));

// Loading component
const LoadingFallback: React.FC = () => (
  <div className="app-loading">
    <div className="app-loading__spinner" />
    <p>Loading Phage Explorer...</p>
    <style>{`
      .app-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: var(--c-bg, #111113);
        color: var(--c-text-muted, #71717a);
        gap: 1rem;
      }
      .app-loading__spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--c-border, #27272a);
        border-top-color: var(--c-accent, #3b82f6);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Error boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message ?? 'An unexpected error occurred'}</p>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
          <style>{`
            .app-error {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: var(--c-bg, #111113);
              color: var(--c-text, #fafafa);
              text-align: center;
              padding: 2rem;
              gap: 1rem;
            }
            .app-error h1 {
              color: var(--c-error, #ef4444);
              margin: 0;
            }
            .app-error p {
              color: var(--c-text-muted, #71717a);
              margin: 0;
            }
            .app-error button {
              padding: 0.5rem 1.5rem;
              background: var(--c-accent, #3b82f6);
              border: none;
              border-radius: 4px;
              color: white;
              cursor: pointer;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AppNew(): React.ReactElement {
  // Initialize store persistence
  useEffect(() => {
    const cleanup = initializeStorePersistence();
    return cleanup;
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<LoadingFallback />}>
          <Explorer />
        </Suspense>
        <Analytics />
        <SpeedInsights />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
