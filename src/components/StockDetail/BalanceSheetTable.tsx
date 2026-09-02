import React from 'react';
import { Landmark } from 'lucide-react';
import { Stock } from '../../types/stock';

interface BalanceSheetTableProps {
  stock: Stock;
}

export const BalanceSheetTable: React.FC<BalanceSheetTableProps> = ({ stock }) => {
  const bs = stock.balance_sheet || [];

  if (bs.length === 0) return null;

  const rows = [
    { label: 'Equity Capital', key: 'equity_capital', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Reserves', key: 'reserves', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isBold: true },
    { label: 'Borrowings +', key: 'borrowings', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isHighlight: true },
    { label: 'Other Liabilities +', key: 'other_liabilities', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Total Liabilities', key: 'total_liabilities', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isBold: true, isBlue: true },
    { label: 'Fixed Assets +', key: 'fixed_assets', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isBold: true },
    { label: 'CWIP', key: 'cwip', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Investments', key: 'investments', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Other Assets +', key: 'other_assets', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Total Assets', key: 'total_assets', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isBold: true, isBlue: true },
  ];

  return (
    <div className="w-full apple-card p-6 shadow-sm mb-8 overflow-hidden border border-apple">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-apple-border-subtle mb-4">
        <div>
          <h3 className="text-base font-bold text-apple-primary flex items-center gap-2 font-display">
            <Landmark className="w-4 h-4 text-apple-blue" />
            Balance Sheet
          </h3>
          <p className="text-xs text-apple-muted mt-0.5">
            Consolidated Balance Sheet 10-Year History (₹ Crores)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse apple-table text-xs font-mono">
          <thead>
            <tr>
              <th className="py-3 px-4 sticky left-0 z-10 bg-apple-subtle min-w-[160px] border-b border-apple-border">
                Particulars
              </th>
              {bs.map((y) => (
                <th key={y.year} className="py-3 px-3 text-right whitespace-nowrap border-b border-apple-border">
                  {y.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-apple-border-subtle">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-apple-surface-hover transition-colors">
                <td
                  className={`py-2.5 px-4 sticky left-0 z-10 bg-apple-card border-r border-apple-border-subtle font-sans transition-colors ${
                    row.isBold ? 'font-bold text-apple-primary' : 'text-apple-secondary'
                  } ${row.isHighlight ? 'bg-apple-subtle' : ''}`}
                >
                  {row.label}
                </td>
                {bs.map((y) => {
                  const val = (y as any)[row.key];
                  const formatted = val !== undefined && val !== null ? row.format(val) : '-';

                  return (
                    <td
                      key={y.year}
                      className={`py-2.5 px-3 text-right whitespace-nowrap ${
                        row.isBlue
                          ? 'text-apple-blue font-bold'
                          : row.isHighlight
                          ? 'text-apple-amber font-semibold'
                          : row.isBold
                          ? 'font-bold text-apple-primary'
                          : 'text-apple-secondary'
                      }`}
                    >
                      {formatted}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
