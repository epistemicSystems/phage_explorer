# Phage Explorer

<div align="center">

<!-- Hero Image -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/desktop_full_interface.webp">
  <source media="(prefers-color-scheme: light)" srcset="docs/images/desktop_full_interface.webp">
  <img alt="Phage Explorer - Full Desktop Interface showing Lambda phage with 3D structure, sequence grid, and analysis tools" src="docs/images/desktop_full_interface.webp" width="100%">
</picture>

<br><br>

[![CI](https://github.com/Dicklesworthstone/phage_explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/Dicklesworthstone/phage_explorer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue)
![Runtime](https://img.shields.io/badge/runtime-Bun%201.1+-purple)

<h3>🧬 Visualize, analyze, and explore bacteriophage genomes with real 3D structures</h3>

<p><strong>In your browser or terminal. No configuration required.</strong></p>

<br>

| 🚀 **Quick Install** | 🌐 **Try Online** |
|:---:|:---:|
| `curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/phage_explorer/main/install.sh" \| bash` | **[phage-explorer.org](https://phage-explorer.org)** |

</div>

---

<br>

## ✨ Visual Tour

<div align="center">

<!-- Welcome Modal -->
<table>
<tr>
<td width="60%">

### 🎯 Keyboard-First Design

Phage Explorer greets you with an interactive tour. Navigate with arrow keys, toggle views with single keypresses, and discover 30+ analysis tools through progressive disclosure.

**Key Features:**
- ⌨️ Full keyboard control (mouse optional)
- 🎨 5 color themes optimized for biology
- 📊 Real-time GC skew, codon bias, and more
- 🔬 3D protein structures from RCSB PDB

</td>
<td width="40%">
<img src="docs/images/hero_welcome_modal.webp" alt="Welcome modal introducing Phage Explorer's keyboard-first design" width="100%">
</td>
</tr>
</table>

</div>

<br>

<!-- Main Feature Gallery -->
<div align="center">

### 🔬 Core Visualization

<table>
<tr>
<td align="center" width="50%">
<img src="docs/images/lambda_phage_3d_structure.webp" alt="Lambda phage with interactive 3D protein structure viewer" width="100%">
<br>
<sub><b>3D Structure Viewer</b> — Real PDB structures from RCSB with cartoon, ball-and-stick, and surface rendering modes</sub>
</td>
<td align="center" width="50%">
<img src="docs/images/phage_selector_with_preview.webp" alt="Phage selector dropdown with genome stats and 3D preview" width="100%">
<br>
<sub><b>Phage Selector</b> — 24 iconic phages with instant genome stats, view mode toggles, and structure preview</sub>
</td>
</tr>
</table>

</div>

<br>

<div align="center">

### 📊 Analysis Tools

<table>
<tr>
<td align="center" width="33%">
<img src="docs/images/analysis_menu_tools.webp" alt="Analysis menu showing GC skew, complexity, bendability, and gene feature tools" width="100%">
<br>
<sub><b>Analysis Menu</b><br>30+ overlays: GC skew, dot plots, Hilbert curves, HGT detection</sub>
</td>
<td align="center" width="33%">
<img src="docs/images/gc_skew_visualization.webp" alt="GC skew analysis overlay showing replication origin detection" width="100%">
<br>
<sub><b>GC Skew</b><br>Cumulative plot for origin/terminus detection</sub>
</td>
<td align="center" width="33%">
<img src="docs/images/sequence_complexity_analysis.webp" alt="Sequence complexity analysis with Shannon entropy visualization" width="100%">
<br>
<sub><b>Complexity Analysis</b><br>Shannon entropy and linguistic complexity</sub>
</td>
</tr>
</table>

</div>

<br>

<div align="center">

### 🎹 Keyboard Power

<table>
<tr>
<td align="center" width="50%">
<img src="docs/images/keyboard_shortcuts_help.webp" alt="Comprehensive keyboard shortcuts overlay showing navigation, view, search, and overlay controls" width="100%">
<br>
<sub><b>Full Keyboard Control</b> — Every action has a shortcut. Press <code>?</code> anytime to see them all.</sub>
</td>
<td align="center" width="50%">
<img src="docs/images/three_dimensional_protein_view.webp" alt="3D protein structure with WebGL rendering and quality controls" width="100%">
<br>
<sub><b>WebGL 3D Viewer</b> — WASM-accelerated rendering handles 50K+ atoms in under 1 second.</sub>
</td>
</tr>
</table>

</div>

<br>

<div align="center">

### 🔎 Sequence Navigation

<table>
<tr>
<td align="center" width="50%">
<img src="docs/images/sequence_grid_zoomed_detail.webp" alt="Zoomed-in view of DNA sequence with color-coded nucleotides and amino acid translation" width="100%">
<br>
<sub><b>Zoomed Detail</b> — Color-coded nucleotides (A/T/G/C) with amino acid translation. Toggle reading frames with <code>F</code>.</sub>
</td>
<td align="center" width="50%">
<img src="docs/images/sequence_grid_full_genome.webp" alt="Full genome overview showing gene density and sequence patterns" width="100%">
<br>
<sub><b>Full Genome</b> — See entire genome patterns at a glance. 60fps smooth scrolling even for 280kb phages.</sub>
</td>
</tr>
</table>

</div>

<br>

<div align="center">

### 📱 Mobile Experience

<table>
<tr>
<td align="center" width="30%">
<img src="docs/images/mobile_responsive_interface.webp" alt="Mobile view with touch-friendly interface and phage illustration" width="100%">
<br>
<sub><b>Responsive Layout</b><br>Full functionality on any screen</sub>
</td>
<td align="center" width="30%">
<img src="docs/images/mobile_action_drawer.webp" alt="Mobile action drawer with touch-optimized controls" width="100%">
<br>
<sub><b>Action Drawer</b><br>Bottom sheets with 44px+ touch targets</sub>
</td>
<td align="center" width="40%">
<img src="docs/images/terminal_aesthetic_dark_theme.webp" alt="Dark terminal aesthetic with cyan and magenta accents" width="100%">
<br>
<sub><b>Terminal Aesthetic</b><br>Dark theme with biology-inspired colors</sub>
</td>
</tr>
</table>

</div>

<br>

---

## TL;DR

**The Problem:** Bacteriophage genomics tools are scattered, slow, and require bioinformatics expertise. Want to see how T4's genome compares to Lambda? You'll need to download FASTA files, install alignment software, write scripts, and squint at text output.

**The Solution:** Phage Explorer gives you instant visual access to 24 iconic phage genomes with color-coded sequences, real 3D protein structures from RCSB, and 30+ analysis overlays—all in a single binary or web app with zero configuration.

### Why Use Phage Explorer?

| Feature | What It Does |
|---------|--------------|
| **Instant Visualization** | Color-coded DNA/amino acid sequences with 60fps smooth scrolling |
| **Real 3D Structures** | PDB structures from RCSB with cartoon/ball-and-stick/surface modes |
| **30+ Analysis Overlays** | GC skew, dot plots, Hilbert curves, HGT detection, synteny, and more |
| **WASM-Accelerated** | Rust-compiled algorithms for structures with 50K+ atoms in <1s |
| **Works Everywhere** | TUI for terminals, web app for browsers, mobile-friendly touch UI |
| **Zero Dependencies** | Single binary, no cloud, no account, works offline |

---

## Quick Example

```bash
# Install (downloads ~6MB database + binary)
$ curl -fsSL .../install.sh | bash -s -- --with-database

# Launch the TUI
$ phage-explorer

# Navigation
↑/↓     Select phage (Lambda, T4, T7, PhiX174...)
←/→     Scroll through sequence
N/C     Toggle DNA / Amino acid view
F       Cycle reading frame (1, 2, 3)
T       Cycle color theme
?       Show all keyboard shortcuts
```

Or just visit **[phage-explorer.org](https://phage-explorer.org)** for the full web experience.

---

## How Phage Explorer Compares

| Capability | Phage Explorer | NCBI Viewer | Geneious | Custom Scripts |
|------------|---------------|-------------|----------|----------------|
| Instant startup | ✅ <100ms | 🐢 5-10s | 🐢 30s+ | N/A |
| 3D structures | ✅ Real PDB | ❌ None | ⚠️ Plugin | ❌ |
| Cross-phage comparison | ✅ Built-in | ⚠️ Manual | ✅ | ⚠️ |
| Offline use | ✅ Full | ❌ | ✅ | ✅ |
| Mobile support | ✅ Touch UI | ⚠️ | ❌ | ❌ |
| Price | ✅ Free | ✅ Free | 💰 $2K+ | ✅ Free |

**Best for:** Students, researchers, and anyone who wants to *see* phage genomes without wrestling with bioinformatics pipelines.

**Not ideal for:** High-throughput analysis of thousands of genomes, or if you need BLAST integration.

---

## Design Philosophy

1. **Instant feedback.** Every interaction responds in <100ms. Sequence scrolling renders at 60fps. Analysis overlays are precomputed on phage selection.

2. **Progressive disclosure.** Newcomers see a clean interface with arrow-key navigation. Power users discover the command palette (`:` or `Ctrl+P`), analysis menu (`A`), and simulation hub (`Shift+S`).

3. **Biology-first colors.** Amino acids are colored by chemical property (hydrophobic, polar, acidic, basic, special) so domain patterns pop. Themes follow bioinformatics conventions.

4. **Zero friction.** No accounts, no cloud, no API keys. Single binary or static web app. Works offline after first load.

5. **Cross-platform parity.** TUI and web share the same Zustand state, same analysis algorithms, same color themes. Learn once, use anywhere.

---

## Phage Genomics Primer

> *Skip this section if you already know what a codon is.*

### What Phages Are (For Engineers)

Bacteriophages ("phages") are viruses that infect bacteria. Think of them as self-assembling nanosyringes: a protein shell (capsid) packages DNA/RNA, a tail lands on the bacterial surface, and the genetic code gets injected to hijack the host's machinery.

They're the most abundant biological entities on Earth (~10³¹ particles)—more than all other organisms combined.

### Why Phages Matter

| Domain | Application |
|--------|-------------|
| **Medicine** | Phage therapy for antibiotic-resistant infections |
| **Biotech** | T7 RNA polymerase (PCR), Phi29 DNA polymerase (genome amplification), CRISPR-Cas (gene editing) |
| **Evolution** | Horizontal gene transfer, ocean carbon cycle, gut microbiome shaping |
| **Engineering** | Modular genomes—swap tail fibers like microservice plugins |

### The Genetic Code in 60 Seconds

```
DNA alphabet: A, C, G, T (4 letters)
Proteins: chains of 20 amino acids

Translation reads DNA in CODONS (non-overlapping triplets):
  ATG → Methionine (M) [Start codon]
  TTT → Phenylalanine (F)
  TAA → Stop

Reading frames matter:
  Frame 1: ATG-GCA-TTC-...
  Frame 2:  TGG-CAT-TC...
  Frame 3:   GGC-ATT-C...

Shift by one base → every downstream codon changes.
```

Phage Explorer lets you toggle reading frames live (`F` key) to see amino acid sequences reflow—the exact experiment that proved the triplet code in 1961.

### Mental Model for Software Folks

| Biology | Software |
|---------|----------|
| Genome | Source code (A/C/G/T characters) |
| Codon | 3-char opcode |
| Promoter/RBS | Function entry point |
| Reading frame | Instruction pointer alignment |
| Stop codon | `return` |
| Lytic cycle | `rm -rf host` |
| Lysogenic cycle | `git clone` into host genome |

### Historical Impact

| Year | Discovery | Phage Used |
|------|-----------|------------|
| 1952 | DNA is genetic material (Hershey-Chase) | T2 |
| 1961 | Genetic code is triplets (Crick-Brenner) | T4 |
| 1976 | First genome sequenced | MS2 |
| 1977 | First DNA genome sequenced | PhiX174 |

---

## Features

### Core Visualization
- **Color-Coded Sequences** — DNA (ACTG) and amino acid views with distinct colors by chemical property
- **5 Color Themes** — Classic, Ocean, Matrix, Sunset, Forest (cycle with `T`)
- **Virtualized Rendering** — Smooth 60fps scrolling for genomes up to 500kb+
- **Gene Map Navigation** — Visual gene bar with position tracking and snap-to-gene (`[`/`]`)

### 3D Structure Viewer
- **Real PDB Structures** — Fetched from RCSB for each phage's representative protein
- **Three Render Modes** — Cartoon, ball-and-stick, surface (web); ASCII wireframe (TUI)
- **WASM-Accelerated** — O(N) spatial-hash bond detection for 50K+ atom structures in <1s

### Analysis Overlays (30+)
- **Layer 1 Quick Toggles** — GC skew (`G`), complexity (`X`), bendability (`B`), promoter/RBS (`P`), repeats (`R`)
- **Analysis Menu** — Dot plots, Hilbert curves, HGT detection, synteny, codon usage
- **Diff Mode** — Visual sequence comparison between phages (`D`)

### Platforms
- **Web App** — [phage-explorer.org](https://phage-explorer.org) with full touch support
- **TUI** — Terminal interface with ASCII 3D models and keyboard controls
- **Mobile** — Bottom sheets, gesture navigation, haptic feedback

### Included Phages (24)

| Phage | Genome | Type | Host | Historical Note |
|-------|--------|------|------|-----------------|
| **Lambda (λ)** | 48,502 bp | dsDNA | E. coli K-12 | Classic temperate phage, lysogenic |
| **T4** | 168,903 bp | dsDNA | E. coli B | Crick-Brenner frameshift experiments |
| **T7** | 39,937 bp | dsDNA | E. coli | RNA polymerase workhorse |
| **PhiX174** | 5,386 bp | ssDNA | E. coli C | First DNA genome sequenced (1977) |
| **MS2** | 3,569 bp | ssRNA | E. coli | First genome ever sequenced (1976) |
| **M13** | 6,407 bp | ssDNA | E. coli | Filamentous, phage display pioneer |
| **P22** | 41,724 bp | dsDNA | Salmonella | Transducing phage |
| **Phi29** | 19,282 bp | dsDNA | B. subtilis | DNA polymerase for whole-genome amplification |
| **Mu** | 36,717 bp | dsDNA | E. coli | Transposable phage |
| **Phi6** | 2,948 bp | dsRNA | P. syringae | Rare dsRNA phage with envelope |
| **SPbeta** | 134,416 bp | dsDNA | B. subtilis | Large temperate phage |
| **T5** | 121,750 bp | dsDNA | E. coli | Two-step DNA injection |
| **P1** | 94,800 bp | dsDNA | E. coli | Plasmid prophage, Cre-lox origin |
| **P2** | 33,593 bp | dsDNA | E. coli | Founding Peduovirus |
| **N4** | 70,153 bp | dsDNA | E. coli | Injects its own RNA polymerase |
| **Felix O1** | 86,155 bp | dsDNA | Salmonella | Classic Salmonella-typing phage |
| **D29** | 49,136 bp | dsDNA | Mycobacterium | SEA-PHAGES workhorse, TB research |
| **L5** | 52,297 bp | dsDNA | Mycobacterium | First sequenced mycobacteriophage |
| **PhiC31** | 41,491 bp | dsDNA | Streptomyces | Serine integrase for gene therapy |
| **PhiKZ** | 280,334 bp | dsDNA | Pseudomonas | Jumbo phage, forms nucleus-like shell |
| **PRD1** | 14,927 bp | dsDNA | E. coli | Tailless, internal lipid membrane |
| **PM2** | 10,079 bp | dsDNA | Pseudoalteromonas | Marine, first lipid-containing phage |
| **Qβ** | 4,217 bp | ssRNA | E. coli | RNA replicase, isothermal amplification |
| **T1** | 48,836 bp | dsDNA | E. coli | Notorious lab contaminant |

---

## Installation

### Quick Install (Recommended)

```bash
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/phage_explorer/main/install.sh?$(date +%s)" | bash
```

**With options:**

```bash
# Include pre-built database (~6MB)
curl -fsSL .../install.sh | bash -s -- --with-database

# Auto-add to PATH
curl -fsSL .../install.sh | bash -s -- --easy-mode

# Install to custom directory
curl -fsSL .../install.sh | bash -s -- --dest ~/bin

# Install system-wide
curl -fsSL .../install.sh | bash -s -- --system

# Specific version
curl -fsSL .../install.sh | bash -s -- --version v1.0.0

# Build from source instead of downloading binary
curl -fsSL .../install.sh | bash -s -- --from-source
```

### From Source

```bash
git clone https://github.com/Dicklesworthstone/phage_explorer.git
cd phage_explorer
bun install

# Build the phage database (fetches from NCBI, ~1 minute)
bun run build:db

# Run the TUI
bun run dev
```

### Web App

Visit **[phage-explorer.org](https://phage-explorer.org)** — no installation required.

Or self-host:

```bash
bun run build:web
# Output in packages/web/dist, deploy anywhere
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VERSION` | latest | Pin specific release tag |
| `DEST` | `~/.local/bin` | Install directory |
| `OWNER` | `Dicklesworthstone` | GitHub owner |
| `REPO` | `phage_explorer` | GitHub repository |

---

## Usage

### Keyboard Controls

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate between phages |
| `←` / `→` | Scroll sequence left/right |
| `PgUp` / `PgDn` | Scroll by one page |
| `Home` / `End` | Jump to start/end of genome |
| `N` / `C` | Toggle DNA / Amino Acid (codon) view |
| `F` | Cycle reading frame (1, 2, 3) |
| `T` | Cycle color theme |
| `D` | Toggle diff mode vs reference phage |
| `M` | Toggle 3D model display |
| `K` | Toggle amino acid key legend |
| `S` / `/` | Search phages |
| `[` / `]` | Jump to previous/next gene |
| `?` | Show help overlay |
| `A` | Open analysis menu |
| `:` / `Ctrl+P` | Command palette |
| `Q` | Quit |

### Depth Layers (Progressive Disclosure)

```
Layer 0 — SACRED SURFACE (always available)
├── Navigation: ↑↓←→ PgUp PgDn Home End
├── View: N/C (DNA/AA), F (frame), T (theme), D (diff), M (3D)
└── Meta: ? (help), S (search), Q (quit)

Layer 1 — QUICK OVERLAYS (single-key toggles)
├── G  GC skew
├── X  Complexity
├── B  Bendability
├── P  Promoter/RBS motifs
└── R  Repeats/palindromes

Layer 2 — ANALYSIS MENU (A)
└── Numbered actions: dot plots, codon usage, HGT detection...

Layer 3 — SIMULATION HUB (Shift+S)
└── Interactive models: lysogeny circuits, ribosome traffic...

Layer 4 — COMMAND PALETTE (:)
└── Fuzzy-search every action
```

### Color Themes

Cycle through themes with `T`:

| Theme | Style |
|-------|-------|
| **Classic** | Traditional bioinformatics (green A, blue C, amber G, red T) |
| **Ocean** | Cool blue/teal palette |
| **Matrix** | Green terminal aesthetic |
| **Sunset** | Warm orange/coral tones |
| **Forest** | Natural earth greens and browns |

Each theme colors amino acids by chemical property:
- **Hydrophobic** (A, V, L, I, M, F, W, P) — warm tones
- **Polar** (S, T, N, Q, C, Y) — cool tones
- **Acidic** (D, E) — red
- **Basic** (K, R, H) — blue
- **Special** (G) — neutral

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                             │
│   Web (React + WebGL)          TUI (Ink + ASCII)         Mobile     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          STATE LAYER (Zustand)                       │
│   Current phage, scroll position, view mode, theme, overlay state   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌──────────────────┐    ┌──────────────────────┐    ┌──────────────────┐
│ packages/core    │    │ packages/wasm-compute │    │ packages/db-*    │
│ Codons, themes,  │    │ Rust/WASM for hot    │    │ SQLite + Drizzle │
│ grid math        │    │ paths (dot plots,    │    │ ORM for phage    │
│                  │    │ k-mers, spatial hash)│    │ metadata         │
└──────────────────┘    └──────────────────────┘    └──────────────────┘
```

### Package Structure

```
phage-explorer/
├── packages/
│   ├── core/           # Domain logic: codons, theming, grid virtualization
│   ├── db-schema/      # Drizzle ORM schema (phages, sequences, genes)
│   ├── db-runtime/     # Repository implementations over SQLite
│   ├── state/          # Zustand store for UI state
│   ├── renderer-3d/    # ASCII 3D rendering with Z-buffering
│   ├── wasm-compute/   # Rust/WASM for performance-critical code
│   ├── data-pipeline/  # NCBI fetcher and database builder
│   ├── web/            # React web app with WebGL 3D viewer
│   └── tui/            # Ink/React TUI components
├── phage.db            # SQLite database (generated)
└── install.sh          # One-liner installer
```

### Technical Details

| Component | Implementation |
|-----------|----------------|
| **Sequence Storage** | Chunked in 10kb segments for virtualized rendering |
| **3D Rendering** | WebGL/Three.js (web), custom ASCII Z-buffer (TUI) |
| **Bond Detection** | O(N) spatial-hash (WASM) vs O(N²) naive |
| **Database** | SQLite + sql.js (browser), Bun SQLite (TUI) |
| **State** | Zustand with computed selectors |
| **Build** | Vite (web), Bun compile (TUI binary) |

---

## Performance

| Metric | Value | Notes |
|--------|-------|-------|
| Binary startup | <100ms | Lazy DB connection |
| Sequence scroll | 60fps | Virtualized, only visible cells rendered |
| 3D structure load | <1s | WASM spatial-hash for 50K atoms |
| Database size | ~6MB | 24 phages with full sequences + PDB refs |
| Memory (idle) | ~40MB | TUI; web varies by browser |

### WASM Acceleration

```
Naive bond detection:  O(N²)  — 50K atoms → 60+ seconds
Spatial-hash (WASM):   O(N)   — 50K atoms → <1 second

Automatic fallback to pure JS when WASM unavailable.
Web Worker isolation keeps UI responsive during heavy computation.
```

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `bun run dev` | Run TUI in development mode |
| `bun run build:db` | Build phage database from NCBI |
| `bun run build` | Compile to single binary |
| `bun run build:all` | Build for all platforms |
| `bun run build:web` | Build web app for deployment |
| `bun run lint` | ESLint (zero warnings) |
| `bun run typecheck` | TypeScript checks |
| `bun run check` | Lint + typecheck |
| `bun run test` | Run unit tests |

---

## Troubleshooting

### "Database missing"

```bash
# Option 1: Reinstall with database
curl -fsSL .../install.sh | bash -s -- --with-database

# Option 2: Build from NCBI
bun run build:db
```

### "NCBI fetch errors"

NCBI rate-limits requests. Retry `build:db` after a minute.

### "Binary not in PATH"

```bash
# Use easy-mode to auto-configure
curl -fsSL .../install.sh | bash -s -- --easy-mode

# Or manually add to PATH
export PATH="$HOME/.local/bin:$PATH"
```

### "Terminal too small"

Resize to at least 80x24 for the TUI. The web app adapts to any viewport.

### "Colors not showing"

Ensure your terminal supports 256 colors or truecolor:

```bash
# Test truecolor support
printf '\e[38;2;255;0;0mRED\e[0m\n'

# If you see red text, truecolor works
```

### "3D model not loading"

- Web: Check browser console for WebGL errors
- TUI: 3D is ASCII wireframe, not full render

---

## Limitations

### What Phage Explorer Doesn't Do

| Feature | Status | Alternative |
|---------|--------|-------------|
| BLAST integration | ❌ Not planned | Use NCBI BLAST separately |
| Custom genome import | ❌ Not yet | Fork and modify `data-pipeline` |
| High-throughput analysis | ⚠️ Not optimized | Use command-line tools |
| Annotation editing | ❌ View-only | Use Geneious, Artemis |

### Known Issues

- Large phages (>200kb) may have slower initial render
- 3D structures depend on RCSB availability
- Some mobile browsers have WebGL limitations

---

## Security & Privacy

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR MACHINE                                 │
│                                                                      │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│   │   Input     │───▶│   Process   │───▶│   Output    │             │
│   │  (SQLite)   │    │  (Local)    │    │  (Screen)   │             │
│   └─────────────┘    └─────────────┘    └─────────────┘             │
│                                                                      │
│   ✅ All data stored locally                                         │
│   ✅ Works offline after first load                                  │
│   ❌ No telemetry or analytics                                       │
│   ❌ No accounts or cloud sync                                       │
│   ❌ No API keys required                                            │
└─────────────────────────────────────────────────────────────────────┘
```

Network calls only happen during:
- `build:db` — fetches sequences from NCBI
- 3D loading — fetches PDB from RCSB
- Web app — initial page load

---

## FAQ

### Why "Phage Explorer"?

Bacteriophages + exploration = Phage Explorer. It's what it does.

### Is this for researchers or students?

Both. The progressive disclosure design means students see a simple sequence viewer, while researchers can access advanced analysis through the command palette.

### Can I add my own phages?

Not yet through the UI. To add custom phages, modify `packages/data-pipeline` and rebuild the database. This requires TypeScript/Node knowledge.

### How accurate are the 3D structures?

Structures come directly from [RCSB PDB](https://www.rcsb.org/). They're real experimental structures (X-ray, cryo-EM), not predictions. Each phage links to its representative protein structure.

### Does it work on my phone?

Yes. The web app at [phage-explorer.org](https://phage-explorer.org) has full touch support with bottom sheets, gesture navigation, and 44px+ touch targets.

### Why Bun instead of Node?

Speed. Bun's SQLite integration is native and fast. The single-binary compilation (`bun build --compile`) produces a zero-dependency executable.

### Is this open source?

Yes, MIT licensed. See [LICENSE](LICENSE).

---

## CI/CD

| Trigger | Actions |
|---------|---------|
| Every push/PR | Lint + typecheck |
| Tagged releases | Cross-platform binary builds |
| Release artifacts | macOS (arm64, x64), Linux (x64, arm64), Windows (x64) |

Pre-built `phage.db` included in releases so users don't need to fetch from NCBI.

---

## Development

```bash
# 1. Clone
git clone https://github.com/Dicklesworthstone/phage_explorer.git
cd phage_explorer

# 2. Install dependencies
bun install

# 3. Build database (fetches from NCBI)
bun run build:db

# 4. Run TUI in dev mode
bun run dev

# 5. Run web app in dev mode
bun run dev:web

# Before committing
bun run check
```

---

## About Contributions

Please don't take this the wrong way, but I do not accept outside contributions for any of my projects. I simply don't have the mental bandwidth to review anything, and it's my name on the thing, so I'm responsible for any problems it causes; thus, the risk-reward is highly asymmetric from my perspective. I'd also have to worry about other "stakeholders," which seems unwise for tools I mostly make for myself for free. Feel free to submit issues, and even PRs if you want to illustrate a proposed fix, but know I won't merge them directly. Instead, I'll have Claude or Codex review submissions via `gh` and independently decide whether and how to address them. Bug reports in particular are welcome. Sorry if this offends, but I want to avoid wasted time and hurt feelings. I understand this isn't in sync with the prevailing open-source ethos that seeks community contributions, but it's the only way I can move at this velocity and keep my sanity.

---

## Acknowledgments

Built with:
- [Bun](https://bun.sh/) — Fast JavaScript runtime and bundler
- [Ink](https://github.com/vadimdemedes/ink) — React for command-line interfaces
- [Drizzle ORM](https://orm.drizzle.team/) — TypeScript ORM for SQLite
- [Three.js](https://threejs.org/) — 3D graphics for the web
- [Zustand](https://github.com/pmndrs/zustand) — Lightweight state management

Data sources:
- [NCBI GenBank/RefSeq](https://www.ncbi.nlm.nih.gov/) — Phage genome sequences
- [RCSB PDB](https://www.rcsb.org/) — Protein 3D structures

---

## License

MIT License — see [LICENSE](LICENSE) for details.
