import { describe, it, expect } from 'vitest';
import { PNG } from 'pngjs';
import { compareImages, normalizeImageSizes } from '../src/diff/wasm_pixelmatch.js';

function createSolidPNG(width: number, height: number, r: number, g: number, b: number): Buffer {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

describe('Pixel comparator', () => {
  it('detects 0 differences between identical images', async () => {
    const buf = createSolidPNG(100, 100, 255, 255, 255);
    const result = await compareImages(buf, buf, { threshold: 0.1 });

    expect(result.metrics.mismatchedPixels).toBe(0);
    expect(result.metrics.diffRatio).toBe(0);
    expect(result.metrics.diffPercentage).toBe(0);
    expect(result.metrics.passed).toBe(true);
    expect(result.metrics.boundingBox).toBeUndefined();
  });

  it('detects and localizes pixel differences', async () => {
    const buf1 = createSolidPNG(100, 100, 255, 255, 255);

    // Modify a 20x20 region in buf2
    const png2 = new PNG({ width: 100, height: 100 });
    png2.data.fill(255); // White
    for (let y = 40; y < 60; y++) {
      for (let x = 30; x < 50; x++) {
        const idx = (y * 100 + x) * 4;
        png2.data[idx] = 0; // Black box
        png2.data[idx + 1] = 0;
        png2.data[idx + 2] = 0;
        png2.data[idx + 3] = 255;
      }
    }
    const buf2 = PNG.sync.write(png2);

    const result = await compareImages(buf1, buf2, { colorThreshold: 0.1, diffThreshold: 0.002 });

    expect(result.metrics.mismatchedPixels).toBe(400); // 20 * 20
    expect(result.metrics.totalPixels).toBe(10000);
    expect(result.metrics.diffRatio).toBeCloseTo(0.04);
    expect(result.metrics.diffPercentage).toBeCloseTo(4.0);
    expect(result.metrics.passed).toBe(false); // Exceeds default 0.002
    expect(result.metrics.boundingBox).toEqual({
      minX: 30,
      minY: 40,
      maxX: 49,
      maxY: 59
    });
  });

  it('normalizes images with different dimensions without throwing', async () => {
    const png1 = new PNG({ width: 50, height: 50 });
    png1.data.fill(128);
    const png2 = new PNG({ width: 80, height: 100 });
    png2.data.fill(128);

    const normalized = normalizeImageSizes(png1, png2);
    expect(normalized.width).toBe(80);
    expect(normalized.height).toBe(100);

    const buf1 = PNG.sync.write(png1);
    const buf2 = PNG.sync.write(png2);

    const result = await compareImages(buf1, buf2);
    expect(result.width).toBe(80);
    expect(result.height).toBe(100);
    expect(result.metrics.mismatchedPixels).toBeGreaterThan(0);
  });
});
