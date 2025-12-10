import type { CSSProperties } from 'react';
import React from 'react';
import type { GlossaryId } from '../glossary/terms';
import { useGlossary } from '../hooks/useGlossary';

interface TermTooltipProps {
  termId: GlossaryId;
  style?: CSSProperties;
}

export function TermTooltip({ termId, style }: TermTooltipProps): React.ReactElement | null {
  const { getTerm, relatedTerms } = useGlossary();
  const entry = getTerm(termId);
  if (!entry) return null;

  const related = relatedTerms(termId);

  return (
    <div
      role="tooltip"
      style={{
        maxWidth: 320,
        padding: '0.5rem 0.75rem',
        borderRadius: 8,
        background: 'rgba(10, 10, 15, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#f0f0f8',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        ...style,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{entry.term}</div>
      <div style={{ fontSize: '0.9rem', color: '#d1d5db' }}>{entry.shortDef}</div>
      {related.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 2 }}>See also</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {related.map((rel) => (
              <span
                key={rel.id}
                style={{
                  fontSize: '0.8rem',
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: 'rgba(34, 211, 238, 0.12)',
                  color: '#22d3ee',
                }}
              >
                {rel.term}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TermTooltip;

