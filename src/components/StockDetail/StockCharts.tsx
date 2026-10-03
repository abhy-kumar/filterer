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
import { Maximize2, Minimize2 } from 'lucide-react';
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

    const bg = isDark ? '#181816' : '#fbfaf7';
    const text = isDark ? '#8a877c' : '#767267';
    const grid = isDark ? 'rgba(255, 250, 225, 0.04)' : 'rgba(40, 34, 12, 0.05)';
    const border = isDark ? '#2c2b26' : '#e2e0d7';

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
      topColor: isDark ? 'rgba(147, 173, 242, 0.1)' : 'rgba(30, 76, 168, 0.07)',
      bottomColor: isDark ? 'rgba(147, 173, 242, 0.1)' : 'rgba(30, 76, 168, 0.07)',
      lineColor: isDark ? '#93adf2' : '#1e4ca8',
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
              ? isDark ? 'rgba(98, 197, 140, 0.35)' : 'rgba(27, 116, 66, 0.28)'
              : isDark ? 'rgba(239, 122, 112, 0.35)' : 'rgba(176, 34, 43, 0.28)',
          };
        })
      );
    }

    // 3. SMA 50 Line
    let sma50Series: ISeriesApi<'Line'> | null = null;
    if (showSma50) {
      sma50Series = chart.addSeries(LineSeries, {
        color: isDark ? '#62c58c' : '#1b7442',
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
        color: isDark ? '#ddaa52' : '#865600',
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
        color: isDark ? '#a3a0f2' : '#4a43b8',
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
      <div className="px-3 sm:px-5 py-2 sm:py-2.5 border-b border-apple-border-subtle flex items-center justify-between gap-2 sm:gap-3 text-caption1 overflow-x-auto no-scrollbar">
        {/* Overlays, shown as a legend you can click: the swatch is the line's own colour. */}
        <div className="flex items-center gap-3 shrink-0">
          {[
            { label: '50-day', on: showSma50, toggle: () => setShowSma50(!showSma50), swatch: 'bg-apple-green' },
            { label: '200-day', on: showSma200, toggle: () => setShowSma200(!showSma200), swatch: 'bg-apple-amber' },
            { label: '20-day EMA', on: showEma20, toggle: () => setShowEma20(!showEma20), swatch: 'bg-apple-indigo' },
            { label: 'Volume', on: showVolume, toggle: () => setShowVolume(!showVolume), swatch: 'bg-apple-faint' },
          ].map((o) => (
            <button
              key={o.label}
              onClick={o.toggle}
              aria-pressed={o.on}
              className={`flex items-center gap-1.5 text-caption1 transition-opacity ${o.on ? 'text-apple-secondary' : 'text-apple-faint opacity-60'}`}
            >
              <span className={`w-3 h-0.5 ${o.swatch}`} aria-hidden="true" />
              {o.label}
            </button>
          ))}
        </div>

        {/* Timeframe Range Selector */}
        <div className="apple-segmented shrink-0">
          {(['1m', '6m', '1y', '3y', '5y', 'max'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              className={`apple-segmented-item px-2 sm:px-2.5 py-0.5 text-caption1 ${
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
        <div className="px-3 sm:px-5 py-1.5 bg-apple-card-bg border-b border-apple-border-subtle flex items-center gap-2.5 sm:gap-4 text-caption1 text-apple-muted num overflow-x-auto no-scrollbar whitespace-nowrap">
          <span><strong className="text-apple-primary">{info.date}</strong></span>
          <span>Close <strong className="text-apple-primary">₹{info.price.toLocaleString('en-IN')}</strong></span>
          {showSma50 && info.dma50 && (
            <span className="text-apple-green">
              50-day <strong>₹{info.dma50.toFixed(2)}</strong>
            </span>
          )}
          {showSma200 && info.dma200 && (
            <span className="text-apple-amber">
              200-day <strong>₹{info.dma200.toFixed(2)}</strong>
            </span>
          )}
          {showEma20 && info.ema20 && (
            <span className="text-apple-indigo">
              20-day EMA <strong>₹{info.ema20.toFixed(2)}</strong>
            </span>
          )}
          {showVolume && info.volume && (
            <span>Volume <strong className="text-apple-secondary">{(info.volume / 1e5).toFixed(1)}L</strong></span>
          )}
        </div>
      )}

      {/* Canvas Mount Container */}
      <div ref={chartContainerRef} className="flex-1 w-full min-h-[260px] sm:min-h-[420px]" />

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

  const axis = isDark ? '#8a877c' : '#767267';
  const grid = isDark ? 'rgba(255,250,225,0.05)' : 'rgba(40,34,12,0.06)';
  const blue = isDark ? '#93adf2' : '#1e4ca8';
  const green = isDark ? '#62c58c' : '#1b7442';
  const indigo = isDark ? '#a3a0f2' : '#4a43b8';

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

  const TABS: Array<{ id: Tab; label: string; available: boolean }> = [
    { id: 'tradingview', label: 'Price', available: true },
    { id: 'pe', label: 'P/E', available: peSeries.length > 0 },
    { id: 'sales', label: 'Sales and profit', available: salesSeries.length > 0 },
  ];

  const activeTab = TABS.find((t) => t.id === tab)?.available ? tab : 'tradingview';
  const tvWebUrl = `https://www.tradingview.com/chart/?symbol=NSE:${encodeURIComponent(toTradingViewSymbol(stock.symbol))}`;

  return (
    <div className="apple-card overflow-hidden">
      {/* Primary Toolbar */}
      <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-apple-border flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="apple-segmented">
            {TABS.filter((t) => t.available).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`apple-segmented-item flex items-center gap-1 text-caption1 py-1 px-2 sm:px-2.5 ${activeTab === t.id ? 'active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Deep link button to TradingView Web */}
          <a
            href={tvWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline text-caption1 text-apple-blue hover:underline underline-offset-4 ml-2"
          >
            Open on TradingView
          </a>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* P/E Horizon Switcher */}
          {activeTab === 'pe' && (
            <div className="apple-segmented">
              {(['1y', '3y', '5y', 'max'] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`apple-segmented-item px-2 sm:px-2.5 py-1 text-caption1 ${range === r ? 'active' : ''}`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Fullscreen / Height Toggle */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="apple-btn apple-btn-quiet apple-btn-sm"
            title={isExpanded ? 'Collapse chart' : 'Expand chart'}
            aria-label={isExpanded ? 'Collapse chart' : 'Expand chart'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className={`w-full transition-all duration-300 ${isExpanded ? 'h-[700px]' : 'h-[330px] sm:h-[420px] lg:h-[520px]'}`}>

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
                <Bar yAxisId="left" dataKey="sales" name="Sales" fill={blue} maxBarSize={44} />
                <Bar yAxisId="left" dataKey="net_profit" name="Net profit" fill={indigo} maxBarSize={44} />
                <Line yAxisId="right" type="monotone" dataKey="opm" name="OPM" stroke={green} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 sm:px-5 py-2.5 border-t border-apple-border-subtle text-caption1 text-apple-muted flex items-center justify-between gap-3 flex-wrap">
        <span>
          {activeTab === 'tradingview'
            ? 'Daily closes. Averages are simple unless marked EMA.'
            : activeTab === 'pe'
              ? 'Price over the latest full-year EPS known at each date. The dashed line is the median for the period shown.'
              : 'Annual sales and net profit in ₹ crore, with operating margin on the right-hand scale.'}
        </span>
      </div>
    </div>
  );
};
