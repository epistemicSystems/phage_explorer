import React from 'react';
import { Tooltip, type HintType } from './Tooltip';

export type InfoButtonSize = 'sm' | 'md';

export interface InfoButtonProps {
  tooltip?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  size?: InfoButtonSize;
  disabled?: boolean;
  className?: string;
  /**
   * Hint type for experience-level gating.
   * Defaults to 'definition' (always available).
   */
  hintType?: HintType;
}

export function InfoButton({
  tooltip,
  label = 'More info',
  onClick,
  size = 'md',
  disabled,
  className = '',
  hintType = 'definition',
}: InfoButtonProps): React.ReactElement {
  const button = (
    <button
      type="button"
      className={`info-button ${size === 'sm' ? 'info-button--sm' : ''} ${className}`.trim()}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <span aria-hidden>i</span>
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} position="top" className="info-button__tooltip" hintType={hintType}>
        {button}
      </Tooltip>
    );
  }

  return button;
}

export default InfoButton;
