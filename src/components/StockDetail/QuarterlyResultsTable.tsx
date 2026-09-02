import React from 'react';
import { Table, Calendar } from 'lucide-react';
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
    <div className="w-full bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 p-6 shadow-xl mb-8 overflow-hidden">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/5 dark:border-white/5 light:border-slate-100 mb-4">
        <div>
          <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" />
            Quarterly Results
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Consolidated figures in ₹ Crores (All numbers reported)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse financial-table text-xs font-mono">
          <thead>
            <tr className="bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100 text-slate-400">
              <th className="py-3 px-4 sticky left-0 z-10 bg-[#080c13] dark:bg-[#080c13] light:bg-slate-100 min-w-[160px]">
                Particulars
              </th>
              {quarters.map((q) => (
                <th key={q.period} className="py-3 px-3 text-right whitespace-nowrap">
                  {q.period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 dark:divide-white/5 light:divide-slate-200">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-slate-800/40 transition-colors">
                <td
                  className={`py-2.5 px-4 sticky left-0 z-10 bg-[#0c1017] dark:bg-[#0c1017] light:bg-white font-sans ${
                    row.isBold ? 'font-bold text-white dark:text-white light:text-slate-900' : 'text-slate-400'
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
                          ? 'text-sky-400 font-bold'
                          : row.isHighlight
                          ? 'text-emerald-400 font-semibold'
                          : row.isBold
                          ? 'text-white dark:text-white light:text-slate-900 font-bold'
                          : 'text-slate-300 dark:text-slate-300 light:text-slate-700'
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
