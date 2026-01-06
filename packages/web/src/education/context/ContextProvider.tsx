/**
 * ContextProvider.tsx - React Context for Context-Aware Help System
 *
 * Provides centralized state management for the context help system:
 * - Tracks which context topic is currently active
 * - Manages panel open/close state
 * - Provides showContext() function for triggering help
 * - Auto-dismisses on navigation changes
 *
 * Part of: phage_explorer-vs9k (Pillar 5: Context-Aware Help System)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useBeginnerModeEnabled } from '@phage-explorer/state';
import { getOverlayContext, getGeneProductContext, getAnalysisContext } from '../contextMapping';
import type { GlossaryId } from '../glossary/terms';

/**
 * Content structure for a context help entry
 */
export interface ContextHelpContent {
  /** Display title for the help panel */
  heading: string;
  /** Short 1-2 sentence summary */
  summary: string;
  /** Glossary term IDs for "Key concepts" section */
  glossaryTerms: GlossaryId[];
  /** Optional module IDs to link to */
  relatedModules?: string[];
  /** Optional tips for the user */
  tips?: string[];
}

/**
 * Context help state interface
 */
export interface ContextHelpState {
  /** Whether context help is currently visible */
  isOpen: boolean;
  /** The active topic ID (key into context mapping) */
  activeTopic: string | null;
  /** The resolved content for the active topic */
  content: ContextHelpContent | null;
  /** Show context help for a specific topic */
  showContext: (topicId: string) => void;
  /** Hide the context help panel */
  hideContext: () => void;
  /** Toggle the context help panel */
  toggleContext: (topicId: string) => void;
  /** Whether beginner mode is enabled (context help respects this) */
  isBeginnerMode: boolean;
}

const defaultState: ContextHelpState = {
  isOpen: false,
  activeTopic: null,
  content: null,
  showContext: () => {},
  hideContext: () => {},
  toggleContext: () => {},
  isBeginnerMode: false,
};

const ContextHelpContext = createContext<ContextHelpState>(defaultState);

/**
 * Resolve a topic ID to its content from the context mapping
 */
function resolveTopicContent(topicId: string): ContextHelpContent | null {
  // Try overlay context first (most common)
  const overlayContent = getOverlayContext(topicId);
  if (overlayContent) {
    return {
      heading: overlayContent.heading,
      summary: overlayContent.summary,
      glossaryTerms: overlayContent.glossary,
      relatedModules: overlayContent.modules,
      tips: overlayContent.tips,
    };
  }

  // Try gene product context
  const geneContent = getGeneProductContext(topicId);
  if (geneContent) {
    return {
      heading: geneContent.heading,
      summary: geneContent.summary,
      glossaryTerms: geneContent.glossary,
      relatedModules: geneContent.modules,
      tips: geneContent.tips,
    };
  }

  // Try analysis context
  const analysisContent = getAnalysisContext(topicId);
  if (analysisContent) {
    return {
      heading: analysisContent.heading,
      summary: analysisContent.summary,
      glossaryTerms: analysisContent.glossary,
      relatedModules: analysisContent.modules,
      tips: analysisContent.tips,
    };
  }

  return null;
}

export interface ContextProviderProps {
  children: ReactNode;
  /** Auto-dismiss delay in ms (0 to disable) */
  autoDismissDelay?: number;
}

/**
 * Context Provider for the help system
 *
 * Usage:
 * ```tsx
 * <ContextProvider>
 *   <App />
 * </ContextProvider>
 * ```
 *
 * Then in any component:
 * ```tsx
 * const { showContext } = useContextHelp();
 * <InfoButton onClick={() => showContext('gc-skew')} />
 * ```
 */
export function ContextProvider({
  children,
  autoDismissDelay = 0,
}: ContextProviderProps): React.ReactElement {
  const isBeginnerMode = useBeginnerModeEnabled();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [content, setContent] = useState<ContextHelpContent | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  // Show context for a topic
  const showContext = useCallback(
    (topicId: string) => {
      // Only show context if beginner mode is enabled
      if (!isBeginnerMode) return;

      clearHideTimer();
      const resolved = resolveTopicContent(topicId);
      if (resolved) {
        setActiveTopic(topicId);
        setContent(resolved);
        setIsOpen(true);
      }
    },
    [isBeginnerMode, clearHideTimer]
  );

  // Hide context panel
  const hideContext = useCallback(() => {
    setIsOpen(false);
    // Keep topic/content briefly for fade-out animation
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setActiveTopic(null);
      setContent(null);
      hideTimerRef.current = null;
    }, 300);
  }, [clearHideTimer]);

  // Toggle context (show if different topic, hide if same)
  const toggleContext = useCallback(
    (topicId: string) => {
      if (isOpen && activeTopic === topicId) {
        hideContext();
      } else {
        showContext(topicId);
      }
    },
    [isOpen, activeTopic, showContext, hideContext]
  );

  // Auto-dismiss after delay if configured
  useEffect(() => {
    if (!isOpen || autoDismissDelay <= 0) return;

    const timer = setTimeout(hideContext, autoDismissDelay);
    return () => clearTimeout(timer);
  }, [isOpen, autoDismissDelay, hideContext]);

  // Close panel when beginner mode is disabled
  useEffect(() => {
    if (!isBeginnerMode && isOpen) {
      hideContext();
    }
  }, [isBeginnerMode, isOpen, hideContext]);

  useEffect(() => {
    return () => {
      clearHideTimer();
    };
  }, [clearHideTimer]);

  const value = useMemo<ContextHelpState>(
    () => ({
      isOpen,
      activeTopic,
      content,
      showContext,
      hideContext,
      toggleContext,
      isBeginnerMode,
    }),
    [isOpen, activeTopic, content, showContext, hideContext, toggleContext, isBeginnerMode]
  );

  return (
    <ContextHelpContext.Provider value={value}>{children}</ContextHelpContext.Provider>
  );
}

/**
 * Hook to access context help state and actions
 *
 * Usage:
 * ```tsx
 * const { showContext, isOpen, content, hideContext } = useContextHelp();
 * ```
 */
export function useContextHelp(): ContextHelpState {
  return useContext(ContextHelpContext);
}

export default ContextProvider;
