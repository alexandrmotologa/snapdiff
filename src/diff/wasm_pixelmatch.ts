import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import type { DiffMetrics } from '../types.js';

export interface DiffOptions {
  colorThreshold?: number; // Pixelmatch color delta threshold (0 to 1, default: 0.1)
  diffThreshold?: number;  // Max diff ratio for pass/fail (e.g. 0.002 = 0.2%, default: 0.002)
  threshold?: number;      // Backward compatible alias
  diffColor?: [number, number, number];
  diffColorAlt?: [number, number, number];
  includeAA?: boolean;
  alpha?: number;
}

export interface DiffResult {
  metrics: DiffMetrics;
  diffPngBuffer: Buffer;
  width: number;
  height: number;
}

/**
 * Normalizes two PNG images to equal dimensions by padding the smaller image.
 */
export function normalizeImageSizes(img1: PNG, img2: PNG): {
  normalized1: PNG;
  normalized2: PNG;
  width: number;
  height: number;
} {
  const width = Math.max(img1.width, img2.width);
  const height = Math.max(img1.height, img2.height);

  if (img1.width === width && img1.height === height && img2.width === width && img2.height === height) {
    return { normalized1: img1, normalized2: img2, width, height };
  }

  // Create new padded image 1
  const normalized1 = new PNG({ width, height });
  normalized1.data.fill(0);
  PNG.bitblt(img1, normalized1, 0, 0, img1.width, img1.height, 0, 0);

  // Create new padded image 2
  const normalized2 = new PNG({ width, height });
  normalized2.data.fill(0);
  PNG.bitblt(img2, normalized2, 0, 0, img2.width, img2.height, 0, 0);

  return { normalized1, normalized2, width, height };
}

/**
 * WebAssembly-assisted pixel comparison with bounding box tracking and anti-aliasing detection.
 */
export async function compareImages(
  baselineBuffer: Buffer,
  currentBuffer: Buffer,
  options: DiffOptions = {}
): Promise<DiffResult> {
  const startTime = performance.now();

  const img1 = PNG.sync.read(baselineBuffer);
  const img2 = PNG.sync.read(currentBuffer);

  const { normalized1, normalized2, width, height } = normalizeImageSizes(img1, img2);
  const diffPng = new PNG({ width, height });

  const colorThreshold = options.colorThreshold ?? (options.threshold !== undefined && options.threshold > 0.05 ? options.threshold : 0.1);
  const diffThreshold = options.diffThreshold ?? (options.threshold !== undefined && options.threshold <= 0.05 ? options.threshold : 0.002);

  const diffColor = options.diffColor ?? [255, 0, 255]; // Magenta
  const includeAA = options.includeAA ?? false;
  const alpha = options.alpha ?? 0.1;

  // Execute pixel-level comparison
  const mismatchedPixels = pixelmatch(
    normalized1.data,
    normalized2.data,
    diffPng.data,
    width,
    height,
    {
      threshold: colorThreshold,
      diffColor,
      includeAA,
      alpha
    }
  );

  // Calculate bounding box of differences
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  if (mismatchedPixels > 0) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = diffPng.data[idx];
        const g = diffPng.data[idx + 1];
        const b = diffPng.data[idx + 2];

        // Check if this pixel matches our diffColor
        if (r === diffColor[0] && g === diffColor[1] && b === diffColor[2]) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  const totalPixels = width * height;
  const diffRatio = totalPixels > 0 ? mismatchedPixels / totalPixels : 0;
  const diffPercentage = Number.parseFloat((diffRatio * 100).toFixed(4));
  const durationMs = Math.round(performance.now() - startTime);

  const metrics: DiffMetrics = {
    totalPixels,
    mismatchedPixels,
    diffRatio,
    diffPercentage,
    threshold: diffThreshold,
    passed: diffRatio <= diffThreshold,
    boundingBox: mismatchedPixels > 0 ? { minX, minY, maxX, maxY } : undefined,
    durationMs
  };

  const diffPngBuffer = PNG.sync.write(diffPng);

  return {
    metrics,
    diffPngBuffer,
    width,
    height
  };
}
