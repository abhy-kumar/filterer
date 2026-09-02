import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { ScreenQueryBuilder } from './components/ScreenQueryBuilder';
import { ScreenResultsTable } from './components/ScreenResultsTable';
import { PresetScreens } from './components/PresetScreens';
import { CommandPalette } from './components/CommandPalette';
import { SaveScreenModal } from './components/SaveScreenModal';
import { Footer } from './components/Footer';
import { StockDetailPage } from './pages/StockDetailPage';
import { Stock, ScreenFilter } from './types/stock';
import { STOCKS_DATA } from './data/stocksData';
import { executeScreenerQuery } from './engine/screenerParser';
import { Sparkles, SlidersHorizontal, Bookmark, Trash2, Play } from 'lucide-react';

export const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryFromUrl = searchParams.get('q') || 'Market Capitalization > 500 AND Return on capital employed > 18 AND Debt to equity < 0.2';
  
  // We'll keep local query state so they can type without changing URL on every keystroke
  // Or we can just use the URL. Better to let `query` be local and URL be updated on run?
  // User asked: "When on /screen?q=..., read the query from URL search params".
  // So queryFromUrl is the source of truth for execution. Let's keep local state for the input box, sync on run.
  const [query, setQuery] = useState<string>(queryFromUrl);
  
  useEffect(() => {
    setQuery(queryFromUrl);
  }, [queryFromUrl]);

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
    return executeScreenerQuery(queryFromUrl, STOCKS_DATA);
  }, [queryFromUrl]);

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
    navigate(`/screen?q=${encodeURIComponent(screenQuery)}`);
  };

  const handleRunQuery = () => {
    navigate(`/screen?q=${encodeURIComponent(query)}`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const stocks = screenResult.matches;
    if (stocks.length === 0) return;

    const headers = [
      'Symbol', 'Name', 'Sector', 'Industry', 'Current Price', 'Market Cap (Cr)',
      'PE Ratio', 'ROCE %', 'ROE %', 'Debt to Equity', 'Sales Growth 3Y %',
      'Profit Growth 3Y %', 'Dividend Yield %', 'Piotroski Score', 'FCF Yield %'
    ];

    const rows = stocks.map((s) => [
      s.symbol, `"${s.name}"`, `"${s.sector}"`, `"${s.industry}"`,
      s.current_price, s.market_cap, s.pe_ratio, s.roce, s.roe,
      s.debt_to_equity, s.sales_growth_3y, s.profit_growth_3y,
      s.dividend_yield, s.piotroski_score, s.fcf_yield
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

  return (
    <div className="min-h-screen flex flex-col bg-[#06090e] dark:bg-[#06090e] light:bg-[#f8fafc]">
      <Header
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        savedScreensCount={savedScreens.length}
      />

      <Routes>
        <Route path="/" element={
          <>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              <div className="animate-fade-in">
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
                        onClick={() => navigate('/screen')}
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

                <PresetScreens
                  onSelectScreen={(s) => handleRunScreen(s.query)}
                  onRunScreen={handleRunScreen}
                />

                <div className="mt-12">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900">
                        Featured Screen: Debt-Free High Return Leaders
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Live matches for: <code className="text-sky-400 font-mono">{queryFromUrl}</code>
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/screen')}
                      className="text-xs font-semibold text-sky-400 hover:underline flex items-center gap-1"
                    >
                      Edit Filter Query &rarr;
                    </button>
                  </div>

                  <ScreenResultsTable
                    stocks={screenResult.matches}
                    onSelectStock={(s) => navigate(`/stock/${s.symbol}`)}
                    onExportCSV={handleExportCSV}
                  />
                </div>
              </div>
            </main>
            <Footer />
          </>
        } />

        <Route path="/screen" element={
          <>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              <div className="animate-fade-in">
                <ScreenQueryBuilder
                  query={query}
                  onChangeQuery={setQuery}
                  onRunQuery={handleRunQuery}
                  onSaveScreen={() => setIsSaveModalOpen(true)}
                  executionTimeMs={screenResult.executionTimeMs}
                  totalMatches={screenResult.matches.length}
                />

                <ScreenResultsTable
                  stocks={screenResult.matches}
                  onSelectStock={(s) => navigate(`/stock/${s.symbol}`)}
                  onExportCSV={handleExportCSV}
                />
              </div>
            </main>
            <Footer />
          </>
        } />

        <Route path="/saved" element={
          <>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
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
                    onClick={() => navigate('/screen')}
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
                      onClick={() => navigate('/screen')}
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
            </main>
            <Footer />
          </>
        } />

        <Route path="/stock/:symbol" element={<StockDetailPage />} />
      </Routes>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectStock={(s) => navigate(`/stock/${s.symbol}`)}
        onSelectScreen={(s) => handleRunScreen(s.query)}
        onInsertMetric={(metric) => {
          setQuery((prev) => (prev ? `${prev} AND ${metric} > ` : `${metric} > `));
          navigate('/screen');
        }}
      />

      <SaveScreenModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        query={queryFromUrl}
        onSave={handleSaveScreen}
      />
    </div>
  );
};

export default App;
