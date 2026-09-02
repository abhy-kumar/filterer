import React from 'react';
import { Coins } from 'lucide-react';
import { Stock } from '../../types/stock';

interface CashFlowTableProps {
  stock: Stock;
}

export const CashFlowTable: React.FC<CashFlowTableProps> = ({ stock }) => {
  const cf = stock.cash_flow || [];

  if (cf.length === 0) return null;

  const rows = [
    { label: 'Cash from Operating Activity +', key: 'operating_cf', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isBold: true, isHighlight: true },
    { label: 'Cash from Investing Activity +', key: 'investing_cf', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Cash from Financing Activity +', key: 'financing_cf', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Net Cash Flow', key: 'net_cf', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isBold: true },
    { label: 'Free Cash Flow (FCF)', key: 'free_cf', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isBold: true, isBlue: true },
  ];

  return (
    <div className="w-full apple-card p-6 shadow-sm mb-8 overflow-hidden border border-apple">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-apple-border-subtle mb-4">
        <div>
          <h3 className="text-base font-bold text-apple-primary flex items-center gap-2 font-display">
            <Coins className="w-4 h-4 text-apple-blue" />
            Cash Flows
          </h3>
          <p className="text-xs text-apple-muted mt-0.5">
            Consolidated Cash Flow Statement 10-Year History (₹ Crores)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse apple-table text-xs font-mono">
          <thead>
            <tr>
              <th className="py-3 px-4 sticky left-0 z-10 bg-apple-subtle min-w-[200px] border-b border-apple-border">
                Particulars
              </th>
              {cf.map((y) => (
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
                {cf.map((y) => {
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
