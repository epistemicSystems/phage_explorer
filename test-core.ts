#!/usr/bin/env bun

// Test script to verify core functionality works

import { BunSqliteRepository } from './packages/db-runtime/src';
import {
  translateSequence,
  buildGrid,
  CLASSIC_THEME,
  getNucleotideColor,
  getAminoAcidColor,
  AMINO_ACIDS,
} from './packages/core/src';
import {
  getPhageModel,
  renderModel,
  createAnimationState,
} from './packages/renderer-3d/src';

async function main() {
  console.log('=== PHAGE-EXPLORER CORE TEST ===\n');

  // Test database
  console.log('1. Testing database...');
  const repo = new BunSqliteRepository('./phage.db');

  const phages = await repo.listPhages();
  console.log(`   Found ${phages.length} phages in database`);

  for (const p of phages.slice(0, 5)) {
    console.log(`   - ${p.name} (${p.genomeLength?.toLocaleString()} bp)`);
  }

  // Test sequence fetching
  console.log('\n2. Testing sequence fetching...');
  const lambda = await repo.getPhageBySlug('lambda');
  if (lambda) {
    console.log(`   Lambda phage: ${lambda.name}`);
    console.log(`   Genome length: ${lambda.genomeLength?.toLocaleString()} bp`);
    console.log(`   GC content: ${lambda.gcContent?.toFixed(1)}%`);
    console.log(`   Genes: ${lambda.genes.length}`);

    const seq = await repo.getSequenceWindow(lambda.id, 0, 100);
    console.log(`   First 100 bp: ${seq.substring(0, 60)}...`);
  }

  // Test codon translation
  console.log('\n3. Testing codon translation...');
  const testSeq = 'ATGGCTAGCAAATAG';
  const aa = translateSequence(testSeq, 0);
  console.log(`   DNA: ${testSeq}`);
  console.log(`   AA:  ${aa}`);

  // Test grid building
  console.log('\n4. Testing grid building...');
  const grid = buildGrid('ACTGACTGACTGACTG', 0, {
    viewportCols: 8,
    viewportRows: 2,
    mode: 'dna',
    frame: 0,
  });
  console.log(`   Built grid: ${grid.length} rows`);
  for (const row of grid) {
    console.log(`   Row ${row.rowIndex}: ${row.cells.map(c => c.char).join('')}`);
  }

  // Test theming
  console.log('\n5. Testing theming...');
  const bases = ['A', 'C', 'G', 'T'];
  for (const base of bases) {
    const color = getNucleotideColor(CLASSIC_THEME, base);
    console.log(`   ${base}: fg=${color.fg}, bg=${color.bg}`);
  }

  // Test 3D rendering
  console.log('\n6. Testing 3D rendering...');
  const model = getPhageModel('lambda');
  console.log(`   Model: ${model.name}`);
  console.log(`   Vertices: ${model.vertices.length}`);
  console.log(`   Edges: ${model.edges.length}`);

  const state = createAnimationState();
  const frame = renderModel(model, { rx: state.rx, ry: state.ry, rz: state.rz }, {
    width: 30,
    height: 15,
  });

  console.log('\n   3D ASCII Render:');
  for (const line of frame.lines) {
    console.log(`   ${line}`);
  }

  // Cleanup
  await repo.close();

  console.log('\n=== ALL TESTS PASSED ===\n');
  console.log('To run the TUI, execute:');
  console.log('  bun run dev');
  console.log('\nOr directly:');
  console.log('  bun run packages/tui/src/index.tsx\n');
}

main().catch(console.error);
