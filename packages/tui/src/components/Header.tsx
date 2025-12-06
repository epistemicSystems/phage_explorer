import React from 'react';
import { Box, Text } from 'ink';
import { usePhageStore } from '@phage-explorer/state';

export function Header(): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const phage = usePhageStore(s => s.currentPhage);
  const phageIndex = usePhageStore(s => s.currentPhageIndex);
  const phages = usePhageStore(s => s.phages);
  const viewMode = usePhageStore(s => s.viewMode);
  const readingFrame = usePhageStore(s => s.readingFrame);
  const diffEnabled = usePhageStore(s => s.diffEnabled);

  const colors = theme.colors;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={colors.border}
      paddingX={1}
    >
      {/* Title row */}
      <Box justifyContent="space-between">
        <Text color={colors.primary} bold>
          PHAGE-EXPLORER v1.0
        </Text>
        <Box gap={2}>
          <Text color={colors.textDim}>[T] Theme</Text>
          <Text color={colors.textDim}>[?] Help</Text>
          <Text color={colors.textDim}>[Q] Quit</Text>
        </Box>
      </Box>

      {/* Phage info row */}
      <Box justifyContent="space-between">
        <Box gap={1}>
          <Text color={colors.accent}>▶</Text>
          <Text color={colors.text} bold>
            {phage?.name ?? 'Loading...'}
          </Text>
        </Box>
        <Text color={colors.textDim}>
          {phageIndex + 1} / {phages.length}
        </Text>
      </Box>

      {/* Stats row */}
      <Box gap={2} flexWrap="wrap">
        {phage && (
          <>
            <Text color={colors.textDim}>
              Family: <Text color={colors.text}>{phage.family ?? 'Unknown'}</Text>
            </Text>
            <Text color={colors.textDim}>
              Host: <Text color={colors.text}>{phage.host ?? 'Unknown'}</Text>
            </Text>
            <Text color={colors.textDim}>
              Size: <Text color={colors.text}>{phage.genomeLength?.toLocaleString() ?? '?'} bp</Text>
            </Text>
            <Text color={colors.textDim}>
              GC: <Text color={colors.text}>{phage.gcContent?.toFixed(1) ?? '?'}%</Text>
            </Text>
          </>
        )}
      </Box>

      {/* Mode row */}
      <Box gap={2}>
        <Text color={colors.textDim}>
          Mode: <Text color={colors.accent}>{viewMode === 'dna' ? 'DNA' : 'AA'}</Text>
        </Text>
        {viewMode === 'aa' && (
          <Text color={colors.textDim}>
            Frame: <Text color={colors.accent}>{readingFrame + 1}</Text>
          </Text>
        )}
        {diffEnabled && (
          <Text color={colors.warning}>DIFF MODE</Text>
        )}
        <Text color={colors.textDim}>
          Theme: <Text color={colors.accent}>{theme.name}</Text>
        </Text>
      </Box>
    </Box>
  );
}
