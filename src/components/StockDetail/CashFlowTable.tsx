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
    { label: 'Cash from Operating Activity +', key: 'operating_cf', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isBold: true, isHighlight: true },
    { label: 'Cash from Investing Activity +', key: 'investing_cf', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Cash from Financing Activity +', key: 'financing_cf', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Net Cash Flow', key: 'net_cf', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isBold: true },
    { label: 'Free Cash Flow (FCF)', key: 'free_cf', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isBold: true, isSky: true },
  ];

  return (
    <div className="w-full bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 p-6 shadow-xl mb-8 overflow-hidden">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/5 dark:border-white/5 light:border-slate-100 mb-4">
        <div>
          <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Coins className="w-4 h-4 text-sky-400" />
            Cash Flows
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Consolidated Cash Flow Statement 10-Year History (₹ Crores)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse financial-table text-xs font-mono">
          <thead>
            <tr className="bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100 text-slate-400">
              <th className="py-3 px-4 sticky left-0 z-10 bg-[#080c13] dark:bg-[#080c13] light:bg-slate-100 min-w-[200px]">
                Particulars
              </th>
              {cf.map((y) => (
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
                {cf.map((y) => {
                  const val = (y as any)[row.key];
                  return (
                    <td
                      key={y.year}
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
