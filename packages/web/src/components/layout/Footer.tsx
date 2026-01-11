/**
 * Footer Component
 *
 * Bottom bar with version info and keyboard hints.
 */

import React from 'react';

export interface KeyHint {
  key: string;
  label: string;
  description?: string;
}

export interface FooterProps {
  version?: string;
  hints?: KeyHint[];
  children?: React.ReactNode;
}

const defaultHints: KeyHint[] = [
  { key: '?', label: 'help' },
  { key: 't', label: 'theme' },
  { key: '/', label: 'search' },
  { key: ':', label: 'command' },
];

export const Footer: React.FC<FooterProps> = ({
  version,
  hints = defaultHints,
  children,
}) => {
  // Only show version when explicitly provided (not placeholder)
  const showVersion = version && version !== '0.0.0';

  return (
    <footer className="app-footer" role="contentinfo" aria-label="Application Footer">
      {showVersion ? (
        <span className="footer-version" aria-label={`Version ${version}`}>Phage Explorer v{version}</span>
      ) : (
        <span className="footer-version">Phage Explorer</span>
      )}
      <div className="footer-hints" role="list" aria-label="Keyboard Shortcuts">
        {hints.map((hint, i) => (
          <React.Fragment key={hint.key}>
            {i > 0 && <span className="hint-separator" aria-hidden="true">·</span>}
            <span
              className="hint-item"
              role="listitem"
              title={hint.description}
              aria-label={
                hint.description ? `${hint.key}: ${hint.description}` : `${hint.key}: ${hint.label}`
              }
            >
              <kbd className="key-hint">{hint.key}</kbd>
              <span className="hint-label">{hint.label}</span>
            </span>
          </React.Fragment>
        ))}
        {children}
      </div>
    </footer>
  );
};

export default Footer;
