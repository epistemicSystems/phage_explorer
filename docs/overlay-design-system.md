# Overlay Design System (Web)

This doc captures **conventions** (not hard rules) for building web overlays that feel consistent, premium, and maintainable. It exists to prevent “one-off” UI drift across overlays.

## Principles

- **Chrome is quiet**: overlays should feel like an analysis card, not a separate app.
- **Use tokens, not magic numbers**: spacing/typography/color should come from CSS variables.
- **Sans for UI, mono for data**: reserve monospace for sequences, coordinates, IDs, numeric readouts.
- **Standard states**: loading/empty/error should look consistent and be actionable.
- **Mobile-first constraints**: overlays must be usable on iPhone screens without fighting scroll or safe areas.

## Where the primitives live

- Overlay chrome primitives: `packages/web/src/components/overlays/primitives/OverlayChrome.tsx`
- Re-exports: `packages/web/src/components/overlays/primitives/index.ts`
- Overlay IDs + stack behavior: `packages/web/src/components/overlays/OverlayProvider.tsx`
- Overlay registration (eager vs lazy): `packages/web/src/components/overlays/OverlayManager.tsx`
- Core tokens: `packages/web/src/styles/variables.css`
- Typography policy: `packages/web/src/styles/typography.css`

## Tokens to use (and how)

Prefer CSS variables over inline values:

- **Spacing**: `var(--space-*)` (e.g. `--space-2`, `--space-6`)
- **Radii**: `var(--radius-*)`
- **Typography**: `--text-*`, `--font-*`, `--leading-*`, `--tracking-*`
- **Overlay typography**: `--overlay-*-size`, `--overlay-*-line-height`, `--overlay-*-weight`
- **Colors**: `--color-*` (avoid hard-coded hex in overlay components)

If you need a new token, add it to `packages/web/src/styles/variables.css` (and prefer reusing an existing one first).

## Layout primitives (use these first)

Instead of bespoke wrappers like `div style={{ display:'flex', flexDirection:'column', gap:'...' }}`, prefer these:

- `OverlayStack`: vertical spacing between blocks
- `OverlaySection` + `OverlaySectionHeader`: consistent bordered sections
- `OverlayToolbar`: top-of-section controls/filters
- `OverlayGrid`: responsive grids for cards
- `OverlayRow`, `OverlayKeyValue`: label/value rows and stat readouts
- `OverlayDescription`: body copy that matches overlay typography
- `OverlayStatCard` / `OverlayStatGrid`: consistent metrics presentation
- `OverlayLegend` / `OverlayLegendItem`: chart legends

The goal is that overlays can be “scan-read” with the same mental model across the app.

## Typography conventions

- **UI text** (titles, descriptions, buttons) should stay in the default sans stack.
- Use `.font-data` for:
  - DNA / AA sequences
  - coordinates / loci / accession IDs
  - numeric tables and dense stats
- Use `.key-hint` for shortcut badges (it’s mono + tabular numbers).

Avoid making an entire overlay monospace; it reads like a dev tool and reduces hierarchy.

## State primitives (loading / empty / error)

Within overlays, use the standardized primitives (from `packages/web/src/components/overlays/primitives`):

- `OverlayLoadingState`: use when async work is in flight
- `OverlayEmptyState`: use when there is no content (include a hint or next step when possible)
- `OverlayErrorState`: use for recoverable failures
  - `message` should be user-facing, brief, and non-technical
  - `details` is optional and should generally be dev-only
  - `onRetry` should be wired when retry is safe

Avoid custom spinners and ad-hoc error boxes unless the overlay truly needs a specialized state.

## Mobile vs desktop guidelines

### Mobile (≤ 640px / coarse pointer)

- Prefer smaller overlay shells (`size="sm"` in `Overlay`) and keep content scrollable.
- Avoid fixed-height canvases without a container that can shrink.
- Keep primary actions reachable (don’t bury critical buttons below long outputs).
- Respect safe areas (`env(safe-area-inset-*)`) and avoid placing controls under the iOS home indicator.

### Desktop

- Use more generous sectioning (`OverlaySection`) to improve scanability.
- Favor side-by-side layouts via `OverlayGrid` only when it meaningfully reduces scrolling.

## Interaction patterns

- Prefer registry-driven hotkeys and labels (ActionRegistry + `useHotkey`) over hardcoded shortcut text.
- Close behavior should remain predictable (`Esc` closes top overlay).
- Don’t register global hotkeys from inside lazy overlay components unless they are contextual to that overlay.

## Do / don’t quick examples

**Do**
- Use `OverlayStack` for vertical rhythm.
- Use `OverlaySectionHeader` for section titles and context badges.
- Use `.font-data` only on the specific spans/blocks that are data-heavy.

**Don’t**
- Add new one-off spacing values (e.g. `gap: '13px'`) in overlay content.
- Hardcode hex colors in overlay components.
- Render raw exceptions to users; prefer `OverlayErrorState` with a clear message.

