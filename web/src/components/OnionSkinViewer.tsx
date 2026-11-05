import React, { useState } from 'react';

interface OnionSkinViewerProps {
  baselineUrl: string;
  currentUrl: string;
  zoom: number;
  highlightBox?: boolean;
  boundingBox?: { minX: number; minY: number; maxX: number; maxY: number };
}

export const OnionSkinViewer: React.FC<OnionSkinViewerProps> = ({
  baselineUrl,
  currentUrl,
  zoom,
  highlightBox,
  boundingBox
}) => {
  const [opacity, setOpacity] = useState(50); // 0 (baseline only) to 100 (current only)
  const [blendMode, setBlendMode] = useState<'normal' | 'difference' | 'multiply'>('normal');

  return (
    <div id="canvas-scroll-container" className="relative w-full h-full flex flex-col items-center justify-between p-4 overflow-hidden select-none">
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
          {/* Base Layer: BASELINE */}
          <img
            src={baselineUrl}
            alt="Baseline"
            className="block max-w-full h-auto pointer-events-none select-none"
            draggable={false}
          />

          {/* Top Layer: CURRENT with controllable opacity and blend mode */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-75"
            style={{
              opacity: opacity / 100,
              mixBlendMode: blendMode
            }}
          >
            <img
              src={currentUrl}
              alt="Current"
              className="block w-full h-auto select-none"
              draggable={false}
            />
          </div>

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
        </div>
      </div>

      {/* Floating Onion Skin Controls */}
      <div className="mt-3 px-5 py-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-full shadow-2xl flex items-center gap-6 text-xs z-30">
        {/* Opacity Slider */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">Baseline</span>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-44 accent-indigo-500 cursor-pointer"
          />
          <span className="text-slate-400 font-medium">Current</span>
          <span className="font-mono text-indigo-400 font-bold w-10 text-right">{opacity}%</span>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        {/* Blend Modes */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['normal', 'difference', 'multiply'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setBlendMode(mode)}
              className={`px-2.5 py-1 rounded capitalize font-medium transition ${
                blendMode === mode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
