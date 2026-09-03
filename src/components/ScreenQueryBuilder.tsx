import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Eraser, WrapText, Bookmark, Check, AlertTriangle, BookOpen, Copy, Info } from 'lucide-react';
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
      <div className="px-4 sm:px-5 py-3 border-b border-apple-border flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-apple-primary font-display">Query</h2>
          <p className="text-xs text-apple-muted mt-0.5">
            Screener.in syntax. Combine conditions with AND, OR, NOT and brackets.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowCatalog(true)} className="apple-btn apple-btn-secondary h-8">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ratios</span>
            <span className="text-apple-faint font-mono">{METRICS_DICTIONARY.length}</span>
          </button>
          <button
            onClick={() => onChangeQuery(formatScreenerQuery(query))}
            disabled={!query.trim() || !validation.ok}
            className="apple-btn apple-btn-secondary h-8"
            title="Format query with canonical names and line breaks"
          >
            <WrapText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Format</span>
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(query);
              setCopied(true);
            }}
            disabled={!query.trim()}
            className="apple-btn apple-btn-secondary h-8"
          >
            {copied ? <Check className="w-3.5 h-3.5 num-pos" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={() => onChangeQuery('')}
            disabled={!query.trim()}
            className="apple-btn apple-btn-quiet px-2 h-8"
            aria-label="Clear query"
            title="Clear"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder="Market Capitalization > 500 AND Return on capital employed > 20 AND Debt to equity < 0.1"
          rows={3}
          className={`apple-input w-full font-mono text-sm p-3.5 resize-y leading-relaxed ${
            errorMessage ? 'border-apple-red' : ''
          }`}
          style={errorMessage ? { borderColor: 'var(--apple-red)' } : undefined}
        />

        {/* Status line */}
        <div className="mt-2.5 flex items-start justify-between gap-4 flex-wrap text-xs">
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
              <p className="flex items-start gap-1.5 text-apple-muted">
                <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
                <span>
                  {thinMetrics
                    .map((m) => `${m.metric?.name ?? m.key} covers ${m.coverage.reported}/${m.coverage.total}`)
                    .join(', ')}
                  . Companies with undisclosed values are excluded from results.
                </span>
              </p>
            ) : query.trim() ? (
              <p className="flex items-center gap-1.5 num-pos">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Active criteria: {validation.metrics.length} {validation.metrics.length === 1 ? 'metric' : 'metrics'}
                </span>
              </p>
            ) : (
              <p className="text-apple-muted">Enter screening criteria above, or run an empty query to view all companies.</p>
            )}
          </div>

          {executionTimeMs !== undefined && !errorMessage && (
            <p className="text-apple-faint font-mono tabular-nums shrink-0">
              {totalMatches} matched · {executionTimeMs} ms
            </p>
          )}
        </div>

        {/* Insert chips */}
        <div className="mt-4 pt-3.5 border-t border-apple-border-subtle space-y-2">
          <div className="flex items-center gap-1 flex-wrap">
            {OPERATORS.map((op) => (
              <button
                key={op}
                onClick={() => insertText(op)}
                className="px-2 py-1 text-[11px] font-mono rounded-md text-apple-blue hover:bg-apple-blue-subtle transition-colors"
              >
                {op}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {QUICK_PICKS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => insertText(chip.snippet)}
                className="apple-tag hover:text-apple-primary transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-apple-border-subtle flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-apple-faint">
            <kbd className="font-mono">⌘</kbd>
            <kbd className="font-mono">↵</kbd> to run · screening {universe.length} companies
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onSaveScreen} disabled={!query.trim()} className="apple-btn apple-btn-secondary">
              <Bookmark className="w-3.5 h-3.5" />
              Save
            </button>
            <button onClick={onRunQuery} disabled={!validation.ok} className="apple-btn apple-btn-primary px-5">
              <Play className="w-3.5 h-3.5 fill-current" />
              {isDirty ? 'Run' : 'Re-run'}
            </button>
          </div>
        </div>
      </div>

      {showCatalog && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-[8vh]"
          onClick={() => setShowCatalog(false)}
        >
          <div
            className="apple-card w-full max-w-2xl flex flex-col max-h-[80vh] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-apple-border">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-apple-primary font-display">Ratio catalog</h3>
                  <p className="text-xs text-apple-muted mt-0.5">
                    Click a ratio to insert it. Coverage is over the {universe.length} companies loaded.
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
                className="apple-input w-full text-xs px-3 h-8 mb-2.5"
              />

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                      category === cat
                        ? 'bg-apple-blue text-white font-semibold'
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
                <p className="text-xs text-apple-muted text-center py-10">No ratio matches that.</p>
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
                    className="w-full text-left p-3 rounded-xl hover:bg-apple-surface-hover transition-colors group"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-xs font-semibold text-apple-primary group-hover:text-apple-blue">
                        {item.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono shrink-0 ${
                          coverage.reported === 0 ? 'num-neg' : full ? 'text-apple-faint' : 'text-apple-amber'
                        }`}
                      >
                        {full ? item.unit : `${coverage.reported}/${coverage.total} reported`}
                      </span>
                    </div>
                    <p className="text-xs text-apple-muted mt-1 leading-relaxed">{item.description}</p>
                    <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                      {item.aliases.slice(0, 5).map((alias) => (
                        <code key={alias} className="text-[10px] font-mono text-apple-faint">
                          {alias}
                        </code>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
