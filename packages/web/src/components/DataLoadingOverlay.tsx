/**
 * DataLoadingOverlay - Database Loading Screen
 *
 * Displays progress while loading the SQLite database.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { DatabaseLoadProgress } from '../db';
import { Skeleton } from './ui/Skeleton';

interface DataLoadingOverlayProps {
  progress: DatabaseLoadProgress | null;
  error?: string | null;
  onRetry?: () => void;
}

export function DataLoadingOverlay({
  progress,
  error,
  onRetry,
}: DataLoadingOverlayProps): React.ReactElement {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Track if loading is taking longer than expected
  const [isSlowLoad, setIsSlowLoad] = useState(false);
  const [estimatedRemainingSeconds, setEstimatedRemainingSeconds] = useState<number | null>(null);
  const progressSamplesRef = useRef<Array<{ timeMs: number; percent: number }>>([]);
  const lastStageRef = useRef<DatabaseLoadProgress['stage'] | null>(null);
  const lastPercentRef = useRef<number | null>(null);

  useEffect(() => {
    // After 15 seconds without completion, show slow load message
    const timer = setTimeout(() => {
      if (!progress || progress.percent < 100) {
        setIsSlowLoad(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [progress]);

  useEffect(() => {
    if (!progress || progress.percent <= 0 || progress.percent >= 100 || progress.stage === 'ready' || progress.stage === 'error') {
      progressSamplesRef.current = [];
      lastStageRef.current = progress?.stage ?? null;
      lastPercentRef.current = progress?.percent ?? null;
      setEstimatedRemainingSeconds(null);
      return;
    }

    const nowMs = Date.now();

    if (lastStageRef.current !== progress.stage) {
      progressSamplesRef.current = [];
      lastStageRef.current = progress.stage;
      lastPercentRef.current = null;
    }

    const prevPercent = lastPercentRef.current;
    if (prevPercent === null || progress.percent !== prevPercent) {
      if (prevPercent !== null && progress.percent < prevPercent) {
        progressSamplesRef.current = [];
      }
      progressSamplesRef.current.push({ timeMs: nowMs, percent: progress.percent });
      lastPercentRef.current = progress.percent;
    }

    const samples = progressSamplesRef.current;
    const MAX_SAMPLES = 8;
    if (samples.length > MAX_SAMPLES) {
      samples.splice(0, samples.length - MAX_SAMPLES);
    }

    if (samples.length < 2) {
      setEstimatedRemainingSeconds(null);
      return;
    }

    const first = samples[0];
    const last = samples[samples.length - 1];
    const deltaPercent = last.percent - first.percent;
    const deltaSeconds = (last.timeMs - first.timeMs) / 1000;
    const secondsSinceLastUpdate = (nowMs - last.timeMs) / 1000;

    if (secondsSinceLastUpdate > 5) {
      setEstimatedRemainingSeconds(null);
      return;
    }

    if (deltaSeconds <= 0.5 || deltaPercent <= 0.5) {
      setEstimatedRemainingSeconds(null);
      return;
    }

    const ratePercentPerSecond = deltaPercent / deltaSeconds;
    const remainingSeconds = Math.ceil((100 - last.percent) / ratePercentPerSecond);
    if (!Number.isFinite(remainingSeconds) || remainingSeconds <= 0) {
      setEstimatedRemainingSeconds(null);
      return;
    }

    setEstimatedRemainingSeconds(Math.min(30 * 60, remainingSeconds));
  }, [progress]);

  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
          zIndex: 9999,
        }}
      >
        <div
          style={{
            border: `1px solid ${colors.error}`,
            padding: '2rem',
            borderRadius: '8px',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }} aria-hidden="true">⚠️</div>
          <h2 style={{ color: colors.error, marginBottom: '1rem' }}>Database Load Failed</h2>
          <p style={{ color: colors.text, marginBottom: '1.5rem' }}>{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: colors.primary,
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show initial loading state when no progress data yet
  // This ensures the overlay is never invisible
  const displayProgress: DatabaseLoadProgress = progress ?? {
    stage: 'initializing',
    percent: 0,
    message: 'Initializing...',
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        zIndex: 9999,
      }}
    >
      <div style={{ width: '320px', textAlign: 'center' }}>
        {/* App title */}
        <div style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: colors.accent }}>
          PHAGE EXPLORER
        </div>

        {/* Animated loading indicator when progress is 0 or unknown */}
        {displayProgress.percent === 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <Skeleton
              variant="rect"
              width="100%"
              height={4}
              animation="shimmer"
              aria-label="Loading"
            />
          </div>
        )}

        {/* Progress bar when we have actual progress */}
        {displayProgress.percent > 0 && (
          <div
            className="progress-bar"
            style={{ marginBottom: '1rem' }}
            role="progressbar"
            aria-valuenow={displayProgress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress"
              style={{ width: `${displayProgress.percent}%` }}
            />
          </div>
        )}

        {/* Status message */}
        <div style={{ color: colors.textDim, fontSize: '0.9rem', marginBottom: estimatedRemainingSeconds ? '0.25rem' : '0.5rem' }}>
          {displayProgress.message}
          {displayProgress.percent > 0 && ` (${displayProgress.percent}%)`}
        </div>

        {estimatedRemainingSeconds !== null && (
          <div
            aria-hidden="true"
            style={{
              color: colors.textMuted,
              fontSize: '0.8rem',
              marginBottom: '0.5rem',
            }}
          >
            About {formatDuration(estimatedRemainingSeconds)} remaining
          </div>
        )}

        {/* Slow load warning */}
        {isSlowLoad && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: colors.backgroundAlt,
              borderRadius: '6px',
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ color: colors.warning, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Taking longer than expected...
            </div>
            <div style={{ color: colors.textMuted, fontSize: '0.8rem' }}>
              This may be due to a slow network or large database.
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.4rem 0.8rem',
                  backgroundColor: 'transparent',
                  color: colors.primary,
                  border: `1px solid ${colors.primary}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Screen reader announcement */}
        <div className="sr-only">
          Loading database: {displayProgress.message},{' '}
          {displayProgress.percent > 0
            ? `${displayProgress.percent}% complete`
            : 'starting up'}
          .
          {isSlowLoad && ' Loading is taking longer than expected.'}
        </div>
      </div>
    </div>
  );
}
