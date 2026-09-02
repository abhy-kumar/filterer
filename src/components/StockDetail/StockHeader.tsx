import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Building2,
  Bookmark,
  Share2,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Stock } from '../../types/stock';

interface StockHeaderProps {
  stock: Stock;
}

export const StockHeader: React.FC<StockHeaderProps> = ({ stock }) => {
  const isUp = stock.change >= 0;

  // Key screener ratio cards
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

  // 52-Week Range position percentage
  const rangePct = Math.min(
    100,
    Math.max(
      0,
      ((stock.current_price - stock.low_52w) / (stock.high_52w - stock.low_52w || 1)) * 100
    )
  );

  return (
    <div className="w-full bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 p-6 shadow-xl mb-6">
      {/* Top Identity Row */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-white/5 dark:border-white/5 light:border-slate-100">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
              {stock.name}
            </h1>
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 font-mono font-bold text-sm border border-sky-500/20">
              {stock.symbol}
            </span>
            {stock.bse_code && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-xs">
                BSE: {stock.bse_code}
              </span>
            )}
            {stock.debt_to_equity < 0.1 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
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
                className="flex items-center gap-1 text-sky-400 hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                Website
              </a>
            )}
          </div>

          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 mt-3 max-w-3xl leading-relaxed">
            {stock.about}
          </p>
        </div>

        {/* Live Price Box & 52W Gauge */}
        <div className="flex flex-col items-start lg:items-end shrink-0 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 p-4 rounded-xl border border-white/5">
          <div className="text-3xl font-extrabold font-mono text-white dark:text-white light:text-slate-900">
            ₹{stock.current_price.toLocaleString('en-IN')}
          </div>
          <div
            className={`flex items-center gap-1 font-mono text-sm font-semibold mt-1 ${
              isUp ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{isUp ? '+' : ''}{stock.change.toFixed(2)}</span>
            <span>({isUp ? '+' : ''}{stock.change_pct.toFixed(2)}%)</span>
          </div>

          {/* 52W Range Bar */}
          <div className="w-48 sm:w-56 mt-3">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>L: ₹{stock.low_52w}</span>
              <span>52W Range</span>
              <span>H: ₹{stock.high_52w}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
                style={{ width: `${rangePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ratios Grid (Classic Screener 12 Cards Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
        {ratioCards.map((card) => (
          <div
            key={card.label}
            className={`p-3 rounded-xl border transition-all ${
              card.isHighlight
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-50 border-white/5 dark:border-white/5 light:border-slate-200'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-400 truncate">
              {card.label}
            </div>
            <div
              className={`text-sm sm:text-base font-bold font-mono mt-1 ${
                card.isHighlight
                  ? 'text-emerald-400'
                  : card.isPrimary
                  ? 'text-sky-400'
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
