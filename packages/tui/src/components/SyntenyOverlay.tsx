import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import type { PhageRepository } from '@phage-explorer/db-runtime';
import type { PhageFull } from '@phage-explorer/core';
import { alignSynteny } from '@phage-explorer/comparison';
import type { SyntenyAnalysis, SyntenyBlock } from '@phage-explorer/comparison';

interface SyntenyOverlayProps {
  repository: PhageRepository;
}

export function SyntenyOverlay({ repository }: SyntenyOverlayProps): React.ReactElement {
  const theme = usePhageStore(s => s.currentTheme);
  const closeOverlay = usePhageStore(s => s.closeOverlay);
  const colors = theme.colors;
  
  const phages = usePhageStore(s => s.phages);
  // Default to comparing current phage with previous one (or first one)
  const currentPhageIndex = usePhageStore(s => s.currentPhageIndex);
  
  // State for the two phages being compared
  const [phageA, setPhageA] = useState<PhageFull | null>(null);
  const [phageB, setPhageB] = useState<PhageFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Compare current phage (A) with:
        // 1. Explicitly selected comparison phage if comparison mode was active?
        // For now, let's just pick:
        // A = Current Phage
        // B = Previous Phage in list (or index 0 if current is 0, or index 1 if current is 0)
        
        const idxA = currentPhageIndex;
        let idxB = idxA - 1;
        if (idxB < 0) idxB = idxA + 1;
        if (idxB >= phages.length) idxB = 0; // Fallback if only 1 phage exists
        
        if (phages.length < 2) {
           // Can't compare
           const pA = await repository.getPhageByIndex(idxA);
           setPhageA(pA);
           setPhageB(pA); // Self compare
           setLoading(false);
           return;
        }

        const [pA, pB] = await Promise.all([
          repository.getPhageByIndex(idxA),
          repository.getPhageByIndex(idxB)
        ]);

        setPhageA(pA);
        setPhageB(pB);
        setLoading(false);
      } catch (err) {
        setError(String(err));
        setLoading(false);
      }
    };
    load();
  }, [currentPhageIndex, phages, repository]);

  const analysis = useMemo<SyntenyAnalysis | null>(() => {
    if (!phageA || !phageB) return null;
    return alignSynteny(phageA.genes, phageB.genes);
  }, [phageA, phageB]);

  useInput((input, key) => {
    if (key.escape) {
      closeOverlay('synteny');
    }
  });

  if (loading) return <Text>Loading synteny data...</Text>;
  if (error) return <Text color={colors.error}>Error: {error}</Text>;
  if (!phageA || !phageB || !analysis) return <Text>No data available</Text>;

  // Rendering Helpers
  const width = 70; // Available width for bars
  
  // Render a single gene bar with block coloring
  const renderGeneBar = (phage: PhageFull, blocks: SyntenyBlock[], isGenomeA: boolean) => {
    const totalLen = phage.genomeLength || 1;
    // Create canvas
    const chars = Array(width).fill('░');
    
    // Fill blocks
    blocks.forEach((block, blockIdx) => {
      // Determine range in genome
      const genes = phage.genes;
      const startGeneIdx = isGenomeA ? block.startIdxA : block.startIdxB;
      const endGeneIdx = isGenomeA ? block.endIdxA : block.endIdxB;
      
      if (startGeneIdx >= genes.length || endGeneIdx >= genes.length) return;
      
      const startPos = genes[startGeneIdx].startPos;
      const endPos = genes[endGeneIdx].endPos;
      
      const startPixel = Math.floor((startPos / totalLen) * width);
      const endPixel = Math.ceil((endPos / totalLen) * width);
      
      const colorChar = (blockIdx % 2 === 0) ? '█' : '▓'; // Alternating patterns for blocks
      
      for (let i = startPixel; i < Math.min(width, endPixel); i++) {
        chars[i] = colorChar;
      }
    });

    return (
        <Box>
            <Text color={colors.text}>{phage.name.slice(0, 15).padEnd(16)} </Text>
            <Text color={colors.accent}>{chars.join('')}</Text>
        </Box>
    );
  };

  // Render connections
  const renderConnections = () => {
    const lines = Array(3).fill('').map(() => Array(width).fill(' '));
    
    analysis.blocks.forEach((block) => {
        const genesA = phageA.genes;
        const genesB = phageB.genes;
        
        const centerA = (genesA[block.startIdxA].startPos + genesA[block.endIdxA].endPos) / 2;
        const centerB = (genesB[block.startIdxB].startPos + genesB[block.endIdxB].endPos) / 2;
        
        const posA = Math.floor((centerA / (phageA.genomeLength || 1)) * width);
        const posB = Math.floor((centerB / (phageB.genomeLength || 1)) * width);
        
        // Draw line from posA (top) to posB (bottom)
        // Simple Bresenham-like or just direct vertical/diagonal char
        const mid = Math.round((posA + posB) / 2);
        
        if (posA >= 0 && posA < width) lines[0][posA] = '│';
        if (mid >= 0 && mid < width) lines[1][mid] = posA === posB ? '│' : (posA < posB ? '╲' : '╱');
        if (posB >= 0 && posB < width) lines[2][posB] = '│';
    });
    
    return (
        <Box flexDirection="column" marginLeft={16}>
            <Text color={colors.textDim}>{lines[0].join('')}</Text>
            <Text color={colors.textDim}>{lines[1].join('')}</Text>
            <Text color={colors.textDim}>{lines[2].join('')}</Text>
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
      width={90}
    >
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color={colors.accent} bold>FUNCTIONAL SYNTENY ALIGNMENT</Text>
        <Text color={colors.textDim}>Esc to close</Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
            Score: <Text bold color={colors.success}>{(analysis.globalScore * 100).toFixed(1)}%</Text> 
            {' '}| Blocks: {analysis.blocks.length} 
            {' '}| DTW Dist: {analysis.dtwDistance.toFixed(1)}
        </Text>
      </Box>

      {renderGeneBar(phageA, analysis.blocks, true)}
      {renderConnections()}
      {renderGeneBar(phageB, analysis.blocks, false)}
      
      <Box marginTop={1} borderStyle="single" paddingX={1} flexDirection="column">
          <Text underline>Synteny Blocks (First 5):</Text>
          {analysis.blocks.slice(0, 5).map((b, i) => (
              <Text key={i}>
                  Block {i+1}: {phageA.genes[b.startIdxA]?.name || '?'}..{phageA.genes[b.endIdxA]?.name || '?'} 
                  {' <--> '} 
                  {phageB.genes[b.startIdxB]?.name || '?'}..{phageB.genes[b.endIdxB]?.name || '?'}
                  {' '}(Score: {b.score.toFixed(2)})
              </Text>
          ))}
      </Box>
    </Box>
  );
}
