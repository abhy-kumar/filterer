import React from 'react';
import type { Stock, QuarterlyResult } from '../../types/stock';
import { StatementTable, StatementRow } from './StatementTable';
import { isReported, pct, statement } from '../../lib/format';
import { missingQuarters } from '../../engine/dataQuality';

export const QuarterlyResultsTable: React.FC<{ stock: Stock }> = ({ stock }) => {
  const quarters = stock.quarterly_results || [];
  if (!quarters.length) return null;

  const gaps = missingQuarters(quarters);

  const rows: StatementRow<QuarterlyResult>[] = [
    { label: 'Sales', value: (q) => statement(q.sales), emphasis: 'subtotal' },
    { label: 'Expenses', value: (q) => statement(q.expenses) },
    { label: 'Operating profit', value: (q) => statement(q.operating_profit), emphasis: 'total' },
    { label: 'OPM', value: (q) => (isReported(q.opm_pct) ? pct(q.opm_pct) : null) },
    { label: 'Other income', value: (q) => (isReported(q.other_income) ? statement(q.other_income) : null) },
    { label: 'Interest', value: (q) => statement(q.interest) },
    { label: 'Depreciation', value: (q) => statement(q.depreciation), hint: 'memo, sits within expenses' },
    { label: 'Profit before tax', value: (q) => statement(q.profit_before_tax), emphasis: 'subtotal' },
    { label: 'Tax', value: (q) => (isReported(q.tax_pct) ? pct(q.tax_pct) : null) },
    { label: 'Net profit', value: (q) => statement(q.net_profit), emphasis: 'total' },
    { label: 'EPS', value: (q) => (isReported(q.eps) ? `₹${q.eps.toFixed(2)}` : null) },
  ];

  return (
    <StatementTable
      title="Quarterly results"
      subtitle="₹ crore, most recent quarter on the right"
      periods={quarters}
      columnLabel={(q) => q.period}
      rows={rows}
      footnote={
        gaps.length ? (
          <span className="text-apple-amber">
            {gaps.join(', ')} {gaps.length === 1 ? 'is' : 'are'} missing from the source feed. The columns
            either side of {gaps.length === 1 ? 'it' : 'them'} are not consecutive quarters, so read
            quarter-on-quarter moves across the gap with care.
          </span>
        ) : undefined
      }
    />
  );
};
