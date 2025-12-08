/**
 * Temporary mock sequence source for web exports until the full
 * browser data pipeline is wired. This prevents export features from
 * failing silently when no live genome is loaded.
 */

const MOCK_SEQUENCE =
  'ATGCGTACGTTAGCTAGCTAGCTAGGCTAGCTAGCTAGGCTAGCTAGCTAGCTGGGCTAGCTAGCTAGCTGATCGATCGATCGATCGATCGTAGCTAGCTAGCTA';

export function getMockSequence(): string {
  return MOCK_SEQUENCE;
}

export function hasMockSequence(): boolean {
  return MOCK_SEQUENCE.length > 0;
}
