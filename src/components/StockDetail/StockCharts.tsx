import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, Area, ReferenceLine,
} from 'recharts';
import type { Stock, PricePoint } from '../../types/stock';
import { useTheme } from '../../context/ThemeContext';

type Tab = 'price' | 'pe' | 'sales';
type Range = '1y' | '3y' | '5y' | 'max';

const RANGE_DAYS: Record<Range, number> = { '1y': 365, '3y': 365 * 3, '5y': 365 * 5, max: Infinity };

/**
 * Rolling mean over the trailing `window` points, null until there are enough.
 *
 * The dataset ships moving averages for only the last 52 of ~520 price points,
 * so the chart computed them itself rather than drawing a line that appears in
 * the final centimetre of the plot.
 */
function rollingMean(values: number[], window: number): Array<number | null> {
  const out: Array<number | null> = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    if (i >= window - 1) out[i] = sum / window;
  }
  return out;
}

/** Annual EPS in effect on a given date, for the historical P/E series. */
function epsTimeline(stock: Stock): Array<{ from: string; eps: number }> {
  return (stock.annual_pnl || [])
    .filter((p) => p.year !== 'TTM' && Number.isFinite(p.eps) && p.eps > 0)
    .map((p) => {
      const year = Number(p.year.split(' ').pop());
      // An Indian financial year ending in March is reported around late May.
      return { from: `${year}-05-31`, eps: p.eps };
    })
    .sort((a, b) => a.from.localeCompare(b.from));
}

export const StockCharts: React.FC<{ stock: Stock }> = ({ stock }) => {
  const [tab, setTab] = useState<Tab>('price');
  const [range, setRange] = useState<Range>('3y');
  const { isDark } = useTheme();

  const allPrices = stock.historical_prices || [];

  const priceSeries = useMemo(() => {
    if (!allPrices.length) return [];

    const closes = allPrices.map((p) => p.price);
    const dma50 = rollingMean(closes, 50);
    const dma200 = rollingMean(closes, 200);

    const enriched = allPrices.map((point: PricePoint, i) => ({
      date: point.date,
      price: point.price,
      dma_50: point.dma_50 ?? dma50[i],
      dma_200: point.dma_200 ?? dma200[i],
    }));

    if (range === 'max') return enriched;

    const cutoff = new Date(allPrices[allPrices.length - 1].date);
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range]);
    const iso = cutoff.toISOString().slice(0, 10);
    // Slice after computing the averages, so the 200-day line is correct at
    // the left edge of the window rather than starting 200 points into it.
    return enriched.filter((p) => p.date >= iso);
  }, [allPrices, range]);

  const peSeries = useMemo(() => {
    const timeline = epsTimeline(stock);
    if (!timeline.length || !priceSeries.length) return [];

    return priceSeries
      .map((point) => {
        let eps: number | null = null;
        for (const entry of timeline) {
          if (point.date >= entry.from) eps = entry.eps;
        }
        return eps && eps > 0 ? { date: point.date, pe: point.price / eps } : null;
      })
      .filter((p): p is { date: string; pe: number } => p !== null);
  }, [stock, priceSeries]);

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
  const amber = isDark ? '#ffab2e' : '#9a5b00';
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

  const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

  const TABS: Array<{ id: Tab; label: string; available: boolean }> = [
    { id: 'price', label: 'Price', available: priceSeries.length > 0 },
    { id: 'pe', label: 'P/E band', available: peSeries.length > 0 },
    { id: 'sales', label: 'Sales & margin', available: salesSeries.length > 0 },
  ];

  const activeTab = TABS.find((t) => t.id === tab)?.available ? tab : TABS.find((t) => t.available)?.id;
  if (!activeTab) return null;

  return (
    <div className="apple-card overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-apple-border flex items-center justify-between gap-3 flex-wrap">
        <div className="apple-segmented">
          {TABS.filter((t) => t.available).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`apple-segmented-item ${activeTab === t.id ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab !== 'sales' && (
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
      </div>

      <div className="h-80 w-full p-4 pr-5">
        {activeTab === 'price' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={priceSeries} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="date" stroke={axis} tick={{ fontSize: 11 }} tickFormatter={formatDate} minTickGap={40} tickLine={false} axisLine={false} />
              <YAxis stroke={axis} domain={['auto', 'auto']} tick={{ fontSize: 11 }} tickFormatter={money} width={72} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(v) => new Date(String(v)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                formatter={(value: number, name) => [money(value), name]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="line" />
              <Area type="monotone" dataKey="price" name="Price" stroke={blue} fill={blue} fillOpacity={0.08} strokeWidth={1.75} dot={false} />
              <Line type="monotone" dataKey="dma_50" name="50-day avg" stroke={green} strokeWidth={1.25} dot={false} connectNulls />
              <Line type="monotone" dataKey="dma_200" name="200-day avg" stroke={amber} strokeWidth={1.25} dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'pe' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={peSeries} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
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
        )}

        {activeTab === 'sales' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={salesSeries} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
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
        )}
      </div>

      <p className="px-4 sm:px-5 py-2.5 border-t border-apple-border-subtle text-[11px] text-apple-muted leading-relaxed">
        {activeTab === 'pe'
          ? 'P/E is computed from the closing price against the earnings per share reported for the financial year in effect on that date, so it steps when results are published.'
          : activeTab === 'price'
            ? 'Moving averages are computed over the full price history, then the window is applied, so both lines are correct at the left edge.'
            : 'Annual figures in ₹ crore, with operating margin on the right axis.'}
      </p>
    </div>
  );
};
