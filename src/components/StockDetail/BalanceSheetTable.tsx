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
    { label: 'Equity Capital', key: 'equity_capital', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Reserves', key: 'reserves', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isBold: true },
    { label: 'Borrowings +', key: 'borrowings', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isHighlight: true },
    { label: 'Other Liabilities +', key: 'other_liabilities', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Total Liabilities', key: 'total_liabilities', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isBold: true, isSky: true },
    { label: 'Fixed Assets +', key: 'fixed_assets', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isBold: true },
    { label: 'CWIP', key: 'cwip', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Investments', key: 'investments', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Other Assets +', key: 'other_assets', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Total Assets', key: 'total_assets', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isBold: true, isSky: true },
  ];

  return (
    <div className="w-full bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 p-6 shadow-xl mb-8 overflow-hidden">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/5 dark:border-white/5 light:border-slate-100 mb-4">
        <div>
          <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-sky-400" />
            Balance Sheet
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Consolidated Balance Sheet 10-Year History (₹ Crores)
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
              {bs.map((y) => (
                <th key={y.year} className="py-3 px-3 text-right whitespace-nowrap">
                  {y.year}
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
                {bs.map((y) => {
                  const val = (y as any)[row.key];
                  return (
                    <td
                      key={y.year}
                      className={`py-2.5 px-3 text-right whitespace-nowrap ${
                        row.isSky
                          ? 'text-sky-400 font-bold'
                          : row.isHighlight
                          ? 'text-amber-400 font-semibold'
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
