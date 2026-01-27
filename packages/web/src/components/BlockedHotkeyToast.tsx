/**
 * BlockedHotkeyToast - Shows a notification when a hotkey is blocked
 * due to experience level restrictions. Uses the toast system.
 */

import { useEffect, useRef } from 'react';
import { usePhageStore } from '@phage-explorer/state';
import type { BlockedHotkeyInfo } from '../hooks/useExperienceLevelSync';
import { getExperienceLevelLabel } from '../hooks/useExperienceLevelSync';
import type { ExperienceLevel } from '../keyboard/types';
import type { ToastOptions } from './ui/Toast';

interface BlockedHotkeyToastProps {
  info: BlockedHotkeyInfo | null;
  onDismiss: () => void;
  showToast?: (options: ToastOptions) => string;
}

export function BlockedHotkeyToast({
  info,
  onDismiss,
  showToast,
}: BlockedHotkeyToastProps): null {
  const setExperienceLevel = usePhageStore((s) => s.setExperienceLevel);
  const lastInfoRef = useRef<BlockedHotkeyInfo | null>(null);

  useEffect(() => {
    if (!info || !showToast) return;
    // Prevent duplicate toasts for the same blocked hotkey event
    if (info === lastInfoRef.current) return;
    lastInfoRef.current = info;

    showToast({
      id: 'blocked-hotkey',
      title: 'Feature locked',
      message: `${info.description} (${info.keyDisplay}) requires ${getExperienceLevelLabel(info.requiredLevel)} experience. You're at ${getExperienceLevelLabel(info.currentLevel)} level.`,
      variant: 'warning',
      duration: 5000,
      actions: [
        {
          label: 'Upgrade',
          onClick: () => {
            setExperienceLevel(info.requiredLevel as ExperienceLevel);
            onDismiss();
          },
        },
      ],
    });
  }, [info, showToast, onDismiss, setExperienceLevel]);

  // No DOM output - toast system handles rendering
  return null;
}

export default BlockedHotkeyToast;
