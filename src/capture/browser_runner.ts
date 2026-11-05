import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { ViewportConfig, WaitOptions } from '../types.js';
import { injectStabilizationAndMasks } from './mask_injector.js';
import { waitForPageReady } from './wait_strategy.js';

export interface CaptureOptions {
  viewport: ViewportConfig;
  selector?: string;
  masks?: string[];
  wait?: WaitOptions;
  stabilize?: boolean;
}

export interface CaptureResult {
  buffer: Buffer;
  width: number;
  height: number;
}

export class BrowserRunner {
  private browser: Browser | null = null;
  private headless: boolean;

  constructor(headless = true) {
    this.headless = headless;
  }

  /**
   * Initializes headless Chromium instance with consistent font rendering flags.
   */
  async init(): Promise<void> {
    if (this.browser) return;

    this.browser = await chromium.launch({
      headless: this.headless,
      args: [
        '--font-render-hinting=none',
        '--enable-font-antialiasing',
        '--disable-skia-runtime-opts',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
  }

  /**
   * Closes the active browser instance.
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Captures a screenshot of the specified URL across a given viewport.
   */
  async capture(url: string, options: CaptureOptions): Promise<CaptureResult> {
    if (!this.browser) {
      await this.init();
    }

    const { viewport, selector, masks = [], wait = {}, stabilize = true } = options;

    const context: BrowserContext = await this.browser!.newContext({
      viewport: {
        width: viewport.width,
        height: viewport.height
      },
      deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
      isMobile: viewport.isMobile ?? false,
      hasTouch: viewport.hasTouch ?? false,
      colorScheme: 'light',
      reducedMotion: 'reduce'
    });

    const page: Page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: wait.timeout ?? 20000 });

      // Apply dynamic masks and stabilization CSS
      await injectStabilizationAndMasks(page, masks, stabilize);

      // Wait for page to stabilize (fonts, lazy load scroll, delay)
      await waitForPageReady(page, wait);

      let buffer: Buffer;

      if (selector) {
        const element = await page.waitForSelector(selector, { timeout: 10000 });
        if (!element) {
          throw new Error(`Element matching selector "${selector}" not found on ${url}`);
        }
        buffer = await element.screenshot({ type: 'png' });
      } else {
        buffer = await page.screenshot({ fullPage: true, type: 'png' });
      }

      const size = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight
      }));

      return {
        buffer,
        width: size.width,
        height: size.height
      };
    } finally {
      await page.close();
      await context.close();
    }
  }
}
