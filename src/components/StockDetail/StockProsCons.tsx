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
      <div className="bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-emerald-500/20 dark:border-emerald-500/20 light:border-emerald-200 p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-emerald-500/10">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ThumbsUp className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-emerald-400">
            PROS
          </h3>
        </div>

        <ul className="space-y-2.5">
          {pros.map((pro, index) => (
            <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cons Box */}
      <div className="bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-rose-500/20 dark:border-rose-500/20 light:border-rose-200 p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-rose-500/10">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ThumbsDown className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-rose-400">
            CONS
          </h3>
        </div>

        <ul className="space-y-2.5">
          {cons.map((con, index) => (
            <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{con}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
