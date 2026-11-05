import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, Search, CheckCircle2, XCircle, Sparkles, Moon } from 'lucide-react';
import type { SnapshotRecord } from '../types.js';

interface SnapshotListProps {
  snapshots: SnapshotRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filter: 'all' | 'failed' | 'passed' | 'new';
}

export const SnapshotList: React.FC<SnapshotListProps> = ({
  snapshots,
  selectedId,
  onSelect,
  filter
}) => {
  const [search, setSearch] = useState('');

  const filtered = snapshots.filter((snap) => {
    if (filter === 'failed' && snap.status !== 'failed') return false;
    if (filter === 'passed' && snap.status !== 'passed') return false;
    if (filter === 'new' && snap.status !== 'new_baseline') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        snap.targetName.toLowerCase().includes(q) ||
        snap.viewportName.toLowerCase().includes(q) ||
        snap.url.toLowerCase().includes(q) ||
        (snap.colorScheme && snap.colorScheme.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getViewportIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('mob')) return <Smartphone className="w-3.5 h-3.5" />;
    if (lower.includes('tab')) return <Tablet className="w-3.5 h-3.5" />;
    return <Monitor className="w-3.5 h-3.5" />;
  };

  return (
    <aside className="w-80 border-r border-slate-800 bg-slate-900/40 flex flex-col shrink-0 h-[calc(100vh-3.5rem)]">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search targets or viewports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Snapshot Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No snapshots match current filter
          </div>
        ) : (
          filtered.map((snap) => {
            const isSelected = snap.id === selectedId;
            const diffPct = snap.metrics ? `${snap.metrics.diffPercentage.toFixed(2)}%` : '0.00%';

            return (
              <button
                key={snap.id}
                onClick={() => onSelect(snap.id)}
                className={`w-full text-left p-2.5 rounded-lg border transition flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm'
                    : 'bg-slate-900/30 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate pr-2">
                    <span className="font-semibold text-xs text-slate-200 truncate">
                      {snap.targetName}
                    </span>
                    {snap.colorScheme === 'dark' && (
                      <span className="flex items-center text-[10px] bg-indigo-950/80 text-indigo-300 px-1 py-0.2 rounded border border-indigo-800/60">
                        <Moon className="w-2.5 h-2.5 mr-0.5" />
                        dark
                      </span>
                    )}
                  </div>

                  {snap.status === 'passed' && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{diffPct}</span>
                    </div>
                  )}
                  {snap.status === 'failed' && (
                    <div className="flex items-center gap-1 text-[11px] text-rose-400 font-semibold font-mono bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{diffPct}</span>
                    </div>
                  )}
                  {snap.status === 'new_baseline' && (
                    <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-medium bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      <Sparkles className="w-3 h-3" />
                      <span>NEW</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    {getViewportIcon(snap.viewportName)}
                    <span className="capitalize">{snap.viewportName}</span>
                    <span className="text-slate-600">({snap.viewport.width}px)</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    {snap.metrics?.durationMs ? `${snap.metrics.durationMs}ms` : ''}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
