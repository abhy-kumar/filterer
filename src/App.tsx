import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Bookmark, Trash2, ArrowRight, Plus } from 'lucide-react';
import { Header } from './components/Header';
import { ScreenQueryBuilder } from './components/ScreenQueryBuilder';
import { ScreenResultsTable } from './components/ScreenResultsTable';
import { PresetScreens } from './components/PresetScreens';
import { CommandPalette } from './components/CommandPalette';
import { SaveScreenModal } from './components/SaveScreenModal';
import { Footer } from './components/Footer';
// The detail page pulls in Recharts and the statement tables; neither is
// needed to render a screen, so it loads on navigation.
const StockDetailPage = lazy(() =>
  import('./pages/StockDetailPage').then((m) => ({ default: m.StockDetailPage }))
);
import { ScreenFilter, Stock } from './types/stock';
import { STOCKS_DATA } from './data/stocksData';
import { executeScreenerQuery } from './engine/screenerParser';
import { getMetric } from './engine/metricsDictionary';
import { screenPath } from './lib/routes';

const SAVED_KEY = 'filterer_saved_screens';

const DEFAULT_QUERY =
  'Market Capitalization > 500 AND Return on capital employed > 18 AND Debt to equity < 0.2';

/** CSV field escaping, so a company name with a comma cannot shift a column. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const EXPORT_COLUMNS: Array<[string, (s: Stock) => unknown]> = [
  ['Symbol', (s) => s.symbol],
  ['Name', (s) => s.name],
  ['Sector', (s) => s.sector],
  ['Industry', (s) => s.industry],
  ['Current Price', (s) => s.current_price],
  ['Market Cap (Cr)', (s) => s.market_cap],
  ['P/E', (s) => s.pe_ratio],
  ['P/B', (s) => s.pb_ratio],
  ['ROCE %', (s) => s.roce],
  ['ROE %', (s) => s.roe],
  ['Debt to Equity', (s) => s.debt_to_equity],
  ['OPM %', (s) => s.opm],
  ['Sales Growth 3Y %', (s) => s.sales_growth_3y],
  ['Profit Growth 3Y %', (s) => s.profit_growth_3y],
  ['Dividend Yield %', (s) => s.dividend_yield],
  ['Piotroski Score', (s) => s.piotroski_score],
  ['FCF Yield %', (s) => s.fcf_yield],
  ['RSI 14', (s) => s.rsi_14],
];

function useSavedScreens() {
  const [savedScreens, setSavedScreens] = useState<ScreenFilter[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const persist = useCallback((next: ScreenFilter[]) => {
    setSavedScreens(next);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    } catch {
      // Private browsing; the list stays for this session only.
    }
  }, []);

  return { savedScreens, persist };
}

export const App: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const committedQuery = searchParams.get('q') ?? DEFAULT_QUERY;
  const [draftQuery, setDraftQuery] = useState(committedQuery);

  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [isSaveOpen, setSaveOpen] = useState(false);
  const { savedScreens, persist } = useSavedScreens();

  useEffect(() => {
    setDraftQuery(committedQuery);
  }, [committedQuery]);

  // The shortcut the header advertises has to actually open the palette; the
  // previous handler only ever closed it.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const result = useMemo(() => executeScreenerQuery(committedQuery, STOCKS_DATA), [committedQuery]);

  const runScreen = useCallback(
    (query: string) => navigate(screenPath(query)),
    [navigate]
  );

  const handleExportCSV = useCallback(() => {
    const rows = result.matches;
    if (!rows.length) return;

    const csv = [
      EXPORT_COLUMNS.map(([label]) => csvCell(label)).join(','),
      ...rows.map((stock) => EXPORT_COLUMNS.map(([, read]) => csvCell(read(stock))).join(',')),
    ].join('\r\n');

    // A Blob, not a data: URI — the old encodeURI approach mangled '#' and
    // broke outright on large result sets.
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `filterer-screen-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [result.matches]);

  const handleSaveScreen = (screen: ScreenFilter) => persist([screen, ...savedScreens]);

  const handleDeleteScreen = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    persist(savedScreens.filter((s) => s.id !== id));
  };

  const resultsTable = (
    <ScreenResultsTable
      stocks={result.matches}
      onExportCSV={handleExportCSV}
      emphasise={result.metrics}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-apple-bg text-apple-primary">
      <Header onOpenSearch={() => setPaletteOpen(true)} savedScreensCount={savedScreens.length} />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <main className="flex-1 w-full apple-canvas">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 animate-fade-in">
                  {/* Statement of what this is, without the badge soup. */}
                  <div className="max-w-2xl">
                    <h1 className="text-3xl sm:text-[2.75rem] font-bold tracking-[-0.035em] text-apple-primary font-display leading-[1.08]">
                      Screen Indian equities
                      <br />
                      with natural query syntax.
                    </h1>
                    <p className="text-[15px] text-apple-secondary mt-4 leading-relaxed">
                      Express fundamental criteria in plain terms, combine formulas with logical operators, and evaluate 100+ metrics across the Nifty 500 instantaneously.
                    </p>

                    <div className="flex items-center gap-2.5 mt-6">
                      <button onClick={() => navigate('/screen')} className="apple-btn apple-btn-primary px-5 py-2.5 text-[13px]">
                        Query Editor
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setPaletteOpen(true)} className="apple-btn apple-btn-secondary px-4 py-2.5 text-[13px]">
                        Search Company
                        <kbd className="text-[10px] font-mono text-apple-faint ml-0.5">⌘K</kbd>
                      </button>
                    </div>
                  </div>

                  <div className="mt-14">
                    <PresetScreens onRunScreen={runScreen} universe={STOCKS_DATA} />
                  </div>

                  <div className="mt-14">
                    <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-apple-primary font-display">Active Screen</h2>
                        <p className="text-xs text-apple-muted mt-1 font-mono truncate max-w-2xl">{committedQuery}</p>
                      </div>
                      <Link to={screenPath(committedQuery)} className="text-xs font-semibold text-apple-blue hover:underline shrink-0">
                        Customize query →
                      </Link>
                    </div>
                    {resultsTable}
                  </div>
                </div>
              </main>
              <Footer />
            </>
          }
        />

        <Route
          path="/screen"
          element={
            <>
              <main className="flex-1 w-full">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
                  <ScreenQueryBuilder
                    query={draftQuery}
                    onChangeQuery={setDraftQuery}
                    onRunQuery={() => runScreen(draftQuery)}
                    onSaveScreen={() => setSaveOpen(true)}
                    universe={STOCKS_DATA}
                    executionTimeMs={result.executionTimeMs}
                    totalMatches={result.matches.length}
                    runError={result.error}
                    isDirty={draftQuery !== committedQuery}
                  />
                  {resultsTable}
                </div>
              </main>
              <Footer />
            </>
          }
        />

        <Route
          path="/saved"
          element={
            <>
              <main className="flex-1 w-full">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                  <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
                    <div>
                      <h1 className="text-xl font-semibold text-apple-primary font-display">Saved Screens</h1>
                      <p className="text-xs text-apple-muted mt-1">
                        Screens saved to local storage for quick access across sessions.
                      </p>
                    </div>
                    <button onClick={() => navigate('/screen')} className="apple-btn apple-btn-primary">
                      <Plus className="w-3.5 h-3.5" />
                      New Screen
                    </button>
                  </div>

                  {savedScreens.length === 0 ? (
                    <div className="apple-card py-16 px-6 text-center">
                      <Bookmark className="w-7 h-7 text-apple-faint mx-auto mb-3" />
                      <h2 className="text-sm font-semibold text-apple-primary">No saved screens</h2>
                      <p className="text-xs text-apple-muted max-w-sm mx-auto mt-1.5 leading-relaxed">
                        Construct your investment screens in the Query Editor and save them here for continuous tracking.
                      </p>
                      <button onClick={() => navigate('/screen')} className="apple-btn apple-btn-primary mt-5">
                        Open Query Editor
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {savedScreens.map((screen) => (
                        <Link
                          key={screen.id}
                          to={screenPath(screen.query)}
                          className="apple-card apple-card-interactive p-4 flex flex-col group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-apple-primary group-hover:text-apple-blue transition-colors">
                              {screen.title}
                            </h3>
                            <button
                              onClick={(e) => handleDeleteScreen(screen.id, e)}
                              className="apple-btn apple-btn-quiet p-1 -mr-1 -mt-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                              title={`Delete ${screen.title}`}
                              aria-label={`Delete ${screen.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {screen.description && (
                            <p className="text-xs text-apple-muted mt-1 line-clamp-2 leading-relaxed">
                              {screen.description}
                            </p>
                          )}

                          <code className="apple-well mt-3 p-2.5 block font-mono text-[11px] text-apple-secondary leading-relaxed line-clamp-3">
                            {screen.query}
                          </code>

                          <div className="mt-auto pt-3 flex items-center justify-between text-[11px]">
                            <span className="text-apple-faint font-mono">
                              {screen.createdAt ? new Date(screen.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                            </span>
                            <span className="text-apple-blue font-semibold">Run →</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </main>
              <Footer />
            </>
          }
        />

        <Route
          path="/stock/:symbol"
          element={
            <Suspense
              fallback={
                <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
                  <div className="skeleton h-56" />
                  <div className="skeleton h-40" />
                </main>
              }
            >
              <StockDetailPage />
            </Suspense>
          }
        />

        <Route
          path="*"
          element={
            <>
              <main className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <h1 className="text-lg font-semibold text-apple-primary font-display">Page not found</h1>
                  <p className="text-xs text-apple-muted mt-1.5">That address does not match anything here.</p>
                  <Link to="/" className="apple-btn apple-btn-primary mt-5">
                    Back to the screener
                  </Link>
                </div>
              </main>
              <Footer />
            </>
          }
        />
      </Routes>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setPaletteOpen(false)}
        onInsertMetric={(metricName) => {
          const metric = getMetric(metricName) ?? undefined;
          const text = metric ? metric.name : metricName;
          setDraftQuery((q) => (q.trim() ? `${q.trim()} AND ${text} ` : `${text} `));
          navigate('/screen');
        }}
      />

      <SaveScreenModal
        isOpen={isSaveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={handleSaveScreen}
        query={draftQuery}
      />
    </div>
  );
};

export default App;
