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
import { ScreenFilter } from './types/stock';
import { STOCKS_DATA } from './data/stocksData';
import { executeScreenerQuery } from './engine/screenerParser';
import { SlidersHorizontal, Bookmark, Trash2, Play, Search, Zap, ShieldCheck } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

export const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();

  const queryFromUrl = searchParams.get('q') || 'Market Capitalization > 500 AND Return on capital employed > 18 AND Debt to equity < 0.2';
  const [query, setQuery] = useState<string>(queryFromUrl);

  useEffect(() => {
    setQuery(queryFromUrl);
  }, [queryFromUrl]);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Saved Screens in LocalStorage
  const [savedScreens, setSavedScreens] = useState<ScreenFilter[]>(() => {
    try {
      const saved = localStorage.getItem('filterer_saved_screens');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
    <div className="min-h-screen flex flex-col bg-apple-bg text-apple-primary transition-colors duration-200">
      <Header
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        savedScreensCount={savedScreens.length}
      />

      <Routes>
        <Route path="/" element={
          <>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
              <div className="animate-fade-in">
                {/* Apple macOS-Style Command Banner */}
                <div className="mb-8 p-6 sm:p-8 rounded-3xl apple-card relative overflow-hidden">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-apple-blue-subtle text-apple-blue text-xs font-semibold font-mono border border-apple-blue/20">
                          <Zap className="w-3 h-3" />
                          Sub-10ms AST Engine
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-apple-green-subtle text-apple-green text-xs font-semibold font-mono border border-apple-green/20">
                          <ShieldCheck className="w-3 h-3" />
                          500 Nifty Equities
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-apple-subtle text-apple-muted text-xs font-mono border border-apple-border">
                          Zero Paywalls • 100% Free
                        </span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-apple-primary font-display">
                        Indian Equity Screener
                      </h1>
                      <p className="text-sm text-apple-secondary mt-2 leading-relaxed">
                        Construct quantitative valuation screens with Screener.in natural query syntax, multi-variable financial formulas, and instant in-browser AST evaluation.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                      <button
                        onClick={() => navigate('/screen')}
                        className="px-5 py-2.5 rounded-xl bg-apple-blue hover:opacity-90 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 active:scale-95"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Query Builder</span>
                      </button>
                      <button
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-apple-subtle hover:bg-apple-surface-active text-apple-primary text-xs font-medium border border-apple-border transition-all flex items-center gap-2 active:scale-95 shadow-xs"
                      >
                        <Search className="w-3.5 h-3.5 text-apple-muted" />
                        <span>Search (⌘K)</span>
                      </button>
                    </div>
                  </div>
                </div>

                <PresetScreens
                  onSelectScreen={(s) => handleRunScreen(s.query)}
                  onRunScreen={handleRunScreen}
                />

                <div className="mt-10">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-apple-primary font-display">
                        Featured Strategy: Debt-Free High Return Leaders
                      </h3>
                      <p className="text-xs text-apple-muted mt-0.5">
                        Matches: <code className="text-apple-blue font-mono font-medium">{queryFromUrl}</code>
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/screen')}
                      className="text-xs font-semibold text-apple-blue hover:underline flex items-center gap-1"
                    >
                      Edit Query &rarr;
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
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
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
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
              <div className="animate-fade-in">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-apple-primary font-display flex items-center gap-2">
                      <Bookmark className="w-6 h-6 text-apple-blue" />
                      Saved Screens
                    </h2>
                    <p className="text-xs text-apple-muted mt-1">
                      Custom financial filters stored locally in your browser session.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/screen')}
                    className="px-4 py-2 rounded-xl bg-apple-blue hover:opacity-90 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    + Create New Screen
                  </button>
                </div>

                {savedScreens.length === 0 ? (
                  <div className="apple-card p-12 text-center my-8">
                    <Bookmark className="w-12 h-12 text-apple-muted mx-auto mb-3 opacity-40" />
                    <h3 className="text-base font-semibold text-apple-primary">No Saved Screens Yet</h3>
                    <p className="text-xs text-apple-muted max-w-sm mx-auto mt-1 mb-5">
                      Save your custom screening formulas to quickly re-run quantitative analyses across the Nifty 500.
                    </p>
                    <button
                      onClick={() => navigate('/screen')}
                      className="px-5 py-2.5 rounded-xl bg-apple-blue hover:opacity-90 text-white text-xs font-semibold transition-all shadow-sm"
                    >
                      Open Query Builder
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedScreens.map((screen) => (
                      <div
                        key={screen.id}
                        onClick={() => handleRunScreen(screen.query)}
                        className="apple-card p-5 cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-apple-primary group-hover:text-apple-blue transition-colors">
                              {screen.title}
                            </h3>
                            <button
                              onClick={(e) => handleDeleteSavedScreen(screen.id, e)}
                              className="p-1.5 rounded-lg text-apple-muted hover:text-apple-red hover:bg-apple-red-subtle transition-colors"
                              title="Delete screen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-apple-muted line-clamp-2">
                            {screen.description || 'Custom user formula'}
                          </p>
                          <div className="mt-3 p-2.5 rounded-xl bg-apple-subtle border border-apple-border font-mono text-[11px] text-apple-secondary line-clamp-2">
                            {screen.query}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-apple-border flex items-center justify-between">
                          <span className="text-[10px] font-mono text-apple-muted">
                            {screen.createdAt ? new Date(screen.createdAt).toLocaleDateString() : 'Curated'}
                          </span>
                          <span className="text-xs font-semibold text-apple-blue flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Run Screen &rarr;
                          </span>
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
      />

      <SaveScreenModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveScreen}
        query={query}
      />
    </div>
  );
};

export default App;
