import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { Stock } from '../../types/stock';

interface StockHeaderProps {
  stock: Stock;
}

export const StockHeader: React.FC<StockHeaderProps> = ({ stock }) => {
  const isUp = stock.change >= 0;

  const ratioCards = [
    { label: 'Market Cap', value: `₹ ${stock.market_cap.toLocaleString('en-IN')} Cr`, isPrimary: true },
    { label: 'Current Price', value: `₹ ${stock.current_price.toLocaleString('en-IN')}`, isPrimary: true },
    { label: 'High / Low', value: `₹ ${stock.high_52w.toLocaleString('en-IN')} / ${stock.low_52w.toLocaleString('en-IN')}` },
    { label: 'Stock P/E', value: stock.pe_ratio > 0 ? stock.pe_ratio.toFixed(1) : '-' },
    { label: 'Book Value', value: `₹ ${stock.book_value.toFixed(1)}` },
    { label: 'Dividend Yield', value: `${stock.dividend_yield.toFixed(2)} %` },
    { label: 'ROCE', value: `${stock.roce.toFixed(1)} %`, isHighlight: stock.roce >= 20 },
    { label: 'ROE', value: `${stock.roe.toFixed(1)} %`, isHighlight: stock.roe >= 18 },
    { label: 'Face Value', value: `₹ ${stock.face_value.toFixed(1)}` },
    { label: 'Industry P/E', value: stock.industry_pe.toFixed(1) },
    { label: 'PEG Ratio', value: stock.peg_ratio.toFixed(2) },
    { label: 'Graham Number', value: `₹ ${stock.graham_number.toFixed(1)}` },
  ];

  const rangePct = Math.min(
    100,
    Math.max(
      0,
      ((stock.current_price - stock.low_52w) / (stock.high_52w - stock.low_52w || 1)) * 100
    )
  );

  return (
    <div className="w-full apple-card p-6 sm:p-7 shadow-sm mb-6 border border-apple">
      {/* Top Identity Row */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-apple-border-subtle">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-apple-primary tracking-tight font-display">
              {stock.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-apple-blue-subtle text-apple-blue font-mono font-bold text-xs border border-apple-blue/20">
              {stock.symbol}
            </span>
            {stock.bse_code && (
              <span className="px-2 py-0.5 rounded-full bg-apple-subtle text-apple-muted font-mono text-[11px] border border-apple-border-subtle">
                BSE: {stock.bse_code}
              </span>
            )}
            {stock.debt_to_equity < 0.1 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-apple-green-subtle text-apple-green text-xs font-semibold border border-apple-green/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Virtually Debt Free
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-apple-muted flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-apple-muted" />
              {stock.sector} • {stock.industry}
            </span>
            {stock.website && (
              <a
                href={stock.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-apple-blue hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                Official Website
              </a>
            )}
          </div>

          <p className="text-xs text-apple-secondary mt-3 max-w-3xl leading-relaxed">
            {stock.about}
          </p>
        </div>

        {/* Live Price Display & 52W Gauge */}
        <div className="flex flex-col items-start lg:items-end shrink-0 bg-apple-subtle p-4 rounded-2xl border border-apple-border shadow-xs">
          <div className="text-3xl font-bold font-mono text-apple-primary">
            ₹{stock.current_price.toLocaleString('en-IN')}
          </div>
          <div
            className={`flex items-center gap-1 font-mono text-sm font-semibold mt-1 ${
              isUp ? 'text-apple-green' : 'text-apple-red'
            }`}
          >
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{isUp ? '+' : ''}{stock.change.toFixed(2)}</span>
            <span>({isUp ? '+' : ''}{stock.change_pct.toFixed(2)}%)</span>
          </div>

          {/* 52W Range Indicator */}
          <div className="w-48 sm:w-56 mt-3">
            <div className="flex justify-between text-[10px] font-mono text-apple-muted mb-1">
              <span>L: ₹{stock.low_52w}</span>
              <span>52W Range</span>
              <span>H: ₹{stock.high_52w}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-apple-border overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-apple-blue to-apple-green rounded-full"
                style={{ width: `${rangePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ratios Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
        {ratioCards.map((card) => (
          <div
            key={card.label}
            className={`p-3.5 rounded-xl border transition-all ${
              card.isHighlight
                ? 'bg-apple-green-subtle border-apple-green/25'
                : 'bg-apple-subtle border-apple-border'
            }`}
          >
            <div className="text-[11px] font-medium text-apple-muted truncate">
              {card.label}
            </div>
            <div
              className={`text-sm sm:text-base font-bold font-mono mt-1 ${
                card.isHighlight
                  ? 'text-apple-green'
                  : card.isPrimary
                  ? 'text-apple-blue'
                  : 'text-apple-primary'
              }`}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
