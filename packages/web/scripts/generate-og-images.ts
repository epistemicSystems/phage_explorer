/**
 * Generate static OG and Twitter share images using Playwright.
 * Run with: bun run scripts/generate-og-images.ts
 */
import { chromium } from "playwright";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

// Read the phage SVG icon
const phageSvg = readFileSync(join(publicDir, "icons", "phage-og.svg"), "utf-8");
// Convert to data URI for embedding
const phageSvgDataUri = `data:image/svg+xml,${encodeURIComponent(phageSvg)}`;

interface ImageConfig {
  width: number;
  height: number;
  filename: string;
}

const configs: ImageConfig[] = [
  { width: 1200, height: 630, filename: "og-image.png" },
  { width: 1200, height: 600, filename: "twitter-image.png" },
];

function generateHtml(config: ImageConfig): string {
  const { width, height } = config;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @font-face {
      font-family: 'JetBrains Mono';
      src: url('file://${join(publicDir, "fonts", "JetBrainsMono-Bold.woff2")}') format('woff2');
      font-weight: 700;
    }
    @font-face {
      font-family: 'JetBrains Mono';
      src: url('file://${join(publicDir, "fonts", "JetBrainsMono-Medium.woff2")}') format('woff2');
      font-weight: 500;
    }
    @font-face {
      font-family: 'JetBrains Mono';
      src: url('file://${join(publicDir, "fonts", "JetBrainsMono-Regular.woff2")}') format('woff2');
      font-weight: 400;
    }
    body {
      width: ${width}px;
      height: ${height}px;
      font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
      overflow: hidden;
    }
    .container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(145deg, #0a0a12 0%, #0f1218 35%, #121620 65%, #0a0a12 100%);
      position: relative;
    }
    /* Glowing orbs for depth */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
    }
    .orb-1 {
      top: -100px;
      left: -50px;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 60%);
    }
    .orb-2 {
      bottom: -150px;
      right: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 60%);
    }
    .orb-3 {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 50%);
    }
    /* Content */
    .content {
      display: flex;
      align-items: center;
      gap: 48px;
      z-index: 1;
    }
    .phage-icon {
      width: 180px;
      height: 180px;
      filter: drop-shadow(0 0 30px rgba(34,197,94,0.4));
    }
    .text-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .badge {
      display: inline-flex;
      padding: 8px 16px;
      border-radius: 8px;
      background: rgba(34,197,94,0.15);
      border: 1px solid rgba(34,197,94,0.3);
      width: fit-content;
    }
    .badge-text {
      color: #22c55e;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .title {
      font-size: 72px;
      font-weight: 700;
      background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.1;
      margin: 0;
    }
    .subtitle {
      font-size: 24px;
      color: #94a3b8;
      font-weight: 400;
      max-width: 600px;
      line-height: 1.4;
    }
    /* DNA sequence decoration */
    .dna-sequence {
      position: absolute;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 4px;
      opacity: 0.6;
      z-index: 1;
    }
    .nucleotide {
      font-size: 16px;
      font-weight: 600;
      padding: 4px 6px;
    }
    .nt-a { color: #22c55e; }
    .nt-c { color: #3b82f6; }
    .nt-g { color: #f59e0b; }
    .nt-t { color: #ef4444; }
    /* Bottom gradient bar */
    .bottom-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg,
        transparent 0%,
        #22c55e 20%,
        #3b82f6 40%,
        #f59e0b 60%,
        #ef4444 80%,
        transparent 100%
      );
    }
    /* URL badge */
    .url-badge {
      position: absolute;
      bottom: 24px;
      right: 40px;
      color: #64748b;
      font-size: 16px;
      font-weight: 500;
      z-index: 1;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Background orbs -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <!-- Main content -->
    <div class="content">
      <img src="${phageSvgDataUri}" class="phage-icon" alt="Phage" />
      <div class="text-content">
        <div class="badge">
          <span class="badge-text">BIOINFORMATICS TOOL</span>
        </div>
        <h1 class="title">Phage Explorer</h1>
        <p class="subtitle">Visualize and analyze bacteriophage genomes with color-coded sequences, 3D structures, and 40+ analysis tools.</p>
      </div>
    </div>

    <!-- DNA sequence decoration -->
    <div class="dna-sequence">
      <span class="nucleotide nt-a">A</span>
      <span class="nucleotide nt-t">T</span>
      <span class="nucleotide nt-g">G</span>
      <span class="nucleotide nt-c">C</span>
      <span class="nucleotide nt-a">A</span>
      <span class="nucleotide nt-g">G</span>
      <span class="nucleotide nt-t">T</span>
      <span class="nucleotide nt-c">C</span>
      <span class="nucleotide nt-g">G</span>
      <span class="nucleotide nt-a">A</span>
      <span class="nucleotide nt-t">T</span>
      <span class="nucleotide nt-c">C</span>
      <span class="nucleotide nt-g">G</span>
      <span class="nucleotide nt-a">A</span>
      <span class="nucleotide nt-t">T</span>
      <span class="nucleotide nt-g">G</span>
      <span class="nucleotide nt-c">C</span>
      <span class="nucleotide nt-a">A</span>
      <span class="nucleotide nt-g">G</span>
      <span class="nucleotide nt-t">T</span>
    </div>

    <!-- URL -->
    <div class="url-badge">phage-explorer.org</div>

    <!-- Bottom gradient bar -->
    <div class="bottom-bar"></div>
  </div>
</body>
</html>`;
}

async function generateImages(): Promise<void> {
  console.log("🧬 Generating OG share images...\n");

  const browser = await chromium.launch();

  for (const config of configs) {
    console.log(`📸 Generating ${config.filename} (${config.width}x${config.height})...`);

    const page = await browser.newPage({
      viewport: { width: config.width, height: config.height },
    });

    const html = generateHtml(config);

    // Write temp HTML for debugging if needed
    // writeFileSync(join(publicDir, `_og-template-${config.width}x${config.height}.html`), html);

    await page.setContent(html, { waitUntil: "networkidle" });

    // Wait for fonts to load
    await page.waitForTimeout(500);

    const outputPath = join(publicDir, config.filename);
    await page.screenshot({
      path: outputPath,
      type: "png",
    });

    console.log(`   ✅ Saved to public/${config.filename}`);
    await page.close();
  }

  await browser.close();
  console.log("\n🎉 All OG images generated successfully!");
}

generateImages().catch(console.error);
