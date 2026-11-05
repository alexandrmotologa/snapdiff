import { BrowserRunner } from './capture/browser_runner.js';
import { resolveViewport } from './capture/viewport_config.js';
import { compareImages } from './diff/wasm_pixelmatch.js';
import { BaselineStore } from './baseline/store.js';
import { getGitMetadata } from './baseline/git_metadata.js';
import { sendWebhookNotification } from './reporter/webhook.js';
import type {
  ColorScheme,
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
  colorSchemes?: ColorScheme[];
  concurrency?: number;
  updateBaseline?: boolean;
}

interface TaskItem {
  target: TargetConfig;
  viewportName: string;
  viewportConfig: ViewportConfig;
  colorScheme: ColorScheme;
}

/**
 * Concurrent task pool executor.
 */
async function runConcurrentTasks<T, R>(
  items: T[],
  concurrency: number,
  taskFn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await taskFn(items[idx]);
    }
  });

  await Promise.all(workers);
  return results;
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

  private buildTaskList(
    targets?: TargetConfig[],
    customColorSchemes?: ColorScheme[]
  ): TaskItem[] {
    const list = targets && targets.length > 0 ? targets : this.config.targets;
    const tasks: TaskItem[] = [];

    for (const target of list) {
      const viewportNames = target.viewports || Object.keys(this.config.viewports);
      const schemes =
        target.colorSchemes ||
        customColorSchemes ||
        this.config.colorSchemes ||
        ['light'];

      for (const vpName of viewportNames) {
        const vpConfig = resolveViewport(vpName, this.config.viewports[vpName]);
        for (const scheme of schemes) {
          tasks.push({
            target,
            viewportName: vpName,
            viewportConfig: vpConfig,
            colorScheme: scheme
          });
        }
      }
    }

    return tasks;
  }

  /**
   * Captures screenshots and saves them directly as baseline references.
   */
  async captureBaselines(targets?: TargetConfig[]): Promise<RunManifest> {
    const tasks = this.buildTaskList(targets);
    if (tasks.length === 0) {
      throw new Error(
        'No targets defined. Please configure at least one target in snapdiff.config.json or pass --url'
      );
    }

    this.store.ensureDirs();
    await this.runner.init();

    const startTime = performance.now();
    const concurrency = this.config.concurrency ?? 4;

    let snapshots: SnapshotRecord[] = [];

    try {
      snapshots = await runConcurrentTasks(tasks, concurrency, async (task) => {
        const { target, viewportName, viewportConfig, colorScheme } = task;
        const snapId = `${target.name}-${viewportName}${colorScheme === 'dark' ? '-dark' : ''}`;

        const captureResult = await this.runner.capture(target.url, {
          viewport: viewportConfig,
          colorScheme,
          selector: target.selector,
          masks: target.masks,
          actions: target.actions,
          auth: target.auth,
          wait: target.wait,
          stabilize: this.config.stabilize
        });

        const baselinePath = await this.store.saveBaseline(
          target.name,
          viewportName,
          captureResult.buffer,
          colorScheme
        );
        const currentPath = await this.store.saveCurrent(
          target.name,
          viewportName,
          captureResult.buffer,
          colorScheme
        );

        return {
          id: snapId,
          targetName: target.name,
          url: target.url,
          viewportName,
          colorScheme,
          viewport: viewportConfig,
          status: 'passed',
          baselinePath,
          currentPath,
          updatedAt: new Date().toISOString()
        } as SnapshotRecord;
      });
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
    const tasks = this.buildTaskList(options.targets, options.colorSchemes);
    if (tasks.length === 0) {
      throw new Error(
        'No targets defined. Please configure at least one target in snapdiff.config.json or pass --url'
      );
    }

    const threshold = options.threshold !== undefined ? options.threshold : this.config.threshold;
    const concurrency = options.concurrency ?? this.config.concurrency ?? 4;

    this.store.ensureDirs();
    await this.runner.init();

    const startTime = performance.now();
    let snapshots: SnapshotRecord[] = [];

    try {
      snapshots = await runConcurrentTasks(tasks, concurrency, async (task) => {
        const { target, viewportName, viewportConfig, colorScheme } = task;
        const snapId = `${target.name}-${viewportName}${colorScheme === 'dark' ? '-dark' : ''}`;
        const targetThreshold = target.threshold !== undefined ? target.threshold : threshold;

        const captureResult = await this.runner.capture(target.url, {
          viewport: viewportConfig,
          colorScheme,
          selector: target.selector,
          masks: target.masks,
          actions: target.actions,
          auth: target.auth,
          wait: target.wait,
          stabilize: this.config.stabilize
        });

        const currentPath = await this.store.saveCurrent(
          target.name,
          viewportName,
          captureResult.buffer,
          colorScheme
        );
        const hasBaseline = this.store.hasBaseline(target.name, viewportName, colorScheme);

        if (!hasBaseline || options.updateBaseline) {
          const baselinePath = await this.store.saveBaseline(
            target.name,
            viewportName,
            captureResult.buffer,
            colorScheme
          );

          return {
            id: snapId,
            targetName: target.name,
            url: target.url,
            viewportName,
            colorScheme,
            viewport: viewportConfig,
            status: 'new_baseline',
            baselinePath,
            currentPath,
            updatedAt: new Date().toISOString()
          } as SnapshotRecord;
        }

        const baselineBuffer = (await this.store.readBaseline(
          target.name,
          viewportName,
          colorScheme
        ))!;
        const diffResult = await compareImages(baselineBuffer, captureResult.buffer, {
          threshold: targetThreshold,
          diffColor: this.config.diffColor
        });

        const passed = diffResult.metrics.diffRatio <= targetThreshold;
        let diffPath: string | undefined;

        if (diffResult.metrics.mismatchedPixels > 0) {
          diffPath = await this.store.saveDiff(
            target.name,
            viewportName,
            diffResult.diffPngBuffer,
            colorScheme
          );
        }

        return {
          id: snapId,
          targetName: target.name,
          url: target.url,
          viewportName,
          colorScheme,
          viewport: viewportConfig,
          status: passed ? 'passed' : 'failed',
          baselinePath: this.store.getBaselinePath(target.name, viewportName, colorScheme),
          currentPath,
          diffPath,
          metrics: {
            ...diffResult.metrics,
            threshold: targetThreshold,
            passed
          },
          updatedAt: new Date().toISOString()
        } as SnapshotRecord;
      });
    } finally {
      await this.runner.close();
    }

    let passedCount = 0;
    let failedCount = 0;
    let newBaselinesCount = 0;

    for (const s of snapshots) {
      if (s.status === 'passed') passedCount++;
      else if (s.status === 'failed') failedCount++;
      else if (s.status === 'new_baseline') {
        newBaselinesCount++;
        passedCount++;
      }
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

    // Send webhook notification if configured
    if (this.config.webhook) {
      await sendWebhookNotification(manifest, this.config.webhook);
    }

    return manifest;
  }
}
