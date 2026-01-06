/**
 * HelpOverlay - Dynamic Hotkey Reference
 *
 * Shows all available keyboard shortcuts organized by category.
 * Matches the TUI HelpOverlay design.
 */

import React, { useMemo, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useHotkey } from '../../hooks';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import { ActionIds, ActionRegistryList, formatKeyCombo, type KeyCombo } from '../../keyboard';

interface HotkeyInfo {
  key: string;
  description: string;
  category: string;
}

function formatShortcut(shortcut: KeyCombo | KeyCombo[]): string {
  const combos = Array.isArray(shortcut) ? shortcut : [shortcut];
  return combos.map(formatKeyCombo).join(' / ');
}

// Group hotkeys by category
function groupByCategory(hotkeys: HotkeyInfo[]): Record<string, HotkeyInfo[]> {
  return hotkeys.reduce((acc, hotkey) => {
    if (!acc[hotkey.category]) {
      acc[hotkey.category] = [];
    }
    acc[hotkey.category].push(hotkey);
    return acc;
  }, {} as Record<string, HotkeyInfo[]>);
}

export function HelpOverlay(): React.ReactElement | null {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { isOpen, toggle } = useOverlay();
  const [detailLevel, setDetailLevel] = useState<'essential' | 'detailed'>('essential');

  const overlayOpen = isOpen('help');

  useHotkey(
    ActionIds.OverlayHelp,
    () => toggle('help'),
    { modes: ['NORMAL'] }
  );

  useHotkey(
    ActionIds.HelpToggleDetail,
    () => setDetailLevel(prev => prev === 'essential' ? 'detailed' : 'essential'),
    { modes: ['NORMAL'], enabled: overlayOpen }
  );

  const hotkeys = useMemo(() => {
    return ActionRegistryList
      .filter((action) => !action.surfaces || action.surfaces.includes('web'))
      .map((action): HotkeyInfo => ({
        key: formatShortcut(action.defaultShortcut),
        description: action.title,
        category: action.category,
      }))
      .sort((a, b) => a.category.localeCompare(b.category) || a.description.localeCompare(b.description));
  }, []);

  if (!overlayOpen) {
    return null;
  }

  const grouped = groupByCategory(hotkeys);
  const categories = detailLevel === 'essential'
    ? ['Navigation', 'View', 'Search', 'Overlays']
    : Object.keys(grouped);

  return (
    <Overlay
      id="help"
      title="KEYBOARD SHORTCUTS"
      hotkey="?"
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Detail level toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.5rem',
          backgroundColor: colors.backgroundAlt,
          borderRadius: '4px',
        }}>
          <span style={{ color: colors.textDim }}>
            Showing: {detailLevel === 'essential' ? 'Essential' : 'All'} shortcuts
          </span>
          <button
            onClick={() => setDetailLevel(prev => prev === 'essential' ? 'detailed' : 'essential')}
            style={{
              background: colors.accent,
              color: colors.background,
              border: 'none',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Press D to toggle
          </button>
        </div>

        {/* Categories */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {categories.map(category => (
            <div
              key={category}
              style={{
                border: `1px solid ${colors.borderLight}`,
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div style={{
                backgroundColor: colors.backgroundAlt,
                padding: '0.5rem 0.75rem',
                borderBottom: `1px solid ${colors.borderLight}`,
              }}>
                <span style={{ color: colors.primary, fontWeight: 'bold' }}>
                  {category}
                </span>
              </div>
              <div style={{ padding: '0.5rem' }}>
                {grouped[category]?.map((hotkey, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '2px',
                      backgroundColor: index % 2 === 0 ? 'transparent' : colors.backgroundAlt,
                    }}
                  >
                    <span style={{
                      color: colors.accent,
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      minWidth: '80px',
                    }}>
                      {hotkey.key}
                    </span>
                    <span style={{ color: colors.text, flex: 1, marginLeft: '1rem' }}>
                      {hotkey.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Overlay>
  );
}

export default HelpOverlay;
