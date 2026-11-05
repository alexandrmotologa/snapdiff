import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from '../src/server/api.js';
import { BaselineStore } from '../src/baseline/store.js';
import { DEFAULT_CONFIG } from '../src/config.js';
import type { RunManifest } from '../src/types.js';

describe('Server API routes', () => {
  const testDir = '.snapdiff_api_test';
  const fullTestDir = path.resolve(process.cwd(), testDir);
  const testConfig = { ...DEFAULT_CONFIG, outputDir: testDir };

  beforeEach(() => {
    if (fs.existsSync(fullTestDir)) {
      fs.rmSync(fullTestDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(fullTestDir)) {
      fs.rmSync(fullTestDir, { recursive: true, force: true });
    }
  });

  it('handles /api/config', async () => {
    const app = await createServer(testConfig);
    const res = await app.inject({
      method: 'GET',
      url: '/api/config'
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.threshold).toBe(0.002);
    expect(json.outputDir).toBe(testDir);
    await app.close();
  });

  it('serves manifest and snapshot images', async () => {
    const store = new BaselineStore(testDir);
    store.ensureDirs();

    const manifest: RunManifest = {
      runId: 'api-test-run',
      timestamp: new Date().toISOString(),
      summary: { total: 1, passed: 1, failed: 0, newBaselines: 0, durationMs: 150 },
      snapshots: [
        {
          id: 'test-desktop',
          targetName: 'test',
          url: 'http://localhost:3000',
          viewportName: 'desktop',
          viewport: { width: 1440, height: 900 },
          status: 'passed',
          updatedAt: new Date().toISOString()
        }
      ]
    };

    await store.saveManifest(manifest);
    await store.saveBaseline('test', 'desktop', Buffer.from('fake-png-bytes'));

    const app = await createServer(testConfig);

    const manifestRes = await app.inject({
      method: 'GET',
      url: '/api/manifest'
    });
    expect(manifestRes.statusCode).toBe(200);
    expect(JSON.parse(manifestRes.payload).runId).toBe('api-test-run');

    const imageRes = await app.inject({
      method: 'GET',
      url: '/api/images/baseline/test/desktop'
    });
    expect(imageRes.statusCode).toBe(200);
    expect(imageRes.headers['content-type']).toBe('image/png');
    expect(imageRes.rawPayload.toString()).toBe('fake-png-bytes');

    await app.close();
  });
});
