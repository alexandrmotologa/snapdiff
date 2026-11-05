import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type {
  AuthOptions,
  ColorScheme,
  PreCaptureAction,
  ViewportConfig,
  WaitOptions
} from '../types.js';
import { injectStabilizationAndMasks } from './mask_injector.js';
import { waitForPageReady } from './wait_strategy.js';

export interface CaptureOptions {
  viewport: ViewportConfig;
  colorScheme?: ColorScheme;
  selector?: string;
  masks?: string[];
  actions?: PreCaptureAction[];
  auth?: AuthOptions;
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
   * Executes pre-capture interaction actions (clicks, hovers, inputs, waits).
   */
  private async executeActions(page: Page, actions: PreCaptureAction[]): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'click': {
          await page.waitForSelector(action.selector, { timeout: action.timeout ?? 5000 });
          await page.click(action.selector);
          break;
        }
        case 'hover': {
          await page.waitForSelector(action.selector, { timeout: action.timeout ?? 5000 });
          await page.hover(action.selector);
          break;
        }
        case 'fill': {
          await page.waitForSelector(action.selector, { timeout: action.timeout ?? 5000 });
          await page.fill(action.selector, action.value);
          break;
        }
        case 'wait': {
          if (action.selector) {
            await page.waitForSelector(action.selector, { timeout: action.timeout ?? 5000 });
          }
          if (action.ms) {
            await page.waitForTimeout(action.ms);
          }
          break;
        }
        case 'evaluate': {
          await page.evaluate(action.script);
          break;
        }
      }
    }
  }

  /**
   * Injects authentication tokens, cookies, and local storage into the page context.
   */
  private async applyAuth(context: BrowserContext, page: Page, auth?: AuthOptions): Promise<void> {
    if (!auth) return;

    // Apply custom headers
    if (auth.headers && Object.keys(auth.headers).length > 0) {
      await page.setExtraHTTPHeaders(auth.headers);
    }

    // Apply cookies
    if (auth.cookies && auth.cookies.length > 0) {
      await context.addCookies(
        auth.cookies.map((c) => ({
          name: c.name,
          value: c.value,
          domain: c.domain ?? 'localhost',
          path: c.path ?? '/',
          httpOnly: c.httpOnly ?? false,
          secure: c.secure ?? false
        }))
      );
    }

    // Apply localStorage & sessionStorage
    if (auth.localStorage || auth.sessionStorage) {
      await page.addInitScript(
        ({ local, session }) => {
          if (local) {
            for (const [k, v] of Object.entries(local)) {
              window.localStorage.setItem(k, v);
            }
          }
          if (session) {
            for (const [k, v] of Object.entries(session)) {
              window.sessionStorage.setItem(k, v);
            }
          }
        },
        { local: auth.localStorage, session: auth.sessionStorage }
      );
    }
  }

  /**
   * Captures a screenshot of the specified URL across a given viewport and color scheme.
   */
  async capture(url: string, options: CaptureOptions): Promise<CaptureResult> {
    if (!this.browser) {
      await this.init();
    }

    const {
      viewport,
      colorScheme = 'light',
      selector,
      masks = [],
      actions = [],
      auth,
      wait = {},
      stabilize = true
    } = options;

    const context: BrowserContext = await this.browser!.newContext({
      viewport: {
        width: viewport.width,
        height: viewport.height
      },
      deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
      isMobile: viewport.isMobile ?? false,
      hasTouch: viewport.hasTouch ?? false,
      colorScheme,
      reducedMotion: 'reduce'
    });

    const page: Page = await context.newPage();

    try {
      // 1. Inject Auth (cookies, headers, storage init scripts)
      await this.applyAuth(context, page, auth);

      // 2. Navigate to target URL
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: wait.timeout ?? 25000 });

      // 3. Apply dynamic masks and stabilization CSS
      await injectStabilizationAndMasks(page, masks, stabilize);

      // 4. Execute pre-capture actions (modal open, tab click, hover, form fill)
      if (actions.length > 0) {
        await this.executeActions(page, actions);
      }

      // 5. Wait for page to stabilize (fonts, lazy load scroll, delay)
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
