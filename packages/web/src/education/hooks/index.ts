/**
 * Education module hooks
 *
 * Exports hooks for beginner mode and educational features
 */

export {
  useBeginnerMode,
  useBeginnerModeInit,
  useContextTopic,
  type BeginnerModeContext,
} from './useBeginnerMode';

export { useGlossary, type UseGlossaryResult } from './useGlossary';

export { useContextHelp, type ContextHelpState, type ContextHelpContent } from './useContextHelp';
