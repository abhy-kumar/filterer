import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ScreenQueryBuilder } from './components/ScreenQueryBuilder';
import { ScreenResultsTable } from './components/ScreenResultsTable';
import { PresetScreens } from './components/PresetScreens';
import { StockDetailModal } from './components/StockDetail/StockDetailModal';
import { CommandPalette } from './components/CommandPalette';
import { SaveScreenModal } from './components/SaveScreenModal';
import { Footer } from './components/Footer';
import { Stock, ScreenFilter } from './types/stock';
import { STOCKS_DATA } from './data/stocksData';
import { CURATED_SCREENS } from './data/screens';
import { executeScreenerQuery } from './engine/screenerParser';
import { Sparkles, SlidersHorizontal, Bookmark, Trash2, Play, ExternalLink } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'screens' | 'query' | 'saved'>('screens');
  const [query, setQuery] = useState<string>('Market Capitalization > 500 AND Return on capital employed > 18 AND Debt to equity < 0.2');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Saved Screens in LocalStorage
  const [savedScreens, setSavedScreens] = useState<ScreenFilter[]>(() => {
    try {
      const saved = localStorage.getItem('filterer_saved_screens');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toggle Theme Class on HTML root
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [isDark]);

  // Execute Query on Stocks Data
  const screenResult = useMemo(() => {
    return executeScreenerQuery(query, STOCKS_DATA);
  }, [query]);

  // Save new custom screen
  const handleSaveScreen = (newScreen: ScreenFilter) => {
    const updated = [newScreen, ...savedScreens];
    setSavedScreens(updated);
    try {
      localStorage.setItem('filterer_saved_screens', JSON.stringify(updated));
    } catch {}
  };

  // Delete saved screen
  const handleDeleteSavedScreen = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedScreens.filter((s) => s.id !== id);
    setSavedScreens(updated);
    try {
      localStorage.setItem('filterer_saved_screens', JSON.stringify(updated));
    } catch {}
  };

  // Run screen from preset or saved
  const handleRunScreen = (screenQuery: string) => {
    setQuery(screenQuery);
    setCurrentTab('query');
  };

  // Export CSV
  const handleExportCSV = () => {
    const stocks = screenResult.matches;
    if (stocks.length === 0) return;

    const headers = [
      'Symbol',
      'Name',
      'Sector',
      'Industry',
      'Current Price',
      'Market Cap (Cr)',
      'PE Ratio',
      'ROCE %',
      'ROE %',
      'Debt to Equity',
      'Sales Growth 3Y %',
      'Profit Growth 3Y %',
      'Dividend Yield %',
      'Piotroski Score',
      'FCF Yield %'
    ];

    const rows = stocks.map((s) => [
      s.symbol,
      `"${s.name}"`,
      `"${s.sector}"`,
      `"${s.industry}"`,
      s.current_price,
      s.market_cap,
      s.pe_ratio,
      s.roce,
      s.roe,
      s.debt_to_equity,
      s.sales_growth_3y,
      s.profit_growth_3y,
      s.dividend_yield,
      s.piotroski_score,
      s.fcf_yield
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `filterer_screen_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Navigate to peer stock
  const handleSelectPeer = (symbol: string) => {
    const found = STOCKS_DATA.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
    if (found) {
      setSelectedStock(found);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#06090e] dark:bg-[#06090e] light:bg-[#f8fafc]">
      {/* Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        savedScreensCount={savedScreens.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* TAB 1: CURATED POPULAR SCREENS */}
        {currentTab === 'screens' && (
          <div className="animate-fade-in">
            {/* Hero Section */}
            <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-sky-900/30 via-slate-900/50 to-indigo-900/20 border border-white/10 relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold border border-sky-500/20 mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  Free & Open Quantitative Stock Screener
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Discover High-Conviction <br className="hidden sm:inline" />
                  Indian Equities with Ease
                </h1>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  Screen over 500+ NSE & BSE stocks using Screener.in compatible formulas, 100+ fundamental indicators, and institutional quantitative models.
                </p>
                <div className="mt-6 flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setCurrentTab('query')}
                    className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Open Custom Screener
                  </button>
                  <button
                    onClick={() => setIsCommandPaletteOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-all"
                  >
                    Quick Search (Ctrl+K)
                  </button>
                </div>
              </div>
            </div>

            {/* Popular Screens Grid */}
            <PresetScreens
              onSelectScreen={(s) => handleRunScreen(s.query)}
              onRunScreen={handleRunScreen}
            />

            {/* Quick Live Preview Table */}
            <div className="mt-12">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900">
                    Featured Screen: Debt-Free High Return Leaders
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live matches for: <code className="text-sky-400 font-mono">{query}</code>
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('query')}
                  className="text-xs font-semibold text-sky-400 hover:underline flex items-center gap-1"
                >
                  Edit Filter Query &rarr;
                </button>
              </div>

              <ScreenResultsTable
                stocks={screenResult.matches}
                onSelectStock={setSelectedStock}
                onExportCSV={handleExportCSV}
              />
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM QUERY BUILDER & FULL RESULTS */}
        {currentTab === 'query' && (
          <div className="animate-fade-in">
            <ScreenQueryBuilder
              query={query}
              onChangeQuery={setQuery}
              onRunQuery={() => {}}
              onSaveScreen={() => setIsSaveModalOpen(true)}
              executionTimeMs={screenResult.executionTimeMs}
              totalMatches={screenResult.matches.length}
            />

            <ScreenResultsTable
              stocks={screenResult.matches}
              onSelectStock={setSelectedStock}
              onExportCSV={handleExportCSV}
            />
          </div>
        )}

        {/* TAB 3: USER SAVED SCREENS */}
        {currentTab === 'saved' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-sky-400" />
                  Your Saved Screens ({savedScreens.length})
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Custom screens and formulas saved in your browser.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('query')}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20"
              >
                + Create New Screen
              </button>
            </div>

            {savedScreens.length === 0 ? (
              <div className="bg-[#0c1017] rounded-2xl border border-white/10 p-12 text-center">
                <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No Saved Screens Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
                  Build custom formulas in the Screener Query Editor and click "Save Custom Screen" to keep them here for quick access.
                </p>
                <button
                  onClick={() => setCurrentTab('query')}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 text-white text-xs font-bold"
                >
                  Go to Custom Screener
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedScreens.map((screen) => (
                  <div
                    key={screen.id}
                    onClick={() => handleRunScreen(screen.query)}
                    className="bg-[#0c1017] rounded-2xl border border-white/10 p-5 hover:border-sky-500/40 cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                          {screen.title}
                        </h3>
                        <button
                          onClick={(e) => handleDeleteSavedScreen(screen.id, e)}
                          className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Screen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {screen.description}
                      </p>
                      <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-400 line-clamp-2">
                        {screen.query}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-slate-500">
                        {screen.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunScreen(screen.query);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 text-xs font-bold hover:bg-sky-500 hover:text-white transition-all"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Stock Detailed Analysis Modal */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
          onSelectPeer={handleSelectPeer}
        />
      )}

      {/* Command Palette Modal (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectStock={setSelectedStock}
        onSelectScreen={(s) => handleRunScreen(s.query)}
        onInsertMetric={(metric) => {
          setQuery((prev) => (prev ? `${prev} AND ${metric} > ` : `${metric} > `));
          setCurrentTab('query');
        }}
      />

      {/* Save Screen Modal */}
      <SaveScreenModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        query={query}
        onSave={handleSaveScreen}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
