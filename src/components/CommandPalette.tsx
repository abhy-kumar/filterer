import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Building2, HelpCircle, X, ChevronRight, Hash } from 'lucide-react';
import { Stock, ScreenFilter, MetricDefinition } from '../types/stock';
import { STOCKS_DATA } from '../data/stocksData';
import { CURATED_SCREENS } from '../data/screens';
import { METRICS_DICTIONARY } from '../engine/metricsDictionary';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (stock: Stock) => void;
  onSelectScreen: (screen: ScreenFilter) => void;
  onInsertMetric: (metricName: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectStock,
  onSelectScreen,
  onInsertMetric,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const query = searchTerm.toLowerCase().trim();

  const matchingStocks = STOCKS_DATA.filter(
    (s) =>
      s.symbol.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query) ||
      s.sector.toLowerCase().includes(query)
  ).slice(0, 5);

  const matchingScreens = CURATED_SCREENS.filter(
    (sc) =>
      sc.title.toLowerCase().includes(query) ||
      sc.description.toLowerCase().includes(query) ||
      sc.category.toLowerCase().includes(query)
  ).slice(0, 3);

  const matchingMetrics = METRICS_DICTIONARY.filter(
    (m) =>
      m.name.toLowerCase().includes(query) ||
      m.aliases.some((a) => a.toLowerCase().includes(query)) ||
      m.description.toLowerCase().includes(query)
  ).slice(0, 4);

  const totalResults = matchingStocks.length + matchingScreens.length + matchingMetrics.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-fade-in">
      <div className="bg-[#0e141f] dark:bg-[#0e141f] light:bg-white w-full max-w-2xl rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-300 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a stock symbol, company name, formula ratio, or screen..."
            className="w-full bg-transparent text-sm sm:text-base text-white dark:text-white light:text-slate-900 placeholder-slate-500 focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No results found for "{searchTerm}".
            </div>
          ) : (
            <>
              {/* Stocks Section */}
              {matchingStocks.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    Stocks & Companies
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        onClick={() => {
                          onSelectStock(stock);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sky-400 font-mono text-sm group-hover:text-sky-300">
                            {stock.symbol}
                          </span>
                          <span className="text-xs text-slate-200 dark:text-slate-200 light:text-slate-800 truncate max-w-xs">
                            {stock.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hidden sm:inline">
                            {stock.sector}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span className="text-white font-semibold">₹{stock.current_price.toLocaleString('en-IN')}</span>
                          <span className={`text-[11px] ${stock.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {stock.change_pct >= 0 ? '+' : ''}{stock.change_pct.toFixed(2)}%
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Screens Section */}
              {matchingScreens.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Curated Screens
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingScreens.map((screen) => (
                      <div
                        key={screen.id}
                        onClick={() => {
                          onSelectScreen(screen);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 group-hover:text-amber-400">
                            {screen.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                            {screen.description}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                          {screen.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ratios & Metrics Section */}
              {matchingMetrics.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-emerald-400" />
                    Screener Ratios
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingMetrics.map((metric) => (
                      <div
                        key={metric.id}
                        onClick={() => {
                          onInsertMetric(metric.name);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400">
                              {metric.name}
                            </span>
                            <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-sky-400">
                              {metric.unit}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                            {metric.description}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Insert +
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <span>Search stocks, screens, or formulas</span>
          <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-400">Esc</kbd> to exit</span>
        </div>
      </div>
    </div>
  );
};
