import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bookmark, Plus, Trash2, Edit2, Check, ArrowRight, Search, ListFilter, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useWatchlists } from '../context/WatchlistContext';
import { ScreenResultsTable } from '../components/ScreenResultsTable';
import { STOCKS_DATA } from '../data/stocksData';
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
  const watchlistStocks = useMemo(() => {
    if (!activeWatchlist) return [];
    const symSet = new Set(activeWatchlist.symbols.map((s) => s.toUpperCase()));
    return STOCKS_DATA.filter((s) => symSet.has(s.symbol.toUpperCase()));
  }, [activeWatchlist]);

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
      <main className="flex-1 w-full apple-canvas animate-fade-in">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header with Title and Mode Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-apple-border pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-apple-primary font-display flex items-center gap-2.5">
                <Bookmark className="w-6 h-6 text-apple-blue" />
                Watchlists & Saved Screens
              </h1>
              <p className="text-xs text-apple-muted mt-1">
                Monitor your custom portfolios and saved screener formulas in one place.
              </p>
            </div>

            {/* Tab switch */}
            <div className="flex items-center apple-segmented self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('watchlists')}
                className={`apple-segmented-item flex items-center gap-1.5 ${
                  activeTab === 'watchlists' ? 'active' : ''
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                Custom Watchlists
                <span className="text-[10px] font-mono text-apple-muted ml-0.5">
                  {watchlists.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('screens')}
                className={`apple-segmented-item flex items-center gap-1.5 ${
                  activeTab === 'screens' ? 'active' : ''
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Saved Screens
                {savedScreens.length > 0 && (
                  <span className="text-[10px] font-mono text-apple-muted ml-0.5">
                    {savedScreens.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* WATCHLISTS VIEW */}
          {activeTab === 'watchlists' && (
            <div className="space-y-6">
              {/* Watchlists Pill Bar */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {watchlists.map((wl) => {
                  const isActive = wl.id === activeWatchlist?.id;
                  return (
                    <button
                      key={wl.id}
                      onClick={() => {
                        setActiveWatchlistId(wl.id);
                        setIsEditingWl(false);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${
                        isActive
                          ? 'bg-apple-primary text-apple-canvas border-apple-primary shadow-sm font-semibold'
                          : 'bg-apple-surface/60 hover:bg-apple-surface text-apple-secondary border-apple-border/70'
                      }`}
                    >
                      <span>{wl.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-apple-canvas/20 text-apple-canvas'
                            : 'bg-apple-border/60 text-apple-muted'
                        }`}
                      >
                        {wl.symbols.length}
                      </span>
                    </button>
                  );
                })}

                {isCreatingWl ? (
                  <form onSubmit={handleCreateWatchlist} className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={newWlName}
                      onChange={(e) => setNewWlName(e.target.value)}
                      placeholder="Watchlist Name"
                      autoFocus
                      className="apple-input text-xs h-8 px-2.5 w-36"
                    />
                    <button
                      type="submit"
                      disabled={!newWlName.trim()}
                      className="apple-btn apple-btn-primary text-xs h-8 px-2.5 disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingWl(false)}
                      className="apple-btn apple-btn-secondary text-xs h-8 px-2"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsCreatingWl(true)}
                    className="apple-btn apple-btn-secondary text-xs h-8 px-3 rounded-full shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Watchlist
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
                            className="apple-input text-sm font-semibold h-8 px-2.5 w-48 font-display"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveRename}
                            className="apple-btn apple-btn-primary text-xs px-2.5 h-8"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setIsEditingWl(false)}
                            className="apple-btn apple-btn-secondary text-xs px-2 h-8"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-apple-primary font-display">
                            {activeWatchlist.name}
                          </h2>
                          <button
                            onClick={() => {
                              setEditingName(activeWatchlist.name);
                              setIsEditingWl(true);
                            }}
                            className="apple-btn apple-btn-quiet p-1 text-apple-muted hover:text-apple-primary"
                            title="Rename watchlist"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {activeWatchlist.description && (
                        <span className="text-xs text-apple-muted hidden md:inline">
                          — {activeWatchlist.description}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 relative">
                      {/* Add stock to watchlist input */}
                      <div className="relative">
                        <input
                          type="text"
                          value={stockSearchQuery}
                          onChange={(e) => {
                            setStockSearchQuery(e.target.value);
                            setIsSearchingStock(true);
                          }}
                          onFocus={() => setIsSearchingStock(true)}
                          placeholder="+ Add stock by symbol or name..."
                          className="apple-input text-xs pl-8 pr-3 h-8 w-60"
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
                                className="w-full px-3 py-2 text-left text-xs hover:bg-apple-surface flex items-center justify-between transition-colors"
                              >
                                <span className="font-mono font-semibold text-apple-primary">
                                  {s.symbol}
                                </span>
                                <span className="text-[11px] text-apple-muted truncate max-w-[130px]">
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
                          className="apple-btn apple-btn-quiet text-rose-500 hover:bg-rose-500/10 p-1.5"
                          title="Delete watchlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric Stats */}
                  {kpis && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-apple-border/60">
                      <div>
                        <div className="text-[10.5px] text-apple-muted">Tracked Stocks</div>
                        <div className="text-base font-bold font-mono text-apple-primary mt-0.5">
                          {kpis.count}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10.5px] text-apple-muted">Total Market Cap</div>
                        <div className="text-base font-bold font-mono text-apple-primary mt-0.5">
                          ₹{Math.round(kpis.totalMcap).toLocaleString('en-IN')} Cr
                        </div>
                      </div>
                      <div>
                        <div className="text-[10.5px] text-apple-muted">Average P/E</div>
                        <div className="text-base font-bold font-mono text-apple-primary mt-0.5">
                          {kpis.avgPe !== null ? kpis.avgPe.toFixed(1) : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10.5px] text-apple-muted">Average ROCE</div>
                        <div className="text-base font-bold font-mono text-apple-primary mt-0.5">
                          {kpis.avgRoce !== null ? `${kpis.avgRoce.toFixed(1)}%` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10.5px] text-apple-muted">Avg Day Change</div>
                        <div
                          className={`text-base font-bold font-mono mt-0.5 ${
                            kpis.avgDayChange >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
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
                  <Bookmark className="w-8 h-8 text-apple-faint mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-apple-primary">Watchlist is empty</h3>
                  <p className="text-xs text-apple-muted max-w-sm mx-auto mt-1.5">
                    Use the search bar above or click "Add to Watchlist" on any stock page to add companies to {activeWatchlist?.name}.
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
                  <h2 className="text-lg font-bold text-apple-primary font-display">Saved Screens</h2>
                  <p className="text-xs text-apple-muted mt-0.5">
                    Queries saved in your browser localStorage.
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
                  <h3 className="text-sm font-semibold text-apple-primary">No saved screens</h3>
                  <p className="text-xs text-apple-muted max-w-sm mx-auto mt-1.5 leading-relaxed">
                    Build and save queries from the query editor to find them here.
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
                          onClick={(e) => onDeleteScreen(screen.id, e)}
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
                          {screen.createdAt
                            ? new Date(screen.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : ''}
                        </span>
                        <span className="text-apple-blue font-semibold">Run →</span>
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
