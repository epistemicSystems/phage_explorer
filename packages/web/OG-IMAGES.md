# OG Share Images

This document describes the OpenGraph and Twitter share images for Phage Explorer.

## Static Images

Static fallback images are located in `public/`:

| File | Dimensions | Purpose |
|------|------------|---------|
| `og-image.png` | 1200×630 | Facebook, LinkedIn, iMessage, general OpenGraph |
| `twitter-image.png` | 1200×600 | Twitter/X cards |

### Regenerating Static Images

If you update the design, regenerate the images:

```bash
cd packages/web
bun run generate:og
bun run generate:icons
```

This uses Playwright to render the HTML template and capture screenshots.

## Dynamic OG Image Generation

The Edge function at `/api/og` generates dynamic OG images on-demand.

### Usage

```
https://phage-explorer.org/api/og
https://phage-explorer.org/api/og?phage=Lambda
https://phage-explorer.org/api/og?title=Custom%20Title&description=Custom%20description
https://phage-explorer.org/api/og?format=twitter
```

### Query Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `title` | "Phage Explorer" | Main title text |
| `description` | Default description | Subtitle/description text |
| `phage` | - | Phage name (customizes title and badge) |
| `type` | "default" | One of: `default`, `phage`, `analysis` |
| `format` | "og" | `og` (1200×630) or `twitter` (1200×600) |

### Examples

**Default homepage:**
```
/api/og
```

**Specific phage page:**
```
/api/og?phage=T4&type=phage
```

**Analysis page:**
```
/api/og?title=GC%20Skew%20Analysis&type=analysis
```

**Twitter format:**
```
/api/og?format=twitter
```

## App Icons

Icons for PWA and iOS home screen:

| File | Size | Purpose |
|------|------|---------|
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `icon-192.png` | 192×192 | Android/PWA |
| `icon-512.png` | 512×512 | PWA splash screen |
| `favicon.svg` | Vector | Browser tab favicon |

## Testing Share Images

### Manual Testing

1. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
   - Enter `https://phage-explorer.org/`
   - Click "Debug" to see how the OG image appears

2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
   - Enter `https://phage-explorer.org/`
   - Verify the summary_large_image card renders correctly

3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
   - Enter `https://phage-explorer.org/`
   - Check the preview

4. **OpenGraph.xyz**: https://www.opengraph.xyz/
   - General OG tag preview for multiple platforms

### Local Testing

Test the Edge function locally with Vercel CLI:

```bash
vercel dev
# Then visit http://localhost:3000/api/og
```

## Design System

The OG images follow the project's visual identity:

### Colors

- **Background**: Dark gradient `#0a0a12` → `#121620`
- **Primary accent**: Emerald green `#22c55e`
- **Secondary**: Blue `#3b82f6`
- **DNA colors**:
  - A (Adenine): `#22c55e` (green)
  - T (Thymine): `#ef4444` (red)
  - G (Guanine): `#f59e0b` (amber)
  - C (Cytosine): `#3b82f6` (blue)

### Typography

- Font: JetBrains Mono (or system monospace fallback)
- Title: 72px bold, gradient text
- Subtitle: 22px regular, muted gray

### Elements

- Phage icon with glow effect
- Badge indicating content type
- DNA sequence decoration at bottom
- Rainbow gradient bar accent

## Meta Tags

The following meta tags are included in `index.html`:

```html
<!-- OpenGraph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://phage-explorer.org/" />
<meta property="og:title" content="Phage Explorer — Bacteriophage Genome Visualization" />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://phage-explorer.org/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Phage Explorer — Bacteriophage Genome Visualization" />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://phage-explorer.org/twitter-image.png" />
```

## Caching

- Static images: Served with standard Vercel static caching
- Edge function: Cached for 24h client-side, 7 days on CDN (see `vercel.json` headers)
