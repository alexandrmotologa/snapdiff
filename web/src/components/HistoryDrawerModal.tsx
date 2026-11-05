import React, { useEffect, useState } from 'react';
import { History, X, RotateCcw } from 'lucide-react';
import type { ColorScheme, HistoryRecord } from '../types.js';

interface HistoryDrawerModalProps {
  isOpen: boolean;
  targetName: string;
  viewportName: string;
  colorScheme: ColorScheme;
  onClose: () => void;
  fetchHistory: (targetName: string, viewportName: string, colorScheme: ColorScheme) => Promise<HistoryRecord[]>;
  onRollback: (targetName: string, viewportName: string, filePath: string, colorScheme: ColorScheme) => Promise<void>;
}

export const HistoryDrawerModal: React.FC<HistoryDrawerModalProps> = ({
  isOpen,
  targetName,
  viewportName,
  colorScheme,
  onClose,
  fetchHistory,
  onRollback
}) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchHistory(targetName, viewportName, colorScheme).then((records) => {
        setHistory(records);
        setLoading(false);
      });
    }
  }, [isOpen, targetName, viewportName, colorScheme, fetchHistory]);

  if (!isOpen) return null;

  const handleRollback = async (filePath: string) => {
    if (!confirm('Roll back to this historical baseline?')) return;
    setRollingBack(true);
    await onRollback(targetName, viewportName, filePath, colorScheme);
    setRollingBack(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <History className="w-4 h-4 text-indigo-400" />
            <span>Baseline History &bull; {targetName} [{viewportName}]</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto space-y-2 text-xs">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading baseline history...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No previous versions archived yet. History is created whenever a baseline is replaced.
            </div>
          ) : (
            history.map((record, i) => (
              <div
                key={record.filePath}
                className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-200">
                    Version #{history.length - i}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {new Date(record.timestamp).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleRollback(record.filePath)}
                  disabled={rollingBack}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded font-medium transition disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore</span>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
