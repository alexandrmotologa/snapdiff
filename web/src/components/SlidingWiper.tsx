import React, { useState, useRef, useCallback, useEffect } from 'react';

interface SlidingWiperProps {
  baselineUrl: string;
  currentUrl: string;
  zoom: number;
  highlightBox?: boolean;
  boundingBox?: { minX: number; minY: number; maxX: number; maxY: number };
}

export const SlidingWiper: React.FC<SlidingWiperProps> = ({
  baselineUrl,
  currentUrl,
  zoom,
  highlightBox,
  boundingBox
}) => {
  const [sliderPos, setSliderPos] = useState(50); // percentage (0 - 100)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handlePointerDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      handleMove(clientX);
    };

    const onPointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchmove', onPointerMove);
      window.addEventListener('touchend', onPointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, [isDragging, handleMove]);

  return (
    <div id="canvas-scroll-container" className="relative w-full h-full flex items-center justify-center overflow-auto p-4 select-none">
      <div
        ref={containerRef}
        onClick={(e) => handleMove(e.clientX)}
        className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950 cursor-ew-resize checker-bg"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out'
        }}
      >
        {/* Right / Background Image: CURRENT */}
        <img
          src={currentUrl}
          alt="Current Build"
          className="block max-w-full h-auto pointer-events-none select-none"
          draggable={false}
        />

        {/* Left / Foreground Image: BASELINE (clipped by sliderPos) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={baselineUrl}
            alt="Baseline Build"
            className="block max-w-none h-auto select-none"
            style={{ width: containerRef.current?.clientWidth || '100%' }}
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

        {/* Vertical Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] z-20 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Thumb Handle */}
          <div
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center font-bold text-xs pointer-events-auto cursor-grab active:cursor-grabbing border-2 border-slate-900"
          >
            &#x21D4;
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-30 bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-700/80 pointer-events-none shadow">
          BASELINE ({Math.round(sliderPos)}%)
        </div>
        <div className="absolute top-3 right-3 z-30 bg-indigo-900/80 backdrop-blur text-indigo-200 text-[10px] font-bold px-2 py-1 rounded border border-indigo-700/80 pointer-events-none shadow">
          CURRENT ({Math.round(100 - sliderPos)}%)
        </div>
      </div>
    </div>
  );
};
