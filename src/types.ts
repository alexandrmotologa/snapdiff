/**
 * Supported color schemes.
 */
export type ColorScheme = 'light' | 'dark';

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
 * Pre-capture action types for testing interactive UI states.
 */
export type PreCaptureAction =
  | { type: 'click'; selector: string; timeout?: number }
  | { type: 'hover'; selector: string; timeout?: number }
  | { type: 'fill'; selector: string; value: string; timeout?: number }
  | { type: 'wait'; selector?: string; ms?: number; timeout?: number }
  | { type: 'evaluate'; script: string };

/**
 * Authentication and session injection options.
 */
export interface AuthOptions {
  cookies?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    httpOnly?: boolean;
    secure?: boolean;
  }>;
  headers?: Record<string, string>;
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
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
  colorSchemes?: ColorScheme[];
  actions?: PreCaptureAction[];
  auth?: AuthOptions;
  wait?: WaitOptions;
  threshold?: number;
}

/**
 * Webhook notification configuration.
 */
export interface WebhookConfig {
  url: string;
  type?: 'slack' | 'discord' | 'generic';
  onFailureOnly?: boolean;
}

/**
 * Top-level SnapDiff configuration.
 */
export interface SnapDiffConfig {
  threshold?: number;
  diffColor?: [number, number, number];
  viewports?: Record<string, ViewportConfig>;
  colorSchemes?: ColorScheme[];
  targets?: TargetConfig[];
  outputDir?: string;
  headless?: boolean;
  stabilize?: boolean;
  concurrency?: number;
  webhook?: WebhookConfig | string;
}

/**
 * Resolved runtime configuration with all defaults applied.
 */
export interface ResolvedSnapDiffConfig {
  threshold: number;
  diffColor: [number, number, number];
  viewports: Record<string, ViewportConfig>;
  colorSchemes: ColorScheme[];
  targets: TargetConfig[];
  outputDir: string;
  headless: boolean;
  stabilize: boolean;
  concurrency: number;
  webhook?: WebhookConfig;
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
  colorScheme: ColorScheme;
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
 * Historical baseline snapshot record.
 */
export interface HistoryRecord {
  targetName: string;
  viewportName: string;
  colorScheme: ColorScheme;
  timestamp: string;
  filePath: string;
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
