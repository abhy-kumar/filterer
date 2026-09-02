import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  Bookmark,
  Check,
  AlertCircle,
  Code,
  Info,
  HelpCircle,
  Copy,
  ChevronDown
} from 'lucide-react';
import { METRICS_DICTIONARY, resolveMetricKey } from '../engine/metricsDictionary';
import { formatScreenerQuery, tokenize, ScreenerParser } from '../engine/screenerParser';

interface ScreenQueryBuilderProps {
  query: string;
  onChangeQuery: (newQuery: string) => void;
  onRunQuery: () => void;
  onSaveScreen: () => void;
  executionTimeMs?: number;
  totalMatches?: number;
  isLoading?: boolean;
}

export const ScreenQueryBuilder: React.FC<ScreenQueryBuilderProps> = ({
  query,
  onChangeQuery,
  onRunQuery,
  onSaveScreen,
  executionTimeMs,
  totalMatches,
  isLoading = false,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showHelperModal, setShowHelperModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Validate query syntax in real-time
  useEffect(() => {
    if (!query.trim()) {
      setValidationError(null);
      return;
    }
    try {
      const tokens = tokenize(query);
      const parser = new ScreenerParser(tokens);
      parser.parse();
      setValidationError(null);
    } catch (err: any) {
      setValidationError(err.message || 'Syntax error in query');
    }
  }, [query]);

  // Quick insertion helper
  const insertText = (text: string) => {
    if (!textareaRef.current) {
      onChangeQuery(query ? `${query} ${text}` : text);
      return;
    }
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = query;
    const before = current.substring(0, start);
    const after = current.substring(end);
    const next = `${before}${before.endsWith(' ') || !before ? '' : ' '}${text} ${after}`;
    onChangeQuery(next);
    setTimeout(() => {
      textarea.focus();
      const nextPos = start + text.length + (before.endsWith(' ') || !before ? 1 : 2);
      textarea.setSelectionRange(nextPos, nextPos);
    }, 10);
  };

  const handleFormat = () => {
    const formatted = formatScreenerQuery(query);
    onChangeQuery(formatted);
  };

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(query);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const popularMetrics = [
    { label: 'Market Cap > 500', snippet: 'Market Capitalization > 500' },
    { label: 'ROCE > 20%', snippet: 'Return on capital employed > 20' },
    { label: 'ROE > 18%', snippet: 'Return on equity > 18' },
    { label: 'P/E < 25', snippet: 'Price to Earning < 25' },
    { label: 'Debt to Equity < 0.1', snippet: 'Debt to equity < 0.1' },
    { label: 'Sales Growth 3Y > 15%', snippet: 'Sales growth 3Years > 15' },
    { label: 'Profit Growth 5Y > 15%', snippet: 'Profit growth 5Years > 15' },
    { label: '50 DMA > 200 DMA', snippet: 'DMA 50 > DMA 200' },
    { label: 'Piotroski >= 7', snippet: 'Piotroski score >= 7' },
    { label: 'FCF Yield > 4%', snippet: 'Free cash flow yield > 4' },
    { label: 'Div Yield > 2%', snippet: 'Dividend yield > 2' },
  ];

  const operators = ['AND', 'OR', 'NOT', '>', '<', '>=', '<=', '==', '(', ')', '*', '/'];

  const categories = ['All', 'Valuation', 'Profitability', 'Growth', 'Financial Health', 'Cash Flow', 'Technicals', 'Shareholding'];

  const filteredDictionary = selectedCategory === 'All'
    ? METRICS_DICTIONARY
    : METRICS_DICTIONARY.filter(m => m.category === selectedCategory);

  return (
    <div className="w-full bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 shadow-xl overflow-hidden mb-8">
      {/* Query Builder Header */}
      <div className="p-4 sm:p-5 border-b border-white/5 dark:border-white/5 light:border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-50/70">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-sky-400" />
              Screener Query Editor
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 dark:bg-slate-800 light:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 font-mono">
              Screener.in Syntax
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Write custom financial formulas and boolean conditions just like on Screener.in.
          </p>
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowHelperModal(!showHelperModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-200 hover:bg-slate-700 text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 transition-all border border-white/5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Ratio Catalog ({METRICS_DICTIONARY.length})</span>
          </button>
          <button
            onClick={handleFormat}
            disabled={!query.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-200 hover:bg-slate-700 disabled:opacity-50 text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 transition-all border border-white/5"
            title="Format query with indentation"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Format</span>
          </button>
          <button
            onClick={handleCopyQuery}
            disabled={!query.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-200 hover:bg-slate-700 disabled:opacity-50 text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 transition-all border border-white/5"
            title="Copy query to clipboard"
          >
            {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedNotification ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={() => onChangeQuery('')}
            disabled={!query.trim()}
            className="p-1.5 rounded-lg bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-200 hover:bg-slate-700 disabled:opacity-50 text-xs text-slate-400 hover:text-white transition-all border border-white/5"
            title="Clear query"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="p-4 sm:p-5 relative">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          placeholder="Example: Market Capitalization > 500 AND Return on capital employed > 20 AND Debt to equity < 0.1 AND Sales growth 3Years > 15"
          rows={4}
          className="w-full bg-[#070a0f] dark:bg-[#070a0f] light:bg-slate-50 text-white dark:text-white light:text-slate-900 font-mono text-sm sm:text-base p-4 rounded-xl border border-white/10 dark:border-white/10 light:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all resize-y leading-relaxed shadow-inner"
        />

        {/* Real-time Syntax Validation Bar */}
        <div className="mt-2.5 flex items-center justify-between text-xs flex-wrap gap-2">
          {validationError ? (
            <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          ) : query.trim() ? (
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Query Syntax is Valid</span>
            </div>
          ) : (
            <span className="text-slate-500 text-xs">Enter conditions separated by AND, OR, or brackets ( ).</span>
          )}

          {executionTimeMs !== undefined && (
            <div className="text-slate-400 font-mono text-[11px] flex items-center gap-3">
              <span>Matches: <strong className="text-white dark:text-white light:text-slate-900">{totalMatches}</strong> stocks</span>
              <span>•</span>
              <span>Executed in <strong className="text-sky-400">{executionTimeMs} ms</strong></span>
            </div>
          )}
        </div>

        {/* Quick Operators & Metrics Pill Bar */}
        <div className="mt-4 pt-3 border-t border-white/5 dark:border-white/5 light:border-slate-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Quick Insert Chips</span>
          </div>

          {/* Operator Chips */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <span className="text-[10px] text-slate-500 font-mono mr-1">Operators:</span>
            {operators.map((op) => (
              <button
                key={op}
                onClick={() => insertText(op)}
                className="px-2 py-1 text-xs font-mono font-semibold rounded bg-slate-800 dark:bg-slate-800 light:bg-slate-100 hover:bg-sky-600 hover:text-white text-sky-400 dark:text-sky-400 light:text-sky-600 border border-white/5 transition-all shadow-xs"
              >
                {op}
              </button>
            ))}
          </div>

          {/* Common Screener Conditions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 font-mono mr-1">Ratios:</span>
            {popularMetrics.map((item) => (
              <button
                key={item.label}
                onClick={() => insertText(item.snippet)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-100 hover:bg-slate-700 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white border border-white/5 hover:border-white/20 transition-all"
              >
                + {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ratio Catalog Drawer Modal */}
      {showHelperModal && (
        <div className="p-4 sm:p-5 bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-100 border-t border-white/10 dark:border-white/10 light:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              Available Screener Ratios & Aliases ({filteredDictionary.length})
            </h3>
            <div className="flex items-center gap-1 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {filteredDictionary.map((metric) => (
              <div
                key={metric.id}
                onClick={() => insertText(metric.name)}
                className="p-2.5 rounded-xl bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-white/5 dark:border-white/5 light:border-slate-200 hover:border-sky-500/50 hover:bg-slate-800/80 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-900 group-hover:text-sky-400">
                    {metric.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-300">
                    {metric.unit}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {metric.description}
                </p>
                <div className="mt-1 text-[10px] text-slate-500 font-mono truncate">
                  Aliases: {metric.aliases.slice(0, 3).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query Bottom Action Bar */}
      <div className="p-4 sm:p-5 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border-t border-white/5 dark:border-white/5 light:border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Run Query</kbd> to filter real-time</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onSaveScreen}
            disabled={!query.trim() || !!validationError}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-800 light:bg-white hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 border border-white/10 transition-all shadow-sm"
          >
            <Bookmark className="w-3.5 h-3.5 text-sky-400" />
            <span>Save Custom Screen</span>
          </button>

          <button
            onClick={onRunQuery}
            disabled={isLoading || !!validationError}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-sky-500/25 transition-all active:scale-98"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isLoading ? 'Running...' : 'RUN THIS QUERY'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
