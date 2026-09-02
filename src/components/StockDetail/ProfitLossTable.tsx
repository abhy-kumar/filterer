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
    { label: 'Sales +', key: 'sales', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isBold: true },
    { label: 'Expenses +', key: 'expenses', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Operating Profit', key: 'operating_profit', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isBold: true, isHighlight: true },
    { label: 'OPM %', key: 'opm_pct', format: (v: number) => `${v.toFixed(1)}%`, isHighlight: true },
    { label: 'Other Income +', key: 'other_income', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Interest', key: 'interest', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Depreciation', key: 'depreciation', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Profit before tax', key: 'profit_before_tax', format: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { label: 'Tax %', key: 'tax_pct', format: (v: number) => `${v.toFixed(1)}%` },
    { label: 'Net Profit +', key: 'net_profit', format: (v: number) => `₹${v.toLocaleString('en-IN')}`, isBold: true, isBlue: true },
    { label: 'EPS in Rs', key: 'eps', format: (v: number) => `₹${v.toFixed(2)}`, isBold: true },
    { label: 'Dividend Payout %', key: 'dividend_payout_pct', format: (v: number) => `${v.toFixed(0)}%` },
  ];

  return (
    <div className="w-full apple-card p-6 shadow-sm mb-8 overflow-hidden border border-apple">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-apple-border-subtle mb-4">
        <div>
          <h3 className="text-base font-bold text-apple-primary flex items-center gap-2 font-display">
            <FileSpreadsheet className="w-4 h-4 text-apple-blue" />
            10-Year Annual Profit & Loss Statement
          </h3>
          <p className="text-xs text-apple-muted mt-0.5">
            Consolidated 10-Year History (Figures in ₹ Crores)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-left border-collapse apple-table text-xs font-mono">
          <thead>
            <tr>
              <th className="py-3 px-4 sticky left-0 z-10 bg-apple-subtle min-w-[160px] border-b border-apple-border">
                Particulars
              </th>
              {annual.map((y) => (
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
                {annual.map((y) => {
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

      {/* Compounded Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compounded Sales Growth */}
        <div className="p-4 rounded-2xl bg-apple-subtle border border-apple-border">
          <h4 className="text-[11px] font-bold text-apple-secondary mb-3 uppercase tracking-wider font-display">
            Compounded Sales Growth
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-apple-secondary">
              <span>10 Years:</span>
              <strong className="text-apple-primary">{stock.sales_growth_10y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-apple-secondary">
              <span>5 Years:</span>
              <strong className="text-apple-primary">{stock.sales_growth_5y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-apple-secondary">
              <span>3 Years:</span>
              <strong className="text-apple-primary">{stock.sales_growth_3y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-apple-secondary">
              <span>12 Months:</span>
              <strong className="text-apple-primary">{stock.sales_growth_3y.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* Compounded Profit Growth */}
        <div className="p-4 rounded-2xl bg-apple-subtle border border-apple-border">
          <h4 className="text-[11px] font-bold text-apple-secondary mb-3 uppercase tracking-wider font-display">
            Compounded Profit Growth
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-apple-secondary">
              <span>10 Years:</span>
              <strong className="text-apple-green">{stock.profit_growth_10y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-apple-secondary">
              <span>5 Years:</span>
              <strong className="text-apple-green">{stock.profit_growth_5y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-apple-secondary">
              <span>3 Years:</span>
              <strong className="text-apple-green">{stock.profit_growth_3y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-apple-secondary">
              <span>TTM:</span>
              <strong className="text-apple-green">{stock.profit_growth_3y.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* Stock Price CAGR */}
        <div className="p-4 rounded-2xl bg-apple-subtle border border-apple-border">
          <h4 className="text-[11px] font-bold text-apple-secondary mb-3 uppercase tracking-wider font-display">
            Stock Price CAGR
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-apple-secondary">
              <span>10 Years:</span>
              <strong className="text-apple-indigo">{stock.price_cagr_10y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-apple-secondary">
              <span>5 Years:</span>
              <strong className="text-apple-indigo">{stock.price_cagr_5y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-apple-secondary">
              <span>3 Years:</span>
              <strong className="text-apple-indigo">{stock.price_cagr_3y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-apple-secondary">
              <span>1 Year:</span>
              <strong className="text-apple-indigo">{stock.price_cagr_1y.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* Return on Equity */}
        <div className="p-4 rounded-2xl bg-apple-subtle border border-apple-border">
          <h4 className="text-[11px] font-bold text-apple-secondary mb-3 uppercase tracking-wider font-display">
            Return on Equity (ROE)
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-apple-secondary">
              <span>10 Years:</span>
              <strong className="text-apple-amber">{stock.roe_10y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-apple-secondary">
              <span>5 Years:</span>
              <strong className="text-apple-amber">{stock.roe_5y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-apple-secondary">
              <span>3 Years:</span>
              <strong className="text-apple-amber">{stock.roe_3y.toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between text-apple-secondary">
              <span>Last Year:</span>
              <strong className="text-apple-amber">{stock.roe.toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
