import fs from 'node:fs';
import path from 'node:path';
import type { RunManifest, SnapshotRecord } from '../types.js';
import { readImageFile, writeImageFile } from '../diff/image_writer.js';

export class BaselineStore {
  readonly rootDir: string;
  readonly baselineDir: string;
  readonly currentDir: string;
  readonly diffDir: string;
  readonly manifestPath: string;

  constructor(outputDir = '.snapdiff', cwd = process.cwd()) {
    this.rootDir = path.resolve(cwd, outputDir);
    this.baselineDir = path.join(this.rootDir, 'baseline');
    this.currentDir = path.join(this.rootDir, 'current');
    this.diffDir = path.join(this.rootDir, 'diff');
    this.manifestPath = path.join(this.rootDir, 'manifest.json');
  }

  ensureDirs(): void {
    for (const dir of [this.rootDir, this.baselineDir, this.currentDir, this.diffDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  getBaselinePath(targetName: string, viewportName: string): string {
    return path.join(this.baselineDir, targetName, `${viewportName}.png`);
  }

  getCurrentPath(targetName: string, viewportName: string): string {
    return path.join(this.currentDir, targetName, `${viewportName}.png`);
  }

  getDiffPath(targetName: string, viewportName: string): string {
    return path.join(this.diffDir, targetName, `${viewportName}.png`);
  }

  hasBaseline(targetName: string, viewportName: string): boolean {
    return fs.existsSync(this.getBaselinePath(targetName, viewportName));
  }

  async readBaseline(targetName: string, viewportName: string): Promise<Buffer | null> {
    return readImageFile(this.getBaselinePath(targetName, viewportName));
  }

  async readCurrent(targetName: string, viewportName: string): Promise<Buffer | null> {
    return readImageFile(this.getCurrentPath(targetName, viewportName));
  }

  async readDiff(targetName: string, viewportName: string): Promise<Buffer | null> {
    return readImageFile(this.getDiffPath(targetName, viewportName));
  }

  async saveBaseline(targetName: string, viewportName: string, buffer: Buffer): Promise<string> {
    const p = this.getBaselinePath(targetName, viewportName);
    await writeImageFile(p, buffer);
    return p;
  }

  async saveCurrent(targetName: string, viewportName: string, buffer: Buffer): Promise<string> {
    const p = this.getCurrentPath(targetName, viewportName);
    await writeImageFile(p, buffer);
    return p;
  }

  async saveDiff(targetName: string, viewportName: string, buffer: Buffer): Promise<string> {
    const p = this.getDiffPath(targetName, viewportName);
    await writeImageFile(p, buffer);
    return p;
  }

  async saveManifest(manifest: RunManifest): Promise<void> {
    this.ensureDirs();
    await fs.promises.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  }

  loadManifest(): RunManifest | null {
    if (!fs.existsSync(this.manifestPath)) {
      return null;
    }
    try {
      const content = fs.readFileSync(this.manifestPath, 'utf8');
      return JSON.parse(content) as RunManifest;
    } catch {
      return null;
    }
  }

  findSnapshot(targetName: string, viewportName: string): SnapshotRecord | undefined {
    const manifest = this.loadManifest();
    if (!manifest) return undefined;
    return manifest.snapshots.find(
      (s) => s.targetName === targetName && s.viewportName === viewportName
    );
  }
}
