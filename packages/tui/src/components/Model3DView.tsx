import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
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

// Memoized inner component to prevent unnecessary re-renders from parent
const Model3DViewInner = memo(function Model3DViewInner({
  width = 24,
  height = 16,
}: Model3DViewProps): React.ReactElement {
  const show3DModel = usePhageStore(s => s.show3DModel);
  const paused = usePhageStore(s => s.model3DPaused);
  const speed = usePhageStore(s => s.model3DSpeed);
  const currentPhage = usePhageStore(s => s.currentPhage);
  const theme = usePhageStore(s => s.currentTheme);

  // Use ref for animation state to avoid triggering re-renders on every tick
  const animStateRef = useRef<AnimationState>(createAnimationState());
  const [frameLines, setFrameLines] = useState<string[]>([]);
  const [, forceUpdate] = useState(0);

  const colors = theme.colors;

  // Get the appropriate model
  const model = React.useMemo(() => {
    if (!currentPhage) return null;
    return getPhageModel(currentPhage.slug ?? 'lambda');
  }, [currentPhage?.slug]);

  // Animation loop - uses ref to avoid re-creating interval on state changes
  // Updates at 10 FPS (100ms) to reduce flickering while maintaining smooth animation
  useEffect(() => {
    if (!show3DModel || !model || paused) return;

    const interval = setInterval(() => {
      // Update animation state in ref (no React state update)
      animStateRef.current = updateAnimation(animStateRef.current, 1, speed);

      // Render the new frame
      const frame = renderModel(
        model,
        { rx: animStateRef.current.rx, ry: animStateRef.current.ry, rz: animStateRef.current.rz },
        { width: width - 2, height: height - 3 }
      );

      // Only update state with the rendered lines
      setFrameLines(frame.lines);
    }, 100); // 10 FPS - smoother than 20 FPS with less flickering

    return () => clearInterval(interval);
  }, [show3DModel, model, paused, speed, width, height]);

  // Initial render when model changes
  useEffect(() => {
    if (!model) {
      setFrameLines([]);
      return;
    }

    const frame = renderModel(
      model,
      { rx: animStateRef.current.rx, ry: animStateRef.current.ry, rz: animStateRef.current.rz },
      { width: width - 2, height: height - 3 }
    );

    setFrameLines(frame.lines);
  }, [model, width, height]);

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
});

// Wrapper component that passes props
export function Model3DView(props: Model3DViewProps): React.ReactElement {
  return <Model3DViewInner {...props} />;
}
