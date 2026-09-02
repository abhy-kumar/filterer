import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Building2,
  ShieldCheck,
  Sparkles
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
    <div className="w-full apple-glass rounded-3xl border border-white/[0.08] p-6 sm:p-7 shadow-2xl mb-6">
      {/* Top Identity Row */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
              {stock.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#2997ff]/15 text-[#2997ff] font-mono font-bold text-xs border border-[#2997ff]/30">
              {stock.symbol}
            </span>
            {stock.bse_code && (
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 font-mono text-[11px]">
                BSE: {stock.bse_code}
              </span>
            )}
            {stock.debt_to_equity < 0.1 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#30d158]/15 text-[#30d158] text-xs font-semibold border border-[#30d158]/25">
                <ShieldCheck className="w-3.5 h-3.5" />
                Virtually Debt Free
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              {stock.sector} • {stock.industry}
            </span>
            {stock.website && (
              <a
                href={stock.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#2997ff] hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                Official Site
              </a>
            )}
          </div>

          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 mt-3 max-w-3xl leading-relaxed">
            {stock.about}
          </p>
        </div>

        {/* Live Price Display & 52W Gauge */}
        <div className="flex flex-col items-start lg:items-end shrink-0 bg-black/40 p-4 rounded-2xl border border-white/[0.06]">
          <div className="text-3xl font-bold font-mono text-white dark:text-white light:text-slate-900">
            ₹{stock.current_price.toLocaleString('en-IN')}
          </div>
          <div
            className={`flex items-center gap-1 font-mono text-sm font-semibold mt-1 ${
              isUp ? 'text-[#30d158]' : 'text-[#ff453a]'
            }`}
          >
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{isUp ? '+' : ''}{stock.change.toFixed(2)}</span>
            <span>({isUp ? '+' : ''}{stock.change_pct.toFixed(2)}%)</span>
          </div>

          {/* 52W Range Indicator */}
          <div className="w-48 sm:w-56 mt-3">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>L: ₹{stock.low_52w}</span>
              <span>52W Range</span>
              <span>H: ₹{stock.high_52w}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.1] overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#2997ff] to-[#30d158] rounded-full"
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
            className={`p-3.5 rounded-2xl border transition-all ${
              card.isHighlight
                ? 'bg-[#30d158]/[0.06] border-[#30d158]/25'
                : 'bg-white/[0.02] border-white/[0.06]'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-400 truncate">
              {card.label}
            </div>
            <div
              className={`text-sm sm:text-base font-bold font-mono mt-1 ${
                card.isHighlight
                  ? 'text-[#30d158]'
                  : card.isPrimary
                  ? 'text-[#2997ff]'
                  : 'text-white dark:text-white light:text-slate-900'
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
