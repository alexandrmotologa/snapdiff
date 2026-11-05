import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ResolvedSnapDiffConfig, SnapDiffConfig } from './types.js';
import { DEFAULT_VIEWPORTS } from './capture/viewport_config.js';

export const DEFAULT_CONFIG: ResolvedSnapDiffConfig = {
  threshold: 0.002, // 0.2%
  diffColor: [255, 0, 255], // Bright magenta
  viewports: DEFAULT_VIEWPORTS,
  targets: [],
  outputDir: '.snapdiff',
  headless: true,
  stabilize: true
};

/**
 * Parses a threshold value that could be a number (0.002) or string ("0.2%").
 */
export function parseThreshold(val: unknown, fallback = 0.002): number {
  if (typeof val === 'number') {
    return val > 1 ? val / 100 : val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.endsWith('%')) {
      const num = Number.parseFloat(trimmed.slice(0, -1));
      return Number.isNaN(num) ? fallback : num / 100;
    }
    const num = Number.parseFloat(trimmed);
    return Number.isNaN(num) ? fallback : (num > 1 ? num / 100 : num);
  }
  return fallback;
}

/**
 * Finds configuration file in current working directory.
 */
export function findConfigFile(cwd = process.cwd(), customPath?: string): string | null {
  if (customPath) {
    const resolved = path.resolve(cwd, customPath);
    return fs.existsSync(resolved) ? resolved : null;
  }

  const candidates = [
    'snapdiff.config.json',
    'snapdiff.config.ts',
    'snapdiff.config.js',
    'snapdiff.config.mjs'
  ];

  for (const name of candidates) {
    const candidatePath = path.resolve(cwd, name);
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

/**
 * Loads and resolves SnapDiff configuration.
 */
export async function loadConfig(cwd = process.cwd(), customPath?: string): Promise<ResolvedSnapDiffConfig> {
  const configFile = findConfigFile(cwd, customPath);
  let userConfig: Partial<SnapDiffConfig> = {};

  if (configFile) {
    if (configFile.endsWith('.json')) {
      const content = fs.readFileSync(configFile, 'utf8');
      userConfig = JSON.parse(content);
    } else {
      // Dynamic import for TS/JS configs
      try {
        const fileUrl = pathToFileURL(configFile).href;
        const mod = await import(fileUrl);
        userConfig = mod.default || mod;
      } catch (err) {
        throw new Error(`Failed to load configuration file at ${configFile}: ${(err as Error).message}`);
      }
    }
  }

  const resolvedViewports = { ...DEFAULT_VIEWPORTS, ...(userConfig.viewports || {}) };

  return {
    threshold: userConfig.threshold !== undefined ? parseThreshold(userConfig.threshold) : DEFAULT_CONFIG.threshold,
    diffColor: userConfig.diffColor || DEFAULT_CONFIG.diffColor,
    viewports: resolvedViewports,
    targets: Array.isArray(userConfig.targets) ? userConfig.targets : [],
    outputDir: userConfig.outputDir || DEFAULT_CONFIG.outputDir,
    headless: userConfig.headless ?? DEFAULT_CONFIG.headless,
    stabilize: userConfig.stabilize ?? DEFAULT_CONFIG.stabilize
  };
}
