#!/usr/bin/env bun
/**
 * Generate Keyboard Shortcut Tables for README
 *
 * Reads the ActionRegistry and outputs markdown tables grouped by category.
 * Run: bun scripts/generate-keyboard-tables.ts
 */

import { ActionRegistry, type ActionDefinition } from '../packages/web/src/keyboard/actionRegistry';
import { formatKeyCombo, type KeyCombo } from '../packages/web/src/keyboard/types';

/**
 * Format shortcuts array to a single display string
 */
function formatShortcuts(shortcuts: KeyCombo | KeyCombo[]): string {
  const combos = Array.isArray(shortcuts) ? shortcuts : [shortcuts];
  if (combos.length === 0) return '—';
  return combos.map(formatKeyCombo).join(' / ');
}

/**
 * Group actions by category
 */
function groupByCategory(actions: ActionDefinition[]): Map<string, ActionDefinition[]> {
  const groups = new Map<string, ActionDefinition[]>();
  for (const action of actions) {
    const category = action.category;
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(action);
  }
  return groups;
}

/**
 * Sort categories in a logical order
 */
function sortCategories(categories: string[]): string[] {
  const order = [
    'Navigation',
    'View',
    'Search',
    'Comparison',
    'Analysis',
    'Simulation',
    'Overlays',
    'Education',
    'Export',
    'Dev',
  ];
  return categories.sort((a, b) => {
    const aIdx = order.indexOf(a);
    const bIdx = order.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
}

/**
 * Generate markdown table for a category
 */
function generateTable(category: string, actions: ActionDefinition[]): string {
  const lines: string[] = [];
  lines.push(`### ${category}`);
  lines.push('');
  lines.push('| Shortcut | Action | Description |');
  lines.push('|----------|--------|-------------|');

  // Sort actions by title within category
  const sorted = [...actions].sort((a, b) => a.title.localeCompare(b.title));

  for (const action of sorted) {
    const shortcut = formatShortcuts(action.defaultShortcut);
    const description = action.description ?? '';
    // Escape pipe characters in description
    const safeDesc = description.replace(/\|/g, '\\|');
    lines.push(`| \`${shortcut}\` | ${action.title} | ${safeDesc} |`);
  }

  return lines.join('\n');
}

// Main
const actions = Object.values(ActionRegistry);
const grouped = groupByCategory(actions);
const sortedCategories = sortCategories([...grouped.keys()]);

const output: string[] = [];
output.push('## Keyboard Shortcuts');
output.push('');
output.push('Phage Explorer uses vim-inspired keyboard navigation. Below are the available shortcuts grouped by category.');
output.push('');

for (const category of sortedCategories) {
  const categoryActions = grouped.get(category)!;
  output.push(generateTable(category, categoryActions));
  output.push('');
}

console.log(output.join('\n'));
