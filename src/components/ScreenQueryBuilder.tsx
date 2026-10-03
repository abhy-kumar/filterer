import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, AlertTriangle } from 'lucide-react';
import { modKey } from '../lib/platform';
import { METRICS_DICTIONARY, getMetric } from '../engine/metricsDictionary';
import { formatScreenerQuery, validateQuery } from '../engine/screenerParser';
import { fieldCoverage } from '../engine/dataQuality';
import type { Stock } from '../types/stock';

interface ScreenQueryBuilderProps {
  query: string;
  onChangeQuery: (next: string) => void;
  onRunQuery: () => void;
  onSaveScreen: () => void;
  universe: Stock[];
  executionTimeMs?: number;
  totalMatches?: number;
  /** Set when the committed query failed to parse. */
  runError?: string;
  isDirty?: boolean;
}

const QUICK_PICKS = [
  { label: 'ROCE > 20', snippet: 'Return on capital employed > 20' },
  { label: 'ROE > 18', snippet: 'Return on equity > 18' },
  { label: 'D/E < 0.2', snippet: 'Debt to equity < 0.2' },
  { label: 'Mkt cap > 1000', snippet: 'Market Capitalization > 1000' },
  { label: 'P/E < 25', snippet: 'Price to Earning < 25' },
  { label: 'Sales 3Y > 15', snippet: 'Sales growth 3Years > 15' },
  { label: 'F-score >= 7', snippet: 'Piotroski score >= 7' },
  { label: 'Div yield > 2', snippet: 'Dividend yield > 2' },
];

const OPERATORS = ['AND', 'OR', 'NOT', '>', '<', '>=', '<=', '==', '(', ')'];

const CATEGORIES = ['All', 'Valuation', 'Profitability', 'Growth', 'Financial Health', 'Cash Flow', 'Technicals', 'Shareholding', 'General'];

export const ScreenQueryBuilder: React.FC<ScreenQueryBuilderProps> = ({
  query,
  onChangeQuery,
  onRunQuery,
  onSaveScreen,
  universe,
  executionTimeMs,
  totalMatches,
  runError,
  isDirty,
}) => {
  const [showCatalog, setShowCatalog] = useState(false);
  const [category, setCategory] = useState('All');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const validation = useMemo(() => validateQuery(query), [query]);

  // Warn before running, not after: a metric no company reports can only ever
  // return nothing, and silently showing zero rows reads like a bug.
  const emptyMetrics = useMemo(() => {
    if (!validation.ok) return [];
    return validation.metrics
      .map((key) => ({ key, coverage: fieldCoverage(universe, key), metric: getMetric(key) }))
      .filter((m) => m.coverage.reported === 0);
  }, [validation, universe]);

  const thinMetrics = useMemo(() => {
    if (!validation.ok) return [];
    return validation.metrics
      .map((key) => ({ key, coverage: fieldCoverage(universe, key), metric: getMetric(key) }))
      .filter((m) => m.coverage.reported > 0 && m.coverage.reported < universe.length * 0.6);
  }, [validation, universe]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    if (!showCatalog) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [showCatalog]);

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChangeQuery(query ? `${query} ${text}` : text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = query.slice(0, start);
    const after = query.slice(end);
    const needsSpace = before.length > 0 && !/\s$/.test(before);
    const next = `${before}${needsSpace ? ' ' : ''}${text}${after.startsWith(' ') ? '' : ' '}${after}`;
    onChangeQuery(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = before.length + (needsSpace ? 1 : 0) + text.length + 1;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter runs, which is what anyone typing in a query box expects.
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onRunQuery();
    }
  };

  const catalog = useMemo(() => {
    const needle = catalogSearch.trim().toLowerCase();
    return METRICS_DICTIONARY.filter((m) => {
      const inCategory = category === 'All' || m.category === category;
      if (!inCategory) return false;
      if (!needle) return true;
      return (
        m.name.toLowerCase().includes(needle) ||
        m.description.toLowerCase().includes(needle) ||
        m.aliases.some((a) => a.includes(needle))
      );
    });
  }, [category, catalogSearch]);

  const errorMessage = validation.ok ? runError : validation.error;

  return (
    <div className="apple-card overflow-hidden">
      <div className="px-3 sm:px-5 py-2 border-b border-apple-border-subtle flex items-center gap-1 overflow-x-auto no-scrollbar text-caption1">
        <button onClick={() => setShowCatalog(true)} className="apple-btn apple-btn-quiet apple-btn-sm">
          All {METRICS_DICTIONARY.length} ratios
        </button>
        <button
          onClick={() => onChangeQuery(formatScreenerQuery(query))}
          disabled={!query.trim() || !validation.ok}
          className="apple-btn apple-btn-quiet apple-btn-sm"
          title="Spell out ratio names in full and put each condition on its own line"
        >
          Tidy
        </button>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(query);
            setCopied(true);
          }}
          disabled={!query.trim()}
          className="apple-btn apple-btn-quiet apple-btn-sm"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          onClick={() => onChangeQuery('')}
          disabled={!query.trim()}
          className="apple-btn apple-btn-quiet apple-btn-sm ml-auto"
        >
          Clear
        </button>
      </div>

      <div className="p-3.5 sm:p-5">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder="Market Capitalization > 500 AND Return on capital employed > 20 AND Debt to equity < 0.1"
          rows={3}
          className={`apple-input w-full font-mono text-subheadline p-3 sm:p-3.5 resize-y leading-relaxed ${
            errorMessage ? 'border-apple-red' : ''
          }`}
          style={errorMessage ? { borderColor: 'var(--apple-red)' } : undefined}
        />

        {/* Status line */}
        <div className="mt-2.5 flex items-start justify-between gap-3 flex-wrap text-caption1">
          <div className="min-w-0 flex-1">
            {errorMessage ? (
              <p className="flex items-start gap-1.5 num-neg">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                <span>{errorMessage}</span>
              </p>
            ) : emptyMetrics.length ? (
              <p className="flex items-start gap-1.5 text-apple-amber">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                <span>
                  {emptyMetrics.map((m) => m.metric?.name ?? m.key).join(' and ')}{' '}
                  {emptyMetrics.length === 1 ? 'is' : 'are'} not reported for any of the {universe.length} companies,
                  so this query cannot match anything.
                </span>
              </p>
            ) : thinMetrics.length ? (
              <p className="text-apple-muted">
                {thinMetrics
                  .map((m) => `${m.metric?.name ?? m.key} is only reported for ${m.coverage.reported} of ${m.coverage.total}`)
                  .join('; ')}
                . Companies without it are left out.
              </p>
            ) : query.trim() ? (
              <p className="text-apple-muted">
                Reads {validation.metrics.length} {validation.metrics.length === 1 ? 'ratio' : 'ratios'}.
              </p>
            ) : (
              <p className="text-apple-muted">An empty query lists every company.</p>
            )}
          </div>

          {executionTimeMs !== undefined && !errorMessage && (
            <p className="text-apple-faint num shrink-0">
              {totalMatches} {totalMatches === 1 ? 'match' : 'matches'} in {executionTimeMs} ms
            </p>
          )}
        </div>

        {/* Insert chips - horizontally scrollable on mobile */}
        <div className="mt-4 pt-3.5 border-t border-apple-border-subtle space-y-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {OPERATORS.map((op) => (
              <button
                key={op}
                onClick={() => insertText(op)}
                className="px-2 py-0.5 text-caption1 font-mono rounded-sm text-apple-secondary hover:text-apple-primary hover:bg-apple-surface-hover border border-apple-border-subtle transition-colors shrink-0"
              >
                {op}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {QUICK_PICKS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => insertText(chip.snippet)}
                className="apple-tag hover:text-apple-primary hover:border-apple-border transition-colors shrink-0 text-caption1 py-0.5 px-2"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-apple-border-subtle flex items-center justify-between gap-3">
          <p className="text-caption1 text-apple-faint hidden sm:block">
            <kbd className="font-mono">{modKey} Enter</kbd> runs it
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button onClick={onSaveScreen} disabled={!query.trim()} className="apple-btn apple-btn-secondary flex-1 sm:flex-initial">
              Save
            </button>
            <button onClick={onRunQuery} disabled={!validation.ok} className="apple-btn apple-btn-primary flex-1 sm:flex-initial px-6">
              {isDirty ? 'Run' : 'Run again'}
            </button>
          </div>
        </div>
      </div>


      {showCatalog &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-0 sm:p-4 pt-0 sm:pt-[8vh]"
            onClick={() => setShowCatalog(false)}
          >
            <div
              className="apple-card w-full max-w-2xl flex flex-col h-full sm:h-auto sm:max-h-[80vh] shadow-lg rounded-none sm:rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-apple-border pt-safe sm:pt-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-subheadline font-semibold text-apple-primary font-display">Ratios</h3>
                    <p className="text-caption1 text-apple-muted mt-0.5">
                      Click one to add it at the cursor. A count means not every company reports it.
                    </p>
                  </div>
                  <button onClick={() => setShowCatalog(false)} className="apple-btn apple-btn-quiet">
                    Close
                  </button>
                </div>

                <input
                  autoFocus
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search ratios"
                  className="apple-input w-full text-caption1 px-3 h-9 sm:h-8 mb-2.5"
                />


                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-caption1 whitespace-nowrap transition-colors ${
                        category === cat
                          ? 'bg-apple-surface-active text-apple-primary font-medium'
                          : 'text-apple-muted hover:text-apple-primary hover:bg-apple-surface-hover'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto p-2 flex-1">
                {catalog.length === 0 && (
                  <p className="text-caption1 text-apple-muted text-center py-10">No ratio by that name.</p>
                )}
                {catalog.map((item) => {
                  const coverage = fieldCoverage(universe, item.id);
                  const full = coverage.reported === coverage.total;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        insertText(item.name);
                        setShowCatalog(false);
                      }}
                      className="w-full text-left p-3 rounded-md hover:bg-apple-surface-hover transition-colors group"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-caption1 font-semibold text-apple-primary group-hover:text-apple-blue">
                          {item.name}
                        </span>
                        <span
                          className={`text-caption2 font-mono shrink-0 ${
                            coverage.reported === 0 ? 'num-neg' : full ? 'text-apple-faint' : 'text-apple-amber'
                          }`}
                        >
                          {full ? item.unit : `${coverage.reported} of ${coverage.total}`}
                        </span>
                      </div>
                      <p className="text-caption1 text-apple-muted mt-1 leading-relaxed">{item.description}</p>
                      <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                        {item.aliases.slice(0, 5).map((alias) => (
                          <code key={alias} className="text-caption2 font-mono text-apple-faint">
                            {alias}
                          </code>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
