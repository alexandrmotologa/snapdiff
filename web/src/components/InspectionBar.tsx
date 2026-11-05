import React from 'react';
import {
  Layers,
  Columns,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  SplitSquareVertical
} from 'lucide-react';
import type { SnapshotRecord, ViewMode } from '../types.js';

interface InspectionBarProps {
  snapshot: SnapshotRecord;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  onApprove: () => void;
  approving: boolean;
}

export const InspectionBar: React.FC<InspectionBarProps> = ({
  snapshot,
  viewMode,
  onViewModeChange,
  zoom,
  onZoomChange,
  onApprove,
  approving
}) => {
  const diffPct = snapshot.metrics ? `${snapshot.metrics.diffPercentage.toFixed(2)}%` : '0.00%';
  const threshPct = snapshot.metrics ? `${(snapshot.metrics.threshold * 100).toFixed(2)}%` : '0.20%';
  const mismatched = snapshot.metrics?.mismatchedPixels?.toLocaleString() ?? '0';
  const total = snapshot.metrics?.totalPixels?.toLocaleString() ?? '0';

  return (
    <div className="h-14 border-t border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between shrink-0 select-none text-xs">
      {/* View Mode Switcher */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() => onViewModeChange('wiper')}
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition font-medium ${
            viewMode === 'wiper'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Shortcut: Press 1"
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
          <span>Sliding Wiper</span>
        </button>

        <button
          onClick={() => onViewModeChange('onion')}
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition font-medium ${
            viewMode === 'onion'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Shortcut: Press 2"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Onion Skin</span>
        </button>

        <button
          onClick={() => onViewModeChange('side-by-side')}
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition font-medium ${
            viewMode === 'side-by-side'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Shortcut: Press 3"
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Side-by-Side</span>
        </button>

        <button
          onClick={() => onViewModeChange('diff')}
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition font-medium ${
            viewMode === 'diff'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Shortcut: Press 4"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#ff00ff]" />
          <span>Diff Mask</span>
        </button>
      </div>

      {/* Snapshot Metadata Stats */}
      <div className="hidden lg:flex items-center gap-4 text-slate-400 font-mono text-[11px]">
        <div>
          <span className="text-slate-500">Diff: </span>
          <span className={snapshot.status === 'failed' ? 'text-rose-400 font-bold' : 'text-slate-200'}>
            {diffPct}
          </span>
          <span className="text-slate-600"> / max {threshPct}</span>
        </div>

        <div>
          <span className="text-slate-500">Mismatched: </span>
          <span className="text-slate-200">{mismatched}</span>
          <span className="text-slate-600"> of {total} px</span>
        </div>

        {snapshot.metrics?.boundingBox && (
          <div>
            <span className="text-slate-500">Box: </span>
            <span className="text-slate-300">
              [{snapshot.metrics.boundingBox.minX},{snapshot.metrics.boundingBox.minY} &rarr; {snapshot.metrics.boundingBox.maxX},{snapshot.metrics.boundingBox.maxY}]
            </span>
          </div>
        )}
      </div>

      {/* Zoom and Approval Actions */}
      <div className="flex items-center gap-3">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-slate-400">
          <button
            onClick={() => onZoomChange(Math.max(0.4, Number((zoom - 0.1).toFixed(1))))}
            className="p-1 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1 text-[11px] font-mono w-10 text-center text-slate-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.5, Number((zoom + 0.1).toFixed(1))))}
            className="p-1 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onZoomChange(1)}
            className="p-1 hover:text-white transition border-l border-slate-800 ml-1 pl-1"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* 1-Click Approve Button */}
        <button
          onClick={onApprove}
          disabled={approving || snapshot.status === 'passed'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition shadow-sm ${
            snapshot.status === 'passed'
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
          }`}
          title="Shortcut: Press A"
        >
          <Check className="w-3.5 h-3.5" />
          <span>
            {snapshot.status === 'passed'
              ? 'Baseline Approved'
              : approving
              ? 'Approving...'
              : 'Approve as Baseline'}
          </span>
        </button>
      </div>
    </div>
  );
};
