import type { Page } from 'playwright';
import type { WaitOptions } from '../types.js';

/**
 * Executes a full-page scroll pass to trigger lazy-loaded images and intersection observers.
 */
export async function scrollPageToTriggerLazyLoad(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const maxScrolls = 50; // Safety cap
      let scrollCount = 0;

      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrollCount++;

        if (totalHeight >= scrollHeight || scrollCount >= maxScrolls) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 50);
    });
  });
}

/**
 * Waits for the page to reach visual stabilization based on configured wait strategies.
 */
export async function waitForPageReady(page: Page, options: WaitOptions = {}): Promise<void> {
  const {
    networkIdle = true,
    fontsReady = true,
    scrollLazy = true,
    delay = 200,
    timeout = 15000
  } = options;

  // 1. Wait for load event
  try {
    await page.waitForLoadState('load', { timeout });
  } catch {
    // Continue even if timeout occurs
  }

  // 2. Wait for network idle
  if (networkIdle) {
    try {
      await page.waitForLoadState('networkidle', { timeout: Math.min(timeout, 5000) });
    } catch {
      // Ignore networkidle timeouts for pages with continuous background polling
    }
  }

  // 3. Wait for web fonts to load
  if (fontsReady) {
    try {
      await page.evaluate(async () => {
        if ('fonts' in document) {
          await document.fonts.ready;
        }
      });
    } catch {
      // Fallback
    }
  }

  // 4. Scroll lazy assets
  if (scrollLazy) {
    try {
      await scrollPageToTriggerLazyLoad(page);
    } catch {
      // Fallback
    }
  }

  // 5. Short stabilization delay
  if (delay > 0) {
    await new Promise((r) => setTimeout(r, delay));
  }
}
