import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Search,
  ArrowUpRight,
  Bookmark,
  Info,
  ShieldAlert,
  Sparkles,
  Flame,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { COMMODITIES_DATA, Commodity, CommodityImpactedStock, CycleStage } from '../data/commoditiesData';
import { STOCKS_DATA } from '../data/stocksData';
import { price, crore, signClass } from '../lib/format';
import { stockPath } from '../lib/routes';
import { WatchlistModal } from '../components/WatchlistModal';
import { Footer } from '../components/Footer';

export const CommoditiesPage: React.FC = () => {
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>(COMMODITIES_DATA[0].id);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [watchlistModalStock, setWatchlistModalStock] = useState<{ symbol: string; name: string } | null>(null);

  const categories = useMemo(() => {
    return ['All', 'Energy', 'Chemicals', 'Metals', 'Agriculture', 'Polymers'];
  }, []);

  const filteredCommodities = useMemo(() => {
    if (categoryFilter === 'All') return COMMODITIES_DATA;
    return COMMODITIES_DATA.filter((c) => c.category === categoryFilter);
  }, [categoryFilter]);

  const activeCommodity = useMemo(() => {
    return (
      filteredCommodities.find((c) => c.id === selectedCommodityId) ||
      filteredCommodities[0] ||
      COMMODITIES_DATA[0]
    );
  }, [filteredCommodities, selectedCommodityId]);

  // Enrich impacted stocks with live quote data from STOCKS_DATA
  const enrichedImpactedStocks = useMemo(() => {
    if (!activeCommodity) return { producers: [], consumers: [] };
    const enrich = (list: CommodityImpactedStock[]) =>
      list.map((item) => {
        const stock = STOCKS_DATA.find((s) => s.symbol.toUpperCase() === item.symbol.toUpperCase());
        return {
          ...item,
          currentPrice: stock?.current_price ?? 0,
          changePct: stock?.change_pct ?? 0,
          marketCap: stock?.market_cap ?? 0,
        };
      });

    const producers = enrich(activeCommodity.impactedStocks.filter((s) => s.role === 'producer'));
    const consumers = enrich(activeCommodity.impactedStocks.filter((s) => s.role === 'consumer'));

    return { producers, consumers };
  }, [activeCommodity]);

  const cycleBadgeClass = (stage: CycleStage) => {
    switch (stage) {
      case 'Expansion / Bull':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
      case 'Bottoming Out':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25';
      case 'Cooling / Bear':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
      case 'Peaking':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
      default:
        return 'bg-apple-surface text-apple-muted border-apple-border';
    }
  };

  return (
    <>
      <main className="flex-1 w-full apple-canvas animate-fade-in">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-apple-border pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-apple-blue shrink-0" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-apple-primary font-display">
                  Commodities
                </h1>
              </div>
              <p className="text-xs text-apple-muted mt-1 leading-normal">
                Track global and domestic input commodity prices, multi-year cycles, and stock margin impacts.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center apple-segmented self-start sm:self-auto overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`apple-segmented-item text-xs whitespace-nowrap ${
                    categoryFilter === cat ? 'active' : ''
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Commodity Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
            {filteredCommodities.map((comm) => {
              const isSelected = comm.id === activeCommodity?.id;
              const isPositive = comm.change1mPct >= 0;

              return (
                <button
                  key={comm.id}
                  onClick={() => setSelectedCommodityId(comm.id)}
                  className={`p-3 rounded-xl text-left transition-all border ${
                    isSelected
                      ? 'bg-apple-surface border-apple-blue shadow-sm ring-1 ring-apple-blue/20'
                      : 'bg-apple-card hover:bg-apple-surface border-apple-border/70'
                  }`}
                >
                  <div className="text-[10px] font-semibold uppercase text-apple-muted tracking-wider truncate">
                    {comm.category}
                  </div>
                  <div className="text-xs font-bold text-apple-primary truncate mt-0.5" title={comm.name}>
                    {comm.name}
                  </div>
                  <div className="font-mono text-xs font-bold text-apple-primary mt-2">
                    {comm.unit.startsWith('$') ? `$${comm.currentPrice}` : `₹${comm.currentPrice.toLocaleString('en-IN')}`}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono mt-0.5">
                    <span className="text-apple-muted">1M</span>
                    <span className={isPositive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                      {isPositive ? '+' : ''}{comm.change1mPct}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Selected Commodity Hub */}
          {activeCommodity && (
            <div className="space-y-6">
              {/* Top Overview & Chart Card */}
              <div className="apple-card p-5 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-apple-border pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-bold text-apple-primary font-display">
                        {activeCommodity.name}
                      </h2>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cycleBadgeClass(activeCommodity.cycleStage)}`}>
                        {activeCommodity.cycleStage}
                      </span>
                    </div>
                    <p className="text-xs text-apple-muted max-w-2xl">
                      {activeCommodity.description}
                    </p>
                  </div>

                  {/* Price & Changes */}
                  <div className="flex items-center gap-4 shrink-0 sm:text-right">
                    <div>
                      <div className="text-[10.5px] text-apple-muted">Current Benchmark</div>
                      <div className="text-2xl font-bold font-mono text-apple-primary mt-0.5">
                        {activeCommodity.unit.startsWith('$')
                          ? `$${activeCommodity.currentPrice}`
                          : `₹${activeCommodity.currentPrice.toLocaleString('en-IN')}`}
                        <span className="text-xs font-normal text-apple-muted ml-1">
                          {activeCommodity.unit}
                        </span>
                      </div>
                    </div>

                    <div className="pl-4 border-l border-apple-border space-y-0.5 text-xs font-mono">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10.5px] text-apple-muted">1M:</span>
                        <span className={signClass(activeCommodity.change1mPct)}>
                          {activeCommodity.change1mPct >= 0 ? '+' : ''}{activeCommodity.change1mPct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10.5px] text-apple-muted">6M:</span>
                        <span className={signClass(activeCommodity.change6mPct)}>
                          {activeCommodity.change6mPct >= 0 ? '+' : ''}{activeCommodity.change6mPct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10.5px] text-apple-muted">1Y:</span>
                        <span className={signClass(activeCommodity.change1yPct)}>
                          {activeCommodity.change1yPct >= 0 ? '+' : ''}{activeCommodity.change1yPct}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Macro Backdrop commentary */}
                <div className="apple-well p-3.5 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-apple-primary flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-apple-blue" />
                    Market Dynamics & Pricing Rationale
                  </div>
                  <p className="text-apple-secondary leading-relaxed">
                    {activeCommodity.macroContext}
                  </p>
                </div>

                {/* Recharts Price Trend Chart */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-apple-secondary flex items-center justify-between">
                    <span>16-Month Price Trajectory ({activeCommodity.unit})</span>
                    <span className="text-[11px] text-apple-muted font-normal font-mono">Monthly Average Closes</span>
                  </div>
                  <div className="h-60 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={activeCommodity.history}
                        margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--apple-blue)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--apple-blue)" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          stroke="var(--apple-border-strong)"
                          tick={{ fontSize: 10, fill: 'var(--apple-muted)' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={['auto', 'auto']}
                          stroke="var(--apple-border-strong)"
                          tick={{ fontSize: 10, fill: 'var(--apple-muted)' }}
                          axisLine={false}
                          tickLine={false}
                          orientation="right"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--apple-card-bg)',
                            borderColor: 'var(--apple-border)',
                            borderRadius: '8px',
                            fontSize: '11px',
                            color: 'var(--apple-primary)',
                          }}
                          formatter={(val: number) => [
                            activeCommodity.unit.startsWith('$') ? `$${val}` : `₹${val.toLocaleString('en-IN')}`,
                            activeCommodity.name,
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="var(--apple-blue)"
                          strokeWidth={2}
                          fill="url(#commGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Impacted Stocks Matrix: Beneficiaries vs Margin Pressure */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Producers / Beneficiaries Table */}
                <div className="apple-card p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-apple-border pb-3">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <div>
                      <h3 className="text-sm font-bold text-apple-primary font-display">
                        Beneficiaries / Raw Material Producers
                      </h3>
                      <p className="text-[11px] text-apple-muted">
                        Revenue & EBITDA expand when {activeCommodity.name} benchmark rises
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {enrichedImpactedStocks.producers.map((s) => (
                      <div
                        key={s.symbol}
                        className="p-3 rounded-lg border border-apple-border/70 hover:border-apple-border-strong bg-apple-surface/30 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            to={stockPath(s.symbol)}
                            className="font-mono text-xs font-bold text-apple-blue hover:underline inline-flex items-center gap-1"
                          >
                            {s.symbol}
                            <ArrowUpRight className="w-3 h-3 text-apple-faint" />
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-apple-primary">
                              {price(s.currentPrice)}
                            </span>
                            <span className={`font-mono text-[11px] ${signClass(s.changePct)}`}>
                              {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                            </span>
                            <button
                              type="button"
                              onClick={() => setWatchlistModalStock({ symbol: s.symbol, name: s.name })}
                              className="apple-btn apple-btn-secondary p-1 text-[10px]"
                              title={`Add ${s.symbol} to watchlist`}
                            >
                              <Bookmark className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-apple-secondary font-medium">
                          {s.name}
                        </div>

                        <p className="text-[11px] text-apple-muted leading-relaxed">
                          {s.impactDescription}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Consumers / Input Users Table */}
                <div className="apple-card p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-apple-border pb-3">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    <div>
                      <h3 className="text-sm font-bold text-apple-primary font-display">
                        Input Users / Margin Tailwinds from Softening
                      </h3>
                      <p className="text-[11px] text-apple-muted">
                        Gross margins expand when {activeCommodity.name} benchmark softens
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {enrichedImpactedStocks.consumers.map((s) => (
                      <div
                        key={s.symbol}
                        className="p-3 rounded-lg border border-apple-border/70 hover:border-apple-border-strong bg-apple-surface/30 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            to={stockPath(s.symbol)}
                            className="font-mono text-xs font-bold text-apple-blue hover:underline inline-flex items-center gap-1"
                          >
                            {s.symbol}
                            <ArrowUpRight className="w-3 h-3 text-apple-faint" />
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-apple-primary">
                              {price(s.currentPrice)}
                            </span>
                            <span className={`font-mono text-[11px] ${signClass(s.changePct)}`}>
                              {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                            </span>
                            <button
                              type="button"
                              onClick={() => setWatchlistModalStock({ symbol: s.symbol, name: s.name })}
                              className="apple-btn apple-btn-secondary p-1 text-[10px]"
                              title={`Add ${s.symbol} to watchlist`}
                            >
                              <Bookmark className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-apple-secondary font-medium">
                          {s.name}
                        </div>

                        <p className="text-[11px] text-apple-muted leading-relaxed">
                          {s.impactDescription}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
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

export default CommoditiesPage;
