/**
 * useContextHelp - Hook for context-aware help system
 *
 * Provides access to the context help panel state and actions.
 * This is a convenience re-export from the ContextProvider.
 *
 * Usage:
 * ```tsx
 * const { showContext, isOpen, content, hideContext } = useContextHelp();
 *
 * // Show help for a specific topic
 * <button onClick={() => showContext('gc-skew')}>?</button>
 *
 * // Conditionally render help panel
 * {isOpen && content && (
 *   <HelpPanel heading={content.heading} summary={content.summary} />
 * )}
 * ```
 *
 * Part of: phage_explorer-vs9k (Pillar 5: Context-Aware Help System)
 */

export { useContextHelp, type ContextHelpState, type ContextHelpContent } from '../context';
