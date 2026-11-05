import fs from 'node:fs';
import type { BaselineStore } from './store.js';
import type { ColorScheme } from '../types.js';

export interface ApprovalResult {
  success: boolean;
  approvedCount: number;
  approvedSnapshots: string[];
  error?: string;
}

/**
 * Promotes a single snapshot from current to baseline.
 */
export async function approveSnapshot(
  store: BaselineStore,
  targetName: string,
  viewportName: string,
  colorScheme: ColorScheme = 'light'
): Promise<boolean> {
  const currentBuffer = await store.readCurrent(targetName, viewportName, colorScheme);
  if (!currentBuffer) {
    throw new Error(
      `Current snapshot not found for target "${targetName}", viewport "${viewportName}" [${colorScheme}]`
    );
  }

  // Save buffer to baseline (store automatically archives previous baseline to history)
  await store.saveBaseline(targetName, viewportName, currentBuffer, colorScheme);

  // Remove diff image if present
  const diffPath = store.getDiffPath(targetName, viewportName, colorScheme);
  if (fs.existsSync(diffPath)) {
    try {
      await fs.promises.unlink(diffPath);
    } catch {
      // Ignore
    }
  }

  // Update manifest
  const manifest = store.loadManifest();
  if (manifest) {
    const snap = manifest.snapshots.find(
      (s) =>
        s.targetName === targetName &&
        s.viewportName === viewportName &&
        (s.colorScheme ?? 'light') === colorScheme
    );

    if (snap) {
      const prevStatus = snap.status;
      snap.status = 'passed';
      snap.baselinePath = store.getBaselinePath(targetName, viewportName, colorScheme);
      snap.diffPath = undefined;
      if (snap.metrics) {
        snap.metrics.mismatchedPixels = 0;
        snap.metrics.diffRatio = 0;
        snap.metrics.diffPercentage = 0;
        snap.metrics.passed = true;
        snap.metrics.boundingBox = undefined;
      }
      snap.updatedAt = new Date().toISOString();

      if (prevStatus === 'failed') {
        manifest.summary.failed = Math.max(0, manifest.summary.failed - 1);
        manifest.summary.passed += 1;
      } else if (prevStatus === 'new_baseline') {
        manifest.summary.newBaselines = Math.max(0, manifest.summary.newBaselines - 1);
        manifest.summary.passed += 1;
      }

      await store.saveManifest(manifest);
    }
  }

  return true;
}

/**
 * Promotes all failed or new snapshots in the current manifest to baseline.
 */
export async function approveAllSnapshots(store: BaselineStore): Promise<ApprovalResult> {
  const manifest = store.loadManifest();
  if (!manifest) {
    return {
      success: false,
      approvedCount: 0,
      approvedSnapshots: [],
      error: 'No manifest found to approve.'
    };
  }

  const approvedSnapshots: string[] = [];

  for (const snap of manifest.snapshots) {
    if (snap.status === 'failed' || snap.status === 'new_baseline') {
      try {
        await approveSnapshot(store, snap.targetName, snap.viewportName, snap.colorScheme || 'light');
        approvedSnapshots.push(`${snap.targetName} [${snap.viewportName}:${snap.colorScheme || 'light'}]`);
      } catch {
        // Continue with others
      }
    }
  }

  return {
    success: true,
    approvedCount: approvedSnapshots.length,
    approvedSnapshots
  };
}
