import React from 'react';
import { Calendar } from 'lucide-react';
import { Stock } from '../../types/stock';

interface QuarterlyResultsTableProps {
  stock: Stock;
}

export const QuarterlyResultsTable: React.FC<QuarterlyResultsTableProps> = ({ stock }) => {
  const quarters = stock.quarterly_results || [];

  if (quarters.length === 0) return null;

  const rows = [
    { label: 'Sales +', key: 'sales', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isBold: true },
    { label: 'Expenses +', key: 'expenses', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Operating Profit', key: 'operating_profit', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isBold: true, isHighlight: true },
    { label: 'OPM %', key: 'opm_pct', format: (v: number) => `${v.toFixed(1)}%`, isHighlight: true },
    { label: 'Other Income', key: 'other_income', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Interest', key: 'interest', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Depreciation', key: 'depreciation', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Profit before tax', key: 'profit_before_tax', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Tax %', key: 'tax_pct', format: (v: number) => `${v.toFixed(1)}%` },
    { label: 'Net Profit +', key: 'net_profit', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isBold: true, isBlue: true },
    { label: 'EPS in Rs', key: 'eps', format: (v: number) => `₹${v.toFixed(2)}`, isBold: true },
  ];

  return (
    <div className="w-full apple-card p-6 shadow-sm mb-8 overflow-hidden border border-apple">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-apple-border-subtle mb-4">
        <div>
          <h3 className="text-base font-bold text-apple-primary flex items-center gap-2 font-display">
            <Calendar className="w-4 h-4 text-apple-blue" />
            Quarterly Financial Results
          </h3>
          <p className="text-xs text-apple-muted mt-0.5">
            Consolidated figures in ₹ Crores (Reported)
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
              {quarters.map((q) => (
                <th key={q.period} className="py-3 px-3 text-right whitespace-nowrap border-b border-apple-border">
                  {q.period}
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
                {quarters.map((q) => {
                  const val = (q as any)[row.key];
                  const formatted = val !== undefined && val !== null ? row.format(val) : '-';

                  return (
                    <td
                      key={q.period}
                      className={`py-2.5 px-3 text-right whitespace-nowrap ${
                        row.isBlue
                          ? 'text-apple-blue font-bold'
                          : row.isHighlight
                          ? 'text-apple-green font-semibold'
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
