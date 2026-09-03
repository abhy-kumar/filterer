import React, { useState, useMemo } from 'react';
import { Layers, TrendingUp, BarChart3, PieChart, Info, ShieldCheck } from 'lucide-react';
import { Stock } from '../../types/stock';
import { getCompanySegments, SegmentPeriod, DivisionalSegment } from '../../data/segmentData';
import { crore, signClass } from '../../lib/format';

interface SegmentResultsTableProps {
  stock: Stock;
}

const SEGMENT_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-indigo-500',
];

export const SegmentResultsTable: React.FC<SegmentResultsTableProps> = ({ stock }) => {
  const segmentData = useMemo(() => getCompanySegments(stock), [stock]);
  const periods = segmentData.periods;
  const [selectedPeriodName, setSelectedPeriodName] = useState<string>(periods[0]?.period || 'FY24');

  const selectedPeriod = useMemo<SegmentPeriod | undefined>(() => {
    return periods.find((p) => p.period === selectedPeriodName) || periods[0];
  }, [periods, selectedPeriodName]);

  // Find Star Segment (highest margin) and Largest Revenue Contributor
  const segmentHighlights = useMemo(() => {
    if (!selectedPeriod || !selectedPeriod.segments.length) return null;
    const sortedByRevenue = [...selectedPeriod.segments].sort((a, b) => b.revenue - a.revenue);
    const sortedByMargin = [...selectedPeriod.segments].sort((a, b) => b.margin_pct - a.margin_pct);

    const largestRev = sortedByRevenue[0];
    const highestMargin = sortedByMargin[0];

    return { largestRev, highestMargin };
  }, [selectedPeriod]);

  if (!selectedPeriod || !selectedPeriod.segments.length) {
    return null;
  }

  const blendedMargin =
    selectedPeriod.total_revenue > 0
      ? Math.round((selectedPeriod.total_ebit / selectedPeriod.total_revenue) * 1000) / 10
      : 0;

  return (
    <div className="apple-card p-5 sm:p-6 space-y-6">
      {/* Header and Period Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-apple-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-apple-blue" />
            <h2 className="text-lg font-bold text-apple-primary font-display">
              Business Segment Disclosures
            </h2>
          </div>
          <p className="text-xs text-apple-muted mt-0.5">
            Divisional revenue, operating profit (EBIT), and segment margins ({segmentData.reportingStandard}).
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center apple-segmented self-start sm:self-auto">
          {periods.map((p) => (
            <button
              key={p.period}
              type="button"
              onClick={() => setSelectedPeriodName(p.period)}
              className={`apple-segmented-item text-xs ${
                selectedPeriodName === p.period ? 'active' : ''
              }`}
            >
              {p.period}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Revenue Share Stacked Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-apple-secondary">Revenue Contribution by Division</span>
          <span className="font-mono text-apple-muted text-[11px]">Total: ₹{selectedPeriod.total_revenue.toLocaleString('en-IN')} Cr</span>
        </div>

        <div className="h-4 w-full rounded-full overflow-hidden flex bg-apple-surface">
          {selectedPeriod.segments.map((seg, idx) => {
            const colorClass = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
            return (
              <div
                key={seg.name}
                className={`${colorClass} h-full transition-all`}
                style={{ width: `${Math.max(1, seg.revenue_share_pct)}%` }}
                title={`${seg.name}: ${seg.revenue_share_pct}% (₹${seg.revenue.toLocaleString('en-IN')} Cr)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap pt-1 text-[11px]">
          {selectedPeriod.segments.map((seg, idx) => {
            const colorClass = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
            return (
              <div key={seg.name} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                <span className="text-apple-secondary truncate max-w-[200px]">{seg.name}:</span>
                <span className="font-mono font-semibold text-apple-primary">{seg.revenue_share_pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Segment Breakdown Table */}
      <div className="overflow-x-auto">
        <table className="apple-table">
          <thead>
            <tr>
              <th className="text-left min-w-[200px]">Divisional Segment</th>
              <th className="text-right">Revenue (₹ Cr)</th>
              <th className="text-right min-w-[130px]">Revenue Share</th>
              <th className="text-right">EBIT (₹ Cr)</th>
              <th className="text-right">EBIT Margin</th>
              <th className="text-right">YoY Growth</th>
            </tr>
          </thead>
          <tbody>
            {selectedPeriod.segments.map((seg, idx) => {
              const colorClass = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
              const isHighMargin = seg.margin_pct >= 20;

              return (
                <tr key={seg.name} className="hover:bg-apple-surface/40 transition-colors">
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${colorClass} shrink-0`} />
                      <span className="font-medium text-apple-primary text-xs">{seg.name}</span>
                    </div>
                  </td>

                  <td className="text-right font-mono text-xs">
                    ₹{seg.revenue.toLocaleString('en-IN')}
                  </td>

                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-apple-surface overflow-hidden hidden sm:block">
                        <div
                          className={`h-full ${colorClass}`}
                          style={{ width: `${Math.min(100, seg.revenue_share_pct)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-apple-secondary">
                        {seg.revenue_share_pct.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  <td className="text-right font-mono text-xs font-semibold text-apple-primary">
                    ₹{seg.ebit.toLocaleString('en-IN')}
                  </td>

                  <td className="text-right font-mono text-xs">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        isHighMargin
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'text-apple-secondary'
                      }`}
                    >
                      {seg.margin_pct.toFixed(1)}%
                    </span>
                  </td>

                  <td className="text-right font-mono text-xs">
                    {seg.growth_yoy_pct !== undefined ? (
                      <span className={signClass(seg.growth_yoy_pct)}>
                        {seg.growth_yoy_pct >= 0 ? '+' : ''}
                        {seg.growth_yoy_pct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-apple-faint">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-apple-border font-semibold text-xs bg-apple-surface/30">
              <td className="font-bold text-apple-primary">Consolidated Total</td>
              <td className="text-right font-mono font-bold text-apple-primary">
                ₹{selectedPeriod.total_revenue.toLocaleString('en-IN')}
              </td>
              <td className="text-right font-mono font-bold text-apple-primary">100.0%</td>
              <td className="text-right font-mono font-bold text-apple-primary">
                ₹{selectedPeriod.total_ebit.toLocaleString('en-IN')}
              </td>
              <td className="text-right font-mono font-bold text-apple-primary">
                {blendedMargin.toFixed(1)}%
              </td>
              <td className="text-right font-mono text-apple-muted">-</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Segment Strategic Insights */}
      {segmentHighlights && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="apple-well p-3 rounded-lg space-y-1">
            <div className="text-[10.5px] uppercase tracking-wider font-semibold text-apple-muted flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-apple-blue" />
              Largest Revenue Driver (Cash Engine)
            </div>
            <div className="text-xs font-bold text-apple-primary">
              {segmentHighlights.largestRev.name}
            </div>
            <p className="text-[11px] text-apple-muted">
              Contributes {segmentHighlights.largestRev.revenue_share_pct}% of top-line (₹{segmentHighlights.largestRev.revenue.toLocaleString('en-IN')} Cr) at {segmentHighlights.largestRev.margin_pct}% operating margin.
            </p>
          </div>

          <div className="apple-well p-3 rounded-lg space-y-1">
            <div className="text-[10.5px] uppercase tracking-wider font-semibold text-apple-muted flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Highest Margin Division (Value Driver)
            </div>
            <div className="text-xs font-bold text-apple-primary">
              {segmentHighlights.highestMargin.name}
            </div>
            <p className="text-[11px] text-apple-muted">
              Generates {segmentHighlights.highestMargin.margin_pct}% EBIT margin, delivering ₹{segmentHighlights.highestMargin.ebit.toLocaleString('en-IN')} Cr in divisional operating profit.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SegmentResultsTable;
