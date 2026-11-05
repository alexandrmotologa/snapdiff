import { describe, it, expect } from 'vitest';
import { getStabilizationCSS, getDynamicMaskCSS } from '../src/capture/mask_injector.js';

describe('Mask injector', () => {
  it('generates stabilization styles to freeze animations and hide carets', () => {
    const css = getStabilizationCSS();
    expect(css).toContain('animation-duration: 0.0001s !important');
    expect(css).toContain('caret-color: transparent !important');
    expect(css).toContain('::-webkit-scrollbar');
  });

  it('generates dynamic masking styles for given selectors', () => {
    const css = getDynamicMaskCSS(['.timestamp', '[data-avatar]']);
    expect(css).toContain('.timestamp');
    expect(css).toContain('[data-avatar]');
    expect(css).toContain('background-color: #cbd5e1 !important');
    expect(css).toContain('visibility: hidden !important');
  });

  it('returns empty string when no selectors are passed', () => {
    expect(getDynamicMaskCSS([])).toBe('');
  });
});
