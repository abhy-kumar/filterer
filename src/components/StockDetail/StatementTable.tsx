import React, { useCallback, useRef, useState } from 'react';
import { NOT_REPORTED } from '../../lib/format';

export interface StatementRow<T> {
  label: string;
  /** Rendered value for one period. Return null to show the not-reported dash. */
  value: (period: T) => React.ReactNode | null;
  emphasis?: 'total' | 'subtotal';
  /** Shown under the label as a quiet note. */
  hint?: string;
}

interface StatementTableProps<T> {
  title: string;
  subtitle?: string;
  periods: T[];
  columnLabel: (period: T) => string;
  rows: StatementRow<T>[];
  labelHeader?: string;
  /** Rendered below the table, for footnotes about how figures are sourced. */
  footnote?: React.ReactNode;
  aside?: React.ReactNode;
  /** Highlight the final column, which is usually the latest period. */
  highlightLast?: boolean;
}

/**
 * The shared shape of every financial statement on the detail page.
 *
 * Periods run left to right with the most recent last, the label column is
 * frozen, and an absent figure always renders as the same dash rather than as
 * a zero or a crash.
 */
export function StatementTable<T>({
  title,
  subtitle,
  periods,
  columnLabel,
  rows,
  labelHeader = '',
  footnote,
  aside,
  highlightLast = true,
}: StatementTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const onScroll = useCallback(() => {
    setIsScrolled((scrollRef.current?.scrollLeft ?? 0) > 2);
  }, []);

  if (!periods.length) return null;

  return (
    <div className="apple-card overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-apple-border flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-apple-primary font-display">{title}</h2>
          {subtitle && <p className="text-xs text-apple-muted mt-0.5">{subtitle}</p>}
        </div>
        {aside}
      </div>

      <div ref={scrollRef} onScroll={onScroll} className={`overflow-x-auto ${isScrolled ? 'is-scrolled' : ''}`}>
        <table className="apple-table">
          <thead>
            <tr>
              <th className="apple-sticky-col text-left min-w-[170px]">{labelHeader}</th>
              {periods.map((period, i) => (
                <th
                  key={columnLabel(period)}
                  className={`text-right ${
                    highlightLast && i === periods.length - 1 ? 'text-apple-primary' : ''
                  }`}
                >
                  {columnLabel(period)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td
                  className={`apple-sticky-col ${
                    row.emphasis === 'total'
                      ? 'font-semibold text-apple-primary'
                      : row.emphasis === 'subtotal'
                        ? 'font-medium text-apple-primary'
                        : 'text-apple-secondary'
                  }`}
                >
                  {row.label}
                  {row.hint && <span className="block text-[10px] text-apple-faint font-normal">{row.hint}</span>}
                </td>
                {periods.map((period, i) => {
                  const value = row.value(period);
                  const isLast = i === periods.length - 1;
                  return (
                    <td
                      key={columnLabel(period)}
                      className={`text-right font-mono whitespace-nowrap ${
                        row.emphasis === 'total' ? 'font-semibold' : ''
                      } ${highlightLast && isLast ? 'text-apple-primary' : 'text-apple-secondary'}`}
                    >
                      {value ?? <span className="num-nil">{NOT_REPORTED}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {footnote && (
        <div className="px-4 sm:px-5 py-2.5 border-t border-apple-border-subtle text-[11px] text-apple-muted leading-relaxed">
          {footnote}
        </div>
      )}
    </div>
  );
}
