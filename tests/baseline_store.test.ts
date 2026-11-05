import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { BaselineStore } from '../src/baseline/store.js';
import { approveSnapshot, approveAllSnapshots } from '../src/baseline/approver.js';
import type { RunManifest } from '../src/types.js';

describe('Baseline store and approver', () => {
  const testDir = path.resolve(process.cwd(), '.snapdiff_test');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('manages baselines and manifests correctly', async () => {
    const store = new BaselineStore('.snapdiff_test');
    expect(store.hasBaseline('home', 'mobile')).toBe(false);

    const dummyBuf = Buffer.from('test-image-data');
    await store.saveBaseline('home', 'mobile', dummyBuf);
    expect(store.hasBaseline('home', 'mobile')).toBe(true);

    const readBuf = await store.readBaseline('home', 'mobile');
    expect(readBuf?.toString()).toBe('test-image-data');

    const manifest: RunManifest = {
      runId: 'test-run-1',
      timestamp: new Date().toISOString(),
      summary: { total: 1, passed: 1, failed: 0, newBaselines: 0, durationMs: 100 },
      snapshots: [
        {
          id: 'home-mobile',
          targetName: 'home',
          url: 'http://localhost:3000',
          viewportName: 'mobile',
          viewport: { width: 390, height: 844 },
          status: 'passed',
          updatedAt: new Date().toISOString()
        }
      ]
    };

    await store.saveManifest(manifest);
    const loaded = store.loadManifest();
    expect(loaded?.runId).toBe('test-run-1');
    expect(loaded?.snapshots.length).toBe(1);
  });

  it('approves snapshots and promotes current to baseline', async () => {
    const store = new BaselineStore('.snapdiff_test');
    const dummyCurrent = Buffer.from('current-pixel-data');
    await store.saveCurrent('pricing', 'desktop', dummyCurrent);

    const manifest: RunManifest = {
      runId: 'test-run-2',
      timestamp: new Date().toISOString(),
      summary: { total: 1, passed: 0, failed: 1, newBaselines: 0, durationMs: 200 },
      snapshots: [
        {
          id: 'pricing-desktop',
          targetName: 'pricing',
          url: 'http://localhost:3000/pricing',
          viewportName: 'desktop',
          viewport: { width: 1440, height: 900 },
          status: 'failed',
          metrics: {
            totalPixels: 1000,
            mismatchedPixels: 50,
            diffRatio: 0.05,
            diffPercentage: 5,
            threshold: 0.002,
            passed: false,
            durationMs: 50
          },
          updatedAt: new Date().toISOString()
        }
      ]
    };

    await store.saveManifest(manifest);

    // Approve snapshot
    await approveSnapshot(store, 'pricing', 'desktop');

    const baseline = await store.readBaseline('pricing', 'desktop');
    expect(baseline?.toString()).toBe('current-pixel-data');

    const updatedManifest = store.loadManifest();
    expect(updatedManifest?.summary.failed).toBe(0);
    expect(updatedManifest?.summary.passed).toBe(1);
    expect(updatedManifest?.snapshots[0].status).toBe('passed');
  });
});
