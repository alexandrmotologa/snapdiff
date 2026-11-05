import { BrowserRunner } from './capture/browser_runner.js';
import { resolveViewport } from './capture/viewport_config.js';
import { compareImages } from './diff/wasm_pixelmatch.js';
import { BaselineStore } from './baseline/store.js';
import { getGitMetadata } from './baseline/git_metadata.js';
import type {
  ResolvedSnapDiffConfig,
  RunManifest,
  SnapshotRecord,
  TargetConfig,
  ViewportConfig
} from './types.js';

export interface RunOptions {
  threshold?: number;
  targets?: TargetConfig[];
  viewports?: Record<string, ViewportConfig>;
  updateBaseline?: boolean;
}

export class SnapDiffEngine {
  readonly config: ResolvedSnapDiffConfig;
  readonly store: BaselineStore;
  readonly runner: BrowserRunner;

  constructor(config: ResolvedSnapDiffConfig) {
    this.config = config;
    this.store = new BaselineStore(config.outputDir);
    this.runner = new BrowserRunner(config.headless);
  }

  /**
   * Captures screenshots and saves them directly as baseline references.
   */
  async captureBaselines(targets?: TargetConfig[]): Promise<RunManifest> {
    const list = targets && targets.length > 0 ? targets : this.config.targets;
    if (list.length === 0) {
      throw new Error('No targets defined. Please configure at least one target in snapdiff.config.json or pass --url');
    }

    this.store.ensureDirs();
    await this.runner.init();

    const startTime = performance.now();
    const snapshots: SnapshotRecord[] = [];

    try {
      for (const target of list) {
        const viewportNames = target.viewports || Object.keys(this.config.viewports);

        for (const vpName of viewportNames) {
          const vpConfig = resolveViewport(vpName, this.config.viewports[vpName]);
          const snapId = `${target.name}-${vpName}`;

          const captureResult = await this.runner.capture(target.url, {
            viewport: vpConfig,
            selector: target.selector,
            masks: target.masks,
            wait: target.wait,
            stabilize: this.config.stabilize
          });

          // Save baseline and current
          const baselinePath = await this.store.saveBaseline(target.name, vpName, captureResult.buffer);
          const currentPath = await this.store.saveCurrent(target.name, vpName, captureResult.buffer);

          snapshots.push({
            id: snapId,
            targetName: target.name,
            url: target.url,
            viewportName: vpName,
            viewport: vpConfig,
            status: 'passed',
            baselinePath,
            currentPath,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } finally {
      await this.runner.close();
    }

    const durationMs = Math.round(performance.now() - startTime);
    const manifest: RunManifest = {
      runId: `run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      git: getGitMetadata(),
      summary: {
        total: snapshots.length,
        passed: snapshots.length,
        failed: 0,
        newBaselines: snapshots.length,
        durationMs
      },
      snapshots
    };

    await this.store.saveManifest(manifest);
    return manifest;
  }

  /**
   * Executes comparison tests between current UI rendering and existing baselines.
   */
  async runTests(options: RunOptions = {}): Promise<RunManifest> {
    const targets = options.targets && options.targets.length > 0 ? options.targets : this.config.targets;
    if (targets.length === 0) {
      throw new Error('No targets defined. Please configure at least one target in snapdiff.config.json or pass --url');
    }

    const threshold = options.threshold !== undefined ? options.threshold : this.config.threshold;
    this.store.ensureDirs();
    await this.runner.init();

    const startTime = performance.now();
    const snapshots: SnapshotRecord[] = [];
    let passedCount = 0;
    let failedCount = 0;
    let newBaselinesCount = 0;

    try {
      for (const target of targets) {
        const targetThreshold = target.threshold !== undefined ? target.threshold : threshold;
        const viewportNames = target.viewports || Object.keys(this.config.viewports);

        for (const vpName of viewportNames) {
          const vpConfig = resolveViewport(vpName, this.config.viewports[vpName]);
          const snapId = `${target.name}-${vpName}`;

          const captureResult = await this.runner.capture(target.url, {
            viewport: vpConfig,
            selector: target.selector,
            masks: target.masks,
            wait: target.wait,
            stabilize: this.config.stabilize
          });

          const currentPath = await this.store.saveCurrent(target.name, vpName, captureResult.buffer);
          const hasBaseline = this.store.hasBaseline(target.name, vpName);

          if (!hasBaseline || options.updateBaseline) {
            // No baseline exists yet, or update requested
            const baselinePath = await this.store.saveBaseline(target.name, vpName, captureResult.buffer);
            newBaselinesCount++;
            passedCount++;

            snapshots.push({
              id: snapId,
              targetName: target.name,
              url: target.url,
              viewportName: vpName,
              viewport: vpConfig,
              status: 'new_baseline',
              baselinePath,
              currentPath,
              updatedAt: new Date().toISOString()
            });
            continue;
          }

          // Baseline exists, perform pixel comparison
          const baselineBuffer = (await this.store.readBaseline(target.name, vpName))!;
          const diffResult = await compareImages(baselineBuffer, captureResult.buffer, {
            threshold: targetThreshold,
            diffColor: this.config.diffColor
          });

          let diffPath: string | undefined;
          const passed = diffResult.metrics.diffRatio <= targetThreshold;

          if (passed) {
            passedCount++;
          } else {
            failedCount++;
          }

          // Save diff image whenever differences exist or test failed
          if (diffResult.metrics.mismatchedPixels > 0) {
            diffPath = await this.store.saveDiff(target.name, vpName, diffResult.diffPngBuffer);
          }

          snapshots.push({
            id: snapId,
            targetName: target.name,
            url: target.url,
            viewportName: vpName,
            viewport: vpConfig,
            status: passed ? 'passed' : 'failed',
            baselinePath: this.store.getBaselinePath(target.name, vpName),
            currentPath,
            diffPath,
            metrics: {
              ...diffResult.metrics,
              threshold: targetThreshold,
              passed
            },
            updatedAt: new Date().toISOString()
          });
        }
      }
    } finally {
      await this.runner.close();
    }

    const durationMs = Math.round(performance.now() - startTime);
    const manifest: RunManifest = {
      runId: `run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      git: getGitMetadata(),
      summary: {
        total: snapshots.length,
        passed: passedCount,
        failed: failedCount,
        newBaselines: newBaselinesCount,
        durationMs
      },
      snapshots
    };

    await this.store.saveManifest(manifest);
    return manifest;
  }
}
