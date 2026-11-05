import React from 'react';
import { Play, CheckCheck, RefreshCw, GitBranch, ShieldAlert } from 'lucide-react';
import type { RunManifest } from '../types.js';

interface HeaderProps {
  manifest: RunManifest | null;
  filter: 'all' | 'failed' | 'passed' | 'new';
  onFilterChange: (f: 'all' | 'failed' | 'passed' | 'new') => void;
  onRunTests: () => void;
  onApproveAll: () => void;
  running: boolean;
  approving: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  manifest,
  filter,
  onFilterChange,
  onRunTests,
  onApproveAll,
  running,
  approving
}) => {
  const summary = manifest?.summary ?? { total: 0, passed: 0, failed: 0, newBaselines: 0 };
  const hasChangesToApprove = summary.failed > 0 || summary.newBaselines > 0;

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-indigo-500/20">
            S
          </div>
          <span className="font-bold text-base tracking-tight text-white">SnapDiff</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">Studio</span>
        </div>

        {manifest?.git && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50">
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-slate-300">{manifest.git.branch || 'main'}</span>
            {manifest.git.commit && (
              <>
                <span className="text-slate-600">&bull;</span>
                <span className="font-mono text-slate-400">{manifest.git.commit}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center bg-slate-950/60 p-1 rounded-lg border border-slate-800/80 text-xs">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1 rounded-md transition font-medium ${
            filter === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({summary.total})
        </button>
        <button
          onClick={() => onFilterChange('failed')}
          className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1 ${
            filter === 'failed'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-rose-300'
          }`}
        >
          {summary.failed > 0 && <ShieldAlert className="w-3 h-3 text-rose-400" />}
          Failed ({summary.failed})
        </button>
        <button
          onClick={() => onFilterChange('passed')}
          className={`px-3 py-1 rounded-md transition font-medium ${
            filter === 'passed'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-emerald-300'
          }`}
        >
          Passed ({summary.passed})
        </button>
        <button
          onClick={() => onFilterChange('new')}
          className={`px-3 py-1 rounded-md transition font-medium ${
            filter === 'new'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-cyan-300'
          }`}
        >
          New ({summary.newBaselines})
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRunTests}
          disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700/60 disabled:opacity-50"
        >
          {running ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          ) : (
            <Play className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span>{running ? 'Running...' : 'Run Test'}</span>
        </button>

        <button
          onClick={onApproveAll}
          disabled={approving || !hasChangesToApprove}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm shadow-emerald-900/30 disabled:opacity-40 disabled:hover:bg-emerald-600"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>{approving ? 'Approving...' : 'Approve All Changed'}</span>
        </button>
      </div>
    </header>
  );
};
