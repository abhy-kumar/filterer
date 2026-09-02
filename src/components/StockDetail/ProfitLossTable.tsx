import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Stock } from '../../types/stock';

interface ProfitLossTableProps {
  stock: Stock;
}

export const ProfitLossTable: React.FC<ProfitLossTableProps> = ({ stock }) => {
  const annual = stock.annual_pnl || [];

  if (annual.length === 0) return null;

  const rows = [
    { label: 'Sales +', key: 'sales', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isBold: true },
    { label: 'Expenses +', key: 'expenses', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Operating Profit', key: 'operating_profit', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isBold: true, isHighlight: true },
    { label: 'OPM %', key: 'opm_pct', format: (v: number) => `${v.toFixed(1)} %`, isHighlight: true },
    { label: 'Other Income +', key: 'other_income', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Interest', key: 'interest', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Depreciation', key: 'depreciation', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Profit before tax', key: 'profit_before_tax', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}` },
    { label: 'Tax %', key: 'tax_pct', format: (v: number) => `${v.toFixed(1)} %` },
    { label: 'Net Profit +', key: 'net_profit', format: (v: number) => `₹ ${v.toLocaleString('en-IN')}`, isBold: true, isSky: true },
    { label: 'EPS in Rs', key: 'eps', format: (v: number) => `₹ ${v.toFixed(2)}`, isBold: true },
    { label: 'Dividend Payout %', key: 'dividend_payout_pct', format: (v: number) => `${v.toFixed(0)} %` },
  ];

  return (
    <div className="w-full apple-glass rounded-3xl border border-white/[0.08] p-6 shadow-2xl mb-8 overflow-hidden">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.06] mb-4">
        <div>
          <h3 className="text-base font-semibold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#2997ff]" />
            10-Year Annual Profit & Loss Statement
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Consolidated 10-Year History (Figures in ₹ Crores)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-left border-collapse apple-table text-xs font-mono">
          <thead>
            <tr className="bg-black/30 text-slate-400">
              <th className="py-3 px-4 sticky left-0 z-10 bg-[#070b12] min-w-[160px]">
                Particulars
              </th>
              {annual.map((y) => (
                <th key={y.year} className="py-3 px-3 text-right whitespace-nowrap">
                  {y.year}
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
                {annual.map((y) => {
                  const val = (y as any)[row.key];
                  return (
                    <td
                      key={y.year}
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

      {/* Compounded Growth 4-Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/[0.06]">
        {/* Sales Growth */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <h4 className="text-[11px] font-bold text-slate-300 mb-3 uppercase tracking-wider">
            Compounded Sales Growth
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span>10 Years:</span>
              <strong className="text-[#2997ff]">{stock.sales_growth_10y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>5 Years:</span>
              <strong className="text-[#2997ff]">{stock.sales_growth_5y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>3 Years:</span>
              <strong className="text-[#2997ff]">{stock.sales_growth_3y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>TTM:</span>
              <strong className="text-[#2997ff]">{stock.sales_growth_3y.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* Profit Growth */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <h4 className="text-[11px] font-bold text-slate-300 mb-3 uppercase tracking-wider">
            Compounded Profit Growth
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span>10 Years:</span>
              <strong className="text-[#30d158]">{stock.profit_growth_10y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>5 Years:</span>
              <strong className="text-[#30d158]">{stock.profit_growth_5y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>3 Years:</span>
              <strong className="text-[#30d158]">{stock.profit_growth_3y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>TTM:</span>
              <strong className="text-[#30d158]">{stock.profit_growth_3y.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* Stock Price CAGR */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <h4 className="text-[11px] font-bold text-slate-300 mb-3 uppercase tracking-wider">
            Stock Price CAGR
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span>10 Years:</span>
              <strong className="text-[#5e5ce6]">{stock.price_cagr_10y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>5 Years:</span>
              <strong className="text-[#5e5ce6]">{stock.price_cagr_5y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>3 Years:</span>
              <strong className="text-[#5e5ce6]">{stock.price_cagr_3y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>1 Year:</span>
              <strong className="text-[#5e5ce6]">{stock.price_cagr_1y.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* Return on Equity */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <h4 className="text-[11px] font-bold text-slate-300 mb-3 uppercase tracking-wider">
            Return on Equity (ROE)
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span>10 Years:</span>
              <strong className="text-[#ff9f0a]">{stock.roe_10y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>5 Years:</span>
              <strong className="text-[#ff9f0a]">{stock.roe_5y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>3 Years:</span>
              <strong className="text-[#ff9f0a]">{stock.roe_3y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Last Year:</span>
              <strong className="text-[#ff9f0a]">{stock.roe.toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
