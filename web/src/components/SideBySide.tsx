import React from 'react';

interface SideBySideProps {
  baselineUrl: string;
  currentUrl: string;
  zoom: number;
  highlightBox?: boolean;
  boundingBox?: { minX: number; minY: number; maxX: number; maxY: number };
}

export const SideBySide: React.FC<SideBySideProps> = ({
  baselineUrl,
  currentUrl,
  zoom,
  highlightBox,
  boundingBox
}) => {
  return (
    <div id="canvas-scroll-container" className="w-full h-full p-4 overflow-auto flex items-start justify-center gap-6 select-none">
      {/* Baseline Container */}
      <div className="flex-1 flex flex-col items-center max-w-xl">
        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
          Baseline
        </div>
        <div
          className="relative shadow-xl rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950 checker-bg w-full"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
        >
          <img src={baselineUrl} alt="Baseline" className="w-full h-auto block" draggable={false} />
        </div>
      </div>

      {/* Current Container */}
      <div className="flex-1 flex flex-col items-center max-w-xl">
        <div className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wider">
          Current
        </div>
        <div
          className="relative shadow-xl rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950 checker-bg w-full"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
        >
          <img src={currentUrl} alt="Current" className="w-full h-auto block" draggable={false} />

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
    </div>
  );
};
