/// <reference lib="webworker" />

import type { GeneInfo, CRISPRAnalysisResult } from '@phage-explorer/core';
import { analyzeCRISPRPressure } from '@phage-explorer/core';

interface CRISPRWorkerRequest {
  sequence: string;
  genes: GeneInfo[];
}

interface CRISPRWorkerResponse {
  ok: boolean;
  result?: CRISPRAnalysisResult;
  error?: string;
}

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<CRISPRWorkerRequest>) => {
  const { sequence, genes } = event.data;
  try {
    if (!sequence || sequence.length === 0) {
      ctx.postMessage({
        ok: false,
        error: 'No sequence provided',
      } satisfies CRISPRWorkerResponse);
      return;
    }

    const result = analyzeCRISPRPressure(sequence, genes);

    ctx.postMessage({
      ok: true,
      result,
    } satisfies CRISPRWorkerResponse);
  } catch (error) {
    ctx.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : 'CRISPR analysis failed',
    } satisfies CRISPRWorkerResponse);
  }
};

export {};

