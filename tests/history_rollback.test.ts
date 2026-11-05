import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { BaselineStore } from '../src/baseline/store.js';

describe('Baseline history and rollback system', () => {
  const testDir = '.snapdiff_hist_test';
  const fullDir = path.resolve(process.cwd(), testDir);

  beforeEach(() => {
    if (fs.existsSync(fullDir)) {
      fs.rmSync(fullDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(fullDir)) {
      fs.rmSync(fullDir, { recursive: true, force: true });
    }
  });

  it('archives previous baseline when replaced and allows rollback', async () => {
    const store = new BaselineStore(testDir);
    store.ensureDirs();

    // 1. Save original baseline version
    const version1 = Buffer.from('baseline-v1-data');
    await store.saveBaseline('landing', 'desktop', version1, 'light');

    // Small delay to ensure timestamp separation
    await new Promise((r) => setTimeout(r, 20));

    // 2. Overwrite with new version (should archive v1 to history)
    const version2 = Buffer.from('baseline-v2-data');
    await store.saveBaseline('landing', 'desktop', version2, 'light');

    // 3. Verify history has version 1 archived
    const history = await store.listHistory('landing', 'desktop', 'light');
    expect(history.length).toBe(1);
    expect(fs.readFileSync(history[0].filePath).toString()).toBe('baseline-v1-data');

    // Current baseline should be v2
    const current = await store.readBaseline('landing', 'desktop', 'light');
    expect(current?.toString()).toBe('baseline-v2-data');

    // 4. Rollback to version 1
    await store.rollbackBaseline('landing', 'desktop', history[0].filePath, 'light');

    // 5. Verify restored baseline is now v1
    const restored = await store.readBaseline('landing', 'desktop', 'light');
    expect(restored?.toString()).toBe('baseline-v1-data');
  });

  it('separates history by color scheme', async () => {
    const store = new BaselineStore(testDir);
    store.ensureDirs();

    await store.saveBaseline('dashboard', 'mobile', Buffer.from('light-v1'), 'light');
    await new Promise((r) => setTimeout(r, 20));
    await store.saveBaseline('dashboard', 'mobile', Buffer.from('light-v2'), 'light');

    await store.saveBaseline('dashboard', 'mobile', Buffer.from('dark-v1'), 'dark');
    await new Promise((r) => setTimeout(r, 20));
    await store.saveBaseline('dashboard', 'mobile', Buffer.from('dark-v2'), 'dark');

    const lightHist = await store.listHistory('dashboard', 'mobile', 'light');
    const darkHist = await store.listHistory('dashboard', 'mobile', 'dark');

    expect(lightHist.length).toBe(1);
    expect(darkHist.length).toBe(1);
    expect(lightHist[0].colorScheme).toBe('light');
    expect(darkHist[0].colorScheme).toBe('dark');
  });
});
