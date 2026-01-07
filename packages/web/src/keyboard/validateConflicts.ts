/**
 * Hotkey Conflict Validator
 *
 * Scans ActionRegistry for duplicate shortcuts and browser-reserved combos.
 * Run at startup in dev/test to catch conflicts early.
 */

import { ActionRegistryList, type ActionDefinition, type ActionScope } from './actionRegistry';
import type { KeyCombo } from './types';

/**
 * Browser-reserved key combinations that cannot be overridden reliably.
 * These vary by browser/OS but this covers the most common ones.
 */
const BROWSER_RESERVED_COMBOS: Array<{ key: string; modifiers?: Partial<Record<'ctrl' | 'alt' | 'shift' | 'meta', boolean>> }> = [
  // Tab management
  { key: 't', modifiers: { ctrl: true } },           // New tab
  { key: 'w', modifiers: { ctrl: true } },           // Close tab
  { key: 'n', modifiers: { ctrl: true } },           // New window
  { key: 'Tab', modifiers: { ctrl: true } },         // Next tab
  { key: 'Tab', modifiers: { ctrl: true, shift: true } }, // Previous tab
  // Navigation
  { key: 'l', modifiers: { ctrl: true } },           // Focus URL bar
  { key: 'r', modifiers: { ctrl: true } },           // Reload
  { key: 'h', modifiers: { ctrl: true } },           // History
  { key: 'd', modifiers: { ctrl: true } },           // Bookmark
  // Find
  { key: 'f', modifiers: { ctrl: true } },           // Find
  { key: 'g', modifiers: { ctrl: true } },           // Find next
  // Dev tools
  { key: 'i', modifiers: { ctrl: true, shift: true } }, // Dev tools
  { key: 'j', modifiers: { ctrl: true, shift: true } }, // Dev tools console
  // Window
  { key: 'F11' },                                    // Fullscreen
  // Zoom (often intercepted)
  { key: '+', modifiers: { ctrl: true } },
  { key: '-', modifiers: { ctrl: true } },
  { key: '0', modifiers: { ctrl: true } },           // Reset zoom
  // Print
  { key: 'p', modifiers: { ctrl: true } },
  // Save
  { key: 's', modifiers: { ctrl: true } },
];

export interface ConflictInfo {
  shortcut: string;
  actions: Array<{
    id: string;
    title: string;
    scope: ActionScope;
    surface?: string;
  }>;
  severity: 'error' | 'warning';
  message: string;
}

export interface BrowserReservedInfo {
  actionId: string;
  actionTitle: string;
  shortcut: string;
  reservedFor: string;
}

export interface ValidationResult {
  valid: boolean;
  conflicts: ConflictInfo[];
  browserReserved: BrowserReservedInfo[];
  summary: string;
}

/**
 * Serialize a KeyCombo to a canonical string for comparison.
 * Format: "mod1+mod2+key" where modifiers are sorted alphabetically.
 */
function serializeCombo(combo: KeyCombo): string {
  const parts: string[] = [];

  if (combo.modifiers?.meta) parts.push('meta');
  if (combo.modifiers?.ctrl) parts.push('ctrl');
  if (combo.modifiers?.alt) parts.push('alt');
  if (combo.modifiers?.shift) parts.push('shift');

  // Sort modifiers for consistent comparison
  parts.sort();

  if ('sequence' in combo) {
    parts.push(`seq:${combo.sequence.join('')}`);
  } else {
    // Normalize key to lowercase for comparison (but keep special keys as-is)
    const key = combo.key.length === 1 ? combo.key.toLowerCase() : combo.key;
    parts.push(key);
  }

  return parts.join('+');
}

/**
 * Format a serialized combo for human-readable display.
 */
function formatComboForDisplay(serialized: string): string {
  return serialized
    .replace('meta+', '⌘')
    .replace('ctrl+', 'Ctrl+')
    .replace('alt+', 'Alt+')
    .replace('shift+', 'Shift+')
    .replace('seq:', '');
}

/**
 * Check if a combo matches a browser-reserved combo.
 */
function matchesBrowserReserved(combo: KeyCombo): { matches: boolean; reservedFor?: string } {
  if ('sequence' in combo) {
    // Sequences don't conflict with browser shortcuts
    return { matches: false };
  }

  const key = combo.key.toLowerCase();
  const mods = combo.modifiers || {};

  for (const reserved of BROWSER_RESERVED_COMBOS) {
    const reservedKey = reserved.key.toLowerCase();
    const reservedMods = reserved.modifiers || {};

    if (key !== reservedKey) continue;

    // Check all modifier matches
    const ctrlMatch = (!!mods.ctrl) === (!!reservedMods.ctrl);
    const altMatch = (!!mods.alt) === (!!reservedMods.alt);
    const shiftMatch = (!!mods.shift) === (!!reservedMods.shift);
    const metaMatch = (!!mods.meta) === (!!reservedMods.meta);

    if (ctrlMatch && altMatch && shiftMatch && metaMatch) {
      // Describe what this combo is reserved for
      const reservedFor = describeReservedCombo(reserved);
      return { matches: true, reservedFor };
    }
  }

  return { matches: false };
}

function describeReservedCombo(combo: { key: string; modifiers?: Partial<Record<string, boolean>> }): string {
  const descriptions: Record<string, string> = {
    't+ctrl': 'New tab',
    'w+ctrl': 'Close tab',
    'n+ctrl': 'New window',
    'tab+ctrl': 'Switch tabs',
    'l+ctrl': 'Focus URL bar',
    'r+ctrl': 'Reload page',
    'h+ctrl': 'History',
    'd+ctrl': 'Bookmark',
    'f+ctrl': 'Find in page',
    'g+ctrl': 'Find next',
    'i+ctrl+shift': 'Developer tools',
    'j+ctrl+shift': 'Console',
    'f11': 'Fullscreen',
    '+ctrl': 'Zoom in',
    '-+ctrl': 'Zoom out',
    '0+ctrl': 'Reset zoom',
    'p+ctrl': 'Print',
    's+ctrl': 'Save page',
  };

  const parts: string[] = [];
  if (combo.modifiers?.ctrl) parts.push('ctrl');
  if (combo.modifiers?.shift) parts.push('shift');
  parts.push(combo.key.toLowerCase());
  const key = parts.join('+');

  return descriptions[key] || 'Browser function';
}

/**
 * Get all combos for an action, handling both single and array shortcuts.
 */
function getCombos(action: ActionDefinition): KeyCombo[] {
  const shortcut = action.defaultShortcut;
  return Array.isArray(shortcut) ? shortcut : [shortcut];
}

/**
 * Validate the ActionRegistry for conflicts.
 *
 * @param options.surface - Only check actions for this surface (default: 'web')
 * @param options.checkBrowserReserved - Check for browser-reserved combos (default: true)
 */
export function validateHotkeyConflicts(options: {
  surface?: 'web' | 'tui';
  checkBrowserReserved?: boolean;
} = {}): ValidationResult {
  const { surface = 'web', checkBrowserReserved = true } = options;

  // Filter actions by surface
  const actions = ActionRegistryList.filter(action =>
    !action.surfaces || action.surfaces.includes(surface)
  );

  // Group actions by their serialized shortcut
  const shortcutMap = new Map<string, Array<{
    action: ActionDefinition;
    combo: KeyCombo;
  }>>();

  for (const action of actions) {
    for (const combo of getCombos(action)) {
      const key = serializeCombo(combo);
      const existing = shortcutMap.get(key) ?? [];
      existing.push({ action, combo });
      shortcutMap.set(key, existing);
    }
  }

  const conflicts: ConflictInfo[] = [];
  const browserReserved: BrowserReservedInfo[] = [];

  // Check for conflicts between actions
  for (const [shortcut, entries] of shortcutMap) {
    if (entries.length < 2) continue;

    // Separate by scope
    const globalActions = entries.filter(e => e.action.scope === 'global');
    const contextualActions = entries.filter(e => e.action.scope === 'contextual');

    // Multiple globals with same shortcut = ERROR
    if (globalActions.length > 1) {
      conflicts.push({
        shortcut: formatComboForDisplay(shortcut),
        actions: globalActions.map(e => ({
          id: e.action.id,
          title: e.action.title,
          scope: e.action.scope,
        })),
        severity: 'error',
        message: `Multiple global actions share the same shortcut`,
      });
    }

    // Global + contextual with same shortcut = WARNING (contextual might shadow global)
    if (globalActions.length >= 1 && contextualActions.length >= 1) {
      conflicts.push({
        shortcut: formatComboForDisplay(shortcut),
        actions: [...globalActions, ...contextualActions].map(e => ({
          id: e.action.id,
          title: e.action.title,
          scope: e.action.scope,
        })),
        severity: 'warning',
        message: `Contextual action may shadow global action when active`,
      });
    }

    // Multiple contextual = OK (they're in different contexts by design)
  }

  // Check for browser-reserved combos
  if (checkBrowserReserved) {
    for (const action of actions) {
      for (const combo of getCombos(action)) {
        const check = matchesBrowserReserved(combo);
        if (check.matches) {
          browserReserved.push({
            actionId: action.id,
            actionTitle: action.title,
            shortcut: formatComboForDisplay(serializeCombo(combo)),
            reservedFor: check.reservedFor!,
          });
        }
      }
    }
  }

  // Build summary
  const errorCount = conflicts.filter(c => c.severity === 'error').length;
  const warningCount = conflicts.filter(c => c.severity === 'warning').length;
  const reservedCount = browserReserved.length;

  let summary: string;
  if (errorCount === 0 && warningCount === 0 && reservedCount === 0) {
    summary = `No hotkey conflicts detected (${actions.length} actions checked)`;
  } else {
    const parts: string[] = [];
    if (errorCount > 0) parts.push(`${errorCount} conflict${errorCount > 1 ? 's' : ''}`);
    if (warningCount > 0) parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);
    if (reservedCount > 0) parts.push(`${reservedCount} browser-reserved`);
    summary = `Found ${parts.join(', ')} (${actions.length} actions checked)`;
  }

  return {
    valid: errorCount === 0,
    conflicts,
    browserReserved,
    summary,
  };
}

/**
 * Run validation and throw if conflicts are found.
 * Intended for use in tests.
 */
export function assertNoHotkeyConflicts(options: Parameters<typeof validateHotkeyConflicts>[0] = {}): void {
  const result = validateHotkeyConflicts(options);

  if (!result.valid) {
    const errorDetails = result.conflicts
      .filter(c => c.severity === 'error')
      .map(c => {
        const actionList = c.actions.map(a => `  - ${a.id} (${a.scope}): "${a.title}"`).join('\n');
        return `Shortcut "${c.shortcut}":\n${actionList}`;
      })
      .join('\n\n');

    throw new Error(`Hotkey conflicts detected:\n\n${errorDetails}`);
  }
}

/**
 * Log validation results to console.
 * Intended for use in dev startup.
 */
export function logValidationResults(result: ValidationResult): void {
  if (result.valid && result.conflicts.length === 0 && result.browserReserved.length === 0) {
    console.log(`[Hotkeys] ${result.summary}`);
    return;
  }

  console.group('[Hotkeys] Validation Results');
  console.log(result.summary);

  // Log errors
  const errors = result.conflicts.filter(c => c.severity === 'error');
  if (errors.length > 0) {
    console.group('Conflicts (must fix)');
    for (const error of errors) {
      console.error(`${error.shortcut}: ${error.message}`);
      for (const action of error.actions) {
        console.error(`  - ${action.id} [${action.scope}]`);
      }
    }
    console.groupEnd();
  }

  // Log warnings
  const warnings = result.conflicts.filter(c => c.severity === 'warning');
  if (warnings.length > 0) {
    console.group('Warnings (review recommended)');
    for (const warning of warnings) {
      console.warn(`${warning.shortcut}: ${warning.message}`);
      for (const action of warning.actions) {
        console.warn(`  - ${action.id} [${action.scope}]`);
      }
    }
    console.groupEnd();
  }

  // Log browser-reserved
  if (result.browserReserved.length > 0) {
    console.group('Browser-Reserved Combos');
    for (const reserved of result.browserReserved) {
      console.warn(`${reserved.shortcut} (${reserved.reservedFor}): ${reserved.actionId}`);
    }
    console.groupEnd();
  }

  console.groupEnd();
}
