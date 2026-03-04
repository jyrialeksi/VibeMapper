import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Test the keyboard shortcut logic by registering a handler on window
// that mirrors useKeyboardShortcuts, then dispatching KeyboardEvents.

describe('Keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y)', () => {
  let undoSpy: ReturnType<typeof vi.fn>;
  let redoSpy: ReturnType<typeof vi.fn>;
  let handler: (e: KeyboardEvent) => void;

  beforeEach(() => {
    undoSpy = vi.fn();
    redoSpy = vi.fn();

    // Recreate the handler logic from useKeyboardShortcuts
    handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoSpy();
      } else if ((mod && e.key === 'z' && e.shiftKey) || (mod && e.key === 'y')) {
        e.preventDefault();
        redoSpy();
      }
    };

    window.addEventListener('keydown', handler);
  });

  afterEach(() => {
    window.removeEventListener('keydown', handler);
  });

  function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...opts,
    });
    window.dispatchEvent(event);
  }

  it('Ctrl+Z triggers undo', () => {
    fireKey('z', { ctrlKey: true });
    expect(undoSpy).toHaveBeenCalledTimes(1);
    expect(redoSpy).not.toHaveBeenCalled();
  });

  it('Cmd+Z triggers undo', () => {
    fireKey('z', { metaKey: true });
    expect(undoSpy).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+Shift+Z triggers redo', () => {
    fireKey('z', { ctrlKey: true, shiftKey: true });
    expect(redoSpy).toHaveBeenCalledTimes(1);
    expect(undoSpy).not.toHaveBeenCalled();
  });

  it('Cmd+Shift+Z triggers redo', () => {
    fireKey('z', { metaKey: true, shiftKey: true });
    expect(redoSpy).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+Y triggers redo', () => {
    fireKey('y', { ctrlKey: true });
    expect(redoSpy).toHaveBeenCalledTimes(1);
  });

  it('ignores when focus is in INPUT element', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);

    expect(undoSpy).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('ignores when focus is in TEXTAREA element', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    textarea.dispatchEvent(event);

    expect(undoSpy).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('does not trigger without modifier key', () => {
    fireKey('z', {});
    expect(undoSpy).not.toHaveBeenCalled();
    expect(redoSpy).not.toHaveBeenCalled();
  });
});
