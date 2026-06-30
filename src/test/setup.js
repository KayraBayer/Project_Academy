import { afterEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

window.requestAnimationFrame =
  window.requestAnimationFrame ||
  ((callback) => window.setTimeout(() => callback(Date.now()), 0));

window.cancelAnimationFrame = window.cancelAnimationFrame || ((id) => window.clearTimeout(id));

Element.prototype.scrollIntoView = vi.fn();
