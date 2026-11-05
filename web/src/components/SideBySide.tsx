import React from 'react';

interface SideBySideProps {
  baselineUrl: string;
  currentUrl: string;
  zoom: number;
}

export const SideBySide: React.FC<SideBySideProps> = ({
  baselineUrl,
  currentUrl,
  zoom
}) => {
  return (
    <div className="w-full h-full p-4 overflow-auto flex items-start justify-center gap-6 select-none">
      {/* Baseline Container */}
      <div className="flex-1 flex flex-col items-center max-w-xl">
        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
          Baseline
        </div>
        <div
          className="shadow-xl rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950 checker-bg w-full"
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
          className="shadow-xl rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950 checker-bg w-full"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
        >
          <img src={currentUrl} alt="Current" className="w-full h-auto block" draggable={false} />
        </div>
      </div>
    </div>
  );
};
