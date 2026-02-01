/**
 * Explorer Page
 *
 * Main phage exploration interface with Ciechanowski-inspired design
 * Clean, content-first, explorable
 */

import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { MinimalShell, MinimalHeader } from '../components/layout/MinimalShell';
import { ExplorableSequence } from '../components/ExplorableSequence';
import { PhageViewer } from '../components/PhageViewer';
import { useDatabase } from '../hooks/useDatabase';
import { usePhageStore } from '../store';
import type { GeneInfo } from '@phage-explorer/core';

// Lazy load the 3D viewer for performance
const WebGPUViewer = lazy(() => import('../components/WebGPUViewer'));

interface PhageListItemProps {
  phage: { id: number; name: string; family?: string | null; genomeLength?: number | null };
  isActive: boolean;
  onClick: () => void;
}

const PhageListItem: React.FC<PhageListItemProps> = ({ phage, isActive, onClick }) => (
  <button
    className={`phage-list-item ${isActive ? 'phage-list-item--active' : ''}`}
    onClick={onClick}
    type="button"
  >
    <span className="phage-list-item__name">{phage.name}</span>
    <span className="phage-list-item__meta">
      {phage.family ?? 'Unknown'} · {((phage.genomeLength ?? 0) / 1000).toFixed(1)}kb
    </span>
  </button>
);

export const Explorer: React.FC = () => {
  const { repository, isLoading: dbLoading, progress, error: dbError } = useDatabase({ autoLoad: true });

  const phages = usePhageStore((s) => s.phages);
  const setPhages = usePhageStore((s) => s.setPhages);
  const currentPhageIndex = usePhageStore((s) => s.currentPhageIndex);
  const setCurrentPhageIndex = usePhageStore((s) => s.setCurrentPhageIndex);
  const currentPhage = usePhageStore((s) => s.currentPhage);
  const setCurrentPhage = usePhageStore((s) => s.setCurrentPhage);

  const [selectedGene, setSelectedGene] = useState<GeneInfo | null>(null);
  const [sequence, setSequence] = useState('');
  const [isLoadingPhage, setIsLoadingPhage] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showViewer3D, setShowViewer3D] = useState(false);

  // Load phage list on mount
  useEffect(() => {
    if (!repository) return;

    repository.listPhages().then((list) => {
      setPhages(list);
      if (list.length > 0 && !currentPhage) {
        loadPhage(0);
      }
    });
  }, [repository, setPhages, currentPhage]);

  // Load a specific phage
  const loadPhage = useCallback(async (index: number) => {
    if (!repository) return;

    setIsLoadingPhage(true);
    setSelectedGene(null);

    try {
      const phage = await repository.getPhageByIndex(index);
      if (!phage) return;

      setCurrentPhageIndex(index);
      setCurrentPhage(phage);

      // Load sequence
      const seq = await repository.getSequenceWindow(phage.id, 0, phage.genomeLength ?? 0);
      setSequence(seq);
    } catch (err) {
      console.error('Failed to load phage:', err);
    } finally {
      setIsLoadingPhage(false);
    }
  }, [repository, setCurrentPhageIndex, setCurrentPhage]);

  // Handle gene selection
  const handleGeneSelect = useCallback((gene: GeneInfo | null) => {
    setSelectedGene(gene);

    // Check if gene has PDB structure
    if (gene) {
      // For now, just toggle the 3D viewer
      setShowViewer3D(true);
    }
  }, []);

  // Navigate phages
  const navigatePhage = useCallback((direction: 'prev' | 'next') => {
    if (phages.length === 0) return;
    const newIndex = direction === 'next'
      ? (currentPhageIndex + 1) % phages.length
      : (currentPhageIndex - 1 + phages.length) % phages.length;
    loadPhage(newIndex);
  }, [currentPhageIndex, loadPhage, phages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'j') {
        navigatePhage('prev');
      } else if (e.key === 'ArrowRight' || e.key === 'k') {
        navigatePhage('next');
      } else if (e.key === 'Escape') {
        setSelectedGene(null);
        setShowViewer3D(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigatePhage]);

  // Loading state
  if (dbLoading && !repository) {
    return (
      <MinimalShell
        header={<MinimalHeader title="Phage Explorer" subtitle="Loading..." />}
      >
        <div className="explorer-loading">
          <div className="explorer-loading__spinner" />
          <p>{progress?.stage ?? 'Initializing...'}</p>
          {progress && (
            <div className="explorer-loading__progress">
              <div
                className="explorer-loading__bar"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          )}
        </div>
      </MinimalShell>
    );
  }

  // Error state
  if (dbError) {
    return (
      <MinimalShell
        header={<MinimalHeader title="Phage Explorer" />}
      >
        <div className="explorer-error">
          <h2>Failed to load database</h2>
          <p>{dbError}</p>
          <button className="btn btn--primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </MinimalShell>
    );
  }

  return (
    <MinimalShell
      header={
        <MinimalHeader
          title="Phage Explorer"
          subtitle={currentPhage?.name}
          actions={
            <>
              <button
                className="btn btn--ghost"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              >
                {sidebarOpen ? '◀' : '▶'}
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => navigatePhage('prev')}
                title="Previous phage (←)"
              >
                ←
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => navigatePhage('next')}
                title="Next phage (→)"
              >
                →
              </button>
            </>
          }
        />
      }
    >
      <div className={`explorer ${sidebarOpen ? 'explorer--with-sidebar' : ''}`}>
        {/* Sidebar - Phage list */}
        {sidebarOpen && (
          <aside className="explorer__sidebar">
            <div className="explorer__sidebar-header">
              <h3>Phages</h3>
              <span className="explorer__count">{phages.length}</span>
            </div>
            <div className="explorer__sidebar-list">
              {phages.map((phage, index) => (
                <PhageListItem
                  key={phage.id}
                  phage={phage}
                  isActive={index === currentPhageIndex}
                  onClick={() => loadPhage(index)}
                />
              ))}
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="explorer__main">
          {currentPhage ? (
            <>
              {/* Phage overview */}
              <section className="explorer__section">
                <PhageViewer
                  phage={currentPhage}
                  sequence={sequence}
                  onGeneSelect={handleGeneSelect}
                  selectedGene={selectedGene}
                />
              </section>

              {/* Sequence explorer */}
              <section className="explorer__section">
                <h2 className="explorer__section-title">Genome Sequence</h2>
                <p className="explorer__section-desc">
                  Explore the {sequence.length.toLocaleString()} bp genome.
                  Scroll to navigate, hover to inspect. Ctrl+scroll to zoom.
                </p>
                <ExplorableSequence
                  sequence={sequence}
                  genes={currentPhage.genes}
                  onGeneSelect={handleGeneSelect}
                />
              </section>

              {/* Selected gene details */}
              {selectedGene && (
                <section className="explorer__section explorer__gene-detail">
                  <div className="gene-detail">
                    <div className="gene-detail__header">
                      <div>
                        <h3 className="gene-detail__name">
                          {selectedGene.name ?? selectedGene.locusTag ?? 'Unknown Gene'}
                        </h3>
                        <p className="gene-detail__product">{selectedGene.product}</p>
                      </div>
                      <button
                        className="btn btn--ghost"
                        onClick={() => {
                          setSelectedGene(null);
                          setShowViewer3D(false);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="gene-detail__stats">
                      <div className="gene-detail__stat">
                        <span className="gene-detail__stat-label">Position</span>
                        <span className="gene-detail__stat-value">
                          {selectedGene.startPos?.toLocaleString()} – {selectedGene.endPos?.toLocaleString()} bp
                        </span>
                      </div>
                      <div className="gene-detail__stat">
                        <span className="gene-detail__stat-label">Length</span>
                        <span className="gene-detail__stat-value">
                          {((selectedGene.endPos ?? 0) - (selectedGene.startPos ?? 0)).toLocaleString()} bp
                        </span>
                      </div>
                      <div className="gene-detail__stat">
                        <span className="gene-detail__stat-label">Strand</span>
                        <span className="gene-detail__stat-value">
                          {selectedGene.strand === '+' ? 'Forward (+)' : 'Reverse (-)'}
                        </span>
                      </div>
                      <div className="gene-detail__stat">
                        <span className="gene-detail__stat-label">Type</span>
                        <span className="gene-detail__stat-value">
                          {selectedGene.type ?? 'CDS'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 3D Structure viewer */}
              {showViewer3D && (
                <section className="explorer__section">
                  <h2 className="explorer__section-title">3D Structure</h2>
                  <p className="explorer__section-desc">
                    Interactive molecular visualization. Drag to rotate, scroll to zoom.
                  </p>
                  <Suspense fallback={<div className="explorer__loading-inline">Loading 3D viewer...</div>}>
                    <WebGPUViewer
                      representation="cartoon"
                      colorScheme="chain"
                    />
                  </Suspense>
                </section>
              )}
            </>
          ) : (
            <div className="explorer__empty">
              <div className="explorer__empty-icon">🧬</div>
              <h2>Welcome to Phage Explorer</h2>
              <p>Select a phage from the sidebar to begin exploring.</p>
            </div>
          )}
        </main>
      </div>

      <style>{explorerStyles}</style>
    </MinimalShell>
  );
};

const explorerStyles = `
  .explorer {
    display: flex;
    gap: var(--space-6, 1.5rem);
    min-height: calc(100vh - 64px - 6rem);
  }

  .explorer--with-sidebar .explorer__main {
    flex: 1;
    min-width: 0;
  }

  .explorer__sidebar {
    width: 280px;
    flex-shrink: 0;
    background: var(--c-bg-elevated, #18181b);
    border: 1px solid var(--c-border, #27272a);
    border-radius: var(--radius-lg, 8px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .explorer__sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4, 1rem);
    border-bottom: 1px solid var(--c-border-subtle, #1f1f23);
  }

  .explorer__sidebar-header h3 {
    font-size: var(--text-sm, 0.875rem);
    font-weight: var(--font-medium, 500);
    color: var(--c-text, #fafafa);
    margin: 0;
  }

  .explorer__count {
    font-size: var(--text-xs, 0.75rem);
    color: var(--c-text-muted, #71717a);
    background: var(--c-bg, #111113);
    padding: 2px 8px;
    border-radius: var(--radius-full, 9999px);
  }

  .explorer__sidebar-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-2, 0.5rem);
  }

  .phage-list-item {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: var(--space-3, 0.75rem);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-md, 4px);
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
  }

  .phage-list-item:hover {
    background: var(--c-bg-hover, #1f1f23);
  }

  .phage-list-item--active {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .phage-list-item__name {
    font-size: var(--text-sm, 0.875rem);
    font-weight: var(--font-medium, 500);
    color: var(--c-text, #fafafa);
  }

  .phage-list-item__meta {
    font-size: var(--text-xs, 0.75rem);
    color: var(--c-text-muted, #71717a);
  }

  .explorer__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-8, 2rem);
  }

  .explorer__section {
    /* Natural flow */
  }

  .explorer__section-title {
    font-size: var(--text-xl, 1.25rem);
    font-weight: var(--font-semibold, 600);
    color: var(--c-text, #fafafa);
    margin: 0 0 var(--space-2, 0.5rem) 0;
  }

  .explorer__section-desc {
    font-size: var(--text-sm, 0.875rem);
    color: var(--c-text-muted, #71717a);
    margin: 0 0 var(--space-4, 1rem) 0;
    max-width: 65ch;
  }

  .explorer__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
  }

  .explorer__empty-icon {
    font-size: 64px;
    margin-bottom: var(--space-4, 1rem);
    opacity: 0.5;
  }

  .explorer__empty h2 {
    font-size: var(--text-2xl, 1.5rem);
    color: var(--c-text, #fafafa);
    margin: 0 0 var(--space-2, 0.5rem) 0;
  }

  .explorer__empty p {
    color: var(--c-text-muted, #71717a);
    margin: 0;
  }

  .explorer__loading-inline {
    padding: var(--space-8, 2rem);
    text-align: center;
    color: var(--c-text-muted, #71717a);
  }

  .explorer-loading,
  .explorer-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    gap: var(--space-4, 1rem);
  }

  .explorer-loading__spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--c-border, #27272a);
    border-top-color: var(--c-accent, #3b82f6);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .explorer-loading__progress {
    width: 200px;
    height: 4px;
    background: var(--c-border, #27272a);
    border-radius: var(--radius-full, 9999px);
    overflow: hidden;
  }

  .explorer-loading__bar {
    height: 100%;
    background: var(--c-accent, #3b82f6);
    transition: width 0.3s ease;
  }

  .explorer-error h2 {
    color: var(--c-error, #ef4444);
    margin: 0;
  }

  .explorer-error p {
    color: var(--c-text-muted, #71717a);
    margin: 0;
  }

  .gene-detail {
    background: var(--c-bg-elevated, #18181b);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: var(--radius-lg, 8px);
    padding: var(--space-5, 1.25rem);
  }

  .gene-detail__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4, 1rem);
    margin-bottom: var(--space-4, 1rem);
  }

  .gene-detail__name {
    font-size: var(--text-lg, 1.125rem);
    font-weight: var(--font-semibold, 600);
    color: var(--c-text, #fafafa);
    margin: 0 0 var(--space-1, 0.25rem) 0;
  }

  .gene-detail__product {
    color: var(--c-text-secondary, #a1a1aa);
    margin: 0;
  }

  .gene-detail__stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-6, 1.5rem);
  }

  .gene-detail__stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .gene-detail__stat-label {
    font-size: var(--text-xs, 0.75rem);
    color: var(--c-text-muted, #71717a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .gene-detail__stat-value {
    font-family: var(--font-mono);
    font-size: var(--text-sm, 0.875rem);
    color: var(--c-text, #fafafa);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .explorer {
      flex-direction: column;
    }

    .explorer__sidebar {
      width: 100%;
      max-height: 200px;
    }

    .explorer__sidebar-list {
      display: flex;
      flex-wrap: nowrap;
      overflow-x: auto;
      padding: var(--space-2, 0.5rem);
      gap: var(--space-2, 0.5rem);
    }

    .phage-list-item {
      flex-shrink: 0;
      min-width: 150px;
    }
  }
`;

export default Explorer;
