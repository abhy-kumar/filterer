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
    { label: 'Sales +', key: 'sales', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isBold: true },
    { label: 'Expenses +', key: 'expenses', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Operating Profit', key: 'operating_profit', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isBold: true, isHighlight: true },
    { label: 'OPM %', key: 'opm_pct', format: (v: number) => `${v.toFixed(1)} %`, isHighlight: true },
    { label: 'Other Income', key: 'other_income', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Interest', key: 'interest', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Depreciation', key: 'depreciation', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Profit before tax', key: 'profit_before_tax', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Tax %', key: 'tax_pct', format: (v: number) => `${v.toFixed(1)} %` },
    { label: 'Net Profit +', key: 'net_profit', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isBold: true, isSky: true },
    { label: 'EPS in Rs', key: 'eps', format: (v: number) => `₹ ${v.toFixed(2)}`, isBold: true },
  ];

  return (
    <div className="w-full apple-glass rounded-3xl border border-white/[0.08] p-6 shadow-2xl mb-8 overflow-hidden">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.06] mb-4">
        <div>
          <h3 className="text-base font-semibold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#2997ff]" />
            Quarterly Financial Results
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Consolidated figures in ₹ Crores (All numbers reported)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse apple-table text-xs font-mono">
          <thead>
            <tr className="bg-black/30 text-slate-400">
              <th className="py-3 px-4 sticky left-0 z-10 bg-[#070b12] min-w-[160px]">
                Particulars
              </th>
              {quarters.map((q) => (
                <th key={q.period} className="py-3 px-3 text-right whitespace-nowrap">
                  {q.period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-white/[0.03] transition-colors">
                <td
                  className={`py-2.5 px-4 sticky left-0 z-10 bg-[#0a0e17] font-sans ${
                    row.isBold ? 'font-semibold text-white' : 'text-slate-400'
                  }`}
                >
                  {row.label}
                </td>
                {quarters.map((q) => {
                  const val = (q as any)[row.key];
                  return (
                    <td
                      key={q.period}
                      className={`py-2.5 px-3 text-right whitespace-nowrap ${
                        row.isSky
                          ? 'text-[#2997ff] font-bold'
                          : row.isHighlight
                          ? 'text-[#30d158] font-semibold'
                          : row.isBold
                          ? 'text-white font-bold'
                          : 'text-slate-300'
                      }`}
                    >
                      {row.format ? row.format(val) : val}
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
