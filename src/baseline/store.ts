import fs from 'node:fs';
import path from 'node:path';
import type { ColorScheme, HistoryRecord, RunManifest, SnapshotRecord } from '../types.js';
import { readImageFile, writeImageFile } from '../diff/image_writer.js';

export class BaselineStore {
  readonly rootDir: string;
  readonly baselineDir: string;
  readonly currentDir: string;
  readonly diffDir: string;
  readonly historyDir: string;
  readonly manifestPath: string;

  constructor(outputDir = '.snapdiff', cwd = process.cwd()) {
    this.rootDir = path.resolve(cwd, outputDir);
    this.baselineDir = path.join(this.rootDir, 'baseline');
    this.currentDir = path.join(this.rootDir, 'current');
    this.diffDir = path.join(this.rootDir, 'diff');
    this.historyDir = path.join(this.rootDir, 'history');
    this.manifestPath = path.join(this.rootDir, 'manifest.json');
  }

  ensureDirs(): void {
    for (const dir of [this.rootDir, this.baselineDir, this.currentDir, this.diffDir, this.historyDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private getFilename(viewportName: string, colorScheme: ColorScheme = 'light'): string {
    return colorScheme === 'dark' ? `${viewportName}-dark.png` : `${viewportName}.png`;
  }

  getBaselinePath(targetName: string, viewportName: string, colorScheme: ColorScheme = 'light'): string {
    return path.join(this.baselineDir, targetName, this.getFilename(viewportName, colorScheme));
  }

  getCurrentPath(targetName: string, viewportName: string, colorScheme: ColorScheme = 'light'): string {
    return path.join(this.currentDir, targetName, this.getFilename(viewportName, colorScheme));
  }

  getDiffPath(targetName: string, viewportName: string, colorScheme: ColorScheme = 'light'): string {
    return path.join(this.diffDir, targetName, this.getFilename(viewportName, colorScheme));
  }

  hasBaseline(targetName: string, viewportName: string, colorScheme: ColorScheme = 'light'): boolean {
    return fs.existsSync(this.getBaselinePath(targetName, viewportName, colorScheme));
  }

  async readBaseline(targetName: string, viewportName: string, colorScheme: ColorScheme = 'light'): Promise<Buffer | null> {
    return readImageFile(this.getBaselinePath(targetName, viewportName, colorScheme));
  }

  async readCurrent(targetName: string, viewportName: string, colorScheme: ColorScheme = 'light'): Promise<Buffer | null> {
    return readImageFile(this.getCurrentPath(targetName, viewportName, colorScheme));
  }

  async readDiff(targetName: string, viewportName: string, colorScheme: ColorScheme = 'light'): Promise<Buffer | null> {
    return readImageFile(this.getDiffPath(targetName, viewportName, colorScheme));
  }

  /**
   * Saves a baseline image, archiving any existing baseline to history first.
   */
  async saveBaseline(
    targetName: string,
    viewportName: string,
    buffer: Buffer,
    colorScheme: ColorScheme = 'light'
  ): Promise<string> {
    const p = this.getBaselinePath(targetName, viewportName, colorScheme);

    // If an existing baseline exists, archive it to history
    if (fs.existsSync(p)) {
      try {
        const existing = await fs.promises.readFile(p);
        const histDir = path.join(this.historyDir, targetName, viewportName);
        if (!fs.existsSync(histDir)) {
          fs.mkdirSync(histDir, { recursive: true });
        }
        const histFile = path.join(
          histDir,
          `${Date.now()}-${colorScheme}.png`
        );
        await fs.promises.writeFile(histFile, existing);
      } catch {
        // Fallback
      }
    }

    await writeImageFile(p, buffer);
    return p;
  }

  async saveCurrent(
    targetName: string,
    viewportName: string,
    buffer: Buffer,
    colorScheme: ColorScheme = 'light'
  ): Promise<string> {
    const p = this.getCurrentPath(targetName, viewportName, colorScheme);
    await writeImageFile(p, buffer);
    return p;
  }

  async saveDiff(
    targetName: string,
    viewportName: string,
    buffer: Buffer,
    colorScheme: ColorScheme = 'light'
  ): Promise<string> {
    const p = this.getDiffPath(targetName, viewportName, colorScheme);
    await writeImageFile(p, buffer);
    return p;
  }

  /**
   * Lists archived baseline snapshots from history.
   */
  async listHistory(
    targetName: string,
    viewportName: string,
    colorScheme: ColorScheme = 'light'
  ): Promise<HistoryRecord[]> {
    const histDir = path.join(this.historyDir, targetName, viewportName);
    if (!fs.existsSync(histDir)) {
      return [];
    }

    const files = await fs.promises.readdir(histDir);
    const records: HistoryRecord[] = [];

    for (const file of files) {
      if (file.endsWith(`-${colorScheme}.png`)) {
        const timestampStr = file.replace(`-${colorScheme}.png`, '');
        const timestamp = Number.parseInt(timestampStr, 10);
        records.push({
          targetName,
          viewportName,
          colorScheme,
          timestamp: new Date(timestamp).toISOString(),
          filePath: path.join(histDir, file)
        });
      }
    }

    // Sort descending by timestamp
    return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Rolls back a baseline to a historical version.
   */
  async rollbackBaseline(
    targetName: string,
    viewportName: string,
    historyFilePath: string,
    colorScheme: ColorScheme = 'light'
  ): Promise<boolean> {
    if (!fs.existsSync(historyFilePath)) {
      throw new Error(`Historical baseline file not found at ${historyFilePath}`);
    }

    const buffer = await fs.promises.readFile(historyFilePath);
    const currentBaselinePath = this.getBaselinePath(targetName, viewportName, colorScheme);
    await writeImageFile(currentBaselinePath, buffer);
    return true;
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

  findSnapshot(
    targetName: string,
    viewportName: string,
    colorScheme: ColorScheme = 'light'
  ): SnapshotRecord | undefined {
    const manifest = this.loadManifest();
    if (!manifest) return undefined;
    return manifest.snapshots.find(
      (s) =>
        s.targetName === targetName &&
        s.viewportName === viewportName &&
        s.colorScheme === colorScheme
    );
  }
}
