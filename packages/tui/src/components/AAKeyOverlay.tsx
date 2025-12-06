import React from 'react';
import { Box, Text } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import { AMINO_ACIDS, type AminoAcid } from '@phage-explorer/core';

export function AAKeyOverlay(): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const colors = theme.colors;

  // Group amino acids by property
  const groups = {
    hydrophobic: ['A', 'V', 'L', 'I', 'M', 'F', 'W', 'P'] as AminoAcid[],
    polar: ['S', 'T', 'Y', 'N', 'Q', 'C'] as AminoAcid[],
    basic: ['K', 'R', 'H'] as AminoAcid[],
    acidic: ['D', 'E'] as AminoAcid[],
    special: ['G', '*'] as AminoAcid[],
  };

  const groupLabels: Record<string, string> = {
    hydrophobic: 'Hydrophobic',
    polar: 'Polar',
    basic: 'Basic (+)',
    acidic: 'Acidic (-)',
    special: 'Special',
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={colors.accent}
      paddingX={2}
      paddingY={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text color={colors.accent} bold>
          AMINO ACID KEY
        </Text>
      </Box>

      {Object.entries(groups).map(([groupName, aas]) => (
        <Box key={groupName} flexDirection="column" marginBottom={1}>
          <Text color={colors.primary} bold>
            {groupLabels[groupName]}
          </Text>
          <Box flexWrap="wrap" gap={1}>
            {aas.map(aa => {
              const info = AMINO_ACIDS[aa];
              const colorPair = theme.aminoAcids[aa];

              return (
                <Box key={aa} gap={0}>
                  <Text
                    color={colorPair.fg}
                    backgroundColor={colorPair.bg}
                  >
                    {' '}{aa}{' '}
                  </Text>
                  <Text color={colors.textDim}>
                    {' '}{info.threeCode} - {info.name}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}

      <Box justifyContent="center" marginTop={1}>
        <Text color={colors.textDim}>Press K or Esc to close</Text>
      </Box>
    </Box>
  );
}
