import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  Bookmark,
  Check,
  AlertCircle,
  Code2,
  HelpCircle,
  Copy,
  Sliders
} from 'lucide-react';
import { METRICS_DICTIONARY } from '../engine/metricsDictionary';
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

  // Real-time query validation
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
    { label: 'Market Cap > 500 Cr', snippet: 'Market Capitalization > 500' },
    { label: 'ROCE > 20%', snippet: 'Return on capital employed > 20' },
    { label: 'ROE > 18%', snippet: 'Return on equity > 18' },
    { label: 'P/E < 25', snippet: 'Price to Earning < 25' },
    { label: 'Debt to Equity < 0.1', snippet: 'Debt to equity < 0.1' },
    { label: 'Sales Growth 3Y > 15%', snippet: 'Sales growth 3Years > 15' },
    { label: 'Profit Growth 5Y > 15%', snippet: 'Profit growth 5Years > 15' },
    { label: '50 DMA > 200 DMA', snippet: 'DMA 50 > DMA 200' },
    { label: 'Piotroski Score >= 7', snippet: 'Piotroski score >= 7' },
    { label: 'FCF Yield > 4%', snippet: 'Free cash flow yield > 4' },
    { label: 'Dividend Yield > 2%', snippet: 'Dividend yield > 2' },
  ];

  const operators = ['AND', 'OR', 'NOT', '>', '<', '>=', '<=', '==', '(', ')', '*', '/'];
  const categories = ['All', 'Valuation', 'Profitability', 'Growth', 'Financial Health', 'Cash Flow', 'Technicals', 'Shareholding'];

  const filteredDictionary = selectedCategory === 'All'
    ? METRICS_DICTIONARY
    : METRICS_DICTIONARY.filter(m => m.category === selectedCategory);

  return (
    <div className="w-full apple-glass rounded-3xl border border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.06] overflow-hidden mb-8 shadow-2xl">
      {/* Top Bar */}
      <div className="p-4 sm:p-5 border-b border-white/[0.06] dark:border-white/[0.06] light:border-black/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#2997ff]" />
              Screener Query Workspace
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
              Screener.in Syntax
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Construct natural quantitative formulas with Boolean operators, financial ratios, and moving averages.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowHelperModal(!showHelperModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] dark:bg-white/[0.05] light:bg-black/[0.04] hover:bg-white/[0.1] text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 transition-all border border-white/[0.08]"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#2997ff]" />
            <span>Ratio Catalog ({METRICS_DICTIONARY.length})</span>
          </button>
          <button
            onClick={handleFormat}
            disabled={!query.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] dark:bg-white/[0.05] light:bg-black/[0.04] hover:bg-white/[0.1] disabled:opacity-40 text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 transition-all border border-white/[0.08]"
            title="Auto-format query indentation"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ff9f0a]" />
            <span>Format</span>
          </button>
          <button
            onClick={handleCopyQuery}
            disabled={!query.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] dark:bg-white/[0.05] light:bg-black/[0.04] hover:bg-white/[0.1] disabled:opacity-40 text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 transition-all border border-white/[0.08]"
          >
            {copiedNotification ? <Check className="w-3.5 h-3.5 text-[#30d158]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedNotification ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={() => onChangeQuery('')}
            disabled={!query.trim()}
            className="p-2 rounded-xl bg-white/[0.05] dark:bg-white/[0.05] light:bg-black/[0.04] hover:bg-white/[0.1] disabled:opacity-40 text-slate-400 hover:text-white transition-all border border-white/[0.08]"
            title="Clear"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Main Content */}
      <div className="p-4 sm:p-5">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          placeholder="e.g. Market Capitalization > 500 AND Return on capital employed > 20 AND Debt to equity < 0.1 AND Sales growth 3Years > 15"
          rows={4}
          className="w-full bg-[#05070a]/90 dark:bg-[#05070a]/90 light:bg-white text-slate-100 dark:text-slate-100 light:text-slate-900 font-mono text-sm sm:text-base p-4 rounded-2xl border border-white/[0.1] dark:border-white/[0.1] light:border-black/[0.1] focus:outline-hidden focus:ring-2 focus:ring-[#2997ff]/40 focus:border-[#2997ff] transition-all resize-y leading-relaxed shadow-inner"
        />

        {/* Validation & Live Feedback */}
        <div className="mt-3 flex items-center justify-between text-xs flex-wrap gap-2">
          {validationError ? (
            <div className="flex items-center gap-1.5 text-[#ff453a] bg-[#ff453a]/10 px-3 py-1 rounded-lg border border-[#ff453a]/20 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          ) : query.trim() ? (
            <div className="flex items-center gap-1.5 text-[#30d158] bg-[#30d158]/10 px-3 py-1 rounded-lg border border-[#30d158]/20 font-medium">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Syntax Valid</span>
            </div>
          ) : (
            <span className="text-slate-500 text-xs">Separate conditions using AND, OR, NOT, or brackets ( ).</span>
          )}

          {executionTimeMs !== undefined && (
            <div className="text-slate-400 font-mono text-[11px] flex items-center gap-3">
              <span>Matching: <strong className="text-white dark:text-white light:text-slate-900">{totalMatches}</strong> stocks</span>
              <span>•</span>
              <span>Evaluated in <strong className="text-[#2997ff]">{executionTimeMs} ms</strong></span>
            </div>
          )}
        </div>

        {/* Quick Insert Chips */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.06]">
          {/* Operators */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
            <span className="text-[10px] text-slate-500 font-mono mr-1">Operators:</span>
            {operators.map((op) => (
              <button
                key={op}
                onClick={() => insertText(op)}
                className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-white/[0.06] dark:bg-white/[0.06] light:bg-black/[0.05] hover:bg-[#0071e3] hover:text-white text-[#2997ff] dark:text-[#2997ff] light:text-[#0071e3] border border-white/[0.08] transition-all shadow-xs"
              >
                {op}
              </button>
            ))}
          </div>

          {/* Screener Formulas */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 font-mono mr-1">Ratios:</span>
            {popularMetrics.map((item) => (
              <button
                key={item.label}
                onClick={() => insertText(item.snippet)}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white/[0.04] dark:bg-white/[0.04] light:bg-black/[0.04] hover:bg-white/[0.08] text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white border border-white/[0.06] transition-all"
              >
                + {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ratio Catalog Dropdown */}
      {showHelperModal && (
        <div className="p-4 sm:p-5 bg-black/40 border-t border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#2997ff]" />
              Ratio Dictionary & Aliases ({filteredDictionary.length})
            </h3>
            <div className="flex items-center gap-1 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#2997ff] text-white font-semibold'
                      : 'bg-white/[0.05] text-slate-400 hover:text-white'
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
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#2997ff]/50 hover:bg-white/[0.06] cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-[#2997ff]">
                    {metric.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-[#2997ff]">
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

      {/* Bottom Action Row */}
      <div className="p-4 sm:p-5 bg-white/[0.02] border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Tip: Press <kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded text-slate-300 font-mono text-[11px]">Run Query</kbd> to evaluate immediately
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onSaveScreen}
            disabled={!query.trim() || !!validationError}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-40 text-xs font-semibold text-slate-200 border border-white/[0.08] transition-all"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#2997ff]" />
            <span>Save Custom Screen</span>
          </button>

          <button
            onClick={onRunQuery}
            disabled={isLoading || !!validationError}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-b from-[#2997ff] to-[#0071e3] hover:brightness-110 active:scale-[0.98] disabled:opacity-40 text-xs font-bold text-white shadow-lg shadow-[#0071e3]/30 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{isLoading ? 'Filtering...' : 'RUN THIS QUERY'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
