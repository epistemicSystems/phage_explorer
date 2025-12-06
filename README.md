# Phage Explorer

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue)
![Runtime](https://img.shields.io/badge/runtime-Bun%201.1+-purple)
![Status](https://img.shields.io/badge/status-early--stage-orange)

Monorepo for an interactive phage genomics explorer: a Bun-powered data pipeline that ingests NCBI phage metadata, a typed Drizzle schema/runtime, shared rendering/state primitives, and an Ink/React TUI with color-rich console output.

---

## ✨ Highlights
- **End-to-end pipeline**: NCBI fetcher and catalog builder convert raw phage data into a structured database.
- **Typed data model**: Drizzle-backed schema and runtime helpers for consistent access from all packages.
- **Shared UI core**: Reusable codon/color themes, virtualization helpers, and shared types for terminal-first UIs.
- **3D-ready renderer**: Hooks for visualizing phage structures in a 3D-capable renderer package.
- **Ink TUI**: React/Ink-driven terminal UI with rich, colorized output for browsing phage datasets.

## 🧭 Monorepo layout (workspaces)
- `packages/core`: Shared codon utilities, themes, types, and virtualization helpers.
- `packages/data-pipeline`: NCBI fetcher, catalog builder, and ingest scripts that populate the DB.
- `packages/db-schema`: Drizzle schema definitions for the phage catalog.
- `packages/db-runtime`: Runtime repository bindings over the Drizzle schema.
- `packages/state`: Centralized state store primitives for the UI layers.
- `packages/renderer-3d`: 3D rendering hooks and utilities (future-facing visualization).
- `packages/tui`: Ink/React terminal UI that consumes the shared state + runtime.

## 🚀 Quickstart
```bash
# Install deps (Bun workspaces)
bun install

# Build database from NCBI sources (writes catalog)
bun run build:db

# Ingest data into the runtime store
bun run ingest

# Launch the terminal UI
bun run dev

# Typecheck everything
bun run typecheck
```

## 🔍 Key scripts (root)
- `bun run dev` — start the Ink TUI (`packages/tui/src/index.tsx`).
- `bun run build:db` — generate the phage catalog via the data pipeline.
- `bun run ingest` — ingest generated data into the runtime repository.
- `bun run typecheck` — project-wide TypeScript checks.

## 🧠 Data flow
1) **Fetch** — `packages/data-pipeline/src/ncbi-fetcher.ts` pulls source data from NCBI.
2) **Catalog** — `packages/data-pipeline/src/phage-catalog.ts` normalizes records into the Drizzle schema.
3) **Schema** — `packages/db-schema` defines tables and types for the catalog.
4) **Runtime** — `packages/db-runtime` exposes typed accessors over the Drizzle layer.
5) **UI** — `packages/tui` reads from the runtime/state layers to render the interactive experience (with `packages/core` + `packages/state` + `packages/renderer-3d` utilities).

## 🛠️ Development notes
- Runtime: Bun 1.1+; workspace-managed dependencies (`bun install`).
- Type system: TypeScript 5.7; project config in the root `tsconfig.json`.
- Logging/UI: Ink + React for colorful, structured terminal output.
- Data: Drizzle ORM for schema + runtime access; pipeline code lives in `packages/data-pipeline`.

## 🧪 Testing & quality
- Use `bun run typecheck` for project-wide TS correctness.
- Add package-local tests alongside sources where appropriate (not yet wired in this scaffold).

## 📌 Roadmap hints
- Deepen 3D rendering for phage structure previews.
- Expand pipeline coverage (additional NCBI endpoints, metadata enrichment).
- Add search/filter and bookmarking within the TUI.

## 🤝 Contributing
- Install deps with `bun install`.
- Keep changes scoped to existing packages; prefer improving current modules over adding new ones.
- Match the existing Ink + TypeScript style; keep console output clear and colorful.


