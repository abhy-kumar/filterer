import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useWatchlists } from '../context/WatchlistContext';
import { ScreenResultsTable } from '../components/ScreenResultsTable';
import { STOCKS_DATA } from '../data/stocksData';
import { useLiveQuotes } from '../context/LiveQuotesContext';
import { applyLiveQuote } from '../lib/liveStock';
import { ScreenFilter } from '../types/stock';
import { screenPath } from '../lib/routes';
import { Footer } from '../components/Footer';

interface SavedAndWatchlistsPageProps {
  savedScreens: ScreenFilter[];
  onDeleteScreen: (id: string, e: React.MouseEvent) => void;
  defaultTab?: 'watchlists' | 'screens';
}

export const SavedAndWatchlistsPage: React.FC<SavedAndWatchlistsPageProps> = ({
  savedScreens,
  onDeleteScreen,
  defaultTab = 'watchlists',
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'watchlists' | 'screens'>(defaultTab);

  const {
    watchlists,
    activeWatchlistId,
    setActiveWatchlistId,
    createWatchlist,
    renameWatchlist,
    deleteWatchlist,
    addStockToWatchlist,
    removeStockFromWatchlist,
  } = useWatchlists();

  // Watchlist creation & edit states
  const [isCreatingWl, setIsCreatingWl] = useState(false);
  const [newWlName, setNewWlName] = useState('');
  const [isEditingWl, setIsEditingWl] = useState(false);
  const [editingName, setEditingName] = useState('');

  // Quick stock search inside active watchlist
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [isSearchingStock, setIsSearchingStock] = useState(false);

  const activeWatchlist = useMemo(
    () => watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0],
    [watchlists, activeWatchlistId]
  );

  // Stocks in active watchlist
  const bundledWatchlistStocks = useMemo(() => {
    if (!activeWatchlist) return [];
    const symSet = new Set(activeWatchlist.symbols.map((s) => s.toUpperCase()));
    return STOCKS_DATA.filter((s) => symSet.has(s.symbol.toUpperCase()));
  }, [activeWatchlist]);

  // The basket's market cap and day change follow live prices too.
  const watchlistQuotes = useLiveQuotes(useMemo(() => bundledWatchlistStocks.map((s) => s.symbol), [bundledWatchlistStocks]));
  const watchlistStocks = useMemo(
    () => bundledWatchlistStocks.map((s) => applyLiveQuote(s, watchlistQuotes[s.symbol.toUpperCase()])),
    [bundledWatchlistStocks, watchlistQuotes]
  );

  // Autocomplete suggestions for adding stock
  const searchSuggestions = useMemo(() => {
    if (!stockSearchQuery.trim()) return [];
    const q = stockSearchQuery.trim().toLowerCase();
    const existingSyms = new Set(activeWatchlist?.symbols || []);
    return STOCKS_DATA.filter(
      (s) =>
        !existingSyms.has(s.symbol) &&
        (s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [stockSearchQuery, activeWatchlist]);

  // Watchlist KPIs
  const kpis = useMemo(() => {
    if (!watchlistStocks.length) return null;
    const totalMcap = watchlistStocks.reduce((sum, s) => sum + (s.market_cap || 0), 0);
    const validPe = watchlistStocks.map((s) => s.pe_ratio).filter((pe): pe is number => typeof pe === 'number' && pe > 0);
    const avgPe = validPe.length ? validPe.reduce((sum, pe) => sum + pe, 0) / validPe.length : null;
    const validRoce = watchlistStocks.map((s) => s.roce).filter((r): r is number => typeof r === 'number');
    const avgRoce = validRoce.length ? validRoce.reduce((sum, r) => sum + r, 0) / validRoce.length : null;
    const avgDayChange =
      watchlistStocks.reduce((sum, s) => sum + (s.change_pct || 0), 0) / watchlistStocks.length;

    return {
      count: watchlistStocks.length,
      totalMcap,
      avgPe,
      avgRoce,
      avgDayChange,
    };
  }, [watchlistStocks]);

  const handleCreateWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWlName.trim()) return;
    createWatchlist(newWlName.trim());
    setNewWlName('');
    setIsCreatingWl(false);
  };

  const handleSaveRename = () => {
    if (!activeWatchlist || !editingName.trim()) return;
    renameWatchlist(activeWatchlist.id, editingName.trim());
    setIsEditingWl(false);
  };

  const handleAddStock = (symbol: string) => {
    if (!activeWatchlist) return;
    addStockToWatchlist(activeWatchlist.id, symbol);
    setStockSearchQuery('');
    setIsSearchingStock(false);
  };

  return (
    <>
      <main className="flex-1 w-full animate-fade-in">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <PageHeader
            title="Watchlists"
            aside={
            <div className="flex items-center apple-segmented overflow-x-auto no-scrollbar max-w-full">
              <button
                onClick={() => setActiveTab('watchlists')}
                className={`apple-segmented-item flex items-center gap-1.5 ${
                  activeTab === 'watchlists' ? 'active' : ''
                }`}
              >
                Watchlists
                <span className="text-caption2 num text-apple-muted ml-0.5">
                  {watchlists.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('screens')}
                className={`apple-segmented-item flex items-center gap-1.5 ${
                  activeTab === 'screens' ? 'active' : ''
                }`}
              >
                Saved queries
                {savedScreens.length > 0 && (
                  <span className="text-caption2 num text-apple-muted ml-0.5">
                    {savedScreens.length}
                  </span>
                )}
              </button>
            </div>
            }
          >
            Companies you're following, and queries you've saved. Both are kept in this browser.
          </PageHeader>

          {/* WATCHLISTS VIEW */}
          {activeTab === 'watchlists' && (
            <div className="space-y-6">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-apple-border">
                {watchlists.map((wl) => {
                  const isActive = wl.id === activeWatchlist?.id;
                  return (
                    <button
                      key={wl.id}
                      onClick={() => {
                        setActiveWatchlistId(wl.id);
                        setIsEditingWl(false);
                      }}
                      className={`filter-tab flex items-baseline gap-1.5 ${isActive ? 'is-active' : ''}`}
                    >
                      <span>{wl.name}</span>
                      <span className="text-caption1 num text-apple-faint">{wl.symbols.length}</span>
                    </button>
                  );
                })}

                {isCreatingWl ? (
                  <form onSubmit={handleCreateWatchlist} className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={newWlName}
                      onChange={(e) => setNewWlName(e.target.value)}
                      placeholder="Name"
                      autoFocus
                      className="apple-input text-caption1 h-8 px-2.5 w-36"
                    />
                    <button
                      type="submit"
                      disabled={!newWlName.trim()}
                      className="apple-btn apple-btn-primary text-caption1 h-8 px-2.5 disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingWl(false)}
                      className="apple-btn apple-btn-quiet text-caption1 h-8 px-2"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsCreatingWl(true)}
                    className="filter-tab text-apple-blue hover:text-apple-blue shrink-0"
                  >
                    New list
                  </button>
                )}
              </div>

              {/* Active Watchlist Toolbar */}
              {activeWatchlist && (
                <div className="apple-card p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {isEditingWl ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="apple-input text-subheadline font-semibold h-8 px-2.5 w-48 font-display"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveRename}
                            className="apple-btn apple-btn-primary text-caption1 px-2.5 h-8"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditingWl(false)}
                            className="apple-btn apple-btn-quiet text-caption1 px-2 h-8"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h2 className="text-title3 text-apple-primary font-display">
                            {activeWatchlist.name}
                          </h2>
                          <button
                            onClick={() => {
                              setEditingName(activeWatchlist.name);
                              setIsEditingWl(true);
                            }}
                            className="apple-btn apple-btn-quiet apple-btn-sm text-apple-muted"
                          >
                            Rename
                          </button>
                        </div>
                      )}

                      {activeWatchlist.description && (
                        <span className="text-caption1 text-apple-muted hidden md:inline">
                          {activeWatchlist.description}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 relative w-full sm:w-auto">
                      {/* Add stock to watchlist input */}
                      <div className="relative flex-1 sm:flex-initial">
                        <input
                          type="text"
                          value={stockSearchQuery}
                          onChange={(e) => {
                            setStockSearchQuery(e.target.value);
                            setIsSearchingStock(true);
                          }}
                          onFocus={() => setIsSearchingStock(true)}
                          placeholder="Add a company"
                          className="apple-input text-caption1 pl-8 pr-3 h-8 w-full sm:w-60"
                        />
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-apple-faint pointer-events-none" />

                        {/* Suggestions Dropdown */}
                        {isSearchingStock && searchSuggestions.length > 0 && (
                          <div className="absolute top-9 left-0 right-0 z-30 apple-card shadow-xl border border-apple-border py-1 overflow-hidden animate-fade-in">
                            {searchSuggestions.map((s) => (
                              <button
                                key={s.symbol}
                                type="button"
                                onClick={() => handleAddStock(s.symbol)}
                                className="w-full px-3 py-2 text-left text-caption1 hover:bg-apple-surface flex items-center justify-between transition-colors"
                              >
                                <span className="num font-semibold text-apple-primary">
                                  {s.symbol}
                                </span>
                                <span className="text-caption2 text-apple-muted truncate max-w-[130px]">
                                  {s.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {watchlists.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete watchlist "${activeWatchlist.name}"?`)) {
                              deleteWatchlist(activeWatchlist.id);
                            }
                          }}
                          className="apple-btn apple-btn-quiet apple-btn-sm num-neg shrink-0"
                        >
                          Delete list
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric Stats */}
                  {kpis && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-3 border-t border-apple-border/60">
                      <div>
                        <div className="text-caption1 text-apple-muted">Companies</div>
                        <div className="text-headline font-display tabular-nums text-apple-primary mt-0.5">
                          {kpis.count}
                        </div>
                      </div>
                      <div>
                        <div className="text-caption1 text-apple-muted">Combined market cap</div>
                        <div className="text-headline font-display tabular-nums text-apple-primary mt-0.5">
                          ₹{Math.round(kpis.totalMcap).toLocaleString('en-IN')} Cr
                        </div>
                      </div>
                      <div>
                        <div className="text-caption1 text-apple-muted">Average P/E</div>
                        <div className="text-headline font-display tabular-nums text-apple-primary mt-0.5">
                          {kpis.avgPe !== null ? kpis.avgPe.toFixed(1) : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-caption1 text-apple-muted">Average ROCE</div>
                        <div className="text-headline font-display tabular-nums text-apple-primary mt-0.5">
                          {kpis.avgRoce !== null ? `${kpis.avgRoce.toFixed(1)}%` : '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-caption1 text-apple-muted">Average move today</div>
                        <div
                          className={`text-headline font-display tabular-nums mt-0.5 ${
                            kpis.avgDayChange >= 0 ? 'num-pos' : 'num-neg'
                          }`}
                        >
                          {kpis.avgDayChange >= 0 ? '+' : ''}
                          {kpis.avgDayChange.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Table of stocks in watchlist */}
              {watchlistStocks.length === 0 ? (
                <div className="apple-card py-16 px-6 text-center">
                  <h3 className="text-subheadline font-semibold text-apple-primary">Nothing in {activeWatchlist?.name} yet</h3>
                  <p className="text-caption1 text-apple-muted max-w-sm mx-auto mt-1.5">
                    Add a company with the box above, or from the Watchlist button on its page.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <ScreenResultsTable stocks={watchlistStocks} />
                </div>
              )}
            </div>
          )}

          {/* SAVED SCREENS VIEW */}
          {activeTab === 'screens' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-subheadline text-apple-secondary">
                    Queries you've saved. They live in this browser only.
                  </p>
                </div>
                <button onClick={() => navigate('/screen')} className="apple-btn apple-btn-primary">
                  New query
                </button>
              </div>

              {savedScreens.length === 0 ? (
                <div className="apple-card py-16 px-6 text-center">
                  <h3 className="text-subheadline font-semibold text-apple-primary">No saved queries</h3>
                  <p className="text-caption1 text-apple-muted max-w-sm mx-auto mt-1.5 leading-relaxed">
                    Write one on the Query page and press Save.
                  </p>
                  <button onClick={() => navigate('/screen')} className="apple-btn apple-btn-primary mt-5">
                    Write a query
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
                        <h3 className="text-subheadline font-semibold text-apple-primary group-hover:text-apple-blue transition-colors">
                          {screen.title}
                        </h3>
                        <button
                          onClick={(e) => onDeleteScreen(screen.id, e)}
                          className="apple-btn apple-btn-quiet apple-btn-sm -mr-1 -mt-1 text-apple-muted opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                          aria-label={`Delete ${screen.title}`}
                        >
                          Delete
                        </button>
                      </div>

                      {screen.description && (
                        <p className="text-caption1 text-apple-muted mt-1 line-clamp-2 leading-relaxed">
                          {screen.description}
                        </p>
                      )}

                      <code className="apple-well mt-3 p-2.5 block font-mono text-caption2 text-apple-secondary leading-relaxed line-clamp-3">
                        {screen.query}
                      </code>

                      <div className="mt-auto pt-3 flex items-center justify-between text-caption2">
                        <span className="text-apple-faint num">
                          {screen.createdAt
                            ? new Date(screen.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : ''}
                        </span>
                        <span className="text-apple-blue font-semibold">Run</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SavedAndWatchlistsPage;
