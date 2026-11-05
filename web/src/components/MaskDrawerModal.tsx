import React, { useState } from 'react';
import { EyeOff, X, Check } from 'lucide-react';

interface MaskDrawerModalProps {
  isOpen: boolean;
  targetName: string;
  onClose: () => void;
  onSaveMask: (targetName: string, selector: string) => Promise<boolean>;
}

export const MaskDrawerModal: React.FC<MaskDrawerModalProps> = ({
  isOpen,
  targetName,
  onClose,
  onSaveMask
}) => {
  const [selector, setSelector] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const presets = ['.timestamp', '[data-dynamic]', '.avatar', '.counter', '.badge-date', '.price-ticker'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selector.trim()) return;
    setSaving(true);
    const success = await onSaveMask(targetName, selector.trim());
    setSaving(false);
    if (success) {
      setSelector('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <EyeOff className="w-4 h-4 text-cyan-400" />
            <span>Add Dynamic Mask &bull; {targetName}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              CSS Selector to Mask:
            </label>
            <input
              type="text"
              placeholder="e.g. .timestamp, [data-avatar], #dynamic-ad"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Common Presets:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setSelector(p)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[11px] border border-slate-700/60 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selector.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Mask to Config'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
