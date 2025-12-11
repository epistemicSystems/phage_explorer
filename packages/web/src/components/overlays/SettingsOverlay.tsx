import React from 'react';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import { useTheme } from '../../hooks/useTheme';
import { useBeginnerMode } from '../../education';

export function SettingsOverlay(): React.ReactElement | null {
  const { close } = useOverlay();
  const { theme } = useTheme();
  const colors = theme.colors;

  const {
    isEnabled: beginnerModeEnabled,
    enable: enableBeginnerMode,
    disable: disableBeginnerMode,
  } = useBeginnerMode();

  const handleToggleBeginner = () => {
    if (beginnerModeEnabled) {
      disableBeginnerMode();
    } else {
      enableBeginnerMode();
    }
  };

  return (
    <Overlay
      id="settings"
      title="Settings"
      icon="⚙️"
      size="md"
      onClose={() => close('settings')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <section
          aria-label="Beginner mode setting"
          style={{
            border: `1px solid ${colors.borderLight}`,
            borderRadius: '6px',
            padding: '1rem',
            backgroundColor: colors.backgroundAlt,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span role="img" aria-label="Sparkles">✨</span>
                <h3 style={{ margin: 0, color: colors.text }}>Beginner Mode</h3>
              </div>
              <p style={{ margin: '0.35rem 0', color: colors.textDim, lineHeight: 1.5 }}>
                Shows glossary, context-aware help, guided tours, and learning overlays.
                Persists to localStorage so newcomers keep their learning setup between visits.
              </p>
              <p style={{ margin: 0, color: colors.textMuted, fontSize: '0.85rem' }}>
                Current state: <strong>{beginnerModeEnabled ? 'Enabled' : 'Disabled'}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                className="btn"
                onClick={handleToggleBeginner}
                aria-pressed={beginnerModeEnabled}
                aria-label={beginnerModeEnabled ? 'Disable Beginner Mode' : 'Enable Beginner Mode'}
              >
                {beginnerModeEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => close('settings')}
          >
            Close
          </button>
        </div>
      </div>
    </Overlay>
  );
}
