/**
 * DataFreshnessIndicator - Mobile-friendly cache status indicator
 *
 * Shows whether the database is loaded from cache or fresh from the network.
 * Designed for mobile where the main panel may be hidden.
 */

import React from 'react';
import { SubtleBadge, InfoBadge } from './Badge';

export interface DataFreshnessIndicatorProps {
  isCached: boolean;
  isLoading: boolean;
  /** Optional: show only on mobile (default: true) */
  mobileOnly?: boolean;
  className?: string;
}

export function DataFreshnessIndicator({
  isCached,
  isLoading,
  mobileOnly = true,
  className = '',
}: DataFreshnessIndicatorProps): React.ReactElement | null {
  // Don't show while loading
  if (isLoading) {
    return null;
  }

  const containerClass = mobileOnly
    ? `data-freshness-indicator mobile-only ${className}`.trim()
    : `data-freshness-indicator ${className}`.trim();

  return (
    <div className={containerClass}>
      {isCached ? (
        <SubtleBadge size="tiny" aria-label="Data loaded from cache">
          Cached
        </SubtleBadge>
      ) : (
        <InfoBadge size="tiny" aria-label="Data freshly loaded">
          Fresh
        </InfoBadge>
      )}
    </div>
  );
}

export default DataFreshnessIndicator;
