import React, { useState, useEffect, useMemo } from 'react';
import { useSnapshots } from './hooks/useSnapshots.js';
import { Header } from './components/Header.js';
import { SnapshotList } from './components/SnapshotList.js';
import { SlidingWiper } from './components/SlidingWiper.js';
import { OnionSkinViewer } from './components/OnionSkinViewer.js';
import { SideBySide } from './components/SideBySide.js';
import { DiffLayer } from './components/DiffLayer.js';
import { InspectionBar } from './components/InspectionBar.js';
import type { ViewMode } from './types.js';

export const App: React.FC = () => {
  const {
    manifest,
    loading,
    running,
    approving,
    error,
    approve,
    approveAll,
    runTests
  } = useSnapshots();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'failed' | 'passed' | 'new'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('wiper');
  const [zoom, setZoom] = useState<number>(1);

  const snapshots = manifest?.snapshots ?? [];

  // Filter snapshots
  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((snap) => {
      if (filter === 'failed') return snap.status === 'failed';
      if (filter === 'passed') return snap.status === 'passed';
      if (filter === 'new') return snap.status === 'new_baseline';
      return true;
    });
  }, [snapshots, filter]);

  // Set initial selected snapshot
  useEffect(() => {
    if (filteredSnapshots.length > 0) {
      if (!selectedId || !filteredSnapshots.some((s) => s.id === selectedId)) {
        // Prefer failed snapshot first if available
        const failedOne = filteredSnapshots.find((s) => s.status === 'failed');
        setSelectedId(failedOne ? failedOne.id : filteredSnapshots[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [filteredSnapshots, selectedId]);

  const selectedSnapshot = snapshots.find((s) => s.id === selectedId);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger shortcuts when typing in inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === '1') setViewMode('wiper');
      else if (e.key === '2') setViewMode('onion');
      else if (e.key === '3') setViewMode('side-by-side');
      else if (e.key === '4') setViewMode('diff');
      else if (e.key === 'a' || e.key === 'A') {
        if (selectedSnapshot && selectedSnapshot.status !== 'passed') {
          approve(selectedSnapshot.targetName, selectedSnapshot.viewportName);
        }
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        const idx = filteredSnapshots.findIndex((s) => s.id === selectedId);
        if (idx !== -1 && idx < filteredSnapshots.length - 1) {
          setSelectedId(filteredSnapshots[idx + 1].id);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        const idx = filteredSnapshots.findIndex((s) => s.id === selectedId);
        if (idx > 0) {
          setSelectedId(filteredSnapshots[idx - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSnapshots, selectedId, selectedSnapshot, approve]);

  const baselineUrl = selectedSnapshot
    ? `/api/images/baseline/${selectedSnapshot.targetName}/${selectedSnapshot.viewportName}`
    : '';
  const currentUrl = selectedSnapshot
    ? `/api/images/current/${selectedSnapshot.targetName}/${selectedSnapshot.viewportName}`
    : '';
  const diffUrl = selectedSnapshot
    ? `/api/images/diff/${selectedSnapshot.targetName}/${selectedSnapshot.viewportName}`
    : '';

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f19] text-slate-100 font-sans antialiased overflow-hidden">
      {/* Top Header */}
      <Header
        manifest={manifest}
        filter={filter}
        onFilterChange={setFilter}
        onRunTests={runTests}
        onApproveAll={approveAll}
        running={running}
        approving={approving}
      />

      {/* Main Body Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <SnapshotList
          snapshots={snapshots}
          selectedId={selectedId}
          onSelect={setSelectedId}
          filter={filter}
        />

        {/* Center Canvas */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          {loading && !manifest ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Loading visual test reports...
            </div>
          ) : error && !manifest ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="text-slate-400 font-medium mb-2">{error}</div>
              <p className="text-xs text-slate-600 max-w-sm mb-4">
                Execute <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">snapdiff test</code> in terminal or click below to run tests now.
              </p>
              <button
                onClick={runTests}
                disabled={running}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                {running ? 'Running...' : 'Run Visual Tests Now'}
              </button>
            </div>
          ) : !selectedSnapshot ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              No snapshot selected
            </div>
          ) : (
            <>
              {/* Dynamic View Area */}
              <div className="flex-1 overflow-hidden relative">
                {viewMode === 'wiper' && (
                  <SlidingWiper
                    baselineUrl={baselineUrl}
                    currentUrl={currentUrl}
                    zoom={zoom}
                  />
                )}
                {viewMode === 'onion' && (
                  <OnionSkinViewer
                    baselineUrl={baselineUrl}
                    currentUrl={currentUrl}
                    zoom={zoom}
                  />
                )}
                {viewMode === 'side-by-side' && (
                  <SideBySide
                    baselineUrl={baselineUrl}
                    currentUrl={currentUrl}
                    zoom={zoom}
                  />
                )}
                {viewMode === 'diff' && (
                  <DiffLayer diffUrl={diffUrl} zoom={zoom} />
                )}
              </div>

              {/* Bottom Inspection Bar */}
              <InspectionBar
                snapshot={selectedSnapshot}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                zoom={zoom}
                onZoomChange={setZoom}
                onApprove={() =>
                  approve(selectedSnapshot.targetName, selectedSnapshot.viewportName)
                }
                approving={approving}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
