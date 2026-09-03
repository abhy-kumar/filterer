import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, Plus, Check, Trash2, X } from 'lucide-react';
import { useWatchlists } from '../context/WatchlistContext';

interface WatchlistModalProps {
  symbol: string;
  stockName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({ symbol, stockName, isOpen, onClose }) => {
  const { watchlists, toggleStockInWatchlist, isStockInWatchlist, createWatchlist } = useWatchlists();
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;
    createWatchlist(newWatchlistName.trim(), '', [symbol]);
    setNewWatchlistName('');
    setShowCreateInput(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="apple-card max-w-sm w-full p-5 shadow-2xl space-y-4 border border-apple-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-apple-blue" />
            <h2 className="text-sm font-semibold text-apple-primary font-display">
              Add {symbol} to Watchlist
            </h2>
          </div>
          <button
            onClick={onClose}
            className="apple-btn apple-btn-quiet p-1 -mr-1 text-apple-muted hover:text-apple-primary"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {stockName && (
          <p className="text-xs text-apple-muted -mt-2">
            {stockName}
          </p>
        )}

        <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar py-1">
          {watchlists.map((wl) => {
            const inList = isStockInWatchlist(wl.id, symbol);
            return (
              <button
                key={wl.id}
                type="button"
                onClick={() => toggleStockInWatchlist(wl.id, symbol)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs transition-colors border ${
                  inList
                    ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/20 font-medium'
                    : 'bg-apple-surface/40 hover:bg-apple-surface text-apple-secondary border-apple-border/50'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="font-medium truncate">{wl.name}</div>
                  <div className="text-[10px] text-apple-muted mt-0.5">
                    {wl.symbols.length} {wl.symbols.length === 1 ? 'stock' : 'stocks'}
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                    inList
                      ? 'bg-apple-blue border-apple-blue text-white'
                      : 'border-apple-border-strong bg-transparent'
                  }`}
                >
                  {inList && <Check className="w-3 h-3 stroke-[2.5]" />}
                </div>
              </button>
            );
          })}
        </div>

        {showCreateInput ? (
          <form onSubmit={handleCreate} className="flex gap-2 pt-2 border-t border-apple-border/50">
            <input
              type="text"
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              placeholder="e.g. Smallcap Gems"
              autoFocus
              className="apple-input text-xs flex-1 h-8 px-2.5"
            />
            <button
              type="submit"
              disabled={!newWatchlistName.trim()}
              className="apple-btn apple-btn-primary text-xs px-3 h-8 shrink-0 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateInput(false);
                setNewWatchlistName('');
              }}
              className="apple-btn apple-btn-secondary text-xs px-2.5 h-8 shrink-0"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreateInput(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-apple-blue hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Create new watchlist
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};
