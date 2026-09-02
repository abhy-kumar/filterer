import React from 'react';
import type { Stock, AnnualPnL } from '../../types/stock';
import { StatementTable, StatementRow } from './StatementTable';
import { isReported, pct, signClass, statement } from '../../lib/format';

interface Props {
  stock: Stock;
}

function growthRow(label: string, value: number | null | undefined) {
  return (
    <div key={label} className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-apple-muted">{label}</span>
      <span className={`font-mono tabular-nums ${isReported(value) ? signClass(value) : 'num-nil'}`}>
        {pct(value)}
      </span>
    </div>
  );
}

export const ProfitLossTable: React.FC<Props> = ({ stock }) => {
  const annual = stock.annual_pnl || [];
  if (!annual.length) return null;

  const rows: StatementRow<AnnualPnL>[] = [
    { label: 'Sales', value: (p) => statement(p.sales), emphasis: 'subtotal' },
    { label: 'Expenses', value: (p) => statement(p.expenses), hint: 'depreciation included' },
    { label: 'Operating profit', value: (p) => statement(p.operating_profit), emphasis: 'total' },
    {
      label: 'OPM',
      value: (p) => (isReported(p.opm_pct) ? pct(p.opm_pct) : null),
    },
    { label: 'Other income', value: (p) => (isReported(p.other_income) ? statement(p.other_income) : null) },
    { label: 'Interest', value: (p) => statement(p.interest) },
    { label: 'Depreciation', value: (p) => statement(p.depreciation), hint: 'memo, sits within expenses' },
    { label: 'Profit before tax', value: (p) => statement(p.profit_before_tax), emphasis: 'subtotal' },
    { label: 'Tax', value: (p) => (isReported(p.tax_pct) ? pct(p.tax_pct) : null) },
    { label: 'Net profit', value: (p) => statement(p.net_profit), emphasis: 'total' },
    { label: 'EPS', value: (p) => (isReported(p.eps) ? `₹${p.eps.toFixed(2)}` : null) },
    {
      label: 'Dividend payout',
      value: (p) => (isReported(p.dividend_payout_pct) ? pct(p.dividend_payout_pct) : null),
    },
  ];

  const years = annual.filter((p) => p.year !== 'TTM').length;

  return (
    <div className="space-y-4">
      <StatementTable
        title="Profit &amp; loss"
        subtitle={`${years} ${years === 1 ? 'year' : 'years'} of annual statements, in ₹ crore`}
        periods={annual}
        columnLabel={(p) => p.year}
        rows={rows}
        footnote={
          <>
            Depreciation is already inside the expenses line in this feed, so profit before tax follows from
            operating profit less interest. Other income and dividend payout are not carried by the source and
            are shown as not reported.
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="apple-well p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-apple-faint mb-2.5">
            Compounded sales growth
          </h3>
          <div className="space-y-1.5">
            {growthRow('10 years', stock.sales_growth_10y)}
            {growthRow('5 years', stock.sales_growth_5y)}
            {growthRow('3 years', stock.sales_growth_3y)}
            {growthRow('TTM', stock.sales_growth_ttm)}
          </div>
        </div>

        <div className="apple-well p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-apple-faint mb-2.5">
            Compounded profit growth
          </h3>
          <div className="space-y-1.5">
            {growthRow('10 years', stock.profit_growth_10y)}
            {growthRow('5 years', stock.profit_growth_5y)}
            {growthRow('3 years', stock.profit_growth_3y)}
            {growthRow('TTM', stock.profit_growth_ttm)}
          </div>
        </div>

        <div className="apple-well p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-apple-faint mb-2.5">
            Share price CAGR
          </h3>
          <div className="space-y-1.5">
            {growthRow('10 years', stock.price_cagr_10y)}
            {growthRow('5 years', stock.price_cagr_5y)}
            {growthRow('3 years', stock.price_cagr_3y)}
            {growthRow('1 year', stock.price_cagr_1y)}
          </div>
        </div>

        <div className="apple-well p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-apple-faint mb-2.5">
            Return on equity
          </h3>
          <div className="space-y-1.5">
            {growthRow('10 years', stock.roe_10y)}
            {growthRow('5 years', stock.roe_5y)}
            {growthRow('3 years', stock.roe_3y)}
            {growthRow('Latest', stock.roe)}
          </div>
        </div>
      </div>
    </div>
  );
};
