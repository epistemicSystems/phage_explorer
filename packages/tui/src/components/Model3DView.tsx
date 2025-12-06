import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { usePhageStore } from '@phage-explorer/state';
import {
  getPhageModel,
  renderModel,
  createAnimationState,
  updateAnimation,
  type AnimationState,
} from '@phage-explorer/renderer-3d';

interface Model3DViewProps {
  width?: number;
  height?: number;
}

export function Model3DView({
  width = 24,
  height = 16,
}: Model3DViewProps): React.ReactElement {
  const show3DModel = usePhageStore(s => s.show3DModel);
  const paused = usePhageStore(s => s.model3DPaused);
  const speed = usePhageStore(s => s.model3DSpeed);
  const currentPhage = usePhageStore(s => s.currentPhage);
  const theme = usePhageStore(s => s.currentTheme);

  const [animState, setAnimState] = useState<AnimationState>(createAnimationState());
  const [frameLines, setFrameLines] = useState<string[]>([]);

  const colors = theme.colors;

  // Get the appropriate model
  const model = React.useMemo(() => {
    if (!currentPhage) return null;
    return getPhageModel(currentPhage.slug ?? 'lambda');
  }, [currentPhage?.slug]);

  // Animation loop
  useEffect(() => {
    if (!show3DModel || !model || paused) return;

    const interval = setInterval(() => {
      setAnimState(prev => updateAnimation(prev, 1, speed));
    }, 50); // ~20 FPS

    return () => clearInterval(interval);
  }, [show3DModel, model, paused, speed]);

  // Render frame when animation state changes
  useEffect(() => {
    if (!model) {
      setFrameLines([]);
      return;
    }

    const frame = renderModel(
      model,
      { rx: animState.rx, ry: animState.ry, rz: animState.rz },
      { width: width - 2, height: height - 3 }
    );

    setFrameLines(frame.lines);
  }, [model, animState, width, height]);

  if (!show3DModel) {
    return <></>;
  }

  return (
    <Box
      flexDirection="column"
      width={width}
      borderStyle="single"
      borderColor={colors.border}
    >
      {/* Title */}
      <Box paddingX={1} justifyContent="space-between">
        <Text color={colors.primary} bold>3D Model</Text>
        <Text color={colors.textDim}>
          {paused ? '⏸' : '▶'}
        </Text>
      </Box>

      {/* Model render */}
      <Box flexDirection="column" paddingX={0}>
        {model ? (
          frameLines.map((line, i) => (
            <Text key={i} color={colors.accent}>
              {line.padEnd(width - 2)}
            </Text>
          ))
        ) : (
          <Box
            height={height - 3}
            alignItems="center"
            justifyContent="center"
          >
            <Text color={colors.textDim}>No model</Text>
          </Box>
        )}
      </Box>

      {/* Model name */}
      {model && (
        <Box paddingX={1} justifyContent="center">
          <Text color={colors.textDim} dimColor>
            {model.name}
          </Text>
        </Box>
      )}
    </Box>
  );
}
