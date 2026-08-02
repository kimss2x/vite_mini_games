import { createElement, useEffect } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  GAME_KEYBOARD_CAPTURE_OPTIONS,
  addGameKeyboardListener,
} from './gameKeyboard';

describe('addGameKeyboardListener', () => {
  it('React mount/unmount lifecycle에서도 같은 listener를 제거한다', () => {
    const handler = vi.fn();

    function KeyboardProbe() {
      useEffect(() => addGameKeyboardListener('keydown', handler), []);
      return null;
    }

    const view = render(createElement(KeyboardProbe));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    expect(handler).toHaveBeenCalledTimes(1);

    view.unmount();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('동일한 event type, wrapper reference, capture 값으로 제거한다', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const handler = vi.fn();

    const cleanup = addGameKeyboardListener('keydown', handler);
    const addCall = addSpy.mock.calls.find(([type]) => type === 'keydown');
    expect(addCall).toBeDefined();

    cleanup();
    expect(removeSpy).toHaveBeenCalledWith(
      'keydown',
      addCall?.[1],
      GAME_KEYBOARD_CAPTURE_OPTIONS,
    );
  });

  it('입력 필드, dialog, hidden document에서 keydown을 무시한다', () => {
    const handler = vi.fn();
    const cleanup = addGameKeyboardListener('keydown', handler);

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    document.body.appendChild(dialog);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));

    dialog.remove();
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));

    expect(handler).not.toHaveBeenCalled();
    cleanup();
    input.remove();
  });

  it('정상 keydown은 한 번만 전달하고 cleanup 후에는 전달하지 않는다', () => {
    const handler = vi.fn();
    const cleanup = addGameKeyboardListener('keydown', handler);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    expect(handler).toHaveBeenCalledTimes(1);

    cleanup();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
