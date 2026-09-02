import React from 'react';
import { Info } from 'lucide-react';
import type { Stock, RatioHistory } from '../../types/stock';
import { StatementTable, StatementRow } from './StatementTable';
import { days, isReported, pct } from '../../lib/format';

/** True when a column is the same figure repeated, which is not a history. */
function isFlat(values: Array<number | null>): boolean {
  const reported = values.filter((v): v is number => typeof v === 'number');
  if (reported.length < 2) return false;
  return new Set(reported.map((v) => v.toFixed(2))).size === 1;
}

export const RatiosTable: React.FC<{ stock: Stock }> = ({ stock }) => {
  const ratios = stock.ratios_history || [];
  if (!ratios.length) return null;

  const column = (key: keyof RatioHistory) => ratios.map((r) => r[key] as number | null);

  const roceFlat = isFlat(column('roce'));
  const anyWorkingCapital = ratios.some(
    (r) =>
      isReported(r.debtor_days) ||
      isReported(r.inventory_days) ||
      isReported(r.days_payable) ||
      isReported(r.working_capital_days) ||
      isReported(r.cash_conversion_cycle)
  );
  const anyRoe = ratios.some((r) => isReported(r.roe));

  // Nothing here varies over time: ROCE is the current figure stamped onto
  // every year, and the rest was never sourced. Drawing a five-column table
  // of that would read as a track record when it is a single data point.
  if (roceFlat && !anyRoe && !anyWorkingCapital) {
    const latest = ratios[ratios.length - 1];
    return (
      <div className="apple-card p-5">
        <h2 className="text-sm font-semibold text-apple-primary font-display">Ratio history</h2>
        <div className="flex items-start gap-2.5 mt-3">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-apple-muted" />
          <div>
            <p className="text-xs text-apple-secondary leading-relaxed">
              No usable history. The feed repeats today&rsquo;s return on capital across every year rather than
              reporting it per year, and the working-capital cycle was never sourced at all, so there is a
              single data point here and nothing to trend.
            </p>
            {isReported(latest?.roce) && (
              <p className="text-xs text-apple-muted mt-2.5">
                Latest ROCE{' '}
                <span className="font-mono font-semibold text-apple-primary">{pct(latest.roce)}</span>
                {isReported(stock.roe) && (
                  <>
                    {' · '}ROE{' '}
                    <span className="font-mono font-semibold text-apple-primary">{pct(stock.roe)}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const rows: StatementRow<RatioHistory>[] = [
    { label: 'ROCE', value: (r) => (isReported(r.roce) ? pct(r.roce) : null), emphasis: 'total' },
    { label: 'ROE', value: (r) => (isReported(r.roe) ? pct(r.roe) : null), emphasis: 'total' },
    { label: 'Debtor days', value: (r) => (isReported(r.debtor_days) ? days(r.debtor_days) : null) },
    { label: 'Inventory days', value: (r) => (isReported(r.inventory_days) ? days(r.inventory_days) : null) },
    { label: 'Days payable', value: (r) => (isReported(r.days_payable) ? days(r.days_payable) : null) },
    { label: 'Working capital days', value: (r) => (isReported(r.working_capital_days) ? days(r.working_capital_days) : null) },
    { label: 'Cash conversion cycle', value: (r) => (isReported(r.cash_conversion_cycle) ? days(r.cash_conversion_cycle) : null) },
  ];

  return (
    <StatementTable
      title="Ratio history"
      subtitle="Returns and working-capital efficiency, by financial year"
      periods={ratios}
      columnLabel={(r) => r.year}
      rows={rows}
      footnote={
        [
          roceFlat ? 'The ROCE column repeats a single figure and should not be read as a trend.' : null,
          anyWorkingCapital
            ? null
            : 'The working-capital cycle needs receivables, inventory and payables, which this feed does not break out.',
        ]
          .filter(Boolean)
          .join(' ') || undefined
      }
    />
  );
};
