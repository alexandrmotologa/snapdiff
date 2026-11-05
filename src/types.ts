/**
 * Viewport configuration definition.
 */
export interface ViewportConfig {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

/**
 * Wait conditions before capturing the screenshot.
 */
export interface WaitOptions {
  networkIdle?: boolean;
  fontsReady?: boolean;
  scrollLazy?: boolean;
  delay?: number;
  timeout?: number;
}

/**
 * Capture target page or component.
 */
export interface TargetConfig {
  name: string;
  url: string;
  selector?: string;
  masks?: string[];
  viewports?: string[];
  wait?: WaitOptions;
  threshold?: number;
}

/**
 * Top-level SnapDiff configuration.
 */
export interface SnapDiffConfig {
  threshold?: number;
  diffColor?: [number, number, number];
  viewports?: Record<string, ViewportConfig>;
  targets?: TargetConfig[];
  outputDir?: string;
  headless?: boolean;
  stabilize?: boolean;
}

/**
 * Resolved runtime configuration with all defaults applied.
 */
export interface ResolvedSnapDiffConfig {
  threshold: number;
  diffColor: [number, number, number];
  viewports: Record<string, ViewportConfig>;
  targets: TargetConfig[];
  outputDir: string;
  headless: boolean;
  stabilize: boolean;
}

/**
 * Pixel diff comparison metrics.
 */
export interface DiffMetrics {
  totalPixels: number;
  mismatchedPixels: number;
  diffRatio: number;
  diffPercentage: number;
  threshold: number;
  passed: boolean;
  boundingBox?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  durationMs: number;
}

/**
 * Snapshot status outcome.
 */
export type SnapshotStatus = 'passed' | 'failed' | 'new_baseline' | 'missing_current';

/**
 * Individual snapshot record in a test run.
 */
export interface SnapshotRecord {
  id: string;
  targetName: string;
  url: string;
  viewportName: string;
  viewport: ViewportConfig;
  status: SnapshotStatus;
  baselinePath?: string;
  currentPath?: string;
  diffPath?: string;
  metrics?: DiffMetrics;
  error?: string;
  updatedAt: string;
}

/**
 * Run summary manifest stored in .snapdiff/manifest.json.
 */
export interface RunManifest {
  runId: string;
  timestamp: string;
  git?: {
    branch?: string;
    commit?: string;
    author?: string;
    message?: string;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    newBaselines: number;
    durationMs: number;
  };
  snapshots: SnapshotRecord[];
}
