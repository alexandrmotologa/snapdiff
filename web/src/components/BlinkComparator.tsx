import React, { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface BlinkComparatorProps {
  baselineUrl: string;
  currentUrl: string;
  zoom: number;
  highlightBox?: boolean;
  boundingBox?: { minX: number; minY: number; maxX: number; maxY: number };
}

export const BlinkComparator: React.FC<BlinkComparatorProps> = ({
  baselineUrl,
  currentUrl,
  zoom,
  highlightBox,
  boundingBox
}) => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(350);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setShowCurrent((prev) => !prev);
    }, speedMs);
    return () => clearInterval(timer);
  }, [isPlaying, speedMs]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-4 overflow-hidden select-none">
      {/* Canvas */}
      <div className="flex-1 w-full flex items-center justify-center overflow-auto">
        <div
          className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950 checker-bg"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
        >
          {/* Display either baseline or current */}
          <img
            src={showCurrent ? currentUrl : baselineUrl}
            alt={showCurrent ? 'Current Build' : 'Baseline Build'}
            className="block max-w-full h-auto pointer-events-none select-none"
            draggable={false}
          />

          {/* Bounding box highlight */}
          {highlightBox && boundingBox && (
            <div
              className="absolute border-2 border-dashed border-[#ff00ff] bg-[#ff00ff]/15 pointer-events-none animate-pulse shadow-[0_0_15px_rgba(255,0,255,0.5)] z-20"
              style={{
                left: `${boundingBox.minX}px`,
                top: `${boundingBox.minY}px`,
                width: `${boundingBox.maxX - boundingBox.minX}px`,
                height: `${boundingBox.maxY - boundingBox.minY}px`
              }}
            >
              <span className="absolute -top-5 left-0 text-[10px] bg-[#ff00ff] text-white font-bold px-1.5 py-0.5 rounded shadow">
                Diff
              </span>
            </div>
          )}

          {/* Indicator Badge */}
          <div
            className={`absolute top-3 left-3 z-30 text-[11px] font-bold px-2.5 py-1 rounded shadow backdrop-blur transition-all ${
              showCurrent
                ? 'bg-indigo-600 text-white border border-indigo-400'
                : 'bg-slate-900/90 text-slate-200 border border-slate-700'
            }`}
          >
            {showCurrent ? 'CURRENT' : 'BASELINE'}
          </div>
        </div>
      </div>

      {/* Floating Blink Controls */}
      <div className="mt-3 px-5 py-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-full shadow-2xl flex items-center gap-6 text-xs z-30">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? 'Pause' : 'Blink'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Speed:</span>
          {[200, 350, 600].map((ms) => (
            <button
              key={ms}
              onClick={() => setSpeedMs(ms)}
              className={`px-2 py-0.5 rounded font-mono transition ${
                speedMs === ms
                  ? 'bg-slate-700 text-cyan-300 font-bold border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ms}ms
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
