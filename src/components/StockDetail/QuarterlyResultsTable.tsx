import React from 'react';
import type { Stock, QuarterlyResult } from '../../types/stock';
import { StatementTable, StatementRow } from './StatementTable';
import { isReported, pct, statement } from '../../lib/format';
import { missingQuarters } from '../../engine/dataQuality';

export const QuarterlyResultsTable: React.FC<{ stock: Stock }> = ({ stock }) => {
  const quarters = stock.quarterly_results || [];
  if (!quarters.length) return null;

  const gaps = missingQuarters(quarters);
  const derived = quarters.filter((q) => q.derived);
  const filed = stock.quarterly_source === 'NSE XBRL';
  // Banks file interest earned and expended rather than revenue and finance
  // costs, and no separate depreciation line. Filed bank rows carry none.
  const bankLayout = filed && quarters.every((q) => q.depreciation === null || q.depreciation === undefined);

  const rows: StatementRow<QuarterlyResult>[] = [
    {
      label: bankLayout ? 'Revenue' : 'Sales',
      value: (q) => statement(q.sales),
      emphasis: 'subtotal',
      hint: bankLayout ? 'interest earned' : undefined,
    },
    {
      label: 'Expenses',
      value: (q) => statement(q.expenses),
      hint: bankLayout ? 'operating expenses and provisions' : filed ? 'excluding interest and depreciation' : undefined,
    },
    {
      label: bankLayout ? 'Financing profit' : 'Operating profit',
      value: (q) => statement(q.operating_profit),
      emphasis: 'total',
      hint: bankLayout ? 'after interest expended' : undefined,
    },
    { label: bankLayout ? 'Financing margin' : 'OPM', value: (q) => (isReported(q.opm_pct) ? pct(q.opm_pct) : null) },
    { label: 'Other income', value: (q) => (isReported(q.other_income) ? statement(q.other_income) : null) },
    {
      label: 'Interest',
      value: (q) => statement(q.interest),
      hint: bankLayout ? 'interest expended, already deducted above' : undefined,
    },
    ...(bankLayout
      ? []
      : [
          {
            label: 'Depreciation',
            value: (q: QuarterlyResult) => statement(q.depreciation),
            // In Yahoo's layout depreciation is inside expenses; in the filed
            // layout it is a line of its own.
            hint: filed ? undefined : 'memo, sits within expenses',
          },
        ]),
    { label: 'Profit before tax', value: (q) => statement(q.profit_before_tax), emphasis: 'subtotal' },
    { label: 'Tax', value: (q) => (isReported(q.tax_pct) ? pct(q.tax_pct) : null) },
    { label: 'Net profit', value: (q) => statement(q.net_profit), emphasis: 'total' },
    { label: 'EPS', value: (q) => (isReported(q.eps) ? `₹${q.eps.toFixed(2)}` : null) },
  ];

  const subtitle = filed
    ? `₹ crore, ${stock.quarterly_basis ?? 'consolidated'}, as filed with NSE`
    : '₹ crore, from Yahoo Finance';

  return (
    <StatementTable
      title="Quarterly results"
      subtitle={subtitle}
      periods={quarters}
      columnLabel={(q) => q.period}
      rows={rows}
      footnote={
        <>
          {filed && "Net profit is the share attributable to the company's own shareholders. Figures follow the XBRL filed with the exchange."}
          {derived.map((q) => (
            <span key={q.period} className="block mt-1">
              {q.period} has no quarterly figures in any filing NSE indexes, so it is worked out as {q.derived}
              {q.expenses === null ? '; only sales and net profit can be' : ''}.
            </span>
          ))}
          {gaps.length > 0 && (
            <span className="block mt-1 text-apple-amber">
              {gaps.join(', ')}: no filing for {gaps.length === 1 ? 'this quarter' : 'these quarters'} could be read
              {filed ? ' from NSE' : ''}, so a comparison across {gaps.length === 1 ? 'it skips a quarter' : 'them skips quarters'}.
            </span>
          )}
        </>
      }
    />
  );
};
