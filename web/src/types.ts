export interface ViewportConfig {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

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

export type SnapshotStatus = 'passed' | 'failed' | 'new_baseline' | 'missing_current';

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

export type ViewMode = 'wiper' | 'onion' | 'side-by-side' | 'diff';
