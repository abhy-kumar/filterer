import React from 'react';
import { Users2, PieChart } from 'lucide-react';
import { Stock } from '../../types/stock';

interface ShareholdingPatternTableProps {
  stock: Stock;
}

export const ShareholdingPatternTable: React.FC<ShareholdingPatternTableProps> = ({ stock }) => {
  const sh = stock.shareholding_history || [];

  if (sh.length === 0) return null;

  const rows = [
    { label: 'Promoters +', key: 'promoter', format: (v: number) => `${v.toFixed(2)} %`, isBold: true, isSky: true },
    { label: 'FIIs +', key: 'fii', format: (v: number) => `${v.toFixed(2)} %`, isHighlight: true },
    { label: 'DIIs +', key: 'dii', format: (v: number) => `${v.toFixed(2)} %`, isHighlight: true },
    { label: 'Public +', key: 'public', format: (v: number) => `${v.toFixed(2)} %` },
    { label: 'Others', key: 'others', format: (v: number) => `${v.toFixed(2)} %` },
    { label: 'Total', key: 'total', format: () => `100.00 %`, isBold: true },
    { label: 'Pledged Promoters %', key: 'pledged', format: (v: number) => `${v.toFixed(2)} %`, isPledge: true },
  ];

  const latest = sh[sh.length - 1];

  return (
    <div className="w-full bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 p-6 shadow-xl mb-8 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5 dark:border-white/5 light:border-slate-100 mb-6">
        <div>
          <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Users2 className="w-4 h-4 text-sky-400" />
            Shareholding Pattern
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Quarterly institutional and promoter ownership breakdown (%)
          </p>
        </div>

        {/* Visual Composition Bar */}
        {latest && (
          <div className="w-full sm:w-72">
            <div className="h-3 rounded-full overflow-hidden flex bg-slate-800">
              <div
                style={{ width: `${latest.promoter}%` }}
                className="bg-sky-500 h-full"
                title={`Promoter: ${latest.promoter}%`}
              />
              <div
                style={{ width: `${latest.fii}%` }}
                className="bg-indigo-500 h-full"
                title={`FII: ${latest.fii}%`}
              />
              <div
                style={{ width: `${latest.dii}%` }}
                className="bg-emerald-500 h-full"
                title={`DII: ${latest.dii}%`}
              />
              <div
                style={{ width: `${latest.public}%` }}
                className="bg-amber-500 h-full"
                title={`Public: ${latest.public}%`}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5">
              <span className="text-sky-400">Prom: {latest.promoter}%</span>
              <span className="text-indigo-400">FII: {latest.fii}%</span>
              <span className="text-emerald-400">DII: {latest.dii}%</span>
              <span className="text-amber-400">Pub: {latest.public}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse financial-table text-xs font-mono">
          <thead>
            <tr className="bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100 text-slate-400">
              <th className="py-3 px-4 sticky left-0 z-10 bg-[#080c13] dark:bg-[#080c13] light:bg-slate-100 min-w-[180px]">
                Holder Category
              </th>
              {sh.map((s) => (
                <th key={s.period} className="py-3 px-3 text-right whitespace-nowrap">
                  {s.period}
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
                {sh.map((s) => {
                  const val = (s as any)[row.key];
                  return (
                    <td
                      key={s.period}
                      className={`py-2.5 px-3 text-right whitespace-nowrap ${
                        row.isPledge
                          ? val > 0
                            ? 'text-rose-400 font-bold'
                            : 'text-emerald-400'
                          : row.isSky
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
