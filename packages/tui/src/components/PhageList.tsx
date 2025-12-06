import React from 'react';
import { Box, Text } from 'ink';
import { usePhageStore } from '@phage-explorer/state';

interface PhageListProps {
  width?: number;
  height?: number;
}

export function PhageList({ width = 30, height = 10 }: PhageListProps): React.ReactElement {
  const phages = usePhageStore(s => s.phages);
  const currentIndex = usePhageStore(s => s.currentPhageIndex);
  const theme = usePhageStore(s => s.currentTheme);
  const colors = theme.colors;

  // Calculate visible window
  const halfWindow = Math.floor(height / 2);
  let startIndex = Math.max(0, currentIndex - halfWindow);
  const endIndex = Math.min(phages.length, startIndex + height);

  // Adjust if we're near the end
  if (endIndex - startIndex < height && startIndex > 0) {
    startIndex = Math.max(0, endIndex - height);
  }

  const visiblePhages = phages.slice(startIndex, endIndex);

  // Format phage name to fit width
  const formatName = (name: string, host: string | null, maxLen: number): string => {
    const hostStr = host ? ` (${host.split(' ')[0]})` : '';
    const fullStr = name + hostStr;
    if (fullStr.length <= maxLen) return fullStr;
    return name.substring(0, maxLen - 3) + '...';
  };

  return (
    <Box
      flexDirection="column"
      width={width}
      borderStyle="single"
      borderColor={colors.border}
    >
      <Box paddingX={1} borderBottom>
        <Text color={colors.primary} bold>Phages</Text>
      </Box>

      <Box flexDirection="column" paddingX={1}>
        {visiblePhages.map((phage, i) => {
          const actualIndex = startIndex + i;
          const isSelected = actualIndex === currentIndex;

          return (
            <Box key={phage.id}>
              <Text
                color={isSelected ? colors.accent : colors.text}
                backgroundColor={isSelected ? colors.background : undefined}
                bold={isSelected}
              >
                {isSelected ? '▶ ' : '  '}
                {formatName(phage.name, phage.host, width - 4)}
              </Text>
            </Box>
          );
        })}

        {/* Padding for empty space */}
        {visiblePhages.length < height && (
          Array(height - visiblePhages.length).fill(0).map((_, i) => (
            <Text key={`empty-${i}`}> </Text>
          ))
        )}
      </Box>

      {/* Scroll indicator */}
      {phages.length > height && (
        <Box paddingX={1} justifyContent="center">
          <Text color={colors.textDim}>
            {startIndex > 0 ? '↑' : ' '}
            {' '}
            {endIndex < phages.length ? '↓' : ' '}
          </Text>
        </Box>
      )}
    </Box>
  );
}
