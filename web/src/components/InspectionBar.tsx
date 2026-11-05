import React from 'react';
import {
  Layers,
  Columns,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  SplitSquareVertical,
  Activity,
  Focus,
  EyeOff,
  History
} from 'lucide-react';
import type { SnapshotRecord, ViewMode } from '../types.js';

interface InspectionBarProps {
  snapshot: SnapshotRecord;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  highlightBox: boolean;
  onToggleHighlightBox: () => void;
  onJumpToDiff: () => void;
  onOpenMaskModal: () => void;
  onOpenHistoryModal: () => void;
  onApprove: () => void;
  approving: boolean;
}

export const InspectionBar: React.FC<InspectionBarProps> = ({
  snapshot,
  viewMode,
  onViewModeChange,
  zoom,
  onZoomChange,
  highlightBox,
  onToggleHighlightBox,
  onJumpToDiff,
  onOpenMaskModal,
  onOpenHistoryModal,
  onApprove,
  approving
}) => {
  const diffPct = snapshot.metrics ? `${snapshot.metrics.diffPercentage.toFixed(2)}%` : '0.00%';
  const threshPct = snapshot.metrics ? `${(snapshot.metrics.threshold * 100).toFixed(2)}%` : '0.20%';
  const hasDiffBox = !!snapshot.metrics?.boundingBox;

  return (
    <div className="h-14 border-t border-slate-800 bg-slate-900/95 backdrop-blur px-3 md:px-4 flex items-center justify-between shrink-0 select-none text-xs overflow-x-auto gap-3">
      {/* View Mode Switcher */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
        <button
          onClick={() => onViewModeChange('wiper')}
          className={`px-2 md:px-2.5 py-1 rounded flex items-center gap-1 transition font-medium ${
            viewMode === 'wiper'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Sliding Wiper (Key 1)"
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Wiper</span>
        </button>

        <button
          onClick={() => onViewModeChange('onion')}
          className={`px-2 md:px-2.5 py-1 rounded flex items-center gap-1 transition font-medium ${
            viewMode === 'onion'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Onion Skin (Key 2)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Onion</span>
        </button>

        <button
          onClick={() => onViewModeChange('blink')}
          className={`px-2 md:px-2.5 py-1 rounded flex items-center gap-1 transition font-medium ${
            viewMode === 'blink'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Blink Comparator (Key 5)"
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Blink</span>
        </button>

        <button
          onClick={() => onViewModeChange('side-by-side')}
          className={`px-2 md:px-2.5 py-1 rounded flex items-center gap-1 transition font-medium ${
            viewMode === 'side-by-side'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Side-by-Side (Key 3)"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Side</span>
        </button>

        <button
          onClick={() => onViewModeChange('diff')}
          className={`px-2 md:px-2.5 py-1 rounded flex items-center gap-1 transition font-medium ${
            viewMode === 'diff'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Difference Mask (Key 4)"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#ff00ff]" />
          <span className="hidden sm:inline">Diff</span>
        </button>
      </div>

      {/* Snapshot Tools & Diff Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {hasDiffBox && (
          <button
            onClick={onJumpToDiff}
            className="flex items-center gap-1 px-2 md:px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded font-medium transition"
            title="Focus and zoom directly on the difference (Key J)"
          >
            <Focus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Jump to Diff</span>
          </button>
        )}

        <button
          onClick={onToggleHighlightBox}
          className={`flex items-center gap-1 px-2 md:px-2.5 py-1 rounded font-medium transition border ${
            highlightBox
              ? 'bg-[#ff00ff]/20 text-fuchsia-300 border-[#ff00ff]/40'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title="Toggle glowing bounding box (Key H)"
        >
          <span>Box</span>
        </button>

        <button
          onClick={onOpenMaskModal}
          className="flex items-center gap-1 px-2 md:px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-medium transition"
          title="Add ignore mask to configuration"
        >
          <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Mask</span>
        </button>

        <button
          onClick={onOpenHistoryModal}
          className="flex items-center gap-1 px-2 md:px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-medium transition"
          title="View baseline history and rollback"
        >
          <History className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">History</span>
        </button>
      </div>

      {/* Snapshot Metadata Stats */}
      <div className="hidden xl:flex items-center gap-4 text-slate-400 font-mono text-[11px] shrink-0">
        <div>
          <span className="text-slate-500">Diff: </span>
          <span className={snapshot.status === 'failed' ? 'text-rose-400 font-bold' : 'text-slate-200'}>
            {diffPct}
          </span>
          <span className="text-slate-600"> / max {threshPct}</span>
        </div>
      </div>

      {/* Zoom and Approval Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-slate-400">
          <button
            onClick={() => onZoomChange(Math.max(0.4, Number((zoom - 0.1).toFixed(1))))}
            className="p-1 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1 text-[11px] font-mono w-9 text-center text-slate-300">
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
            className="p-1 hover:text-white transition border-l border-slate-800 ml-0.5 pl-0.5 hidden sm:block"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* 1-Click Approve Button */}
        <button
          onClick={onApprove}
          disabled={approving || snapshot.status === 'passed'}
          className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 rounded-lg font-semibold transition shadow-sm ${
            snapshot.status === 'passed'
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
          }`}
          title="Approve baseline (Shortcut: A)"
        >
          <Check className="w-3.5 h-3.5" />
          <span>
            {snapshot.status === 'passed'
              ? 'Approved'
              : approving
              ? 'Approving...'
              : 'Approve'}
          </span>
        </button>
      </div>
    </div>
  );
};
