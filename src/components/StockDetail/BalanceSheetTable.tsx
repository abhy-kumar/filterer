import React from 'react';
import type { Stock, BalanceSheet } from '../../types/stock';
import { StatementTable, StatementRow } from './StatementTable';
import { statement } from '../../lib/format';
import { balanceSheetFootingErrors } from '../../engine/dataQuality';

export const BalanceSheetTable: React.FC<{ stock: Stock }> = ({ stock }) => {
  const sheets = stock.balance_sheet || [];
  if (!sheets.length) return null;

  const failing = balanceSheetFootingErrors(stock);

  const rows: StatementRow<BalanceSheet>[] = [
    { label: 'Equity capital', value: (b) => statement(b.equity_capital) },
    { label: 'Reserves', value: (b) => statement(b.reserves) },
    { label: 'Borrowings', value: (b) => statement(b.borrowings) },
    { label: 'Other liabilities', value: (b) => statement(b.other_liabilities) },
    { label: 'Total liabilities', value: (b) => statement(b.total_liabilities), emphasis: 'total' },
    { label: 'Fixed assets', value: (b) => statement(b.fixed_assets) },
    { label: 'Capital work in progress', value: (b) => statement(b.cwip) },
    { label: 'Investments', value: (b) => statement(b.investments) },
    { label: 'Other assets', value: (b) => statement(b.other_assets) },
    { label: 'Total assets', value: (b) => statement(b.total_assets), emphasis: 'total' },
  ];

  return (
    <StatementTable
      title="Balance sheet"
      subtitle="₹ crore, as reported"
      periods={sheets}
      columnLabel={(b) => b.year}
      rows={rows}
      footnote={
        failing.length ? (
          <span className="text-apple-amber">
            The components do not add to the stated totals for {failing.join(', ')}. Nothing on this page divides
            by these figures — return on equity is derived from EPS and book value per share instead.
          </span>
        ) : (
          'The source feed does not split current from non-current items, so working-capital ratios cannot be computed from this statement.'
        )
      }
    />
  );
};
