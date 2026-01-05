/**
 * Service Worker Registration
 *
 * Registers the service worker and handles updates.
 */

export interface ServiceWorkerCallbacks {
  onUpdate?: () => void;
  onSuccess?: () => void;
  onOffline?: () => void;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(
  callbacks: ServiceWorkerCallbacks = {}
): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    if (import.meta.env.DEV) {
      console.log('[SW] Service workers not supported');
    }
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Check for updates periodically (every hour)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content available
          if (import.meta.env.DEV) {
            console.log('[SW] New content available');
          }
          callbacks.onUpdate?.();
        }
      });
    });

    // Initial registration success
    if (registration.active) {
      if (import.meta.env.DEV) {
        console.log('[SW] Service worker active');
      }
      callbacks.onSuccess?.();
    }

    // Handle offline/online events
    window.addEventListener('offline', () => {
      if (import.meta.env.DEV) {
        console.log('[SW] App is offline');
      }
      callbacks.onOffline?.();
    });

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}

/**
 * Trigger service worker update
 */
export async function updateServiceWorker(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Wait until the new service worker takes control to avoid reloading back into old caches.
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };

      navigator.serviceWorker.addEventListener('controllerchange', finish, { once: true });
      // Fallback: if controllerchange never fires, still allow reload after a short delay.
      window.setTimeout(finish, 1500);
    });

    window.location.reload();
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    return registration.unregister();
  }

  return false;
}

export default registerServiceWorker;
