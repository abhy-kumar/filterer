import React, { useMemo } from 'react';
import { Plus, Minus } from 'lucide-react';
import type { Stock } from '../../types/stock';
import { generateProsAndCons } from '../../engine/prosAndConsGenerator';

export const StockProsCons: React.FC<{ stock: Stock }> = ({ stock }) => {
  const { pros, cons } = useMemo(() => generateProsAndCons(stock), [stock]);

  if (!pros.length && !cons.length) return null;

  const column = (
    heading: string,
    items: string[],
    tone: 'good' | 'bad',
    empty: string
  ) => (
    <div className="apple-card p-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3.5" style={{ color: tone === 'good' ? 'var(--apple-green)' : 'var(--apple-red)' }}>
        {heading}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-apple-muted leading-relaxed">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-xs text-apple-secondary leading-relaxed">
              {tone === 'good' ? (
                <Plus className="w-3 h-3 shrink-0 mt-1 num-pos" strokeWidth={3} />
              ) : (
                <Minus className="w-3 h-3 shrink-0 mt-1 num-neg" strokeWidth={3} />
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {column(
        'Strengths',
        pros,
        'good',
        'No major fundamental strengths triggered for this stock.'
      )}
      {column(
        'Limitations',
        cons,
        'bad',
        'No major operational or financial risk factors triggered for this stock.'
      )}
    </div>
  );
};
