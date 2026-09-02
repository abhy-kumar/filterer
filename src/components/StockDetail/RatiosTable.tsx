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
    { label: 'ROCE %', key: 'roce', format: (v: number) => `${v.toFixed(1)} %`, isBold: true, isHighlight: true },
    { label: 'ROE %', key: 'roe', format: (v: number) => `${v.toFixed(1)} %`, isBold: true, isSky: true },
    { label: 'Debtor Days', key: 'debtor_days', format: (v: number) => `${v} Days` },
    { label: 'Inventory Days', key: 'inventory_days', format: (v: number) => `${v} Days` },
    { label: 'Days Payable', key: 'days_payable', format: (v: number) => `${v} Days` },
    { label: 'Working Capital Days', key: 'working_capital_days', format: (v: number) => `${v} Days`, isBold: true },
    { label: 'Cash Conversion Cycle', key: 'cash_conversion_cycle', format: (v: number) => `${v} Days` },
  ];

  return (
    <div className="w-full bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 p-6 shadow-xl mb-8 overflow-hidden">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/5 dark:border-white/5 light:border-slate-100 mb-4">
        <div>
          <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            Ratios Track Record
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Return metrics and working capital efficiency cycle (10 Years)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse financial-table text-xs font-mono">
          <thead>
            <tr className="bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100 text-slate-400">
              <th className="py-3 px-4 sticky left-0 z-10 bg-[#080c13] dark:bg-[#080c13] light:bg-slate-100 min-w-[180px]">
                Particulars
              </th>
              {ratios.map((y) => (
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
                {ratios.map((y) => {
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
