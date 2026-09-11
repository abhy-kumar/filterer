import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { DerivedInsight, InsightTone } from '../../engine/derivedInsights';

const TONE_LABEL: Record<InsightTone, string> = {
  positive: 'Favourable',
  negative: 'Unfavourable',
  neutral: 'Neither favourable nor unfavourable',
};

function figureClass(tone?: InsightTone): string {
  if (tone === 'positive') return 'num-pos';
  if (tone === 'negative') return 'num-neg';
  return 'text-apple-primary';
}

/** Shape as well as colour, so the reading survives colour blindness and greyscale. */
const ToneMark: React.FC<{ tone: InsightTone }> = ({ tone }) => {
  const Icon = tone === 'positive' ? ArrowUpRight : tone === 'negative' ? ArrowDownRight : Minus;
  return (
    <span role="img" aria-label={TONE_LABEL[tone]} title={TONE_LABEL[tone]} className={`shrink-0 ${figureClass(tone)}`}>
      <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
    </span>
  );
};

export const DerivedInsightsPanel: React.FC<{ insights: DerivedInsight[] }> = ({ insights }) => {
  const [showSources, setShowSources] = useState(false);
  if (!insights.length) return null;

  return (
    <div className="apple-card overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-apple-border flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="text-title3 text-apple-primary font-display">Insights</h2>
          <p className="text-caption1 text-apple-muted mt-0.5 max-w-2xl">
            Worked out from this company's own results, statements and shareholding filings. Every figure can be
            checked against the tables further down the page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSources((v) => !v)}
          aria-pressed={showSources}
          className="apple-btn apple-btn-quiet apple-btn-sm self-start sm:self-auto"
        >
          {showSources ? 'Hide sources' : 'Show sources'}
        </button>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-3 sm:p-4">
        {insights.map((insight) => (
          <li key={insight.id} className="apple-well p-4 flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-eyebrow">{insight.category}</span>
              <ToneMark tone={insight.tone} />
            </div>

            <div>
              <h3 className="text-footnote font-semibold text-apple-primary">{insight.title}</h3>
              <p className="text-caption1 text-apple-secondary leading-relaxed mt-1">{insight.headline}</p>
            </div>

            {insight.figures.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mt-auto pt-3 border-t border-apple-border-subtle">
                {insight.figures.map((figure) => (
                  <div key={figure.label} className="min-w-0">
                    <dt className="text-caption2 text-apple-muted truncate" title={figure.label}>
                      {figure.label}
                    </dt>
                    <dd className={`text-caption1 font-semibold num ${figureClass(figure.tone)}`}>{figure.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {showSources && <p className="text-caption2 text-apple-faint leading-snug">{insight.basis}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DerivedInsightsPanel;
