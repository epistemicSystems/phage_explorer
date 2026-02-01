import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { OverlayProvider } from './components/overlays/OverlayProvider';
import { ToastProvider } from './components/ui/Toast';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { ScrollProvider } from './providers';
import { queryClient } from './queryClient';
import { initializeStorePersistence } from './store';

// Check for design mode preference
// Use new Ciechanowski-inspired design by default
// Add ?legacy=true to URL to use old design
const urlParams = new URLSearchParams(window.location.search);
const useLegacyDesign = urlParams.get('legacy') === 'true' || localStorage.getItem('phage-explorer-legacy') === 'true';

// Lazy load both apps for code splitting
const AppNew = lazy(() => import('./AppNew'));
const AppLegacy = lazy(() => import('./App'));

// Import appropriate styles
if (!useLegacyDesign) {
  import('./styles/ciechanowski.css');
} else {
  import('./styles.css');
  import('./styles/scroll.css');
}

function installViewportVariables(): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const root = document.documentElement;
  let rafId: number | null = null;
  let lastHeight: number | null = null;
  let lastWidth: number | null = null;

  const update = () => {
    const vv = window.visualViewport;
    const heightCandidate = vv?.height;
    const widthCandidate = vv?.width;
    // iOS Safari can report `visualViewport.height === 0` transiently during page load / rotation.
    // Never allow that to collapse layout (e.g. sequence canvas height becomes 0).
    const height =
      typeof heightCandidate === 'number' && Number.isFinite(heightCandidate) && heightCandidate > 0
        ? heightCandidate
        : window.innerHeight;
    const width =
      typeof widthCandidate === 'number' && Number.isFinite(widthCandidate) && widthCandidate > 0
        ? widthCandidate
        : window.innerWidth;

    // Avoid style recalculation churn during scroll: on iOS, `visualViewport.scroll`
    // can fire continuously even when the viewport size is unchanged.
    if (
      lastHeight !== null &&
      lastWidth !== null &&
      Math.abs(height - lastHeight) < 0.5 &&
      Math.abs(width - lastWidth) < 0.5
    ) {
      return;
    }
    lastHeight = height;
    lastWidth = width;
    root.style.setProperty('--visual-viewport-height', `${height}px`);
    root.style.setProperty('--visual-viewport-width', `${width}px`);
    root.style.setProperty('--vvh', `${height * 0.01}px`);
    root.style.setProperty('--vvw', `${width * 0.01}px`);
  };

  const schedule = () => {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      update();
    });
  };

  update();
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', schedule);
    // Some iOS Safari versions fire `visualViewport.scroll` more reliably than `resize`
    // when browser chrome shows/hides. `schedule` is RAF-throttled and `update()` is
    // no-op when dimensions are unchanged, so this is safe.
    vv.addEventListener('scroll', schedule);
  }

  return () => {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    window.removeEventListener('resize', schedule);
    window.removeEventListener('orientationchange', schedule);
    if (vv) {
      vv.removeEventListener('resize', schedule);
      vv.removeEventListener('scroll', schedule);
    }
  };
}

const cleanupViewportVariables = installViewportVariables();

// Hydrate/persist main-store preferences (including device-aware defaults) before first render.
// This avoids flashing expensive UI (e.g., 3D viewer) on first-run for coarse-pointer devices.
const cleanupStorePersistence = initializeStorePersistence();

let didCleanup = false;
const cleanupAll = () => {
  if (didCleanup) return;
  didCleanup = true;
  cleanupStorePersistence();
  cleanupViewportVariables();
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('unload', cleanupAll);
    }
    cleanupAll();
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('unload', cleanupAll, { once: true });
}

const container = document.getElementById('root');

// Loading fallback for Suspense
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#111113',
    color: '#71717a',
    gap: '1rem',
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: '3px solid #27272a',
      borderTopColor: '#3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    <p>Loading Phage Explorer...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

if (container) {
  const root = ReactDOM.createRoot(container);

  if (useLegacyDesign) {
    // Legacy design with full provider stack
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ScrollProvider>
              <ToastProvider>
                <OverlayProvider>
                  <Suspense fallback={<LoadingFallback />}>
                    <AppLegacy />
                  </Suspense>
                </OverlayProvider>
              </ToastProvider>
            </ScrollProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </React.StrictMode>,
    );
  } else {
    // New Ciechanowski-inspired design
    root.render(
      <React.StrictMode>
        <Suspense fallback={<LoadingFallback />}>
          <AppNew />
        </Suspense>
      </React.StrictMode>,
    );
  }
}

// Register service worker in production builds (disabled for automation via navigator.webdriver).
if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator && !navigator.webdriver) {
  window.addEventListener('load', () => {
    void import('./registerSW').then(({ registerServiceWorker, updateServiceWorker }) => {
      const reloadKey = 'phage-explorer-sw-updated';
      void registerServiceWorker({
        onUpdate: () => {
          // Avoid reload loops (e.g., on flaky networks or repeated SW install attempts).
          try {
            if (sessionStorage.getItem(reloadKey)) return;
            sessionStorage.setItem(reloadKey, '1');
          } catch {
            // Ignore storage errors (private mode, quota).
          }
          void updateServiceWorker();
        },
      });
    });
  });
}
