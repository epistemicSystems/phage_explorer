/**
 * Keyboard Primer Component
 *
 * A quick reference card for essential keyboard shortcuts.
 */

import React from 'react';
import { useTheme } from '../../hooks/useTheme';

export function KeyboardPrimer(): React.ReactElement {
  const { theme } = useTheme();
  const colors = theme.colors;

  const sections = [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['↑', '↓'], desc: 'Select Phage' },
        { keys: ['←', '→'], desc: 'Scroll Sequence' },
        { keys: ['g', 'g'], desc: 'Go to Start' },
        { keys: ['G'], desc: 'Go to End' },
      ]
    },
    {
      title: 'View',
      shortcuts: [
        { keys: ['Space'], desc: 'Toggle DNA/Amino' },
        { keys: ['f'], desc: 'Cycle Frame' },
        { keys: ['t'], desc: 'Cycle Theme' },
        { keys: ['?'], desc: 'Help' },
      ]
    },
    {
      title: 'Tools',
      shortcuts: [
        { keys: ['/'], desc: 'Search' },
        { keys: [':'], desc: 'Command Palette' },
        { keys: ['a'], desc: 'Analysis Menu' },
        { keys: ['Esc'], desc: 'Close / Back' },
      ]
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginTop: '1rem'
    }}>
      {sections.map(section => (
        <div key={section.title} style={{
          backgroundColor: colors.backgroundAlt,
          borderRadius: '4px',
          padding: '0.75rem',
          border: `1px solid ${colors.border}`
        }}>
          <h4 style={{
            margin: '0 0 0.5rem 0',
            color: colors.primary,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {section.title}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {section.shortcuts.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: colors.textDim, fontSize: '0.85rem' }}>{s.desc}</span>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  {s.keys.map(k => (
                    <kbd key={k} style={{
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '3px',
                      padding: '0.1rem 0.3rem',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: colors.accent,
                      minWidth: '1.2rem',
                      textAlign: 'center'
                    }}>
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
