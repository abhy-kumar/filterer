import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  AreaSeries,
  LineSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
} from 'lightweight-charts';
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
  ExternalLink,
  Layers,
  Check,
} from 'lucide-react';
import type { Stock, PricePoint } from '../../types/stock';
import { useTheme } from '../../context/ThemeContext';

type Tab = 'tradingview' | 'pe' | 'sales';
type Range = '1m' | '6m' | '1y' | '3y' | '5y' | 'max';

const RANGE_DAYS: Record<Range, number> = {
  '1m': 30,
  '6m': 180,
  '1y': 365,
  '3y': 365 * 3,
  '5y': 365 * 5,
  max: Infinity,
};

/** Formats NSE symbol for TradingView Web deep links */
function toTradingViewSymbol(symbol: string): string {
  return symbol.replace(/&/g, '_').replace(/-/g, '_');
}

/** Compute 20-period Exponential Moving Average */
function computeEma(prices: number[], period: number = 20): Array<number | null> {
  const k = 2 / (period + 1);
  const out: Array<number | null> = new Array(prices.length).fill(null);
  let ema: number | null = null;
  for (let i = 0; i < prices.length; i++) {
    const p = prices[i];
    if (i < period - 1) continue;
    if (ema === null) {
      const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
      ema = sum / period;
    } else {
      ema = p * k + ema * (1 - k);
    }
    out[i] = ema;
  }
  return out;
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

/**
 * TradingView Lightweight Charts Engine
 * Built by TradingView for high-performance canvas charting of custom data.
 * Solves the "This symbol is only available on TradingView" exchange licensing restriction.
 */
const TradingViewLightweightChart: React.FC<{
  stock: Stock;
  isDark: boolean;
  isExpanded: boolean;
}> = ({ stock, isDark, isExpanded }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Indicators toggle state
  const [showSma50, setShowSma50] = useState(true);
  const [showSma200, setShowSma200] = useState(true);
  const [showEma20, setShowEma20] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [selectedRange, setSelectedRange] = useState<Range>('3y');

  // Hover crosshair info
  const [legendInfo, setLegendInfo] = useState<{
    date: string;
    price: number;
    dma50?: number | null;
    dma200?: number | null;
    ema20?: number | null;
    volume?: number | null;
  } | null>(null);

  const allPrices = useMemo(() => {
    return (stock.historical_prices || [])
      .filter((p) => p.price > 0 && p.date)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [stock.historical_prices]);

  const ema20Values = useMemo(() => {
    const closes = allPrices.map((p) => p.price);
    return computeEma(closes, 20);
  }, [allPrices]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || !allPrices.length) return;

    container.innerHTML = '';

    const bg = isDark ? '#141416' : '#ffffff';
    const text = isDark ? '#a1a1a6' : '#6e6e73';
    const grid = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    const border = isDark ? '#2c2c2e' : '#e5e5ea';

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: text,
        fontSize: 11,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      },
      grid: {
        vertLines: { color: grid },
        horzLines: { color: grid },
      },
      crosshair: {
        vertLine: { color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', width: 1, style: 3 },
        horzLine: { color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: border,
        scaleMargins: { top: 0.1, bottom: showVolume ? 0.22 : 0.08 },
      },
      timeScale: {
        borderColor: border,
        timeVisible: false,
      },
      handleScale: true,
      handleScroll: true,
    });

    chartRef.current = chart;

    // 1. Price Area Series
    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: isDark ? 'rgba(61, 155, 255, 0.35)' : 'rgba(0, 98, 204, 0.25)',
      bottomColor: isDark ? 'rgba(61, 155, 255, 0.01)' : 'rgba(0, 98, 204, 0.01)',
      lineColor: isDark ? '#3d9bff' : '#0062cc',
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 2, minMove: 0.05 },
    });

    areaSeries.setData(allPrices.map((p) => ({ time: p.date, value: p.price })));

    // 2. Volume Series (Overlayed at bottom)
    let volumeSeries: ISeriesApi<'Histogram'> | null = null;
    if (showVolume) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(
        allPrices.map((p, i) => {
          const prev = i > 0 ? allPrices[i - 1].price : p.price;
          const isUp = p.price >= prev;
          return {
            time: p.date,
            value: p.volume || 0,
            color: isUp
              ? isDark ? 'rgba(58, 212, 106, 0.35)' : 'rgba(23, 122, 61, 0.3)'
              : isDark ? 'rgba(255, 69, 58, 0.35)' : 'rgba(215, 0, 21, 0.3)',
          };
        })
      );
    }

    // 3. SMA 50 Line
    let sma50Series: ISeriesApi<'Line'> | null = null;
    if (showSma50) {
      sma50Series = chart.addSeries(LineSeries, {
        color: isDark ? '#3ad46a' : '#177a3d',
        lineWidth: 1,
        title: 'SMA 50',
      });
      sma50Series.setData(
        allPrices
          .filter((p) => p.dma_50 !== null && p.dma_50 !== undefined)
          .map((p) => ({ time: p.date, value: p.dma_50! }))
      );
    }

    // 4. SMA 200 Line
    let sma200Series: ISeriesApi<'Line'> | null = null;
    if (showSma200) {
      sma200Series = chart.addSeries(LineSeries, {
        color: isDark ? '#ff9f0a' : '#d97706',
        lineWidth: 1,
        title: 'SMA 200',
      });
      sma200Series.setData(
        allPrices
          .filter((p) => p.dma_200 !== null && p.dma_200 !== undefined)
          .map((p) => ({ time: p.date, value: p.dma_200! }))
      );
    }

    // 5. EMA 20 Line
    let ema20Series: ISeriesApi<'Line'> | null = null;
    if (showEma20) {
      ema20Series = chart.addSeries(LineSeries, {
        color: isDark ? '#bf5af2' : '#8944ab',
        lineWidth: 1,
        title: 'EMA 20',
      });
      const emaData: Array<{ time: string; value: number }> = [];
      for (let i = 0; i < allPrices.length; i++) {
        const v = ema20Values[i];
        if (v !== null) emaData.push({ time: allPrices[i].date, value: Number(v.toFixed(2)) });
      }
      ema20Series.setData(emaData);
    }

    // Set Default Visible Range
    if (allPrices.length) {
      const lastDate = new Date(allPrices[allPrices.length - 1].date);
      const days = RANGE_DAYS[selectedRange];
      if (Number.isFinite(days)) {
        const fromDate = new Date(lastDate);
        fromDate.setDate(fromDate.getDate() - days);
        const fromIso = fromDate.toISOString().slice(0, 10);
        chart.timeScale().setVisibleRange({ from: fromIso, to: allPrices[allPrices.length - 1].date });
      } else {
        chart.timeScale().fitContent();
      }
    }

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        // Default to latest point
        const latest = allPrices[allPrices.length - 1];
        if (latest) {
          setLegendInfo({
            date: latest.date,
            price: latest.price,
            dma50: latest.dma_50,
            dma200: latest.dma_200,
            ema20: ema20Values[allPrices.length - 1],
            volume: latest.volume,
          });
        }
        return;
      }
      const timeStr = String(param.time);
      const pt = allPrices.find((p) => p.date === timeStr);
      if (pt) {
        const idx = allPrices.indexOf(pt);
        setLegendInfo({
          date: pt.date,
          price: pt.price,
          dma50: pt.dma_50,
          dma200: pt.dma_200,
          ema20: ema20Values[idx],
          volume: pt.volume,
        });
      }
    });

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [allPrices, isDark, showSma50, showSma200, showEma20, showVolume, ema20Values, isExpanded]);

  // Handle Range Button Clicks
  const handleRangeChange = (r: Range) => {
    setSelectedRange(r);
    const chart = chartRef.current;
    if (!chart || !allPrices.length) return;

    const lastDate = new Date(allPrices[allPrices.length - 1].date);
    const days = RANGE_DAYS[r];
    if (Number.isFinite(days)) {
      const fromDate = new Date(lastDate);
      fromDate.setDate(fromDate.getDate() - days);
      const fromIso = fromDate.toISOString().slice(0, 10);
      chart.timeScale().setVisibleRange({ from: fromIso, to: allPrices[allPrices.length - 1].date });
    } else {
      chart.timeScale().fitContent();
    }
  };

  const latest = allPrices[allPrices.length - 1];
  const info = legendInfo || (latest ? {
    date: latest.date,
    price: latest.price,
    dma50: latest.dma_50,
    dma200: latest.dma_200,
    ema20: ema20Values[allPrices.length - 1],
    volume: latest.volume,
  } : null);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Interactive Controls & Legend Sub-Header */}
      <div className="px-4 sm:px-5 py-2.5 bg-apple-surface/50 border-b border-apple-border flex items-center justify-between gap-3 flex-wrap text-xs">
        {/* Indicators Toggle Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-apple-muted text-[11px] font-medium flex items-center gap-1 mr-1">
            <Layers className="w-3 h-3" />
            Indicators:
          </span>
          <button
            onClick={() => setShowSma50(!showSma50)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
              showSma50
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-apple-surface text-apple-muted border border-apple-border hover:text-apple-secondary'
            }`}
          >
            {showSma50 && <Check className="w-2.5 h-2.5" />}
            SMA 50
          </button>
          <button
            onClick={() => setShowSma200(!showSma200)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
              showSma200
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-apple-surface text-apple-muted border border-apple-border hover:text-apple-secondary'
            }`}
          >
            {showSma200 && <Check className="w-2.5 h-2.5" />}
            SMA 200
          </button>
          <button
            onClick={() => setShowEma20(!showEma20)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
              showEma20
                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                : 'bg-apple-surface text-apple-muted border border-apple-border hover:text-apple-secondary'
            }`}
          >
            {showEma20 && <Check className="w-2.5 h-2.5" />}
            EMA 20
          </button>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
              showVolume
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                : 'bg-apple-surface text-apple-muted border border-apple-border hover:text-apple-secondary'
            }`}
          >
            {showVolume && <Check className="w-2.5 h-2.5" />}
            Volume
          </button>
        </div>

        {/* Timeframe Range Selector */}
        <div className="apple-segmented">
          {(['1m', '6m', '1y', '3y', '5y', 'max'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              className={`apple-segmented-item px-2.5 py-0.5 text-[11px] uppercase ${
                selectedRange === r ? 'active' : ''
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Dynamic Metric Readout */}
      {info && (
        <div className="px-4 sm:px-5 py-1.5 bg-apple-card-bg border-b border-apple-border-subtle flex items-center gap-4 text-[11px] text-apple-muted font-mono flex-wrap">
          <span>Date: <strong className="text-apple-primary">{info.date}</strong></span>
          <span>Price: <strong className="text-apple-primary">₹{info.price.toLocaleString('en-IN')}</strong></span>
          {showSma50 && info.dma50 && (
            <span className="text-emerald-600 dark:text-emerald-400">
              SMA 50: <strong>₹{info.dma50.toFixed(2)}</strong>
            </span>
          )}
          {showSma200 && info.dma200 && (
            <span className="text-amber-600 dark:text-amber-400">
              SMA 200: <strong>₹{info.dma200.toFixed(2)}</strong>
            </span>
          )}
          {showEma20 && info.ema20 && (
            <span className="text-purple-600 dark:text-purple-400">
              EMA 20: <strong>₹{info.ema20.toFixed(2)}</strong>
            </span>
          )}
          {showVolume && info.volume && (
            <span>Vol: <strong className="text-apple-secondary">{(info.volume / 1e5).toFixed(1)}L</strong></span>
          )}
        </div>
      )}

      {/* Canvas Mount Container */}
      <div ref={chartContainerRef} className="flex-1 w-full min-h-[420px]" />
    </div>
  );
};

export const StockCharts: React.FC<{ stock: Stock }> = ({ stock }) => {
  const [tab, setTab] = useState<Tab>('tradingview');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [range, setRange] = useState<Range>('3y');
  const { isDark } = useTheme();

  const allPrices = stock.historical_prices || [];

  const peSeries = useMemo(() => {
    const timeline = epsTimeline(stock);
    if (!timeline.length || !allPrices.length) return [];

    const enriched = allPrices
      .map((point) => {
        let eps: number | null = null;
        for (const entry of timeline) {
          if (point.date >= entry.from) eps = entry.eps;
        }
        return eps && eps > 0 ? { date: point.date, pe: point.price / eps } : null;
      })
      .filter((p): p is { date: string; pe: number } => p !== null);

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
    { id: 'tradingview', label: 'TradingView Chart', icon: <TrendingUp className="w-3.5 h-3.5" />, available: true },
    { id: 'pe', label: 'P/E Multiple', icon: <Activity className="w-3.5 h-3.5" />, available: peSeries.length > 0 },
    { id: 'sales', label: 'Financial Growth', icon: <BarChart3 className="w-3.5 h-3.5" />, available: salesSeries.length > 0 },
  ];

  const activeTab = TABS.find((t) => t.id === tab)?.available ? tab : 'tradingview';
  const tvWebUrl = `https://www.tradingview.com/chart/?symbol=NSE:${encodeURIComponent(toTradingViewSymbol(stock.symbol))}`;

  return (
    <div className={`apple-card overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-2xl ring-1 ring-apple-primary/20' : ''}`}>
      {/* Primary Toolbar */}
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

          {/* Deep link button to TradingView Web */}
          <a
            href={tvWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-apple-secondary hover:text-apple-primary hover:bg-apple-surface border border-apple-border transition-colors"
            title="Open real-time interactive workspace on TradingView.com"
          >
            <span>TradingView Web</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          {/* P/E Horizon Switcher */}
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

      {/* Chart Canvas Area */}
      <div className={`w-full transition-all duration-300 ${isExpanded ? 'h-[700px]' : 'h-[520px]'}`}>
        {activeTab === 'tradingview' && (
          <TradingViewLightweightChart
            stock={stock}
            isDark={isDark}
            isExpanded={isExpanded}
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

      {/* Footer Info */}
      <div className="px-4 sm:px-5 py-2.5 border-t border-apple-border-subtle text-[11px] text-apple-muted flex items-center justify-between gap-3 flex-wrap">
        <span>
          {activeTab === 'tradingview'
            ? 'Interactive daily price action with 50-day & 200-day simple moving averages, 20-day EMA, and volume overlay.'
            : activeTab === 'pe'
              ? 'Historical valuation multiple: trailing P/E relative to 10-year median valuation band.'
              : 'Annual revenue and net profit trajectory (₹ crore) with operating profit margin (OPM%).'}
        </span>
        <span className="text-[10px] opacity-75">
          Filterer Terminal
        </span>
      </div>
    </div>
  );
};
