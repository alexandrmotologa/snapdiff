import type { ViewportConfig } from '../types.js';

/**
 * Standard responsive viewports covering Mobile, Tablet, and Desktop.
 */
export const DEFAULT_VIEWPORTS: Record<string, ViewportConfig> = {
  mobile: {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  },
  tablet: {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  },
  desktop: {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false
  }
};

/**
 * Normalizes viewport config and fills missing attributes.
 */
export function resolveViewport(name: string, custom?: Partial<ViewportConfig>): ViewportConfig {
  const base = DEFAULT_VIEWPORTS[name] || {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false
  };

  return {
    width: custom?.width ?? base.width,
    height: custom?.height ?? base.height,
    deviceScaleFactor: custom?.deviceScaleFactor ?? base.deviceScaleFactor ?? 1,
    isMobile: custom?.isMobile ?? (custom?.width ? custom.width <= 480 : base.isMobile),
    hasTouch: custom?.hasTouch ?? (custom?.width ? custom.width <= 768 : base.hasTouch)
  };
}
