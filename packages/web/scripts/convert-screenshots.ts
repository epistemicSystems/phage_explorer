/**
 * Convert screenshots to webp with descriptive names using sharp.
 * Run with: bun run scripts/convert-screenshots.ts
 */
import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(__dirname, "..", "screenshots");
const outputDir = join(__dirname, "..", "..", "..", "docs", "images");

// Mapping of old filenames to new descriptive names
const nameMapping: Record<string, string> = {
  "01-homepage.png": "hero_welcome_modal.webp",
  "03-sequence-view.png": "lambda_phage_3d_structure.webp",
  "04-phage-selector.png": "phage_selector_with_preview.webp",
  "05-control-deck.png": "main_interface_overview.webp",
  "08-help-overlay.png": "keyboard_shortcuts_help.webp",
  "09-3d-model.png": "three_dimensional_protein_view.webp",
  "10-analysis-menu.png": "analysis_menu_tools.webp",
  "11-complexity-analysis.png": "sequence_complexity_analysis.webp",
  "12-gc-skew.png": "gc_skew_visualization.webp",
  "13-zoomed-in.png": "sequence_grid_zoomed_detail.webp",
  "14-zoomed-out.png": "sequence_grid_full_genome.webp",
  "15-mobile-view.png": "mobile_responsive_interface.webp",
  "16-mobile-action-drawer.png": "mobile_action_drawer.webp",
  "17-dark-theme.png": "terminal_aesthetic_dark_theme.webp",
  "20-final-overview-1080p.png": "desktop_full_interface.webp",
};

async function convertScreenshots(): Promise<void> {
  console.log("🖼️  Converting screenshots to WebP with sharp...\n");

  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created ${outputDir}\n`);
  }

  const files = readdirSync(screenshotsDir).filter(f => f.endsWith(".png"));
  let converted = 0;
  let totalSavedBytes = 0;

  for (const file of files) {
    const newName = nameMapping[file];
    if (!newName) {
      console.log(`⏭️  Skipping ${file} (no mapping defined)`);
      continue;
    }

    const inputPath = join(screenshotsDir, file);
    const outputPath = join(outputDir, newName);

    try {
      const inputStats = Bun.file(inputPath);
      const inputSize = inputStats.size;

      await sharp(inputPath)
        .webp({ quality: 85, effort: 6 })
        .toFile(outputPath);

      const outputStats = Bun.file(outputPath);
      const outputSize = outputStats.size;
      const savedBytes = inputSize - outputSize;
      const savedPercent = ((savedBytes / inputSize) * 100).toFixed(1);

      totalSavedBytes += savedBytes;
      converted++;

      console.log(`✅ ${file}`);
      console.log(`   → ${newName} (${(outputSize / 1024).toFixed(0)}KB, -${savedPercent}%)`);
    } catch (err) {
      console.log(`❌ Failed to convert ${file}:`, err);
    }
  }

  console.log(`\n🎉 Converted ${converted} screenshots!`);
  console.log(`💾 Total space saved: ${(totalSavedBytes / 1024).toFixed(0)}KB`);
  console.log(`📂 Output: ${outputDir}`);
}

convertScreenshots().catch(console.error);
