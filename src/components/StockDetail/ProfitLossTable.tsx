import React from 'react';
import type { Stock, AnnualPnL } from '../../types/stock';
import { StatementTable, StatementRow } from './StatementTable';
import { isReported, pct, signClass, statement } from '../../lib/format';

interface Props {
  stock: Stock;
}

function growthRow(label: string, value: number | null | undefined) {
  return (
    <div key={label} className="flex items-baseline justify-between gap-3 text-caption1">
      <span className="text-apple-muted">{label}</span>
      <span className={`num ${isReported(value) ? signClass(value) : 'num-nil'}`}>
        {pct(value)}
      </span>
    </div>
  );
}

export const ProfitLossTable: React.FC<Props> = ({ stock }) => {
  const annual = stock.annual_pnl || [];
  if (!annual.length) return null;

  const filed = stock.annual_source === 'NSE XBRL';
  const filedYears = annual.filter((p) => p.source === 'NSE');
  // Banks file interest earned and expended, and no depreciation line.
  const bankLayout = filed && filedYears.length > 0 && filedYears.every((p) => p.depreciation === null || p.depreciation === undefined);
  const yahooYears = annual.filter((p) => p.source === 'Yahoo').map((p) => p.year);

  const rows: StatementRow<AnnualPnL>[] = [
    {
      label: bankLayout ? 'Revenue' : 'Sales',
      value: (p) => statement(p.sales),
      emphasis: 'subtotal',
      hint: bankLayout ? 'interest earned' : undefined,
    },
    {
      label: 'Expenses',
      value: (p) => statement(p.expenses),
      hint: bankLayout ? 'operating expenses and provisions' : filed ? 'excluding interest and depreciation' : 'depreciation included',
    },
    {
      label: bankLayout ? 'Financing profit' : 'Operating profit',
      value: (p) => statement(p.operating_profit),
      emphasis: 'total',
      hint: bankLayout ? 'after interest expended' : undefined,
    },
    {
      label: bankLayout ? 'Financing margin' : 'OPM',
      value: (p) => (isReported(p.opm_pct) ? pct(p.opm_pct) : null),
    },
    { label: 'Other income', value: (p) => (isReported(p.other_income) ? statement(p.other_income) : null) },
    {
      label: 'Interest',
      value: (p) => statement(p.interest),
      hint: bankLayout ? 'interest expended, already deducted above' : undefined,
    },
    ...(bankLayout
      ? []
      : [
          {
            label: 'Depreciation',
            value: (p: AnnualPnL) => statement(p.depreciation),
            hint: filed ? undefined : 'memo, sits within expenses',
          },
        ]),
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
        subtitle={
          filed
            ? `${years} years, ₹ crore, ${stock.quarterly_basis ?? 'consolidated'}, as filed with NSE`
            : `${years} ${years === 1 ? 'year' : 'years'}, ₹ crore, from Yahoo Finance`
        }
        periods={annual}
        columnLabel={(p) => p.year}
        rows={rows}
        footnote={
          filed ? (
            <>
              Each year is read from the company's results filing with NSE. Dividend payout is not in the filing
              and comes from Yahoo Finance.
              {yahooYears.length > 0 && (
                <span className="text-apple-amber">
                  {' '}
                  NSE has no machine-readable filing for {yahooYears.join(' and ')}, so sales and net profit for{' '}
                  {yahooYears.length === 1 ? 'that year come' : 'those years come'} from Yahoo Finance, which agrees
                  with the filings in the years both cover. The other lines are left blank rather than mixed from
                  two layouts.
                </span>
              )}
            </>
          ) : (
            <>
              Depreciation is already inside the expenses line in this feed, so profit before tax follows from
              operating profit less interest. Other income and dividend payout are not carried by the source and
              are shown as not reported.
            </>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="apple-well p-4">
          <h3 className="text-caption1 font-medium text-apple-muted mb-2">
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
          <h3 className="text-caption1 font-medium text-apple-muted mb-2">
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
          <h3 className="text-caption1 font-medium text-apple-muted mb-2">
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
          <h3 className="text-caption1 font-medium text-apple-muted mb-2">
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
