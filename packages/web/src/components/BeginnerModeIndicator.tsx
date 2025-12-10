import React from 'react';
import { Tooltip } from './ui/Tooltip';
import { useBeginnerMode } from '../education';

export const BeginnerModeIndicator: React.FC = () => {
  const { isEnabled, openGlossary, toggle } = useBeginnerMode();

  if (!isEnabled) return null;

  const tooltip = (
    <>
      Beginner Mode is on.
      <br />
      Click to open Learn. Press Ctrl+B to disable.
    </>
  );

  return (
    <Tooltip content={tooltip} position="top" className="beginner-indicator__tooltip">
      <div className="beginner-indicator" role="status" aria-live="polite">
        <button
          type="button"
          className="beginner-indicator__button"
          onClick={openGlossary}
          aria-label="Open Beginner Learn menu"
        >
          <span className="beginner-indicator__dot" aria-hidden />
          <span className="beginner-indicator__text">Beginner Mode</span>
        </button>
        <button
          type="button"
          className="beginner-indicator__dismiss"
          onClick={toggle}
          aria-label="Disable Beginner Mode"
        >
          ×
        </button>
      </div>
    </Tooltip>
  );
};

export default BeginnerModeIndicator;
