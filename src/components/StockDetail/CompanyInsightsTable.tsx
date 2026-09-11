import React, { useState, useMemo } from 'react';
import { Flag, ChevronDown, ChevronUp, LineChart as ChartIcon, Info } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Stock } from '../../types/stock';
import {
  getStockCompanyInsights,
  StockCompanyInsights,
  CompanyInsightMetric,
} from '../../engine/companyInsightsGenerator';

interface CompanyInsightsTableProps {
  stock: Stock;
}

export const CompanyInsightsTable: React.FC<CompanyInsightsTableProps> = ({ stock }) => {
  const [horizon, setHorizon] = useState<'yearly' | 'quarterly'>('yearly');
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);

  const insightsData: StockCompanyInsights | null = useMemo(() => {
    return getStockCompanyInsights(stock);
  }, [stock]);

  const selectedMetric = useMemo(() => {
    if (!insightsData) return null;
    return insightsData.metrics.find((m) => m.id === selectedMetricId) || null;
  }, [insightsData, selectedMetricId]);

  const chartData = useMemo(() => {
    if (!selectedMetric) return [];
    const series = horizon === 'yearly' ? selectedMetric.yearly : selectedMetric.quarterly;
    return series
      .filter((s) => s.value !== null)
      .map((s) => ({
        period: s.period,
        value: s.value,
      }));
  }, [selectedMetric, horizon]);

  if (!insightsData || !insightsData.metrics || insightsData.metrics.length === 0) {
    return null;
  }


  const periods = horizon === 'yearly' ? insightsData.yearlyPeriods : insightsData.quarterlyPeriods;

  const formatCellValue = (metric: CompanyInsightMetric, val: number | null): string => {
    if (val === null || val === undefined) return '-';

    if (metric.format === 'percent' || metric.unit === '%') {
      return `${val.toFixed(1)}%`;
    }

    if (metric.format === 'currency' || metric.unit.startsWith('₹') || metric.unit.startsWith('$')) {
      const prefix = metric.unit.startsWith('$') ? '$' : '₹';
      return `${prefix}${val.toLocaleString('en-IN')}`;
    }

    if (metric.format === 'decimal') {
      return val.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }

    return val.toLocaleString('en-IN');
  };

  return (
    <div className="apple-card overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 sm:px-6 py-4 border-b border-apple-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-title3 text-apple-primary font-display flex items-center gap-2">
            Operating KPIs
            <span className="apple-tag">Compiled by hand</span>
          </h2>

          <a
            href={`https://github.com/abhy-kumar/filterer/issues/new?title=${encodeURIComponent(`KPI correction: ${stock.symbol}`)}&body=${encodeURIComponent('Which figure is wrong, what should it be, and where is it published?')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-caption1 text-apple-muted hover:text-apple-secondary flex items-center gap-1 transition-colors pl-2 border-l border-apple-border/80"
          >
            <Flag className="w-3 h-3" aria-hidden="true" />
            <span>Report an error</span>
          </a>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented Time Horizon */}
          <div className="apple-segmented">
            <button
              onClick={() => setHorizon('yearly')}
              className={`apple-segmented-item text-caption1 ${horizon === 'yearly' ? 'active' : ''}`}
            >
              Yearly
            </button>
            <button
              onClick={() => setHorizon('quarterly')}
              className={`apple-segmented-item text-caption1 ${horizon === 'quarterly' ? 'active' : ''}`}
            >
              Quarterly
            </button>
          </div>
        </div>
      </div>

      {/* Selected Metric Inline Chart Drawer */}
      {selectedMetric && chartData.length > 0 && (
        <div className="p-4 sm:p-5 bg-apple-bg-subtle/40 border-b border-apple-border animate-fade-in space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-caption1 font-semibold text-apple-primary font-display flex items-center gap-2">
                <ChartIcon className="w-3.5 h-3.5 text-apple-blue" />
                <span>{selectedMetric.name}</span>
                <span className="text-caption2 font-normal text-apple-muted">({selectedMetric.unit})</span>
              </div>
              {selectedMetric.description && (
                <p className="text-caption2 text-apple-muted mt-0.5">{selectedMetric.description}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedMetricId(null)}
              className="text-caption1 text-apple-muted hover:text-apple-primary px-2 py-1 rounded bg-apple-surface border border-apple-border text-caption2"
            >
              Close Chart
            </button>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0062cc" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#0062cc" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#86868b' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#86868b' }}
                  tickFormatter={(v) => v.toLocaleString('en-IN')}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="apple-card px-2.5 py-1.5 text-caption1 shadow-md border border-apple-border">
                          <div className="text-caption2 text-apple-muted num">{data.period}</div>
                          <div className="num font-bold text-apple-primary mt-0.5">
                            {formatCellValue(selectedMetric, data.value)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0062cc"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#metricGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Operational KPIs Table */}
      <div className="overflow-x-auto">
        <table className="apple-table text-left">
          <thead>
            <tr>
              <th className="apple-sticky-col min-w-[130px] sm:min-w-[240px] bg-apple-bg-subtle text-apple-muted font-semibold text-caption2 sm:text-caption2 px-2.5 sm:px-3">
                OPERATIONAL KPI
              </th>
              {periods.map((p) => (
                <th key={p} className="text-right text-caption2 sm:text-caption2 num min-w-[80px] sm:min-w-[95px] px-2.5 sm:px-3">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {insightsData.metrics.map((metric) => {
              const series = horizon === 'yearly' ? metric.yearly : metric.quarterly;
              const isSelected = selectedMetricId === metric.id;

              return (
                <tr
                  key={metric.id}
                  onClick={() => setSelectedMetricId(isSelected ? null : metric.id)}
                  className={`cursor-pointer transition-colors group ${
                    isSelected ? 'bg-apple-blue-subtle/30' : 'hover:bg-apple-surface-hover'
                  }`}
                  title="Click to view historical trend chart"
                >
                  <td className="apple-sticky-col py-2 sm:py-2.5 px-2.5 sm:px-3 min-w-[130px] sm:min-w-[240px]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-caption1 text-apple-primary group-hover:text-apple-blue transition-colors truncate max-w-[120px] sm:max-w-none">
                          {metric.name}
                        </div>
                        <div className="text-caption2 text-apple-muted num mt-0.5">
                          {metric.unit}
                        </div>
                      </div>

                      <span className="text-apple-faint group-hover:text-apple-blue opacity-0 group-hover:opacity-100 transition-opacity">
                        {isSelected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  </td>

                  {periods.map((periodName) => {
                    const cell = series.find((s) => s.period === periodName);
                    const val = cell ? cell.value : null;

                    return (
                      <td key={periodName} className="text-right num text-caption1 px-3 py-2.5">
                        {formatCellValue(metric, val)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Attribution */}
      <div className="px-4 sm:px-6 py-3 border-t border-apple-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-caption1 text-apple-muted">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-apple-muted shrink-0" aria-hidden="true" />
          <span>Entered by hand from annual reports and investor presentations. Not traced to a filing in this app, so check the company’s own disclosures before relying on a figure.</span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-caption2 text-apple-faint hidden md:inline">Click any row to view chart</span>
        </div>
      </div>
    </div>
  );
};
