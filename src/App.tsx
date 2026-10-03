import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Header } from './components/Header';
import { ScreenQueryBuilder } from './components/ScreenQueryBuilder';
import { ScreenResultsTable } from './components/ScreenResultsTable';
import { PresetScreens } from './components/PresetScreens';
import { CommandPalette } from './components/CommandPalette';
import { SaveScreenModal } from './components/SaveScreenModal';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PageHeader } from './components/PageHeader';
const StockDetailPage = lazy(() =>
  import('./pages/StockDetailPage').then((m) => ({ default: m.StockDetailPage }))
);
const SuperInvestorsPage = lazy(() =>
  import('./pages/SuperInvestorsPage').then((m) => ({ default: m.SuperInvestorsPage }))
);
const SavedAndWatchlistsPage = lazy(() =>
  import('./pages/SavedAndWatchlistsPage').then((m) => ({ default: m.SavedAndWatchlistsPage }))
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

    // Uses a Blob URL instead of a data URI to avoid encoding issues with special characters.
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

  const fallback = (
    <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      <div className="skeleton h-44" />
      <div className="skeleton h-72" />
    </main>
  );

  const isDefault = !searchParams.get('q');

  return (
    <div className="min-h-screen flex flex-col bg-apple-bg text-apple-primary pb-16 md:pb-0">
      <Header onOpenSearch={() => setPaletteOpen(true)} savedScreensCount={savedScreens.length} />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <main className="flex-1 w-full animate-fade-in">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                  <PageHeader
                    title="Screens"
                    aside={
                      <Link to="/screen" className="text-subheadline font-medium text-apple-blue hover:underline underline-offset-4">
                        Write your own query
                      </Link>
                    }
                  >
                    Starting points for the {STOCKS_DATA.length} companies in the Nifty 500. Each one is an ordinary
                    query: open it, and change the numbers if they don't suit you.
                  </PageHeader>

                  <PresetScreens onRunScreen={runScreen} universe={STOCKS_DATA} />

                  <section>
                    <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
                      <h2 className="text-headline text-apple-primary font-display">
                        {result.matches.length} {result.matches.length === 1 ? 'company' : 'companies'}
                        <span className="text-apple-muted font-normal">
                          {isDefault ? ' match the default query' : ' match this query'}
                        </span>
                      </h2>
                      <Link to={screenPath(committedQuery)} className="text-caption1 font-medium text-apple-blue hover:underline underline-offset-4 shrink-0">
                        Edit query
                      </Link>
                    </div>
                    <p className="font-mono text-caption1 text-apple-secondary mb-4 break-words">{committedQuery}</p>
                    {resultsTable}
                  </section>
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
              <main className="flex-1 w-full animate-fade-in">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                  <PageHeader
                    title="Query"
                    aside={
                      <Link to="/" className="text-subheadline font-medium text-apple-blue hover:underline underline-offset-4">
                        Back to screens
                      </Link>
                    }
                  >
                    The same syntax as Screener.in. Join conditions with AND, OR and NOT, and use arithmetic where you
                    need it, as in <code className="font-mono text-footnote">Debt / Market Capitalization &lt; 0.1</code>.
                  </PageHeader>

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

        {['/saved', '/watchlists'].map((path) => (
          <Route
            key={path}
            path={path}
            element={
              <Suspense fallback={fallback}>
                <SavedAndWatchlistsPage
                  savedScreens={savedScreens}
                  onDeleteScreen={handleDeleteScreen}
                  defaultTab="watchlists"
                />
              </Suspense>
            }
          />
        ))}

        {['/people', '/investors'].map((path) => (
          <Route
            key={path}
            path={path}
            element={
              <Suspense fallback={fallback}>
                <SuperInvestorsPage />
              </Suspense>
            }
          />
        ))}

        <Route
          path="/stock/:symbol"
          element={
            <Suspense fallback={fallback}>
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
                  <h1 className="text-title3 text-apple-primary font-display">Nothing at this address</h1>
                  <p className="text-subheadline text-apple-muted mt-1.5">
                    {window.location.pathname.startsWith('/commodities')
                      ? 'The commodities page has been taken down until it has a live price feed.'
                      : 'The link may be mistyped, or the page may have moved.'}
                  </p>
                  <Link to="/" className="apple-btn apple-btn-primary mt-5">
                    Go to screens
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

      <MobileBottomNav savedScreensCount={savedScreens.length} />
    </div>
  );
};


export default App;
