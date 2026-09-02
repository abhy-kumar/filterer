import React from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { Stock } from '../../types/stock';
import { generateProsAndCons } from '../../engine/prosAndConsGenerator';

interface StockProsConsProps {
  stock: Stock;
}

export const StockProsCons: React.FC<StockProsConsProps> = ({ stock }) => {
  const { pros, cons } = generateProsAndCons(stock);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Pros Box */}
      <div className="apple-glass rounded-3xl border border-[#30d158]/20 p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#30d158]/10">
          <div className="w-8 h-8 rounded-xl bg-[#30d158]/15 text-[#30d158] flex items-center justify-center">
            <ThumbsUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[#30d158] uppercase tracking-wider">
            Key Strengths & Merits
          </h3>
        </div>

        <ul className="space-y-2.5">
          {pros.map((pro, index) => (
            <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-[#30d158] shrink-0 mt-0.5" />
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cons Box */}
      <div className="apple-glass rounded-3xl border border-[#ff453a]/20 p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#ff453a]/10">
          <div className="w-8 h-8 rounded-xl bg-[#ff453a]/15 text-[#ff453a] flex items-center justify-center">
            <ThumbsDown className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[#ff453a] uppercase tracking-wider">
            Key Risks & Limitations
          </h3>
        </div>

        <ul className="space-y-2.5">
          {cons.map((con, index) => (
            <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-[#ff453a] shrink-0 mt-0.5" />
              <span>{con}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
