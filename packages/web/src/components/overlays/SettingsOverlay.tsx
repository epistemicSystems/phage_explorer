import React from 'react';
import { Overlay } from './Overlay';
import { useOverlay } from './OverlayProvider';
import { useTheme } from '../../hooks/useTheme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useBeginnerMode } from '../../education';
import { useWebPreferences } from '../../store/createWebStore';
import { IconContrast, IconLearn, IconSettings } from '../ui';

export function SettingsOverlay(): React.ReactElement | null {
  const { close } = useOverlay();
  const { theme, setTheme, availableThemes } = useTheme();
  const reducedMotion = useReducedMotion();
  const highContrast = useWebPreferences((s) => s.highContrast);
  const setHighContrast = useWebPreferences((s) => s.setHighContrast);
  const backgroundEffects = useWebPreferences((s) => s.backgroundEffects);
  const setBackgroundEffects = useWebPreferences((s) => s.setBackgroundEffects);
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
      icon={<IconSettings size={18} />}
      size="md"
      onClose={() => close('settings')}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <section
          aria-label="Appearance settings"
          style={{
            border: `1px solid ${colors.borderLight}`,
            borderRadius: '6px',
            padding: '1rem',
            backgroundColor: colors.backgroundAlt,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconContrast size={16} />
              <h3 style={{ margin: 0, color: colors.text }}>Appearance</h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: colors.text }}>Theme</div>
                <div style={{ color: colors.textMuted, fontSize: '0.85rem', lineHeight: 1.4 }}>
                  Choose the overall color palette.
                </div>
              </div>
              <select
                value={theme.id}
                onChange={(e) => setTheme(e.target.value)}
                aria-label="Select theme"
                style={{
                  padding: '0.45rem 0.6rem',
                  borderRadius: 8,
                  border: `1px solid ${colors.borderLight}`,
                  background: colors.background,
                  color: colors.text,
                  minWidth: 160,
                }}
              >
                {availableThemes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: colors.text }}>High contrast</div>
                <div style={{ color: colors.textMuted, fontSize: '0.85rem', lineHeight: 1.4 }}>
                  Increases text and border contrast for readability.
                </div>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => setHighContrast(!highContrast)}
                aria-pressed={highContrast}
                aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
              >
                {highContrast ? 'On' : 'Off'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: colors.text }}>Background effects</div>
                <div style={{ color: colors.textMuted, fontSize: '0.85rem', lineHeight: 1.4 }}>
                  Matrix rain and CRT overlay.
                  {reducedMotion ? ' Disabled by your Reduced Motion preference.' : ''}
                </div>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => setBackgroundEffects(!backgroundEffects)}
                aria-pressed={backgroundEffects}
                aria-label={backgroundEffects ? 'Disable background effects' : 'Enable background effects'}
                disabled={reducedMotion}
              >
                {backgroundEffects ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </section>

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
                <IconLearn size={16} />
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
