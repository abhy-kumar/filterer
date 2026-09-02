import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Building2, HelpCircle, X, ChevronRight, Hash } from 'lucide-react';
import { Stock, ScreenFilter, MetricDefinition } from '../types/stock';
import { STOCKS_DATA } from '../data/stocksData';
import { CURATED_SCREENS } from '../data/screens';
import { METRICS_DICTIONARY } from '../engine/metricsDictionary';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock?: (stock: Stock) => void;
  onSelectScreen?: (screen: ScreenFilter) => void;
  onInsertMetric?: (metricName: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectStock,
  onSelectScreen,
  onInsertMetric,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
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
  ).slice(0, 6);

  const matchingScreens = CURATED_SCREENS.filter(
    (s) =>
      s.title.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.category.toLowerCase().includes(query)
  ).slice(0, 4);

  const matchingMetrics = METRICS_DICTIONARY.filter(
    (m) =>
      m.name.toLowerCase().includes(query) ||
      m.description.toLowerCase().includes(query) ||
      m.aliases.some((a) => a.toLowerCase().includes(query))
  ).slice(0, 5);

  const hasResults =
    matchingStocks.length > 0 || matchingScreens.length > 0 || matchingMetrics.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 p-4 animate-fade-in">
      <div className="bg-apple-card w-full max-w-2xl rounded-3xl border border-apple shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Top Search Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-apple-border-subtle bg-apple-subtle">
          <Search className="w-5 h-5 text-apple-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search across 500 stocks, curated screens, financial ratios..."
            className="w-full bg-transparent text-sm sm:text-base text-apple-primary placeholder-apple-muted focus:outline-hidden"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="p-1 text-apple-muted hover:text-apple-primary">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-apple-muted bg-apple-card rounded-md border border-apple-border">
            ESC
          </kbd>
        </div>

        {/* Search Results Area */}
        <div className="overflow-y-auto p-3 space-y-4 flex-1">
          {!hasResults && query ? (
            <div className="py-12 text-center text-apple-muted text-xs">
              No results found for "{searchTerm}". Try searching by ticker (e.g. RELIANCE), screen name, or ratio.
            </div>
          ) : (
            <>
              {/* Stocks Section */}
              {matchingStocks.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-apple-muted px-3 py-1 flex items-center gap-1.5 font-display">
                    <Building2 className="w-3.5 h-3.5 text-apple-blue" />
                    Stocks ({matchingStocks.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        onClick={() => {
                          navigate(`/stock/${stock.symbol}`);
                          if (onSelectStock) onSelectStock(stock);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-apple-surface-hover cursor-pointer flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-apple-blue font-mono text-sm group-hover:underline">
                            {stock.symbol}
                          </span>
                          <span className="text-xs text-apple-primary truncate max-w-xs">
                            {stock.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-apple-subtle text-apple-muted hidden sm:inline border border-apple-border-subtle">
                            {stock.sector}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span className="text-apple-primary font-semibold">₹{stock.current_price.toLocaleString('en-IN')}</span>
                          <span className={`text-[11px] ${stock.change_pct >= 0 ? 'text-apple-green' : 'text-apple-red'}`}>
                            {stock.change_pct >= 0 ? '+' : ''}{stock.change_pct.toFixed(2)}%
                          </span>
                          <ChevronRight className="w-4 h-4 text-apple-muted group-hover:text-apple-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Screens Section */}
              {matchingScreens.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-apple-muted px-3 py-1 flex items-center gap-1.5 font-display">
                    <Sparkles className="w-3.5 h-3.5 text-apple-amber" />
                    Curated Screens
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingScreens.map((screen) => (
                      <div
                        key={screen.id}
                        onClick={() => {
                          navigate(`/screen?q=${encodeURIComponent(screen.query)}`);
                          if (onSelectScreen) onSelectScreen(screen);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-apple-surface-hover cursor-pointer flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-apple-primary group-hover:text-apple-blue">
                            {screen.title}
                          </div>
                          <div className="text-[11px] text-apple-muted truncate max-w-md mt-0.5">
                            {screen.description}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-apple-subtle text-apple-muted uppercase border border-apple-border-subtle">
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
                  <div className="text-[11px] font-bold uppercase tracking-wider text-apple-muted px-3 py-1 flex items-center gap-1.5 font-display">
                    <Hash className="w-3.5 h-3.5 text-apple-green" />
                    Screener Ratios
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingMetrics.map((metric) => (
                      <div
                        key={metric.id}
                        onClick={() => {
                          if (onInsertMetric) onInsertMetric(metric.name);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-apple-surface-hover cursor-pointer flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-apple-primary group-hover:text-apple-green">
                              {metric.name}
                            </span>
                            <span className="text-[10px] font-mono px-1 rounded bg-apple-subtle text-apple-blue border border-apple-border-subtle">
                              {metric.unit}
                            </span>
                          </div>
                          <div className="text-[11px] text-apple-muted truncate max-w-md mt-0.5">
                            {metric.description}
                          </div>
                        </div>
                        <span className="text-[10px] text-apple-muted font-mono">Insert &crarr;</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 border-t border-apple-border-subtle bg-apple-subtle text-[11px] text-apple-muted flex items-center justify-between">
          <span>Search stocks, strategies, or formulas</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
};
