/**
 * Micro-interactions and Polish
 *
 * Subtle, purposeful interactions inspired by Ciechanowski
 * Focus on feedback and discoverability
 */

/**
 * Add ripple effect to interactive elements
 */
export function createRipple(
  event: MouseEvent,
  element: HTMLElement,
  color = 'rgba(59, 130, 246, 0.3)'
): void {
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position: absolute;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: ${color};
    transform: translate(-50%, -50%);
    pointer-events: none;
    left: ${x}px;
    top: ${y}px;
  `;

  // Ensure parent has relative positioning
  const computedStyle = getComputedStyle(element);
  if (computedStyle.position === 'static') {
    element.style.position = 'relative';
  }
  element.style.overflow = 'hidden';

  element.appendChild(ripple);

  const size = Math.max(rect.width, rect.height) * 2;

  requestAnimationFrame(() => {
    ripple.style.transition = 'all 0.6s ease-out';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.opacity = '0';
  });

  setTimeout(() => {
    ripple.remove();
  }, 600);
}

/**
 * Create a tooltip that follows the cursor
 */
export function createFollowingTooltip(
  content: string | HTMLElement,
  options: {
    offset?: { x: number; y: number };
    className?: string;
  } = {}
): {
  show: (x: number, y: number) => void;
  hide: () => void;
  update: (content: string | HTMLElement) => void;
  destroy: () => void;
} {
  const { offset = { x: 12, y: 12 }, className = '' } = options;

  const tooltip = document.createElement('div');
  tooltip.className = `following-tooltip ${className}`;
  tooltip.style.cssText = `
    position: fixed;
    z-index: 9999;
    padding: 6px 10px;
    background: rgba(13, 13, 15, 0.95);
    border: 1px solid #27272a;
    border-radius: 6px;
    font-size: 13px;
    color: #fafafa;
    pointer-events: none;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.15s ease, transform 0.15s ease;
    max-width: 300px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  `;

  if (typeof content === 'string') {
    tooltip.textContent = content;
  } else {
    tooltip.appendChild(content);
  }

  document.body.appendChild(tooltip);

  return {
    show: (x: number, y: number) => {
      tooltip.style.left = `${x + offset.x}px`;
      tooltip.style.top = `${y + offset.y}px`;
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
    },
    hide: () => {
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translateY(4px)';
    },
    update: (newContent: string | HTMLElement) => {
      tooltip.innerHTML = '';
      if (typeof newContent === 'string') {
        tooltip.textContent = newContent;
      } else {
        tooltip.appendChild(newContent);
      }
    },
    destroy: () => {
      tooltip.remove();
    },
  };
}

/**
 * Add keyboard focus indicator
 */
export function setupFocusRing(element: HTMLElement): () => void {
  let usingKeyboard = false;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      usingKeyboard = true;
      element.classList.add('keyboard-focus');
    }
  };

  const handleMouseDown = () => {
    usingKeyboard = false;
    element.classList.remove('keyboard-focus');
  };

  const handleFocus = () => {
    if (usingKeyboard) {
      element.classList.add('keyboard-focus');
    }
  };

  const handleBlur = () => {
    element.classList.remove('keyboard-focus');
  };

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mousedown', handleMouseDown);
  element.addEventListener('focus', handleFocus);
  element.addEventListener('blur', handleBlur);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousedown', handleMouseDown);
    element.removeEventListener('focus', handleFocus);
    element.removeEventListener('blur', handleBlur);
  };
}

/**
 * Create a smooth number display that animates value changes
 */
export class AnimatedNumber {
  private element: HTMLElement;
  private currentValue: number;
  private targetValue: number;
  private decimals: number;
  private rafId: number | null = null;
  private formatter: (value: number) => string;

  constructor(
    element: HTMLElement,
    initialValue = 0,
    options: {
      decimals?: number;
      formatter?: (value: number) => string;
    } = {}
  ) {
    this.element = element;
    this.currentValue = initialValue;
    this.targetValue = initialValue;
    this.decimals = options.decimals ?? 0;
    this.formatter = options.formatter ?? ((v) =>
      this.decimals > 0 ? v.toFixed(this.decimals) : Math.round(v).toLocaleString()
    );
    this.render();
  }

  set(value: number, animate = true): void {
    this.targetValue = value;

    if (!animate) {
      this.currentValue = value;
      this.render();
      return;
    }

    if (this.rafId) return;

    const startValue = this.currentValue;
    const startTime = performance.now();
    const duration = 400;

    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      this.currentValue = startValue + (this.targetValue - startValue) * eased;
      this.render();

      if (progress < 1) {
        this.rafId = requestAnimationFrame(update);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(update);
  }

  private render(): void {
    this.element.textContent = this.formatter(this.currentValue);
  }

  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}

/**
 * Create a smooth progress indicator
 */
export class SmoothProgress {
  private element: HTMLElement;
  private barElement: HTMLElement;
  private currentProgress: number;
  private rafId: number | null = null;

  constructor(container: HTMLElement, initialProgress = 0) {
    this.currentProgress = initialProgress;

    this.element = document.createElement('div');
    this.element.style.cssText = `
      width: 100%;
      height: 4px;
      background: #27272a;
      border-radius: 9999px;
      overflow: hidden;
    `;

    this.barElement = document.createElement('div');
    this.barElement.style.cssText = `
      height: 100%;
      background: #3b82f6;
      border-radius: 9999px;
      width: ${initialProgress}%;
      transition: width 0.3s ease-out;
    `;

    this.element.appendChild(this.barElement);
    container.appendChild(this.element);
  }

  set(progress: number): void {
    this.currentProgress = Math.min(100, Math.max(0, progress));
    this.barElement.style.width = `${this.currentProgress}%`;
  }

  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.element.remove();
  }
}

/**
 * Debounce helper for scroll/resize handlers
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle helper for frequent events
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= limit) {
      lastTime = now;
      fn(...args);
    }
  };
}

/**
 * Intersection observer for lazy loading and animations
 */
export function observeVisibility(
  element: HTMLElement,
  callback: (isVisible: boolean, entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): () => void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        callback(entry.isIntersecting, entry);
      });
    },
    {
      threshold: 0.1,
      ...options,
    }
  );

  observer.observe(element);

  return () => observer.disconnect();
}

/**
 * Prefetch a URL when element becomes visible
 */
export function prefetchOnVisible(element: HTMLElement, url: string): () => void {
  return observeVisibility(element, (isVisible) => {
    if (isVisible) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    }
  });
}
