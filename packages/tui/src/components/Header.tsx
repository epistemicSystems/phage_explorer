import React from 'react';
import { Box, Text } from 'ink';
import { usePhageStore } from '@phage-explorer/state';

// Unicode decorative elements for visual polish
const ICONS = {
  dna: '🧬',
  phage: '🦠',
  arrow: '▶',
  bullet: '●',
  diamond: '◆',
  gene: '◉',
  diff: '⇄',
  frame: '◫',
} as const;

// Format large numbers with K/M suffixes
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function Header(): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const phage = usePhageStore(s => s.currentPhage);
  const phageIndex = usePhageStore(s => s.currentPhageIndex);
  const phages = usePhageStore(s => s.phages);
  const viewMode = usePhageStore(s => s.viewMode);
  const readingFrame = usePhageStore(s => s.readingFrame);
  const diffEnabled = usePhageStore(s => s.diffEnabled);
  const experienceLevel = usePhageStore(s => s.experienceLevel);

  const colors = theme.colors;
  const muted = colors.textDim;
  const infoColor = colors.accent;
  const bgHighlight = colors.borderFocus;

  // Create visual experience level indicator
  const levelIndicator = experienceLevel === 'power' ? '★★★' :
                         experienceLevel === 'intermediate' ? '★★☆' : '★☆☆';

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={colors.border}
      paddingX={1}
    >
      {/* Title bar with branding */}
      <Box justifyContent="space-between">
        <Box gap={1}>
          <Text color={colors.primary} bold>
            ═══
          </Text>
          <Text color={colors.accent} bold>
            PHAGE EXPLORER
          </Text>
          <Text color={colors.textDim}>v1.0</Text>
          <Text color={colors.primary} bold>
            ═══
          </Text>
        </Box>
        <Box gap={2}>
          <Text color={muted}>{levelIndicator}</Text>
          <Text color={colors.textDim}>
            <Text color={colors.accent}>[T]</Text> Theme
          </Text>
          <Text color={colors.textDim}>
            <Text color={colors.accent}>[?]</Text> Help
          </Text>
          <Text color={colors.textDim}>
            <Text color={colors.accent}>[Q]</Text> Quit
          </Text>
        </Box>
      </Box>

      {/* Phage info row */}
      <Box justifyContent="space-between" marginTop={0}>
        <Box gap={1}>
          <Text color={colors.accent}>{ICONS.arrow}</Text>
          <Text color={colors.text} bold>
            {phage?.name ?? 'Loading...'}
          </Text>
          {phage?.family && (
            <Text color={muted}>
              [{phage.family}]
            </Text>
          )}
        </Box>
        <Box gap={1}>
          <Text color={muted}>Phage</Text>
          <Text color={colors.primary} bold>
            {phageIndex + 1}
          </Text>
          <Text color={muted}>of</Text>
          <Text color={colors.text}>
            {phages.length}
          </Text>
        </Box>
      </Box>

      {/* Stats row with better visual separation */}
      <Box gap={3} flexWrap="wrap">
        {phage && (
          <>
            <Box gap={1}>
              <Text color={infoColor}>{ICONS.bullet}</Text>
              <Text color={colors.textDim}>Host:</Text>
              <Text color={colors.text}>{phage.host ?? 'Unknown'}</Text>
            </Box>
            <Box gap={1}>
              <Text color={colors.success}>{ICONS.bullet}</Text>
              <Text color={colors.textDim}>Size:</Text>
              <Text color={colors.text} bold>{formatNumber(phage.genomeLength ?? 0)}</Text>
              <Text color={colors.textMuted}>bp</Text>
            </Box>
            <Box gap={1}>
              <Text color={colors.warning}>{ICONS.bullet}</Text>
              <Text color={colors.textDim}>GC:</Text>
              <Text color={colors.text}>{phage.gcContent?.toFixed(1) ?? '?'}%</Text>
            </Box>
            <Box gap={1}>
              <Text color={colors.secondary}>{ICONS.bullet}</Text>
              <Text color={colors.textDim}>Genes:</Text>
              <Text color={colors.text}>{phage.genes?.length ?? '?'}</Text>
            </Box>
          </>
        )}
      </Box>

      {/* Mode row with visual indicators */}
      <Box gap={3} marginTop={0}>
        {/* View mode indicator */}
        <Box gap={1}>
          <Text
            color={viewMode === 'dna' ? colors.success : muted}
            bold={viewMode === 'dna'}
            backgroundColor={viewMode === 'dna' ? bgHighlight : undefined}
          >
            {' DNA '}
          </Text>
          <Text color={muted}>│</Text>
          <Text
            color={viewMode === 'aa' ? colors.accent : muted}
            bold={viewMode === 'aa'}
            backgroundColor={viewMode === 'aa' ? bgHighlight : undefined}
          >
            {' AA '}
          </Text>
        </Box>

        {/* Reading frame (only shown in AA mode) */}
        {viewMode === 'aa' && (
          <Box gap={1}>
            <Text color={infoColor}>{ICONS.frame}</Text>
            <Text color={colors.textDim}>Frame:</Text>
            <Box>
              {[0, 1, 2].map(f => (
                <Text
                  key={f}
                  color={readingFrame === f ? colors.accent : muted}
                  bold={readingFrame === f}
                  backgroundColor={readingFrame === f ? bgHighlight : undefined}
                >
                  {` ${f + 1} `}
                </Text>
              ))}
            </Box>
          </Box>
        )}

        {/* Diff mode indicator */}
        {diffEnabled && (
          <Box gap={1}>
            <Text color={colors.warning} bold backgroundColor={colors.backgroundAlt}>
              {' '}{ICONS.diff} DIFF MODE{' '}
            </Text>
          </Box>
        )}

        {/* Theme indicator */}
        <Box gap={1}>
          <Text color={muted}>{ICONS.diamond}</Text>
          <Text color={colors.textDim}>Theme:</Text>
          <Text color={colors.accent} bold>{theme.name}</Text>
        </Box>
      </Box>
    </Box>
  );
}
