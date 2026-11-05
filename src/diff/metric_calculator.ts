import type { DiffMetrics } from '../types.js';

/**
 * Evaluates whether diff ratio is within acceptable threshold.
 */
export function isDiffPassing(diffRatio: number, threshold: number): boolean {
  return diffRatio <= threshold;
}

/**
 * Formats diff ratio as human-readable percentage string (e.g. "0.04%").
 */
export function formatPercentage(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`;
}

/**
 * Computes aggregate summary statistics for a collection of diff metrics.
 */
export function calculateAggregateMetrics(metricsList: DiffMetrics[]): {
  totalSnapshots: number;
  passedSnapshots: number;
  failedSnapshots: number;
  averageDiffPercentage: number;
  maxDiffPercentage: number;
} {
  if (metricsList.length === 0) {
    return {
      totalSnapshots: 0,
      passedSnapshots: 0,
      failedSnapshots: 0,
      averageDiffPercentage: 0,
      maxDiffPercentage: 0
    };
  }

  let totalDiff = 0;
  let maxDiff = 0;
  let passedCount = 0;

  for (const m of metricsList) {
    totalDiff += m.diffPercentage;
    if (m.diffPercentage > maxDiff) {
      maxDiff = m.diffPercentage;
    }
    if (m.passed) {
      passedCount++;
    }
  }

  return {
    totalSnapshots: metricsList.length,
    passedSnapshots: passedCount,
    failedSnapshots: metricsList.length - passedCount,
    averageDiffPercentage: Number.parseFloat((totalDiff / metricsList.length).toFixed(3)),
    maxDiffPercentage: Number.parseFloat(maxDiff.toFixed(3))
  };
}
