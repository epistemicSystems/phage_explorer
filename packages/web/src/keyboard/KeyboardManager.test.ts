/**
 * KeyboardManager typing guard tests
 *
 * Ensures global hotkeys do not trigger while typing unless explicitly allowed.
 */

import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { KeyboardManager } from './KeyboardManager';
import { ActionIds, getOverlayHotkeyActions } from './actionRegistry';
import type { HotkeyDefinition } from './types';

type GlobalSnapshot = {
  Element?: typeof Element;
  document?: Document;
  window?: Window & typeof globalThis;
};

function createKeyboardEvent(target: Element): globalThis.KeyboardEvent {
  return {
    key: 'k',
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    target,
    composedPath: () => [target],
    preventDefault: () => undefined,
    stopPropagation: () => undefined,
  } as unknown as globalThis.KeyboardEvent;
}

describe('KeyboardManager typing guards', () => {
  const original: GlobalSnapshot = {};

  beforeEach(() => {
    original.Element = globalThis.Element;
    original.document = globalThis.document;
    original.window = globalThis.window;

    class TestElement {}
    (globalThis as unknown as { Element: typeof Element }).Element = TestElement as unknown as typeof Element;

    (globalThis as unknown as { document: Document }).document = {
      activeElement: null,
    } as Document;

    (globalThis as unknown as { window: Window & typeof globalThis }).window = {
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    } as Window & typeof globalThis;
  });

  afterEach(() => {
    if (original.Element) {
      (globalThis as unknown as { Element: typeof Element }).Element = original.Element;
    } else {
      delete (globalThis as unknown as { Element?: typeof Element }).Element;
    }

    if (original.document) {
      (globalThis as unknown as { document: Document }).document = original.document;
    } else {
      delete (globalThis as unknown as { document?: Document }).document;
    }

    if (original.window) {
      (globalThis as unknown as { window: Window & typeof globalThis }).window = original.window;
    } else {
      delete (globalThis as unknown as { window?: Window & typeof globalThis }).window;
    }
  });

  it('does not trigger hotkeys while typing by default', () => {
    const manager = new KeyboardManager();
    let fired = 0;

    const definition: HotkeyDefinition = {
      actionId: ActionIds.OverlayHelp,
      combo: { key: 'k' },
      description: 'Test hotkey',
      action: () => {
        fired += 1;
      },
      modes: ['NORMAL'],
    };

    manager.register(definition);

	    const input = new (globalThis as unknown as { Element: typeof Element }).Element();
	    (input as unknown as { tagName: string }).tagName = 'INPUT';
	    (input as unknown as { isContentEditable: boolean }).isContentEditable = false;
	    (globalThis.document as unknown as { activeElement: Element | null }).activeElement = input as unknown as Element;

    const event = createKeyboardEvent(input as unknown as Element);
    (manager as unknown as { handleKeyDown: (event: globalThis.KeyboardEvent) => void }).handleKeyDown(event);

    expect(fired).toBe(0);
  });

  it('allows hotkeys when allowInInput is true', () => {
    const manager = new KeyboardManager();
    let fired = 0;

    const definition: HotkeyDefinition = {
      actionId: ActionIds.OverlayHelp,
      combo: { key: 'k' },
      description: 'Allowed hotkey',
      action: () => {
        fired += 1;
      },
      modes: ['NORMAL'],
      allowInInput: true,
    };

    manager.register(definition);

	    const input = new (globalThis as unknown as { Element: typeof Element }).Element();
	    (input as unknown as { tagName: string }).tagName = 'INPUT';
	    (input as unknown as { isContentEditable: boolean }).isContentEditable = false;
	    (globalThis.document as unknown as { activeElement: Element | null }).activeElement = input as unknown as Element;

    const event = createKeyboardEvent(input as unknown as Element);
    (manager as unknown as { handleKeyDown: (event: globalThis.KeyboardEvent) => void }).handleKeyDown(event);

    expect(fired).toBe(1);
  });
});

describe('ActionRegistry overlay hotkeys', () => {
  it('keeps overlay open actions globally available for lazy overlays', () => {
    const overlayActions = getOverlayHotkeyActions();
    expect(overlayActions.length).toBeGreaterThan(0);

    const ids = overlayActions.map((action) => action.actionId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(ActionIds.OverlayHelp);
  });
});
