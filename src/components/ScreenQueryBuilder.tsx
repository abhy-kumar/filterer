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
  Copy
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
      const nextCursor = start + text.length + 1;
      textarea.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  };

  const handleFormat = () => {
    if (!query.trim()) return;
    const formatted = formatScreenerQuery(query);
    onChangeQuery(formatted);
  };

  const handleCopyQuery = () => {
    if (!query.trim()) return;
    navigator.clipboard.writeText(query);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const quickPicks = [
    { label: 'ROCE > 20%', snippet: 'Return on capital employed > 20' },
    { label: 'ROE > 18%', snippet: 'Return on equity > 18' },
    { label: 'Debt to Equity < 0.2', snippet: 'Debt to equity < 0.2' },
    { label: 'Market Cap > 1000 Cr', snippet: 'Market Capitalization > 1000' },
    { label: 'Price to Earning < 25', snippet: 'Price to Earning < 25' },
    { label: 'Sales Growth 5Y > 15%', snippet: 'Sales growth 5Years > 15' },
    { label: 'Piotroski Score >= 7', snippet: 'Piotroski score >= 7' },
    { label: 'Dividend Yield > 2%', snippet: 'Dividend yield > 2' },
  ];

  const operators = ['AND', 'OR', 'NOT', '>', '<', '>=', '<=', '==', '(', ')', '*', '/'];
  const categories = ['All', 'Valuation', 'Profitability', 'Growth', 'Financial Health', 'Cash Flow', 'Technicals', 'Shareholding'];

  const filteredDictionary = selectedCategory === 'All'
    ? METRICS_DICTIONARY
    : METRICS_DICTIONARY.filter(m => m.category === selectedCategory);

  return (
    <div className="w-full apple-card overflow-hidden mb-8 shadow-sm border border-apple">
      {/* Top Bar */}
      <div className="p-4 sm:p-5 border-b border-apple-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-apple-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-apple-primary flex items-center gap-2 font-display">
              <Code2 className="w-4 h-4 text-apple-blue" />
              Screener Query Workspace
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-apple-card text-apple-secondary border border-apple-border">
              Screener.in Syntax
            </span>
          </div>
          <p className="text-xs text-apple-muted mt-1">
            Construct natural quantitative formulas with Boolean operators, financial ratios, and moving averages.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowHelperModal(!showHelperModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-apple-card hover:bg-apple-surface-active text-xs font-medium text-apple-secondary hover:text-apple-primary transition-all border border-apple-border shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-apple-blue" />
            <span>Ratio Catalog ({METRICS_DICTIONARY.length})</span>
          </button>
          <button
            onClick={handleFormat}
            disabled={!query.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-apple-card hover:bg-apple-surface-active disabled:opacity-40 text-xs font-medium text-apple-secondary hover:text-apple-primary transition-all border border-apple-border shadow-xs"
            title="Auto-format query indentation"
          >
            <Sparkles className="w-3.5 h-3.5 text-apple-amber" />
            <span>Format</span>
          </button>
          <button
            onClick={handleCopyQuery}
            disabled={!query.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-apple-card hover:bg-apple-surface-active disabled:opacity-40 text-xs font-medium text-apple-secondary hover:text-apple-primary transition-all border border-apple-border shadow-xs"
          >
            {copiedNotification ? <Check className="w-3.5 h-3.5 text-apple-green" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedNotification ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={() => onChangeQuery('')}
            disabled={!query.trim()}
            className="p-2 rounded-xl bg-apple-card hover:bg-apple-surface-active disabled:opacity-40 text-apple-muted hover:text-apple-primary transition-all border border-apple-border shadow-xs"
            title="Clear"
            aria-label="Clear Query"
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
          className="w-full bg-apple-card text-apple-primary font-mono text-sm sm:text-base p-4 rounded-2xl border border-apple-border focus:outline-hidden focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue transition-all resize-y leading-relaxed shadow-xs"
        />

        {/* Validation & Live Feedback */}
        <div className="mt-3 flex items-center justify-between text-xs flex-wrap gap-2">
          {validationError ? (
            <div className="flex items-center gap-1.5 text-apple-red bg-apple-red-subtle px-3 py-1 rounded-lg border border-apple-red/20 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          ) : query.trim() ? (
            <div className="flex items-center gap-1.5 text-apple-green bg-apple-green-subtle px-3 py-1 rounded-lg border border-apple-green/20 font-medium">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Syntax Valid</span>
            </div>
          ) : (
            <span className="text-apple-muted text-xs">Separate conditions using AND, OR, NOT, or brackets ( ).</span>
          )}

          {executionTimeMs !== undefined && (
            <div className="text-apple-muted font-mono text-[11px] flex items-center gap-3">
              <span>Matching: <strong className="text-apple-primary">{totalMatches}</strong> stocks</span>
              <span>•</span>
              <span>Evaluated in <strong className="text-apple-blue">{executionTimeMs} ms</strong></span>
            </div>
          )}
        </div>

        {/* Quick Insert Chips */}
        <div className="mt-4 pt-3.5 border-t border-apple-border-subtle">
          {/* Operators */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
            <span className="text-[10px] text-apple-muted font-mono mr-1">Operators:</span>
            {operators.map((op) => (
              <button
                key={op}
                onClick={() => insertText(op)}
                className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-apple-subtle hover:bg-apple-blue hover:text-white text-apple-blue border border-apple-border transition-all shadow-xs active:scale-95"
              >
                {op}
              </button>
            ))}
          </div>

          {/* Quick Picks */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-apple-muted font-mono mr-1">Ratios:</span>
            {quickPicks.map((chip) => (
              <button
                key={chip.label}
                onClick={() => insertText(chip.snippet)}
                className="px-2.5 py-1 text-xs rounded-lg bg-apple-subtle hover:bg-apple-surface-active text-apple-secondary hover:text-apple-primary border border-apple-border transition-all shadow-xs"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Run Row */}
        <div className="mt-5 pt-4 border-t border-apple-border-subtle flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs text-apple-muted">
            Press <kbd className="px-1.5 py-0.5 rounded bg-apple-subtle border border-apple-border font-mono text-[10px] text-apple-secondary">Run Query</kbd> to execute filter across 500 equities.
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onSaveScreen}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-apple-card hover:bg-apple-surface-active text-apple-secondary hover:text-apple-primary text-xs font-semibold border border-apple-border transition-all shadow-xs"
            >
              <Bookmark className="w-3.5 h-3.5 text-apple-blue" />
              <span>Save Screen</span>
            </button>

            <button
              onClick={onRunQuery}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-apple-blue hover:opacity-90 active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Screen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ratio Catalog Modal */}
      {showHelperModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-apple-card w-full max-w-3xl rounded-3xl border border-apple shadow-2xl p-6 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-apple-border-subtle">
              <div>
                <h3 className="text-base font-bold text-apple-primary flex items-center gap-2 font-display">
                  <HelpCircle className="w-4 h-4 text-apple-blue" />
                  Screener Formula & Ratio Catalog
                </h3>
                <p className="text-xs text-apple-muted mt-0.5">
                  Click any financial metric or alias to insert it into your active query.
                </p>
              </div>
              <button
                onClick={() => setShowHelperModal(false)}
                className="text-apple-muted hover:text-apple-primary text-xs font-semibold px-2 py-1 rounded-lg bg-apple-subtle"
              >
                Close
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 py-3 overflow-x-auto border-b border-apple-border-subtle no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-apple-blue text-white font-semibold'
                      : 'bg-apple-subtle text-apple-secondary hover:text-apple-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Metric Items Grid */}
            <div className="overflow-y-auto py-3 space-y-2 flex-1 pr-1">
              {filteredDictionary.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    insertText(item.name);
                    setShowHelperModal(false);
                  }}
                  className="p-3 rounded-2xl bg-apple-subtle border border-apple-border hover:border-apple-blue/40 transition-all cursor-pointer group flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-apple-primary group-hover:text-apple-blue transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-apple-card text-apple-muted border border-apple-border">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-apple-muted mt-1 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-apple-muted font-mono">Aliases:</span>
                      {item.aliases.map((alias) => (
                        <code
                          key={alias}
                          className="px-1.5 py-0.5 rounded bg-apple-card text-[10px] font-mono text-apple-secondary border border-apple-border"
                        >
                          {alias}
                        </code>
                      ))}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-apple-muted px-2 py-1 rounded-lg bg-apple-card border border-apple-border shrink-0">
                    {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
