/**
 * MinimalShell Component
 *
 * Clean, content-first layout inspired by Ciechanowski
 * Single-column flow with generous whitespace
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { animate, duration } from '../../lib/animate';

export interface MinimalShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  showScrollProgress?: boolean;
}

export const MinimalShell: React.FC<MinimalShellProps> = ({
  children,
  header,
  showScrollProgress = true,
}) => {
  const mainRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  // Smooth scroll progress tracking
  const handleScroll = useCallback(() => {
    const main = mainRef.current;
    if (!main) return;

    const scrollTop = main.scrollTop;
    const scrollHeight = main.scrollHeight - main.clientHeight;
    const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
    setScrollProgress(progress);
  }, []);

  // Animate progress bar smoothly
  useEffect(() => {
    if (!progressRef.current || !showScrollProgress) return;

    animate(progressRef.current, {
      scaleX: scrollProgress,
      duration: duration.fast,
      ease: 'outQuad',
    });
  }, [scrollProgress, showScrollProgress]);

  return (
    <div className="minimal-shell">
      {/* Scroll progress indicator */}
      {showScrollProgress && (
        <div className="scroll-progress">
          <div
            ref={progressRef}
            className="scroll-progress__bar"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      )}

      {/* Header */}
      {header && <header className="minimal-header">{header}</header>}

      {/* Main content - scrollable */}
      <main
        ref={mainRef}
        className="minimal-main"
        onScroll={handleScroll}
      >
        <div className="minimal-content">
          {children}
        </div>
      </main>

      <style>{`
        .minimal-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          height: 100vh;
          background: var(--c-bg, #111113);
          color: var(--c-text, #fafafa);
        }

        .scroll-progress {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: transparent;
          z-index: 1000;
          overflow: hidden;
        }

        .scroll-progress__bar {
          height: 100%;
          background: var(--c-accent, #3b82f6);
          transform-origin: left center;
          will-change: transform;
        }

        .minimal-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(17, 17, 19, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--c-border-subtle, #1f1f23);
        }

        .minimal-main {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }

        .minimal-content {
          max-width: var(--page-max-width, 1200px);
          margin: 0 auto;
          padding: var(--space-12, 3rem) var(--space-6, 1.5rem);
        }

        @media (max-width: 768px) {
          .minimal-content {
            padding: var(--space-8, 2rem) var(--space-4, 1rem);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .scroll-progress__bar {
            transition: transform 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Minimal Header Component
 */
export interface MinimalHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onTitleClick?: () => void;
}

export const MinimalHeader: React.FC<MinimalHeaderProps> = ({
  title,
  subtitle,
  actions,
  onTitleClick,
}) => {
  return (
    <div className="minimal-header__inner">
      <div className="minimal-header__left">
        <h1
          className="minimal-header__title"
          onClick={onTitleClick}
          style={{ cursor: onTitleClick ? 'pointer' : 'default' }}
        >
          {title}
        </h1>
        {subtitle && (
          <span className="minimal-header__subtitle">{subtitle}</span>
        )}
      </div>
      {actions && (
        <div className="minimal-header__actions">{actions}</div>
      )}

      <style>{`
        .minimal-header__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          padding: 0 var(--space-6, 1.5rem);
          max-width: var(--page-max-width, 1200px);
          margin: 0 auto;
        }

        .minimal-header__left {
          display: flex;
          align-items: baseline;
          gap: var(--space-4, 1rem);
        }

        .minimal-header__title {
          font-family: var(--font-sans, sans-serif);
          font-size: var(--text-lg, 1.125rem);
          font-weight: var(--font-semibold, 600);
          color: var(--c-text, #fafafa);
          margin: 0;
          transition: opacity 0.15s ease;
        }

        .minimal-header__title:hover {
          opacity: 0.8;
        }

        .minimal-header__subtitle {
          font-size: var(--text-sm, 0.875rem);
          color: var(--c-text-muted, #71717a);
        }

        .minimal-header__actions {
          display: flex;
          align-items: center;
          gap: var(--space-3, 0.75rem);
        }

        @media (max-width: 768px) {
          .minimal-header__inner {
            height: 56px;
            padding: 0 var(--space-4, 1rem);
          }

          .minimal-header__subtitle {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default MinimalShell;
