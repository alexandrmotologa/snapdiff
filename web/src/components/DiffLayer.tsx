import React from 'react';

interface DiffLayerProps {
  diffUrl: string;
  zoom: number;
}

export const DiffLayer: React.FC<DiffLayerProps> = ({ diffUrl, zoom }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-auto select-none">
      <div className="text-xs font-bold text-rose-400 mb-2 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff00ff]" />
        Magenta Difference Mask
      </div>
      <div
        className="shadow-2xl rounded-lg overflow-hidden border border-rose-500/30 bg-slate-950 checker-bg max-w-2xl"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out'
        }}
      >
        <img src={diffUrl} alt="Diff Mask" className="w-full h-auto block" draggable={false} />
      </div>
    </div>
  );
};
