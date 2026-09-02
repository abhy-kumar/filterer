import React from 'react';
import { Activity } from 'lucide-react';
import { Stock } from '../../types/stock';

interface RatiosTableProps {
  stock: Stock;
}

export const RatiosTable: React.FC<RatiosTableProps> = ({ stock }) => {
  const ratios = stock.ratios_history || [];

  if (ratios.length === 0) return null;

  const rows = [
    { label: 'ROCE %', key: 'roce', format: (v: number) => `${v.toFixed(1)}%`, isBold: true, isHighlight: true },
    { label: 'ROE %', key: 'roe', format: (v: number) => `${v.toFixed(1)}%`, isBold: true, isBlue: true },
    { label: 'Debtor Days', key: 'debtor_days', format: (v: number) => `${v} Days` },
    { label: 'Inventory Days', key: 'inventory_days', format: (v: number) => `${v} Days` },
    { label: 'Days Payable', key: 'days_payable', format: (v: number) => `${v} Days` },
    { label: 'Working Capital Days', key: 'working_capital_days', format: (v: number) => `${v} Days`, isBold: true },
    { label: 'Cash Conversion Cycle', key: 'cash_conversion_cycle', format: (v: number) => `${v} Days` },
  ];

  return (
    <div className="w-full apple-card p-6 shadow-sm mb-8 overflow-hidden border border-apple">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-apple-border-subtle mb-4">
        <div>
          <h3 className="text-base font-bold text-apple-primary flex items-center gap-2 font-display">
            <Activity className="w-4 h-4 text-apple-blue" />
            Ratios Track Record
          </h3>
          <p className="text-xs text-apple-muted mt-0.5">
            Return metrics and working capital efficiency cycle (10 Years)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse apple-table text-xs font-mono">
          <thead>
            <tr>
              <th className="py-3 px-4 sticky left-0 z-10 bg-apple-subtle min-w-[180px] border-b border-apple-border">
                Particulars
              </th>
              {ratios.map((y) => (
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
                {ratios.map((y) => {
                  const val = (y as any)[row.key];
                  const formatted = val !== undefined && val !== null ? row.format(val) : '-';

                  return (
                    <td
                      key={y.year}
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
