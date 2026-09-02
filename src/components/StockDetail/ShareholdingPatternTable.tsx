import React from 'react';
import { Users2 } from 'lucide-react';
import { Stock } from '../../types/stock';

interface ShareholdingPatternTableProps {
  stock: Stock;
}

export const ShareholdingPatternTable: React.FC<ShareholdingPatternTableProps> = ({ stock }) => {
  const sh = stock.shareholding_history || [];

  if (sh.length === 0) return null;

  const rows = [
    { label: 'Promoters +', key: 'promoter', format: (v: number) => `${v.toFixed(2)}%`, isBold: true, isBlue: true },
    { label: 'FIIs +', key: 'fii', format: (v: number) => `${v.toFixed(2)}%`, isHighlight: true },
    { label: 'DIIs +', key: 'dii', format: (v: number) => `${v.toFixed(2)}%`, isHighlight: true },
    { label: 'Public +', key: 'public', format: (v: number) => `${v.toFixed(2)}%` },
    { label: 'Others', key: 'others', format: (v: number) => `${v.toFixed(2)}%` },
    { label: 'Total', key: 'total', format: () => `100.00%`, isBold: true },
    { label: 'Pledged Promoters %', key: 'pledged', format: (v: number) => `${v.toFixed(2)}%`, isPledge: true },
  ];

  const latest = sh[sh.length - 1];

  return (
    <div className="w-full apple-card p-6 shadow-sm mb-8 overflow-hidden border border-apple">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-apple-border-subtle mb-6">
        <div>
          <h3 className="text-base font-bold text-apple-primary flex items-center gap-2 font-display">
            <Users2 className="w-4 h-4 text-apple-blue" />
            Shareholding Pattern
          </h3>
          <p className="text-xs text-apple-muted mt-0.5">
            Quarterly institutional and promoter ownership breakdown (%)
          </p>
        </div>

        {/* Visual Composition Bar */}
        {latest && (
          <div className="w-full sm:w-72">
            <div className="h-2.5 rounded-full overflow-hidden flex bg-apple-border">
              <div
                style={{ width: `${latest.promoter}%` }}
                className="bg-apple-blue h-full"
                title={`Promoter: ${latest.promoter}%`}
              />
              <div
                style={{ width: `${latest.fii}%` }}
                className="bg-apple-indigo h-full"
                title={`FII: ${latest.fii}%`}
              />
              <div
                style={{ width: `${latest.dii}%` }}
                className="bg-apple-green h-full"
                title={`DII: ${latest.dii}%`}
              />
              <div
                style={{ width: `${latest.public}%` }}
                className="bg-apple-amber h-full"
                title={`Public: ${latest.public}%`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-apple-muted mt-1.5 font-mono">
              <span className="text-apple-blue">Prom: {latest.promoter}%</span>
              <span className="text-apple-indigo">FII: {latest.fii}%</span>
              <span className="text-apple-green">DII: {latest.dii}%</span>
              <span className="text-apple-amber">Pub: {latest.public}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse apple-table text-xs font-mono">
          <thead>
            <tr>
              <th className="py-3 px-4 sticky left-0 z-10 bg-apple-subtle min-w-[180px] border-b border-apple-border">
                Particulars
              </th>
              {sh.map((q) => (
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
                  } ${row.isPledge ? 'text-apple-red' : ''}`}
                >
                  {row.label}
                </td>
                {sh.map((q) => {
                  const val = (q as any)[row.key];
                  const formatted = val !== undefined && val !== null ? row.format(val) : '-';

                  return (
                    <td
                      key={q.period}
                      className={`py-2.5 px-3 text-right whitespace-nowrap ${
                        row.isPledge
                          ? 'text-apple-red font-semibold'
                          : row.isBlue
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
