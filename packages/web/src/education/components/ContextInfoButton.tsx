/**
 * ContextInfoButton - InfoButton that triggers context-aware help
 *
 * A specialized InfoButton that integrates with the context help system.
 * When clicked, it shows the context help panel for the specified topic.
 * Only visible when Beginner Mode is enabled.
 *
 * Features:
 * - Hover preview shows short summary
 * - Click opens full context panel
 * - Only renders when beginner mode is enabled
 * - Consistent [?] styling across the app
 *
 * Usage:
 * ```tsx
 * <ContextInfoButton topicId="gc-skew" />
 * ```
 *
 * Part of: phage_explorer-vs9k (Pillar 5: Context-Aware Help System)
 */

import React, { useCallback, useMemo } from 'react';
import { InfoButton, type InfoButtonSize } from '../../components/ui';
import { useContextHelp } from '../context';
import { getOverlayContext, getGeneProductContext, getAnalysisContext } from '../contextMapping';

export interface ContextInfoButtonProps {
  /** The topic ID to show help for (must exist in context mapping) */
  topicId: string;
  /** Optional size override */
  size?: InfoButtonSize;
  /** Additional CSS class name */
  className?: string;
  /** Whether to show in inline position (default) or absolute */
  position?: 'inline' | 'absolute';
}

/**
 * Get the short summary for hover preview
 */
function getTopicSummary(topicId: string): string | undefined {
  const overlay = getOverlayContext(topicId);
  if (overlay) return overlay.summary;

  const gene = getGeneProductContext(topicId);
  if (gene) return gene.summary;

  const analysis = getAnalysisContext(topicId);
  if (analysis) return analysis.summary;

  return undefined;
}

/**
 * Get the heading for the topic
 */
function getTopicHeading(topicId: string): string | undefined {
  const overlay = getOverlayContext(topicId);
  if (overlay) return overlay.heading;

  const gene = getGeneProductContext(topicId);
  if (gene) return gene.heading;

  const analysis = getAnalysisContext(topicId);
  if (analysis) return analysis.heading;

  return undefined;
}

export function ContextInfoButton({
  topicId,
  size = 'sm',
  className = '',
  position = 'inline',
}: ContextInfoButtonProps): React.ReactElement | null {
  const { showContext, isBeginnerMode, activeTopic, isOpen } = useContextHelp();

  const handleClick = useCallback(() => {
    showContext(topicId);
  }, [showContext, topicId]);

  // Get hover preview content
  const summary = useMemo(() => getTopicSummary(topicId), [topicId]);
  const heading = useMemo(() => getTopicHeading(topicId), [topicId]);

  // Don't render if beginner mode is disabled
  if (!isBeginnerMode) {
    return null;
  }

  // Check if this topic is currently active
  const isActive = isOpen && activeTopic === topicId;

  const positionClass = position === 'absolute' ? 'context-info-button--absolute' : '';
  const activeClass = isActive ? 'context-info-button--active' : '';

  return (
    <InfoButton
      size={size}
      className={`context-info-button ${positionClass} ${activeClass} ${className}`.trim()}
      onClick={handleClick}
      label={heading ?? 'Show context help'}
      tooltip={
        summary ? (
          <span className="context-info-button__preview">
            {heading && <strong>{heading}</strong>}
            {heading && <br />}
            {summary}
          </span>
        ) : undefined
      }
    />
  );
}

export default ContextInfoButton;
