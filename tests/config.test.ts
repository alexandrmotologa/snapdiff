import { describe, it, expect } from 'vitest';
import { parseThreshold, DEFAULT_CONFIG } from '../src/config.js';

describe('Configuration parsing', () => {
  it('parses fractional and percentage thresholds', () => {
    expect(parseThreshold(0.002)).toBe(0.002);
    expect(parseThreshold('0.2%')).toBeCloseTo(0.002);
    expect(parseThreshold('1.5%')).toBeCloseTo(0.015);
    expect(parseThreshold('0.05')).toBeCloseTo(0.05);
    expect(parseThreshold(5)).toBeCloseTo(0.05); // > 1 treated as percentage
  });

  it('has valid default configuration', () => {
    expect(DEFAULT_CONFIG.threshold).toBe(0.002);
    expect(DEFAULT_CONFIG.viewports.mobile.width).toBe(390);
    expect(DEFAULT_CONFIG.viewports.tablet.width).toBe(768);
    expect(DEFAULT_CONFIG.viewports.desktop.width).toBe(1440);
  });
});
