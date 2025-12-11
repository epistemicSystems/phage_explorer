import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FloatingActionButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
}

/**
 * Mobile-first Floating Action Button (FAB)
 * - Renders via portal to avoid stacking issues
 * - Supports long-press gesture for secondary action
 * - Respects reduced motion preference
 */
export function FloatingActionButton({
  isOpen,
  onToggle,
  onLongPress,
}: FloatingActionButtonProps): JSX.Element {
  const portalRootRef = useRef<HTMLElement | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    portalRootRef.current = document.body;
    return () => {
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleTouchStart = () => {
    if (!onLongPress) return;
    longPressTimer.current = window.setTimeout(() => {
      longPressTimer.current = null;
      onLongPress();
    }, 500);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const content = (
    <button
      type="button"
      className={`fab ${isOpen ? 'open' : ''} ${reducedMotion ? 'fab--no-anim' : ''}`}
      aria-label={isOpen ? 'Close control menu' : 'Open control menu'}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      aria-controls="action-drawer"
      onClick={onToggle}
      onTouchStart={handleTouchStart}
      onTouchEnd={clearLongPress}
      onTouchCancel={clearLongPress}
    >
      <span className="fab-icon" aria-hidden="true">
        {isOpen ? '×' : '☰'}
      </span>
    </button>
  );

  if (portalRootRef.current) {
    return createPortal(content, portalRootRef.current);
  }

  return content;
}
