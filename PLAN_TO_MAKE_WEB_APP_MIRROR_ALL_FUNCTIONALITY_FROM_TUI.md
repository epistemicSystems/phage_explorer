# Plan: Web App Feature Parity with TUI

> **Goal**: Make the web application a complete replica of the TUI with all features, but with superior visualizations using Canvas/WebGL instead of ASCII art.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Architecture Overview](#3-architecture-overview)
4. [Implementation Phases](#4-implementation-phases)
5. [Component Mapping: TUI → Web](#5-component-mapping-tui--web)
6. [Detailed Implementation Tasks](#6-detailed-implementation-tasks)
7. [Visualization Upgrades](#7-visualization-upgrades)
8. [Database Integration](#8-database-integration)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment Considerations](#10-deployment-considerations)

---

## 1. Executive Summary

### What the TUI Has (1100+ lines in App.tsx alone)

The TUI is a sophisticated genome exploration application with:

- **31 overlay types** for analysis, visualization, and navigation
- **6 simulation engines** (lysogeny, ribosome traffic, plaque formation, evolution, infection kinetics, packaging motor)
- **Vim-style keyboard navigation** with modal modes (NORMAL, SEARCH, COMMAND)
- **F-key shortcuts** for quick access to major features
- **Progressive disclosure** (novice → intermediate → power user tiers)
- **Real-time genome analysis** with incremental loading
- **Genome comparison** with multi-metric analysis
- **3D ASCII model rendering** with fullscreen mode

### What the Web Package Already Has

The web package has excellent infrastructure (~60+ components/utilities):

- ✅ AppShell, Header, Footer layout system
- ✅ OverlayProvider/OverlayManager (sophisticated modal management)
- ✅ KeyboardManager (vim-style modal keyboard system)
- ✅ SequenceGridRenderer (canvas-based, virtual scrolling)
- ✅ GlyphAtlas for font rendering
- ✅ ComputeOrchestrator (web worker pool management)
- ✅ 8+ analysis overlays (GCSkew, Complexity, Bendability, Promoter, Repeats, Kmer, Module, TranscriptionFlow)
- ✅ 5 simulation visualizers (Lysogeny, Plaque, Ribosome, Evolution + TimeControls)
- ✅ useDatabase hook with progress tracking
- ✅ Theme system with CSS variable injection
- ✅ Sparkline/Histogram chart components

### What's Missing

- ❌ **Integrated App.tsx** - Currently a static landing page
- ❌ **PhageList component** - Browse/select phages from database
- ❌ **SequenceGrid integration** - Renderer exists but not wired up
- ❌ **GeneMap visualization** - Canvas component exists but incomplete
- ❌ **3D Model View** - No WebGL implementation
- ❌ **~20 analysis overlays** - Menu references them but components missing
- ❌ **Comparison View** - Store supports it but no UI
- ❌ **Search Overlay** - Not implemented
- ❌ **Data flow** - Workers exist but not connected to UI

---

## 2. Current State Analysis

### 2.1 TUI Components (49 files in packages/tui/src/components/)

| Component | Purpose | Web Equivalent |
|-----------|---------|----------------|
| `App.tsx` | Main orchestrator (1100 lines) | ❌ Needs full rewrite |
| `Header.tsx` | Top bar with phage info | ✅ Exists (needs data binding) |
| `Footer.tsx` | Keyboard hints, status | ✅ Exists (needs data binding) |
| `PhageList.tsx` | Sidebar phage browser | ❌ Missing |
| `SequenceGrid.tsx` | ASCII sequence display | ⚠️ Canvas renderer exists, needs integration |
| `GeneMap.tsx` | Gene visualization bar | ⚠️ Canvas component exists, incomplete |
| `Model3DView.tsx` | ASCII 3D structure | ❌ Missing (needs WebGL) |
| `HelpOverlay.tsx` | Keyboard reference | ✅ Exists |
| `SearchOverlay.tsx` | Phage search | ❌ Missing |
| `ComparisonOverlay.tsx` | Side-by-side comparison | ❌ Missing |
| `CommandPalette.tsx` | Fuzzy command search | ✅ Exists |
| `AAKeyOverlay.tsx` | Amino acid legend | ❌ Missing |
| `AALegend.tsx` | Compact AA colors | ❌ Missing |
| **Analysis Overlays** | | |
| `GCOverlay.tsx` | GC skew visualization | ✅ GCSkewOverlay.tsx |
| `SequenceComplexityOverlay.tsx` | Entropy analysis | ✅ ComplexityOverlay.tsx |
| `BendabilityOverlay.tsx` | DNA bendability | ✅ Exists |
| `PromoterOverlay.tsx` | Promoter sites | ✅ Exists |
| `RepeatOverlay.tsx` | Repeat finder | ✅ RepeatsOverlay.tsx |
| `KmerAnomalyOverlay.tsx` | K-mer anomalies | ✅ Exists |
| `ModuleOverlay.tsx` | Functional modules | ✅ Exists |
| `TranscriptionFlowOverlay.tsx` | Expression program | ✅ Exists |
| `PackagingPressureOverlay.tsx` | Packaging constraints | ❌ Missing |
| `VirionStabilityOverlay.tsx` | Structural stability | ❌ Missing |
| `PhasePortraitOverlay.tsx` | AA property PCA | ❌ Missing |
| `BiasDecompositionOverlay.tsx` | Codon bias PCA | ❌ Missing |
| `HGTOverlay.tsx` | Horizontal gene transfer | ❌ Missing |
| `CRISPROverlay.tsx` | CRISPR spacers | ❌ Missing |
| `SyntenyOverlay.tsx` | Gene order conservation | ❌ Missing |
| `TropismOverlay.tsx` | Receptor predictions | ❌ Missing |
| `StructureConstraintOverlay.tsx` | Structural constraints | ❌ Missing |
| `NonBDNAOverlay.tsx` | G4, Z-DNA, cruciform | ❌ Missing |
| `AnomalyOverlay.tsx` | Statistical anomalies | ❌ Missing |
| `DotPlotOverlay.tsx` | Self-similarity | ❌ Missing |
| `CGROverlay.tsx` | Chaos game representation | ❌ Missing |
| `HilbertOverlay.tsx` | Hilbert curve | ❌ Missing |
| `GelOverlay.tsx` | Gel electrophoresis | ❌ Missing |
| `SelectionPressureOverlay.tsx` | dN/dS analysis | ⚠️ Exists but may be incomplete |
| **Simulation** | | |
| `SimulationHubOverlay.tsx` | Simulation launcher | ✅ SimulationHub.tsx |
| `SimulationView.tsx` | Active simulation view | ❌ Missing (visualizers exist) |
| `MenuOverlays.tsx` | Analysis menu | ✅ AnalysisMenu.tsx |
| `FoldQuickview.tsx` | Protein fold preview | ❌ Missing |

### 2.2 Shared Package Availability

| Package | TUI Usage | Web Availability |
|---------|-----------|------------------|
| `@phage-explorer/state` | Full store | ✅ Can use directly |
| `@phage-explorer/core` | Analysis, themes, types | ✅ Can use directly |
| `@phage-explorer/comparison` | Genome comparison | ✅ Can use directly |
| `@phage-explorer/db-runtime` | SQLite access | ⚠️ Needs web adapter (sql.js) |

### 2.3 Web Package Hook Inventory

| Hook | Purpose | Status |
|------|---------|--------|
| `useDatabase()` | Load SQLite DB | ✅ Complete |
| `useTheme()` | Theme management | ✅ Complete |
| `useHotkey()` / `useHotkeys()` | Keyboard shortcuts | ✅ Complete |
| `useKeyboardMode()` | Modal keyboard | ✅ Complete |
| `usePendingSequence()` | Multi-key sequences | ✅ Complete |
| `useSimulation()` | Simulation control | ✅ Complete |
| `useSequenceGrid()` | Canvas grid control | ✅ Complete |
| `useReducedMotion()` | Accessibility | ✅ Complete |
| `useFileSystem()` | Local file access | ✅ Complete |
| `useCollaboration()` | Real-time collab | ⚠️ Stub only |

---

## 3. Architecture Overview

### 3.1 Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.tsx (Orchestrator)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────────────┐  ┌────────────────┐ │
│  │   Header    │  │    Main Content      │  │   Overlays     │ │
│  │  - Title    │  │  ┌────────┬────────┐ │  │  - Help        │ │
│  │  - Status   │  │  │Phage   │Sequence│ │  │  - Search      │ │
│  │  - Actions  │  │  │List    │Grid    │ │  │  - Analysis*31 │ │
│  └─────────────┘  │  │(Canvas)│(Canvas)│ │  │  - Comparison  │ │
│                   │  ├────────┴────────┤ │  │  - Simulations │ │
│                   │  │    Gene Map     │ │  │  - Command     │ │
│                   │  │    (Canvas)     │ │  └────────────────┘ │
│                   │  ├─────────────────┤ │                     │
│                   │  │   3D Model      │ │                     │
│                   │  │   (WebGL)       │ │                     │
│                   │  └─────────────────┘ │                     │
│  ┌─────────────┐  └──────────────────────┘                     │
│  │   Footer    │                                               │
│  │  - Hints    │                                               │
│  │  - Progress │                                               │
│  └─────────────┘                                               │
├─────────────────────────────────────────────────────────────────┤
│                     State Layer (Zustand)                       │
│  @phage-explorer/state + web-specific persistence               │
├─────────────────────────────────────────────────────────────────┤
│                     Data Layer                                  │
│  sql.js (SQLite in browser) + Web Workers for analysis          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
User Input (Keyboard/Mouse)
         │
         ▼
┌─────────────────┐
│ KeyboardManager │ (vim-style modal)
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Zustand Store  │◄────│ Analysis Workers │
│  (usePhageStore)│     │ (ComputeOrch.)   │
└────────┬────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ React Components│◄────│  sql.js Database │
│ (Overlays, Grid)│     │  (PhageRepo)     │
└────────┬────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐
│ Canvas/WebGL    │
│ Renderers       │
└─────────────────┘
```

---

## 4. Implementation Phases

### Phase 1: Core Infrastructure (Foundation)
**Estimated Complexity: Medium**

1. **Database Integration**
   - Create `WebPhageRepository` implementing `PhageRepository` interface
   - Use sql.js to load SQLite database in browser
   - Wire up `useDatabase()` hook to app lifecycle

2. **State Integration**
   - Connect `@phage-explorer/state` store to components
   - Merge web preferences store with main store
   - Set up persistence layer

3. **App.tsx Rewrite**
   - Create proper component structure (not landing page)
   - Implement layout with PhageList, SequenceGrid, GeneMap
   - Wire up keyboard manager
   - Connect to overlay system

### Phase 2: Core Views (Main Interface)
**Estimated Complexity: High**

1. **PhageList Component** (NEW)
   - Virtualized list of phages from database
   - Search/filter functionality
   - Keyboard navigation (j/k, arrow keys)
   - Current selection highlighting

2. **SequenceGrid Integration**
   - Wire SequenceGridRenderer to store
   - Implement scroll position sync
   - Add DNA/AA view mode toggle
   - Reading frame support
   - Diff mode highlighting

3. **GeneMap Enhancement**
   - Full gene visualization
   - Click-to-jump functionality
   - Current position indicator
   - Gene hover tooltips

4. **Header/Footer Data Binding**
   - Show current phage name, length, GC%
   - Display keyboard mode indicator
   - Show pending key sequences
   - Analysis progress indicator

### Phase 3: Analysis Overlays (Feature Parity)
**Estimated Complexity: High**

Create/complete these overlays with canvas-based visualizations:

**Tier 1 - Already Started (Complete them):**
- [x] GCSkewOverlay
- [x] ComplexityOverlay
- [x] BendabilityOverlay
- [x] PromoterOverlay
- [x] RepeatsOverlay
- [x] KmerAnomalyOverlay
- [x] ModuleOverlay
- [x] TranscriptionFlowOverlay

**Tier 2 - Missing (Create them):**
- [ ] PackagingPressureOverlay
- [ ] VirionStabilityOverlay
- [ ] PhasePortraitOverlay (PCA scatter plot)
- [ ] BiasDecompositionOverlay (PCA scatter plot)
- [ ] HGTOverlay (genomic islands)
- [ ] CRISPROverlay (spacer map)
- [ ] SyntenyOverlay (gene order blocks)
- [ ] TropismOverlay (receptor predictions)
- [ ] StructureConstraintOverlay
- [ ] NonBDNAOverlay (G-quadruplex, Z-DNA, cruciform)
- [ ] AnomalyOverlay (statistical outliers)
- [ ] DotPlotOverlay (self-similarity matrix)
- [ ] CGROverlay (Chaos Game Representation)
- [ ] HilbertOverlay (space-filling curve)
- [ ] GelOverlay (virtual gel electrophoresis)

**Supporting Components:**
- [ ] AAKeyOverlay (amino acid reference)
- [ ] AALegend (compact legend)
- [ ] SearchOverlay (phage search)

### Phase 4: Comparison System
**Estimated Complexity: High**

1. **ComparisonOverlay**
   - Phage A/B selection
   - Side-by-side sequence view
   - Tabbed results (summary, kmer, information, correlation, biological, genes)
   - Metric visualizations

2. **Diff Mode**
   - Highlight differences in SequenceGrid
   - Color-coded insertions/deletions
   - Statistics panel

### Phase 5: Simulations
**Estimated Complexity: Medium**

1. **SimulationView Integration**
   - Wire existing visualizers to workers
   - Real-time state updates
   - Parameter controls

2. **Complete Visualizers**
   - LysogenyVisualizer (CI/Cro concentrations)
   - RibosomeVisualizer (traffic flow)
   - PlaqueVisualizer (2D automata)
   - EvolutionVisualizer (phylogeny replay)

3. **Missing Simulations**
   - InfectionKineticsVisualizer
   - PackagingMotorVisualizer

### Phase 6: 3D Visualization
**Estimated Complexity: High**

1. **WebGL Model Viewer**
   - Three.js or raw WebGL implementation
   - Protein structure rendering
   - Rotation/zoom controls
   - Quality presets (low/medium/high/ultra)

2. **Fullscreen Mode**
   - Dedicated fullscreen view
   - Keyboard controls in fullscreen

### Phase 7: Polish & Optimization
**Estimated Complexity: Medium**

1. **Performance**
   - Virtual scrolling optimization
   - Worker load balancing
   - Memory management for large genomes

2. **Accessibility**
   - Screen reader support
   - Keyboard-only navigation
   - Reduced motion support

3. **Progressive Disclosure**
   - Novice → Intermediate → Power tiers
   - Timed promotion
   - Feature gating

---

## 5. Component Mapping: TUI → Web

### Detailed Component Mapping

```
TUI Component                    Web Implementation
─────────────────────────────────────────────────────────────
App.tsx (1100 lines)        →   App.tsx (orchestrator)
                                 ├── usePhageStore() integration
                                 ├── useDatabase() lifecycle
                                 ├── useInput() → useHotkeys()
                                 └── Overlay rendering

Header.tsx                  →   components/layout/Header.tsx
                                 ├── Add phage info display
                                 ├── Add mode indicator
                                 └── Wire to store

Footer.tsx                  →   components/layout/Footer.tsx
                                 ├── Add keyboard hints
                                 ├── Add progress indicator
                                 └── Wire to store

PhageList.tsx               →   components/PhageList.tsx (NEW)
                                 ├── Virtual list (react-window)
                                 ├── Keyboard navigation
                                 └── Search integration

SequenceGrid.tsx            →   visualization/SequenceGridRenderer
                                 ├── Already canvas-based
                                 ├── Wire to store scroll position
                                 └── Add diff highlighting

GeneMap.tsx                 →   components/GeneMapCanvas.tsx
                                 ├── Enhance with full features
                                 └── Add click navigation

Model3DView.tsx             →   components/Model3DView.tsx (NEW)
                                 ├── WebGL/Three.js
                                 └── Quality presets

[Analysis Overlays]         →   components/overlays/*.tsx
                                 ├── Use Canvas/SVG
                                 ├── Wire to analysis workers
                                 └── Interactive visualizations

ComparisonOverlay.tsx       →   components/overlays/ComparisonOverlay.tsx (NEW)
                                 └── Tabbed interface

SearchOverlay.tsx           →   components/overlays/SearchOverlay.tsx (NEW)
                                 └── Fuzzy search

SimulationView.tsx          →   Connect existing visualizers
                                 └── Wire to simulation workers
```

---

## 6. Detailed Implementation Tasks

### 6.1 Phase 1 Tasks

#### Task 1.1: WebPhageRepository
```typescript
// packages/web/src/data/WebPhageRepository.ts
import initSqlJs, { Database } from 'sql.js';
import type { PhageRepository } from '@phage-explorer/db-runtime';

export class WebPhageRepository implements PhageRepository {
  private db: Database | null = null;

  async initialize(dbUrl: string, onProgress?: (pct: number) => void): Promise<void> {
    // 1. Fetch database file with progress
    // 2. Initialize sql.js
    // 3. Open database
  }

  async listPhages(): Promise<PhageSummary[]> { /* ... */ }
  async getPhageByIndex(index: number): Promise<PhageFull | null> { /* ... */ }
  async getSequenceWindow(phageId: number, start: number, end: number): Promise<string> { /* ... */ }
  // ... implement all PhageRepository methods
}
```

#### Task 1.2: App.tsx Rewrite
```typescript
// packages/web/src/App.tsx
export default function App() {
  const { db, loading, progress, error } = useDatabase();

  if (loading) return <DataLoadingOverlay progress={progress} />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <OverlayProvider>
      <PhageExplorerContent repository={db} />
    </OverlayProvider>
  );
}

function PhageExplorerContent({ repository }: { repository: PhageRepository }) {
  // Wire up all the hooks and store connections
  // Render main layout
  // Handle keyboard events
  // Manage overlays
}
```

### 6.2 Phase 2 Tasks

#### Task 2.1: PhageList Component
```typescript
// packages/web/src/components/PhageList.tsx
interface PhageListProps {
  width: number;
  height: number;
}

export function PhageList({ width, height }: PhageListProps) {
  const phages = usePhageStore(s => s.phages);
  const currentIndex = usePhageStore(s => s.currentPhageIndex);
  const setCurrentPhage = usePhageStore(s => s.setCurrentPhage);

  // Virtualized list with keyboard navigation
  // Highlight current selection
  // Show name, host, length for each
}
```

#### Task 2.2: SequenceGrid Integration
```typescript
// packages/web/src/components/SequenceView.tsx
export function SequenceView() {
  const sequence = usePhageStore(s => s.currentPhage?.sequence ?? '');
  const viewMode = usePhageStore(s => s.viewMode);
  const scrollPosition = usePhageStore(s => s.scrollPosition);
  const theme = usePhageStore(s => s.currentTheme);

  const { canvasRef, scrollTo, visibleRange } = useSequenceGrid({
    sequence,
    viewMode,
    theme,
    initialPosition: scrollPosition,
  });

  return <canvas ref={canvasRef} />;
}
```

### 6.3 Phase 3 Tasks (Analysis Overlays)

Each overlay follows this pattern:

```typescript
// packages/web/src/components/overlays/[Name]Overlay.tsx
export function [Name]Overlay() {
  const sequence = usePhageStore(s => s.currentPhage?.sequence ?? '');
  const overlayData = usePhageStore(s => s.overlayData);
  const closeOverlay = usePhageStore(s => s.closeOverlay);

  // Get or compute analysis data
  const data = overlayData.[name] ?? computeDefault();

  return (
    <Overlay title="[Name] Analysis" onClose={() => closeOverlay('[name]')}>
      {/* Canvas-based visualization */}
      <AnalysisCanvas data={data} />
      {/* Summary statistics */}
      <StatisticsPanel data={data} />
    </Overlay>
  );
}
```

### 6.4 Phase 4 Tasks (Comparison)

```typescript
// packages/web/src/components/overlays/ComparisonOverlay.tsx
export function ComparisonOverlay() {
  const {
    comparisonPhageAIndex,
    comparisonPhageBIndex,
    comparisonResult,
    comparisonLoading,
    comparisonTab,
  } = usePhageStore(s => ({
    comparisonPhageAIndex: s.comparisonPhageAIndex,
    comparisonPhageBIndex: s.comparisonPhageBIndex,
    comparisonResult: s.comparisonResult,
    comparisonLoading: s.comparisonLoading,
    comparisonTab: s.comparisonTab,
  }));

  // Phage selector UI
  // Tab navigation
  // Result visualizations for each tab
}
```

---

## 7. Visualization Upgrades

### 7.1 ASCII → Canvas/WebGL Mapping

| TUI (ASCII) | Web (Canvas/WebGL) | Enhancement |
|-------------|-------------------|-------------|
| Character grid | SequenceGridRenderer | Smooth scrolling, zoom, click-to-select |
| ASCII sparklines | Sparkline component (already canvas) | Animations, hover tooltips |
| ASCII 3D model | WebGL Three.js | Real rotation, lighting, zoom |
| Box-drawing charts | SVG/Canvas charts | Interactive, animated |
| Text-based heatmaps | Canvas ImageData | Color gradients, zoom |
| ASCII dot plots | Canvas scatter | Click-to-explore regions |
| Text tables | Styled HTML tables | Sortable, filterable |

### 7.2 Visualization Components to Create

```typescript
// Reusable visualization primitives
components/viz/
├── HeatmapCanvas.tsx      // 2D intensity grid
├── ScatterCanvas.tsx      // PCA plots, dot plots
├── LineChartCanvas.tsx    // Time series, profiles
├── BarChartCanvas.tsx     // Distributions
├── CircularCanvas.tsx     // CGR, genome wheels
├── GelCanvas.tsx          // Virtual gel
├── PhyloTreeCanvas.tsx    // Evolution trees
└── StructureCanvas.tsx    // 3D structures (WebGL)
```

### 7.3 Analysis Visualization Mapping

| Analysis | TUI Visualization | Web Upgrade |
|----------|------------------|-------------|
| GC Skew | ASCII line plot | Interactive line chart with origin/terminus markers |
| Complexity | Text histogram | Canvas heatmap + histogram |
| Bendability | ASCII profile | Gradient-colored genome track |
| Promoters | Text markers | Clickable genome annotation track |
| Repeats | Text list | Arc diagram connecting repeat pairs |
| K-mer Anomaly | ASCII heatmap | Interactive heatmap with zoom |
| HGT Islands | Text blocks | Colored genome segments with donor info |
| Phase Portrait | ASCII scatter | Interactive 2D scatter with zoom/pan |
| CGR | ASCII grid | Full-resolution fractal visualization |
| Dot Plot | ASCII matrix | Zoomable similarity matrix |
| Hilbert | Text curve | High-res space-filling curve |
| Gel | ASCII bands | Realistic gel simulation |

---

## 8. Database Integration

### 8.1 sql.js Setup

```typescript
// packages/web/src/data/initDatabase.ts
import initSqlJs from 'sql.js';

let SQL: SqlJsStatic | null = null;

export async function initializeDatabase(
  dbUrl: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<Database> {
  // Initialize sql.js with WASM
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    });
  }

  // Fetch database with progress
  const response = await fetch(dbUrl);
  const reader = response.body!.getReader();
  const contentLength = +response.headers.get('Content-Length')!;

  let receivedLength = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    receivedLength += value.length;
    onProgress?.(receivedLength, contentLength);
  }

  const buffer = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, position);
    position += chunk.length;
  }

  return new SQL.Database(buffer);
}
```

### 8.2 Database Hosting

The SQLite database file needs to be:
1. Built during development: `bun run build:db`
2. Hosted on CDN or Vercel static files
3. Loaded on first app visit
4. Optionally cached in IndexedDB for offline use

```typescript
// Database URLs
const DB_URLS = {
  production: 'https://phage-explorer.org/data/phages.db',
  development: '/data/phages.db',
};
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// Test analysis functions (already pure)
describe('GC Skew Analysis', () => {
  it('computes correct skew values', () => {
    const result = computeGCskew('ATGCGCGCATGC');
    expect(result.skew).toHaveLength(12);
  });
});
```

### 9.2 Component Tests

```typescript
// Test overlay rendering
describe('GCSkewOverlay', () => {
  it('renders with sequence data', () => {
    render(<GCSkewOverlay sequence="ATGC..." />);
    expect(screen.getByText('GC Skew Analysis')).toBeInTheDocument();
  });
});
```

### 9.3 Integration Tests

```typescript
// Test keyboard navigation
describe('Keyboard Navigation', () => {
  it('navigates phage list with j/k', async () => {
    render(<App />);
    await userEvent.keyboard('j');
    expect(store.getState().currentPhageIndex).toBe(1);
  });
});
```

### 9.4 E2E Tests (Playwright)

```typescript
// Test full user flows
test('user can explore a phage', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid="phage-list"]');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid="sequence-grid"]')).toBeVisible();
});
```

---

## 10. Deployment Considerations

### 10.1 Build Configuration

```json
// vercel.json
{
  "framework": "vite",
  "buildCommand": "bun run build:web",
  "outputDirectory": "packages/web/dist",
  "headers": [
    {
      "source": "/data/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000" }
      ]
    }
  ]
}
```

### 10.2 Asset Optimization

- **Database**: Compress with gzip, serve from CDN
- **WASM**: sql.js WASM file (~1MB), cache aggressively
- **Fonts**: Subset JetBrains Mono to needed glyphs
- **Code splitting**: Lazy load analysis overlays

### 10.3 Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Database Load | < 5s (with progress) |
| Sequence Scroll FPS | 60fps |
| Analysis Compute | < 2s (with worker) |

---

## Implementation Priority

### Immediate (P0)
1. WebPhageRepository implementation
2. App.tsx rewrite with proper layout
3. PhageList component
4. SequenceGrid integration

### Short-term (P1)
5. All missing analysis overlays
6. Comparison system
7. Search overlay
8. Keyboard parity with TUI

### Medium-term (P2)
9. 3D WebGL viewer
10. Simulation integration
11. Performance optimization
12. Progressive disclosure

### Long-term (P3)
13. Offline support (IndexedDB)
14. Export features
15. Collaboration features
16. Mobile responsiveness

---

## Success Criteria

The web app will be considered complete when:

1. ✅ All 31 overlay types from TUI are available
2. ✅ All keyboard shortcuts work identically
3. ✅ All 6 simulations are runnable
4. ✅ Genome comparison fully functional
5. ✅ 3D model viewing available
6. ✅ Performance meets targets
7. ✅ Works offline after initial load
8. ✅ Passes accessibility audit

---

## Appendix: File Creation Checklist

### New Files to Create

```
packages/web/src/
├── data/
│   ├── WebPhageRepository.ts      # sql.js implementation
│   └── initDatabase.ts            # Database initialization
├── components/
│   ├── PhageList.tsx              # Phage browser
│   ├── SequenceView.tsx           # Sequence grid wrapper
│   ├── Model3DView.tsx            # WebGL 3D viewer
│   ├── AAKeyOverlay.tsx           # Amino acid reference
│   ├── AALegend.tsx               # Compact AA legend
│   └── overlays/
│       ├── SearchOverlay.tsx
│       ├── ComparisonOverlay.tsx
│       ├── PackagingPressureOverlay.tsx
│       ├── VirionStabilityOverlay.tsx
│       ├── PhasePortraitOverlay.tsx
│       ├── BiasDecompositionOverlay.tsx
│       ├── HGTOverlay.tsx
│       ├── CRISPROverlay.tsx
│       ├── SyntenyOverlay.tsx
│       ├── TropismOverlay.tsx
│       ├── StructureConstraintOverlay.tsx
│       ├── NonBDNAOverlay.tsx
│       ├── AnomalyOverlay.tsx
│       ├── DotPlotOverlay.tsx
│       ├── CGROverlay.tsx
│       ├── HilbertOverlay.tsx
│       └── GelOverlay.tsx
├── components/viz/
│   ├── HeatmapCanvas.tsx
│   ├── ScatterCanvas.tsx
│   ├── ArcDiagram.tsx
│   ├── GenomeTrack.tsx
│   └── GelCanvas.tsx
└── App.tsx                        # Complete rewrite
```

### Files to Modify

```
packages/web/src/
├── components/layout/Header.tsx   # Add data binding
├── components/layout/Footer.tsx   # Add data binding
├── components/GeneMapCanvas.tsx   # Complete implementation
├── hooks/index.ts                 # Export all hooks
└── main.tsx                       # Proper app mounting
```

---

*This plan provides a complete roadmap for achieving feature parity between the TUI and web applications. The web version will not just match the TUI—it will exceed it with superior visualizations and interactivity.*
