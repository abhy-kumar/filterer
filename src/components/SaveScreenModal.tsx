import React, { useState } from 'react';
import { Bookmark, X } from 'lucide-react';
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
      description: description.trim() || 'Custom quantitative formula filter.',
      query: query.trim(),
      category,
      iconName: 'Zap',
      author: 'You',
      createdAt: new Date().toISOString(),
    };

    onSave(newScreen);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-apple-card w-full max-w-lg rounded-3xl border border-apple shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-apple-border-subtle">
          <h3 className="text-base font-bold text-apple-primary flex items-center gap-2 font-display">
            <Bookmark className="w-4 h-4 text-apple-blue" />
            Save Custom Screener
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-apple-muted hover:text-apple-primary hover:bg-apple-subtle transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-apple-primary mb-1">
              Screen Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. High ROCE Midcaps with Low Leverage"
              className="w-full bg-apple-subtle text-xs px-3.5 py-2.5 rounded-xl border border-apple-border text-apple-primary focus:outline-hidden focus:border-apple-blue transition-colors shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-apple-primary mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Filters companies generating >20% return on capital with low D/E ratio..."
              rows={2}
              className="w-full bg-apple-subtle text-xs px-3.5 py-2 rounded-xl border border-apple-border text-apple-primary focus:outline-hidden focus:border-apple-blue resize-none transition-colors shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-apple-primary mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-apple-subtle text-xs px-3.5 py-2.5 rounded-xl border border-apple-border text-apple-secondary focus:outline-hidden focus:border-apple-blue transition-colors shadow-xs"
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
            <label className="block text-xs font-semibold text-apple-primary mb-1">
              Filter Query
            </label>
            <div className="p-3 bg-apple-subtle rounded-xl border border-apple-border font-mono text-[11px] text-apple-blue max-h-24 overflow-y-auto">
              {query}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-apple-subtle hover:bg-apple-surface-active text-xs font-semibold text-apple-secondary hover:text-apple-primary border border-apple-border transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-xl bg-apple-blue hover:opacity-90 disabled:opacity-50 text-xs font-semibold text-white shadow-sm transition-all"
            >
              Save Screen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
