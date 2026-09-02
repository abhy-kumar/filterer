import React from 'react';
import { Globe, ShieldCheck } from 'lucide-react';
import type { Stock } from '../../types/stock';
import { crore, isReported, multiple, pct, price, signClass } from '../../lib/format';

interface KeyFigure {
  label: string;
  value: string;
  /** Set when the figure is worth calling out either way. */
  tone?: 'good' | 'bad';
  hint?: string;
}

export const StockHeader: React.FC<{ stock: Stock }> = ({ stock }) => {
  const isUp = stock.change >= 0;

  const figures: KeyFigure[] = [
    { label: 'Market cap', value: crore(stock.market_cap) },
    { label: '52-week range', value: `${price(stock.low_52w)} – ${price(stock.high_52w)}` },
    {
      label: 'P/E',
      value: multiple(stock.pe_ratio),
      hint: isReported(stock.industry_pe) ? `sector median ${stock.industry_pe.toFixed(1)}` : undefined,
      tone:
        isReported(stock.pe_ratio) && isReported(stock.industry_pe)
          ? stock.pe_ratio < stock.industry_pe
            ? 'good'
            : undefined
          : undefined,
    },
    { label: 'P/B', value: multiple(stock.pb_ratio, 2) },
    { label: 'Book value', value: price(stock.book_value) },
    { label: 'Dividend yield', value: pct(stock.dividend_yield, 2) },
    {
      label: 'ROCE',
      value: pct(stock.roce),
      tone: isReported(stock.roce) && stock.roce >= 20 ? 'good' : undefined,
    },
    {
      label: 'ROE',
      value: pct(stock.roe),
      tone: isReported(stock.roe) && stock.roe >= 18 ? 'good' : undefined,
    },
    {
      label: 'Debt / equity',
      value: multiple(stock.debt_to_equity, 2),
      tone: isReported(stock.debt_to_equity) && stock.debt_to_equity > 1.5 ? 'bad' : undefined,
    },
    { label: 'PEG', value: multiple(stock.peg_ratio, 2) },
    { label: 'Graham number', value: price(stock.graham_number) },
    { label: 'Face value', value: price(stock.face_value) },
  ];

  const band = stock.high_52w - stock.low_52w;
  const position = band > 0
    ? Math.min(100, Math.max(0, ((stock.current_price - stock.low_52w) / band) * 100))
    : 50;

  return (
    <div className="apple-card p-5 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-[1.75rem] font-bold tracking-[-0.03em] text-apple-primary font-display">
              {stock.name}
            </h1>
            <span className="apple-tag font-mono">{stock.symbol}</span>
            {stock.bse_code && <span className="apple-tag font-mono">BSE {stock.bse_code}</span>}
            {isReported(stock.debt_to_equity) && stock.debt_to_equity < 0.1 && (
              <span className="apple-tag" style={{ color: 'var(--apple-green)' }}>
                <ShieldCheck className="w-3 h-3" />
                Virtually debt free
              </span>
            )}
          </div>

          <p className="flex items-center gap-3 mt-2 text-xs text-apple-muted flex-wrap">
            <span>
              {stock.sector} · {stock.industry}
            </span>
            {stock.website && (
              <a
                href={stock.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-apple-blue hover:underline"
              >
                <Globe className="w-3 h-3" />
                Website
              </a>
            )}
          </p>

          {stock.about && (
            <p className="text-xs text-apple-secondary mt-3.5 max-w-3xl leading-relaxed line-clamp-4">
              {stock.about}
            </p>
          )}
        </div>

        {/* Price block */}
        <div className="shrink-0 lg:text-right">
          <div className="text-[2rem] font-semibold font-mono tabular-nums text-apple-primary leading-none">
            {price(stock.current_price)}
          </div>
          <div className={`mt-1.5 font-mono text-sm tabular-nums ${signClass(stock.change_pct)}`}>
            {isUp ? '+' : ''}
            {stock.change.toFixed(2)} ({isUp ? '+' : ''}
            {stock.change_pct.toFixed(2)}%)
          </div>

          <div className="w-full lg:w-56 mt-4">
            <div
              className="h-1 rounded-full relative"
              style={{ background: 'var(--apple-bg-tertiary)' }}
              role="img"
              aria-label={`Trading at ${position.toFixed(0)}% of its 52-week range`}
            >
              <span
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full ring-2"
                style={{
                  left: `${position}%`,
                  background: 'var(--apple-blue)',
                  boxShadow: '0 0 0 3px var(--apple-card-bg)',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-apple-faint mt-1.5">
              <span>{price(stock.low_52w)}</span>
              <span className="text-apple-muted">52-week range</span>
              <span>{price(stock.high_52w)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key figures */}
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4 mt-6 pt-5 border-t border-apple-border-subtle">
        {figures.map((figure) => (
          <div key={figure.label}>
            <dt className="text-[11px] text-apple-muted truncate">{figure.label}</dt>
            <dd
              className={`text-sm font-semibold font-mono tabular-nums mt-0.5 ${
                figure.tone === 'good' ? 'num-pos' : figure.tone === 'bad' ? 'num-neg' : 'text-apple-primary'
              }`}
            >
              {figure.value}
            </dd>
            {figure.hint && <dd className="text-[10px] text-apple-faint mt-0.5">{figure.hint}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
};
