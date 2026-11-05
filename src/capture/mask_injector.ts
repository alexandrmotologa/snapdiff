import type { Page } from 'playwright';

/**
 * Returns CSS that freezes animations, hides carets, and suppresses scrollbars.
 */
export function getStabilizationCSS(): string {
  return `
    *, *::before, *::after {
      animation-duration: 0.0001s !important;
      animation-delay: 0s !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.0001s !important;
      transition-delay: 0s !important;
      scroll-behavior: auto !important;
    }
    * {
      caret-color: transparent !important;
    }
    ::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    html, body {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
  `;
}

/**
 * Returns CSS to neutralize volatile dynamic elements by selector.
 */
export function getDynamicMaskCSS(selectors: string[]): string {
  if (!selectors || selectors.length === 0) {
    return '';
  }

  const combined = selectors.join(',\n');
  return `
    ${combined} {
      background-color: #cbd5e1 !important;
      color: transparent !important;
      border-color: #94a3b8 !important;
      box-shadow: none !important;
      text-shadow: none !important;
      user-select: none !important;
      pointer-events: none !important;
    }
    ${selectors.map(s => `${s} *`).join(',\n')} {
      visibility: hidden !important;
    }
  `;
}

/**
 * Injects stabilization and masking CSS into the Playwright page.
 */
export async function injectStabilizationAndMasks(
  page: Page,
  masks: string[] = [],
  stabilize = true
): Promise<void> {
  let css = '';
  if (stabilize) {
    css += getStabilizationCSS();
  }
  if (masks.length > 0) {
    css += getDynamicMaskCSS(masks);
  }

  if (css.trim().length > 0) {
    await page.addStyleTag({ content: css });
  }
}
