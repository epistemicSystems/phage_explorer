import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { usePhageStore } from '@phage-explorer/state';

interface Props {
  sequence: string;
}

function findPalindromes(seq: string, minLen = 6): Array<{ pos: number; len: number }> {
  const hits: Array<{ pos: number; len: number }> = [];
  const upper = seq.toUpperCase();
  const revCompChar = (c: string) => (c === 'A' ? 'T' : c === 'T' ? 'A' : c === 'C' ? 'G' : c === 'G' ? 'C' : c);

  for (let i = 0; i <= upper.length - minLen; i++) {
    for (let len = minLen; len <= minLen + 4 && i + len <= upper.length; len++) {
      const sub = upper.slice(i, i + len);
      const rev = sub.split('').reverse().map(revCompChar).join('');
      if (sub === rev) {
        hits.push({ pos: i + 1, len });
        break;
      }
    }
  }
  return hits;
}

export function RepeatOverlay({ sequence }: Props): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const closeOverlay = usePhageStore(s => s.closeOverlay);
  const colors = theme.colors;

  const hits = useMemo(() => findPalindromes(sequence), [sequence]);
  const topHits = hits.slice(0, 12);

  useInput((input, key) => {
    if (key.escape || input === 'r' || input === 'R') closeOverlay('repeats');
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={colors.accent}
      paddingX={2}
      paddingY={1}
      width={68}
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color={colors.accent} bold>REPEATS / PALINDROMES (R KEY)</Text>
        <Text color={colors.textDim}>ESC/R to close</Text>
      </Box>
      {sequence.length === 0 ? (
        <Text color={colors.textDim}>No sequence loaded</Text>
      ) : hits.length === 0 ? (
        <Text color={colors.textDim}>No palindromic repeats ≥6 bp detected</Text>
      ) : (
        <>
          <Text color={colors.textDim}>Total hits: {hits.length}. Showing first {topHits.length}.</Text>
          {topHits.map(hit => (
            <Text key={`${hit.pos}-${hit.len}`} color={colors.text}>
              {hit.pos.toLocaleString().padStart(8, ' ')}  len={hit.len}
            </Text>
          ))}
        </>
      )}
    </Box>
  );
}
