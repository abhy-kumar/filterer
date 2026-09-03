import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Bookmark,
  ChevronRight,
  SlidersHorizontal,
  Building2,
  PieChart,
  Briefcase
} from 'lucide-react';
import {
  SUPER_INVESTORS_DATA,
  SuperInvestor,
  computeHoldingValueCr,
  computeInvestorNetWorthCr,
  getConsensusPicks,
  DeltaType
} from '../data/superInvestorsData';
import { STOCKS_DATA } from '../data/stocksData';
import { price, crore, signClass } from '../lib/format';
import { stockPath } from '../lib/routes';
import { WatchlistModal } from '../components/WatchlistModal';
import { Footer } from '../components/Footer';

export const SuperInvestorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>(SUPER_INVESTORS_DATA[0].id);

  // Watchlist modal state
  const [watchlistModalStock, setWatchlistModalStock] = useState<{ symbol: string; name: string } | null>(null);

  // Pre-calculate live net worths
  const investorsWithWorth = useMemo(() => {
    return SUPER_INVESTORS_DATA.map((inv) => ({
      ...inv,
      liveNetWorthCr: computeInvestorNetWorthCr(inv),
    })).sort((a, b) => b.liveNetWorthCr - a.liveNetWorthCr);
  }, []);

  // Filtered investors
  const filteredInvestors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return investorsWithWorth.filter((inv) => {
      const matchType = typeFilter === 'All' || inv.type === typeFilter;
      const matchSearch =
        !q ||
        inv.name.toLowerCase().includes(q) ||
        (inv.alias && inv.alias.toLowerCase().includes(q)) ||
        inv.holdings.some(
          (h) =>
            h.symbol.toLowerCase().includes(q) ||
            h.companyName.toLowerCase().includes(q) ||
            h.sector.toLowerCase().includes(q)
        );
      return matchType && matchSearch;
    });
  }, [investorsWithWorth, searchQuery, typeFilter]);

  const selectedInvestor = useMemo(() => {
    return (
      filteredInvestors.find((inv) => inv.id === selectedInvestorId) ||
      filteredInvestors[0] ||
      investorsWithWorth[0]
    );
  }, [filteredInvestors, selectedInvestorId, investorsWithWorth]);

  // Overall Market summary stats
  const aggregateStats = useMemo(() => {
    const totalWorth = investorsWithWorth.reduce((sum, inv) => sum + inv.liveNetWorthCr, 0);
    const allSymbols = new Set(SUPER_INVESTORS_DATA.flatMap((i) => i.holdings.map((h) => h.symbol)));
    return {
      totalInvestors: SUPER_INVESTORS_DATA.length,
      totalWorthCr: totalWorth,
      totalStocksTracked: allSymbols.size,
    };
  }, [investorsWithWorth]);

  const consensusPicks = useMemo(() => getConsensusPicks(), []);

  // Detail portfolio table stocks with live prices
  const activeHoldings = useMemo(() => {
    if (!selectedInvestor) return [];
    return selectedInvestor.holdings.map((h) => {
      const stock = STOCKS_DATA.find((s) => s.symbol.toUpperCase() === h.symbol.toUpperCase());
      const holdingValue = computeHoldingValueCr(h.symbol, h.holding_pct);
      return {
        ...h,
        currentPrice: stock?.current_price ?? 0,
        changePct: stock?.change_pct ?? 0,
        marketCap: stock?.market_cap ?? 0,
        peRatio: stock?.pe_ratio ?? null,
        holdingValueCr: holdingValue,
      };
    }).sort((a, b) => b.holdingValueCr - a.holdingValueCr);
  }, [selectedInvestor]);

  // Delta counts for selected investor
  const deltaSummary = useMemo(() => {
    if (!selectedInvestor) return { newCount: 0, increased: 0, decreased: 0, unchanged: 0 };
    let newCount = 0, increased = 0, decreased = 0, unchanged = 0;
    for (const h of selectedInvestor.holdings) {
      if (h.delta.change === 'new') newCount++;
      else if (h.delta.change === 'increased') increased++;
      else if (h.delta.change === 'decreased') decreased++;
      else unchanged++;
    }
    return { newCount, increased, decreased, unchanged };
  }, [selectedInvestor]);

  return (
    <>
      <main className="flex-1 w-full apple-canvas animate-fade-in">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-apple-border pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-apple-primary font-display flex items-center gap-2.5">
                <Users className="w-6 h-6 text-apple-blue" />
                Super-Investors
              </h1>
            </div>

            {/* Aggregated KPIs */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="apple-card px-4 py-2.5 min-w-[120px]">
                <div className="text-[10px] uppercase font-semibold text-apple-muted tracking-wider">
                  Super-Investors
                </div>
                <div className="text-lg font-bold font-mono text-apple-primary mt-0.5">
                  {aggregateStats.totalInvestors}
                </div>
              </div>
              <div className="apple-card px-4 py-2.5 min-w-[140px]">
                <div className="text-[10px] uppercase font-semibold text-apple-muted tracking-wider">
                  Tracked Wealth
                </div>
                <div className="text-lg font-bold font-mono text-apple-primary mt-0.5">
                  ₹{Math.round(aggregateStats.totalWorthCr).toLocaleString('en-IN')} Cr
                </div>
              </div>
              <div className="apple-card px-4 py-2.5 min-w-[120px]">
                <div className="text-[10px] uppercase font-semibold text-apple-muted tracking-wider">
                  Unique Stocks
                </div>
                <div className="text-lg font-bold font-mono text-apple-primary mt-0.5">
                  {aggregateStats.totalStocksTracked}
                </div>
              </div>
            </div>
          </div>

          {/* Consensus Picks Strip */}
          {consensusPicks.length > 0 && (
            <div className="apple-card p-4 bg-gradient-to-r from-apple-blue/5 via-apple-surface to-apple-surface border border-apple-blue/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-apple-blue shrink-0" />
                <h3 className="text-xs font-semibold text-apple-primary font-display">
                  Consensus Super-Investor Stock Picks (Held by multiple 1%+ super-investors)
                </h3>
              </div>
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pt-1">
                {consensusPicks.map((pick) => (
                  <Link
                    key={pick.symbol}
                    to={stockPath(pick.symbol)}
                    className="apple-surface px-3 py-1.5 rounded-lg border border-apple-border/70 hover:border-apple-blue/50 text-xs flex items-center gap-2 whitespace-nowrap transition-colors group shrink-0"
                  >
                    <span className="font-mono font-bold text-apple-blue group-hover:underline">
                      {pick.symbol}
                    </span>
                    <span className="text-[10px] bg-apple-blue/10 text-apple-blue font-semibold px-1.5 py-0.5 rounded-full">
                      {pick.investorCount} Investors
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-apple-faint pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by investor, company, or symbol (e.g. Damani, Titan, Rare)..."
                className="apple-input text-xs pl-9 pr-4 h-9 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="apple-segmented">
                {['All', 'Individual HNI', 'Institutional / PMS', 'Family Office'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`apple-segmented-item text-xs ${typeFilter === t ? 'active' : ''}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Master-Detail Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Investor Cards List */}
            <div className="lg:col-span-4 space-y-2.5 max-h-[850px] overflow-y-auto no-scrollbar pr-1">
              <div className="text-xs font-semibold text-apple-muted px-1">
                {filteredInvestors.length} Investors Found
              </div>

              {filteredInvestors.map((inv) => {
                const isSelected = inv.id === selectedInvestor?.id;
                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvestorId(inv.id)}
                    className={`apple-card p-4 cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-apple-blue ring-1 ring-apple-blue/25 bg-apple-surface shadow-md'
                        : 'border-apple-border/70 hover:border-apple-border-strong bg-apple-card/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold font-display text-xs ${
                            isSelected
                              ? 'bg-apple-blue text-white'
                              : 'bg-apple-surface-active text-apple-primary'
                          }`}
                        >
                          {inv.avatar_initials}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-apple-primary font-display leading-tight">
                            {inv.name}
                          </h3>
                          {inv.alias && (
                            <p className="text-[11px] text-apple-muted truncate max-w-[170px]">
                              {inv.alias}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold font-mono text-apple-primary">
                          ₹{inv.liveNetWorthCr.toLocaleString('en-IN')} Cr
                        </div>
                        <div className="text-[10px] text-apple-faint font-mono">
                          {inv.holdings.length} stocks
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-apple-surface text-apple-muted border border-apple-border/40">
                        {inv.type}
                      </span>
                      {inv.holdings.slice(0, 3).map((h) => (
                        <span
                          key={h.symbol}
                          className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-apple-surface text-apple-secondary border border-apple-border/40"
                        >
                          {h.symbol} ({h.holding_pct}%)
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Selected Investor Portfolio Deep Dive */}
            <div className="lg:col-span-8 space-y-4">
              {selectedInvestor && (
                <div className="apple-card p-5 sm:p-6 space-y-6">
                  {/* Top Profile Card */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-apple-border pb-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-bold text-apple-primary font-display">
                          {selectedInvestor.name}
                        </h2>
                        <span className="apple-tag text-[11px] font-medium">
                          {selectedInvestor.type}
                        </span>
                        {selectedInvestor.alias && (
                          <span className="text-xs text-apple-muted">
                            ({selectedInvestor.alias})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-apple-secondary max-w-2xl leading-relaxed">
                        {selectedInvestor.description}
                      </p>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-[10.5px] font-semibold text-apple-muted uppercase tracking-wider">
                          Key Sectors:
                        </span>
                        {selectedInvestor.top_sectors.map((sec) => (
                          <span key={sec} className="apple-tag text-[10px]">
                            {sec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Net Worth Card */}
                    <div className="apple-well p-3.5 rounded-xl shrink-0 sm:text-right">
                      <div className="text-[10.5px] text-apple-muted">Estimated Equity Portfolio</div>
                      <div className="text-xl font-bold font-mono text-apple-primary mt-0.5">
                        ₹{selectedInvestor.liveNetWorthCr.toLocaleString('en-IN')} Cr
                      </div>
                      <div className="text-[10px] text-apple-faint mt-1 flex items-center sm:justify-end gap-1.5 font-mono">
                        <span>Latest: Q3 FY25 filings</span>
                      </div>
                    </div>
                  </div>

                  {/* Quarter Activity Delta Badges */}
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="text-apple-muted text-[11px] font-semibold">Latest Quarter Delta:</span>
                    {deltaSummary.newCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        +{deltaSummary.newCount} New Entrant
                      </span>
                    )}
                    {deltaSummary.increased > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        +{deltaSummary.increased} Stake Increased
                      </span>
                    )}
                    {deltaSummary.decreased > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        -{deltaSummary.decreased} Stake Trimmed
                      </span>
                    )}
                    {deltaSummary.unchanged > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-apple-surface text-apple-muted border border-apple-border/50">
                        {deltaSummary.unchanged} Unchanged
                      </span>
                    )}
                  </div>

                  {/* Portfolio Table */}
                  <div className="overflow-x-auto">
                    <table className="apple-table">
                      <thead>
                        <tr>
                          <th className="text-left">Company</th>
                          <th className="text-right">Price</th>
                          <th className="text-right">Day</th>
                          <th className="text-right">Holding %</th>
                          <th className="text-right">Value (₹ Cr)</th>
                          <th className="text-center">Quarter Delta</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeHoldings.map((h) => {
                          const delta = h.delta;
                          const isUp = h.changePct >= 0;

                          return (
                            <tr key={h.symbol} className="hover:bg-apple-surface/40 transition-colors">
                              <td>
                                <div>
                                  <Link
                                    to={stockPath(h.symbol)}
                                    className="font-mono text-xs font-semibold text-apple-blue hover:underline inline-flex items-center gap-1"
                                  >
                                    {h.symbol}
                                    <ArrowUpRight className="w-3 h-3 text-apple-faint" />
                                  </Link>
                                  <div className="text-[11px] text-apple-muted truncate max-w-[170px]">
                                    {h.companyName}
                                  </div>
                                </div>
                              </td>

                              <td className="text-right font-mono text-xs">
                                {price(h.currentPrice)}
                              </td>

                              <td className={`text-right font-mono text-xs ${signClass(h.changePct)}`}>
                                {isUp ? '+' : ''}
                                {h.changePct.toFixed(2)}%
                              </td>

                              <td className="text-right font-mono text-xs font-semibold text-apple-primary">
                                {h.holding_pct.toFixed(2)}%
                              </td>

                              <td className="text-right font-mono text-xs font-semibold text-apple-primary">
                                ₹{h.holdingValueCr.toLocaleString('en-IN')}
                              </td>

                              <td className="text-center">
                                {delta.change === 'new' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    NEW ({delta.delta_pct ? `+${delta.delta_pct}%` : 'Entered'})
                                  </span>
                                )}
                                {delta.change === 'increased' && (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                    <ArrowUp className="w-2.5 h-2.5" />
                                    +{delta.delta_pct?.toFixed(2)}%
                                  </span>
                                )}
                                {delta.change === 'decreased' && (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    <ArrowDown className="w-2.5 h-2.5" />
                                    {delta.delta_pct?.toFixed(2)}%
                                  </span>
                                )}
                                {delta.change === 'unchanged' && (
                                  <span className="text-[10.5px] font-mono text-apple-muted">
                                    Unchanged
                                  </span>
                                )}
                              </td>

                              <td className="text-right">
                                <button
                                  type="button"
                                  onClick={() => setWatchlistModalStock({ symbol: h.symbol, name: h.companyName })}
                                  className="apple-btn apple-btn-secondary p-1 text-[11px]"
                                  title={`Add ${h.symbol} to watchlist`}
                                >
                                  <Bookmark className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Watchlist Modal */}
      {watchlistModalStock && (
        <WatchlistModal
          isOpen={true}
          onClose={() => setWatchlistModalStock(null)}
          symbol={watchlistModalStock.symbol}
          stockName={watchlistModalStock.name}
        />
      )}

      <Footer />
    </>
  );
};

export default SuperInvestorsPage;
