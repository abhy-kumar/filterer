import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Maximize2,
  Minimize2,
  BarChart3,
  Compass,
  Layers,
} from 'lucide-react';
import type { Stock } from '../../types/stock';
import { useTheme } from '../../context/ThemeContext';

type Tab = 'tradingview' | 'technical_gauge' | 'pe' | 'sales';
type Range = '1y' | '3y' | '5y' | 'max';

const RANGE_DAYS: Record<Range, number> = { '1y': 365, '3y': 365 * 3, '5y': 365 * 5, max: Infinity };

/** Formats NSE symbol for TradingView (handles symbols with ampersands or hyphens) */
function toTradingViewSymbol(symbol: string): string {
  return symbol.replace(/&/g, '_').replace(/-/g, '_');
}

/** Annual EPS in effect on a given date, for the historical P/E series. */
function epsTimeline(stock: Stock): Array<{ from: string; eps: number }> {
  return (stock.annual_pnl || [])
    .filter((p) => p.year !== 'TTM' && Number.isFinite(p.eps) && p.eps > 0)
    .map((p) => {
      const year = Number(p.year.split(' ').pop());
      return { from: `${year}-05-31`, eps: p.eps };
    })
    .sort((a, b) => a.from.localeCompare(b.from));
}

/** TradingView Advanced Real-Time Chart Widget */
const TradingViewAdvancedChart: React.FC<{
  symbol: string;
  exchange: 'NSE' | 'BSE';
  bseCode?: string;
  isDark: boolean;
}> = ({ symbol, exchange, bseCode, isDark }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const tvSymbol = useMemo(() => {
    if (exchange === 'BSE' && bseCode) {
      return `BSE:${bseCode}`;
    }
    return `NSE:${toTradingViewSymbol(symbol)}`;
  }, [exchange, symbol, bseCode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: 'D',
      timezone: 'Asia/Kolkata',
      theme: isDark ? 'dark' : 'light',
      style: '1',
      locale: 'in',
      enable_publishing: false,
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      details: true,
      hotlist: false,
      calendar: false,
      studies: [
        'STD;SMA',
        'STD;EMA',
        'STD;RSI',
        'STD;MACD',
        'STD;Volume',
      ],
      support_host: 'https://www.tradingview.com',
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      container.innerHTML = '';
    };
  }, [tvSymbol, isDark]);

  return (
    <div className="relative w-full h-full bg-apple-surface">
      <div ref={containerRef} className="w-full h-full min-h-[500px]" />
    </div>
  );
};

/** TradingView Technical Analysis Consensus Gauge Widget */
const TradingViewTechnicalGauge: React.FC<{
  symbol: string;
  exchange: 'NSE' | 'BSE';
  bseCode?: string;
  isDark: boolean;
}> = ({ symbol, exchange, bseCode, isDark }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const tvSymbol = useMemo(() => {
    if (exchange === 'BSE' && bseCode) {
      return `BSE:${bseCode}`;
    }
    return `NSE:${toTradingViewSymbol(symbol)}`;
  }, [exchange, symbol, bseCode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: '1D',
      width: '100%',
      isTransparent: true,
      height: '100%',
      symbol: tvSymbol,
      showIntervalTabs: true,
      displayMode: 'multiple',
      locale: 'in',
      colorTheme: isDark ? 'dark' : 'light',
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      container.innerHTML = '';
    };
  }, [tvSymbol, isDark]);

  return (
    <div className="relative w-full h-full p-4 flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full max-w-4xl min-h-[460px]" />
    </div>
  );
};

export const StockCharts: React.FC<{ stock: Stock }> = ({ stock }) => {
  const [tab, setTab] = useState<Tab>('tradingview');
  const [exchange, setExchange] = useState<'NSE' | 'BSE'>('NSE');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [range, setRange] = useState<Range>('3y');
  const { isDark } = useTheme();

  const allPrices = stock.historical_prices || [];

  const peSeries = useMemo(() => {
    const timeline = epsTimeline(stock);
    if (!timeline.length || !allPrices.length) return [];

    const enriched = allPrices.map((point) => {
      let eps: number | null = null;
      for (const entry of timeline) {
        if (point.date >= entry.from) eps = entry.eps;
      }
      return eps && eps > 0 ? { date: point.date, pe: point.price / eps } : null;
    }).filter((p): p is { date: string; pe: number } => p !== null);

    if (range === 'max') return enriched;
    const cutoff = new Date(allPrices[allPrices.length - 1].date);
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range]);
    const iso = cutoff.toISOString().slice(0, 10);
    return enriched.filter((p) => p.date >= iso);
  }, [stock, allPrices, range]);

  const medianPe = useMemo(() => {
    if (!peSeries.length) return null;
    const sorted = peSeries.map((p) => p.pe).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }, [peSeries]);

  const salesSeries = useMemo(
    () =>
      (stock.annual_pnl || [])
        .filter((p) => p.year !== 'TTM')
        .map((p) => ({ year: p.year, sales: p.sales, net_profit: p.net_profit, opm: p.opm_pct })),
    [stock]
  );

  const axis = isDark ? '#74747e' : '#86868b';
  const grid = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const blue = isDark ? '#3d9bff' : '#0062cc';
  const green = isDark ? '#3ad46a' : '#177a3d';
  const indigo = isDark ? '#7d7bf0' : '#4f46c9';

  const tooltipStyle: React.CSSProperties = {
    background: 'var(--apple-card-bg)',
    border: '1px solid var(--apple-border)',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: 'var(--apple-shadow)',
    color: 'var(--apple-text-primary)',
  };

  const formatDate = (value: string) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  };

  const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode; available: boolean }> = [
    { id: 'tradingview', label: 'TradingView Pro', icon: <TrendingUp className="w-3.5 h-3.5" />, available: true },
    { id: 'technical_gauge', label: 'Technical Gauge', icon: <Compass className="w-3.5 h-3.5" />, available: true },
    { id: 'pe', label: 'P/E Multiple', icon: <Activity className="w-3.5 h-3.5" />, available: peSeries.length > 0 },
    { id: 'sales', label: 'Financial Growth', icon: <BarChart3 className="w-3.5 h-3.5" />, available: salesSeries.length > 0 },
  ];

  const activeTab = TABS.find((t) => t.id === tab)?.available ? tab : 'tradingview';

  return (
    <div className={`apple-card overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-2xl ring-1 ring-apple-primary/20' : ''}`}>
      {/* Chart Top Navigation Bar */}
      <div className="px-4 sm:px-5 py-3 border-b border-apple-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="apple-segmented">
            {TABS.filter((t) => t.available).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`apple-segmented-item flex items-center gap-1.5 ${activeTab === t.id ? 'active' : ''}`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Exchange Switcher (NSE / BSE) for TradingView */}
          {(activeTab === 'tradingview' || activeTab === 'technical_gauge') && (
            <div className="inline-flex rounded-lg p-0.5 bg-apple-surface border border-apple-border text-[11px] font-medium">
              <button
                onClick={() => setExchange('NSE')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  exchange === 'NSE'
                    ? 'bg-apple-card-bg text-apple-primary shadow-sm'
                    : 'text-apple-muted hover:text-apple-secondary'
                }`}
              >
                NSE
              </button>
              {stock.bse_code && (
                <button
                  onClick={() => setExchange('BSE')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    exchange === 'BSE'
                      ? 'bg-apple-card-bg text-apple-primary shadow-sm'
                      : 'text-apple-muted hover:text-apple-secondary'
                  }`}
                  title={`BSE Scrip: ${stock.bse_code}`}
                >
                  BSE
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Historical P/E Horizon Switcher */}
          {activeTab === 'pe' && (
            <div className="apple-segmented">
              {(['1y', '3y', '5y', 'max'] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`apple-segmented-item px-2.5 py-1 text-xs uppercase ${range === r ? 'active' : ''}`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Fullscreen / Height Toggle */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg border border-apple-border bg-apple-surface hover:bg-apple-surface-active text-apple-secondary hover:text-apple-primary transition-colors"
            title={isExpanded ? 'Collapse chart' : 'Expand chart'}
            aria-label={isExpanded ? 'Collapse chart' : 'Expand chart'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Indicator Chips Bar for TradingView Pro */}
      {activeTab === 'tradingview' && (
        <div className="px-4 sm:px-5 py-2 bg-apple-surface/40 border-b border-apple-border-subtle flex items-center justify-between gap-3 text-[11px] overflow-x-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-apple-muted font-medium flex items-center gap-1">
              <Layers className="w-3 h-3" />
              Pre-loaded Indicators:
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
              SMA 50
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
              SMA 200
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
              EMA 20
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
              RSI (14)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
              MACD
            </span>
            <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-medium">
              Volume
            </span>
          </div>
          <span className="text-apple-muted text-[10px] shrink-0 hidden md:inline">
            Use TradingView top toolbar to customize studies or draw trendlines
          </span>
        </div>
      )}

      {/* Chart Canvas */}
      <div className={`w-full transition-all duration-300 ${isExpanded ? 'h-[720px]' : 'h-[540px]'}`}>
        {activeTab === 'tradingview' && (
          <TradingViewAdvancedChart
            symbol={stock.symbol}
            exchange={exchange}
            bseCode={stock.bse_code}
            isDark={isDark}
          />
        )}

        {activeTab === 'technical_gauge' && (
          <TradingViewTechnicalGauge
            symbol={stock.symbol}
            exchange={exchange}
            bseCode={stock.bse_code}
            isDark={isDark}
          />
        )}

        {activeTab === 'pe' && (
          <div className="h-full w-full p-4 pr-5">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={peSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="date" stroke={axis} tick={{ fontSize: 11 }} tickFormatter={formatDate} minTickGap={40} tickLine={false} axisLine={false} />
                <YAxis stroke={axis} domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={48} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(v) => new Date(String(v)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  formatter={(value: number) => [`${value.toFixed(1)}x`, 'P/E']}
                />
                {medianPe !== null && (
                  <ReferenceLine
                    y={medianPe}
                    stroke={axis}
                    strokeDasharray="4 4"
                    label={{ value: `median ${medianPe.toFixed(1)}x`, position: 'insideTopRight', fill: axis, fontSize: 11 }}
                  />
                )}
                <Line type="monotone" dataKey="pe" name="P/E" stroke={indigo} strokeWidth={1.75} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="h-full w-full p-4 pr-5">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={salesSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="year" stroke={axis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke={axis} tick={{ fontSize: 11 }} width={72} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke={green} tick={{ fontSize: 11 }} width={44} unit="%" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name) =>
                    name === 'OPM' ? [`${value.toFixed(1)}%`, name] : [`₹${Math.round(value).toLocaleString('en-IN')} Cr`, name]
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar yAxisId="left" dataKey="sales" name="Sales" fill={blue} radius={[4, 4, 0, 0]} maxBarSize={44} />
                <Bar yAxisId="left" dataKey="net_profit" name="Net profit" fill={indigo} radius={[4, 4, 0, 0]} maxBarSize={44} />
                <Line yAxisId="right" type="monotone" dataKey="opm" name="OPM" stroke={green} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart Footer Note */}
      <div className="px-4 sm:px-5 py-2.5 border-t border-apple-border-subtle text-[11px] text-apple-muted flex items-center justify-between gap-3 flex-wrap">
        <span>
          {activeTab === 'tradingview'
            ? `Real-time interactive chart via TradingView on ${exchange}. Supports all drawing tools, multi-timeframe candles, and technical indicators.`
            : activeTab === 'technical_gauge'
              ? `Live technical analysis consensus across 26 technical oscillators and moving averages.`
              : activeTab === 'pe'
                ? 'Historical P/E multiple calculated from daily close against applicable financial year earnings per share.'
                : 'Annual revenue and profit progression in ₹ crore with operating profit margin on the right axis.'}
        </span>
        <span className="text-[10px] opacity-75">
          Filterer Market Terminal
        </span>
      </div>
    </div>
  );
};
