import React, { useMemo, useState } from 'react';
import { useGlossary } from '../hooks/useGlossary';
import { useContextTopic } from '../hooks/useBeginnerMode';
import type { GlossaryCategory } from './terms';

interface GlossaryPanelProps {
  onSelect?: (termId: string) => void;
}

export function GlossaryPanel({ onSelect }: GlossaryPanelProps): React.ReactElement {
  const { terms, categories, searchTerms, filterByCategory } = useGlossary();
  const contextTopic = useContextTopic();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'all'>('all');
  const [activeId, setActiveId] = useState<string | null>(contextTopic);

  const filtered = useMemo(() => {
    const base = category === 'all' ? terms : filterByCategory(category);
    if (!query.trim()) return base;
    return searchTerms(query);
  }, [category, terms, filterByCategory, query, searchTerms]);

  const active = filtered.find((t) => t.id === activeId) ?? filtered[0];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 280px) 1fr',
        gap: '0.75rem',
        height: '100%',
        minHeight: 360,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            aria-label="Search glossary"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms"
            style={{
              flex: 1,
              padding: '0.45rem 0.65rem',
              borderRadius: 8,
              border: '1px solid var(--color-border-subtle)',
              background: 'var(--color-background-alt)',
              color: 'var(--color-text)',
            }}
          />
          <select
            aria-label="Filter glossary category"
            value={category}
            onChange={(e) => setCategory(e.target.value as GlossaryCategory | 'all')}
            style={{
              padding: '0.45rem 0.65rem',
              borderRadius: 8,
              border: '1px solid var(--color-border-subtle)',
              background: 'var(--color-background-alt)',
              color: 'var(--color-text)',
            }}
          >
            <option value="all">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 8,
            overflow: 'hidden',
            flex: 1,
            minHeight: 220,
          }}
        >
          <div
            style={{
              maxHeight: '100%',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {filtered.map((term) => {
              const isActive = active?.id === term.id;
              return (
                <button
                  key={term.id}
                  onClick={() => {
                    setActiveId(term.id);
                    onSelect?.(term.id);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '0.55rem 0.75rem',
                    background: isActive ? 'var(--color-background-hover)' : 'transparent',
                    color: 'var(--color-text)',
                    border: 'none',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{term.term}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{term.shortDef}</div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>No terms found</div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 10,
          padding: '0.75rem 1rem',
          background: 'var(--color-background-alt)',
          minHeight: 240,
        }}
      >
        {active ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  {active.category}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{active.term}</div>
              </div>
            </div>
            <div style={{ marginTop: 8, lineHeight: 1.5, color: 'var(--color-text)' }}>{active.longDef}</div>
            {active.related?.length ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Related</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {active.related.map((rel) => (
                    <span
                      key={rel}
                      style={{
                        fontSize: '0.85rem',
                        padding: '4px 8px',
                        borderRadius: 8,
                        background: 'rgba(34, 211, 238, 0.12)',
                        color: '#22d3ee',
                      }}
                    >
                      {rel}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div style={{ color: 'var(--color-text-muted)' }}>Select a term to view its definition.</div>
        )}
      </div>
    </div>
  );
}

export default GlossaryPanel;

