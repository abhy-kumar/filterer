import React, { useState } from 'react';
import { Bookmark, X, Check } from 'lucide-react';
import { ScreenFilter } from '../types/stock';

interface SaveScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onSave: (newScreen: ScreenFilter) => void;
}

export const SaveScreenModal: React.FC<SaveScreenModalProps> = ({
  isOpen,
  onClose,
  query,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Popular' | 'Growth' | 'Valuation' | 'Technicals' | 'Safety' | 'Dividends'>('Popular');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newScreen: ScreenFilter = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Custom user created screener filter.',
      query: query.trim(),
      category,
      iconName: 'Sparkles',
      author: 'You',
    };

    onSave(newScreen);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0e141f] dark:bg-[#0e141f] light:bg-white w-full max-w-lg rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-300 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-sky-400" />
            Save Custom Screener
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Screen Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. High ROCE Midcaps with Zero Debt"
              className="w-full bg-slate-950/80 text-xs px-3.5 py-2.5 rounded-xl border border-white/10 text-white focus:outline-hidden focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Screens companies generating >20% return on capital with low leverage..."
              rows={2}
              className="w-full bg-slate-950/80 text-xs px-3.5 py-2 rounded-xl border border-white/10 text-white focus:outline-hidden focus:border-sky-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-slate-950/80 text-xs px-3.5 py-2.5 rounded-xl border border-white/10 text-slate-200 focus:outline-hidden focus:border-sky-500"
            >
              <option value="Popular">Popular</option>
              <option value="Growth">Growth</option>
              <option value="Valuation">Valuation</option>
              <option value="Technicals">Technicals</option>
              <option value="Safety">Safety</option>
              <option value="Dividends">Dividends</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Filter Query
            </label>
            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 font-mono text-[11px] text-sky-400 max-h-24 overflow-y-auto">
              {query}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-sky-500/20"
            >
              Save Screen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
