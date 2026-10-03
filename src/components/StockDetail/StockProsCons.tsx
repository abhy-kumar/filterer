import React, { useMemo } from 'react';
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
      <h3 className={`text-subheadline font-semibold mb-3 ${tone === 'good' ? 'num-pos' : 'num-neg'}`}>
        {heading}
      </h3>
      {items.length === 0 ? (
        <p className="text-footnote text-apple-muted leading-relaxed">{empty}</p>
      ) : (
        <ul className="space-y-2 list-disc pl-4 marker:text-apple-faint">
          {items.map((item) => (
            <li key={item} className="text-footnote text-apple-secondary leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {column('Pros', pros, 'good', 'None of the checks came out in its favour.')}
      {column('Cons', cons, 'bad', 'None of the checks came out against it.')}
    </div>
  );
};
