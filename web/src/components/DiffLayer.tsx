import React from 'react';

interface DiffLayerProps {
  diffUrl: string;
  zoom: number;
  highlightBox?: boolean;
  boundingBox?: { minX: number; minY: number; maxX: number; maxY: number };
}

export const DiffLayer: React.FC<DiffLayerProps> = ({
  diffUrl,
  zoom,
  highlightBox,
  boundingBox
}) => {
  return (
    <div id="canvas-scroll-container" className="w-full h-full flex flex-col items-center justify-center p-4 overflow-auto select-none">
      <div className="text-xs font-bold text-rose-400 mb-2 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff00ff]" />
        Magenta Difference Mask
      </div>
      <div
        className="relative shadow-2xl rounded-lg overflow-hidden border border-rose-500/30 bg-slate-950 checker-bg max-w-2xl"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out'
        }}
      >
        <img src={diffUrl} alt="Diff Mask" className="w-full h-auto block" draggable={false} />

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
  );
};
