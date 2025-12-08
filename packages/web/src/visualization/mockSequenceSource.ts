import type { SequenceSource, SequenceWindow } from './types';

/**
 * Simple in-memory sequence provider for renderer bring-up and demos.
 * Not used in production; replace with sql.js-backed implementation.
 */
export class MockSequenceSource implements SequenceSource {
  constructor(private sequence: string) {}

  async getWindow(request: { start: number; end: number }): Promise<SequenceWindow> {
    const start = Math.max(0, request.start);
    const end = Math.min(this.sequence.length, request.end);
    const chunk = this.sequence.slice(start, end);
    const rows: string[] = [];
    const rowWidth = 80;
    for (let i = 0; i < chunk.length; i += rowWidth) {
      rows.push(chunk.slice(i, i + rowWidth));
    }
    return { start, end, rows };
  }

  async totalLength(): Promise<number> {
    return this.sequence.length;
  }
}

