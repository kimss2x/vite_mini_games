import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

const canvasContext = new Proxy<Record<string, unknown>>({}, {
  get(target, property) {
    if (!(property in target)) target[property as string] = vi.fn();
    return target[property as string];
  },
  set(target, property, value) {
    target[property as string] = value;
    return true;
  },
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn(() => canvasContext),
});

Object.defineProperty(document, 'hidden', {
  configurable: true,
  value: false,
});

afterEach(() => {
  cleanup();
  document.head.querySelectorAll('script[data-turnstile-script="true"]').forEach((node) => node.remove());
  delete window.turnstile;
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
});
