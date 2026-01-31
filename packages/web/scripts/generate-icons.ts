/**
 * Generate apple-touch-icon from phage SVG.
 * Run with: bun run scripts/generate-icons.ts
 */
import { chromium } from "playwright";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const phageSvg = readFileSync(join(publicDir, "icons", "phage-og.svg"), "utf-8");
const phageSvgDataUri = `data:image/svg+xml,${encodeURIComponent(phageSvg)}`;

interface IconConfig {
  size: number;
  filename: string;
  background: string;
  padding: number;
}

const icons: IconConfig[] = [
  { size: 180, filename: "apple-touch-icon.png", background: "#0a0a12", padding: 20 },
  { size: 192, filename: "icon-192.png", background: "#0a0a12", padding: 24 },
  { size: 512, filename: "icon-512.png", background: "#0a0a12", padding: 64 },
];

function generateHtml(config: IconConfig): string {
  const { size, background, padding } = config;
  const iconSize = size - padding * 2;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body {
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${background};
      overflow: hidden;
    }
    .icon {
      width: ${iconSize}px;
      height: ${iconSize}px;
      filter: drop-shadow(0 0 ${size / 20}px rgba(34,197,94,0.5));
    }
  </style>
</head>
<body>
  <img src="${phageSvgDataUri}" class="icon" alt="Phage" />
</body>
</html>`;
}

async function generateIcons(): Promise<void> {
  console.log("🧬 Generating app icons...\n");

  const browser = await chromium.launch();

  for (const config of icons) {
    console.log(`📱 Generating ${config.filename} (${config.size}x${config.size})...`);

    const page = await browser.newPage({
      viewport: { width: config.size, height: config.size },
    });

    const html = generateHtml(config);
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.waitForTimeout(200);

    const outputPath = join(publicDir, config.filename);
    await page.screenshot({
      path: outputPath,
      type: "png",
    });

    console.log(`   ✅ Saved to public/${config.filename}`);
    await page.close();
  }

  await browser.close();
  console.log("\n🎉 All icons generated successfully!");
}

generateIcons().catch(console.error);
