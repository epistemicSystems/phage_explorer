import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import { computeSequenceLogo, LogoColumn } from '@phage-explorer/core';

// Mock alignment data generator (since we don't have multi-sequence alignment in state yet)
function generateMockAlignment(consensus: string, depth = 10): string[] {
  const alignment = [];
  const bases = ['A', 'C', 'G', 'T'];
  
  for (let i = 0; i < depth; i++) {
    let seq = '';
    for (const char of consensus) {
      if (Math.random() > 0.8) {
        // Mutation
        seq += bases[Math.floor(Math.random() * bases.length)];
      } else {
        seq += char;
      }
    }
    alignment.push(seq);
  }
  return alignment;
}

export function LogoOverlay(): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const colors = theme.colors;
  const closeOverlay = usePhageStore(s => s.closeOverlay);
  const sequence = usePhageStore(s => s.sequence); // Current single sequence
  const scrollPos = usePhageStore(s => s.scrollPosition);

  // For demonstration, we'll generate a "local consensus" around the current view
  // In a real app, this would come from a Multiple Sequence Alignment (MSA) file
  const windowSize = 20;
  const targetSeq = sequence.slice(scrollPos, scrollPos + windowSize);
  
  const logoData = useMemo(() => {
    if (!targetSeq) return [];
    const alignment = generateMockAlignment(targetSeq);
    return computeSequenceLogo(alignment, 'dna');
  }, [targetSeq]);

  useInput((input, key) => {
    if (key.escape) {
      closeOverlay('logo');
    }
  });

  const renderColumn = (col: LogoColumn) => {
    // ASCII art stacking
    // We can't easily scale text height in terminal, so we map height to color/brightness or simply list them
    // A better TUI approach: Vertical stack of characters
    
    // Stack from top (highest info) to bottom
    const letters = [...col.letters].reverse();
    
    return (
      <Box flexDirection="column" alignItems="center" width={3}>
        <Text color={colors.textDim} dimColor>{col.totalBits.toFixed(1)}</Text>
        {letters.map((l, i) => (
          <Text key={i} color={l.height > 1 ? colors.accent : colors.text}>
            {l.char}
          </Text>
        ))}
        <Text color={colors.border}>─</Text>
        <Text color={colors.textDim}>{col.position}</Text>
      </Box>
    );
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={colors.accent}
      paddingX={2}
      paddingY={1}
      width={80}
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color={colors.accent} bold>SEQUENCE LOGO (Local Conservation)</Text>
        <Text color={colors.textDim}>Esc to close</Text>
      </Box>

      {!targetSeq ? (
        <Text color={colors.textDim}>No sequence available</Text>
      ) : (
        <Box flexDirection="row">
          {logoData.map((col, i) => (
            <Box key={i} marginRight={1}>
              {renderColumn(col)}
            </Box>
          ))}
        </Box>
      )}
      
      <Box marginTop={1}>
        <Text color={colors.textDim} dimColor>
          (Mock alignment based on current view. Real MSA required for true conservation.)
        </Text>
      </Box>
    </Box>
  );
}
