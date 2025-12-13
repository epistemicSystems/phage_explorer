import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBeginnerMode } from '../education';

type MenuItem = {
  id: string;
  label: string;
  description: string;
  action: () => void;
};

export const LearnMenu: React.FC = () => {
  const { isEnabled, openGlossary, startTour, showContextFor } = useBeginnerMode();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const ids = useMemo(() => ({ trigger: 'learn-menu-trigger', menu: 'learn-menu' }), []);

  const closeMenu = useCallback((opts?: { restoreFocus?: boolean }) => {
    setOpen(false);
    if (opts?.restoreFocus) {
      window.requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }, []);

  const items: MenuItem[] = useMemo(
    () => [
      {
        id: 'foundations',
        label: 'Foundational Modules',
        description: 'Core DNA/RNA/protein primers',
        action: () => {
          showContextFor('foundations');
          closeMenu();
        },
      },
      {
        id: 'glossary',
        label: 'Glossary',
        description: 'Definitions for key terms',
        action: () => {
          openGlossary();
          closeMenu();
        },
      },
      {
        id: 'welcome-tour',
        label: 'Start Welcome Tour',
        description: 'Guided walkthrough',
        action: () => {
          startTour('welcome');
          closeMenu();
        },
      },
    ],
    [closeMenu, openGlossary, showContextFor, startTour],
  );

  const toggleMenu = useCallback(() => setOpen(v => !v), []);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [closeMenu, open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    const raf = window.requestAnimationFrame(() => {
      itemRefs.current[0]?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [open]);

  if (!isEnabled) return null;

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative' }}
      onBlurCapture={(event) => {
        if (!open) return;
        const next = event.relatedTarget as Node | null;
        if (!next || !containerRef.current?.contains(next)) {
          closeMenu();
        }
      }}
    >
      <button
        type="button"
        className="btn"
        ref={triggerRef}
        id={ids.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={ids.menu}
        onClick={toggleMenu}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
            return;
          }
          if (event.key === 'Escape' && open) {
            event.preventDefault();
            closeMenu({ restoreFocus: true });
          }
        }}
      >
        Learn
      </button>
      {open && (
        <div
          role="menu"
          id={ids.menu}
          aria-labelledby={ids.trigger}
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '0.5rem',
            minWidth: '240px',
            background: 'var(--color-background-elevated)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.3))',
            zIndex: 20,
            padding: '0.25rem',
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              closeMenu({ restoreFocus: true });
              return;
            }

            if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
              event.preventDefault();
              const focusedIndex = itemRefs.current.findIndex((node) => node === document.activeElement);
              const current = focusedIndex >= 0 ? focusedIndex : activeIndex;
              const lastIndex = items.length - 1;

              const nextIndex =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? lastIndex
                    : event.key === 'ArrowDown'
                      ? Math.min(lastIndex, current + 1)
                      : Math.max(0, current - 1);

              setActiveIndex(nextIndex);
              itemRefs.current[nextIndex]?.focus();
            }
          }}
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              role="menuitem"
              type="button"
              onClick={item.action}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              tabIndex={index === activeIndex ? 0 : -1}
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                textAlign: 'left',
                margin: 0,
                marginBottom: '0.25rem',
                background: 'transparent',
              }}
              onFocus={() => setActiveIndex(index)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 600 }}>{item.label}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  {item.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnMenu;
