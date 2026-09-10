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

  const scrollToLatest = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' });
    }
  };

  const scrollToOldest = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  if (!periods.length) return null;

  return (
    <div className="apple-card overflow-hidden">
      <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-apple-border flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-caption1 sm:text-subheadline font-semibold text-apple-primary font-display">{title}</h2>
          {subtitle && <p className="text-caption2 sm:text-caption1 text-apple-muted mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Quick period jump on mobile */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              type="button"
              onClick={scrollToOldest}
              className="apple-btn apple-btn-secondary px-2 py-0.5 text-caption2"
              title="Jump to oldest years"
            >
              Oldest
            </button>
            <button
              type="button"
              onClick={scrollToLatest}
              className="apple-btn apple-btn-secondary px-2 py-0.5 text-caption2 text-apple-blue font-semibold"
              title="Jump to latest numbers"
            >
              Latest →
            </button>
          </div>
          {aside}
        </div>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className={`overflow-x-auto ${isScrolled ? 'is-scrolled' : ''}`}>
        <table className="apple-table">
          <thead>
            <tr>
              <th className="apple-sticky-col text-left min-w-[125px] sm:min-w-[170px] px-2.5 sm:px-3 py-2 sm:py-2.5 text-caption2 sm:text-caption2">
                {labelHeader}
              </th>
              {periods.map((period, i) => (
                <th
                  key={columnLabel(period)}
                  className={`text-right px-2.5 sm:px-3 py-2 sm:py-2.5 text-caption2 sm:text-caption2 ${
                    highlightLast && i === periods.length - 1 ? 'text-apple-primary font-bold' : ''
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
                  className={`apple-sticky-col px-2.5 sm:px-3 py-2 sm:py-2.5 text-caption1 ${
                    row.emphasis === 'total'
                      ? 'font-semibold text-apple-primary'
                      : row.emphasis === 'subtotal'
                        ? 'font-medium text-apple-primary'
                        : 'text-apple-secondary'
                  }`}
                >
                  <span className="truncate block max-w-[115px] sm:max-w-none" title={row.label}>
                    {row.label}
                  </span>
                  {row.hint && <span className="block text-caption2 text-apple-faint font-normal">{row.hint}</span>}
                </td>
                {periods.map((period, i) => {
                  const value = row.value(period);
                  const isLast = i === periods.length - 1;
                  return (
                    <td
                      key={columnLabel(period)}
                      className={`text-right num whitespace-nowrap px-2.5 sm:px-3 py-2 sm:py-2.5 text-caption2 sm:text-caption1 ${
                        row.emphasis === 'total' ? 'font-semibold' : ''
                      } ${highlightLast && isLast ? 'text-apple-primary font-semibold' : 'text-apple-secondary'}`}
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
        <div className="px-4 sm:px-5 py-2.5 border-t border-apple-border-subtle text-caption2 text-apple-muted leading-relaxed">
          {footnote}
        </div>
      )}
    </div>
  );
}
