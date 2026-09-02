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
      <div className="apple-card p-6 shadow-sm border border-apple-green/20 relative overflow-hidden">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-apple-green/10">
          <div className="w-8 h-8 rounded-xl bg-apple-green-subtle text-apple-green flex items-center justify-center">
            <ThumbsUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-apple-green uppercase tracking-wider font-display">
            Key Strengths & Merits
          </h3>
        </div>

        <ul className="space-y-2.5">
          {pros.map((pro, index) => (
            <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-apple-secondary leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-apple-green shrink-0 mt-0.5" />
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cons Box */}
      <div className="apple-card p-6 shadow-sm border border-apple-red/20 relative overflow-hidden">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-apple-red/10">
          <div className="w-8 h-8 rounded-xl bg-apple-red-subtle text-apple-red flex items-center justify-center">
            <ThumbsDown className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-apple-red uppercase tracking-wider font-display">
            Key Risks & Limitations
          </h3>
        </div>

        <ul className="space-y-2.5">
          {cons.map((con, index) => (
            <li key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-apple-secondary leading-relaxed">
              <AlertCircle className="w-4 h-4 text-apple-red shrink-0 mt-0.5" />
              <span>{con}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
