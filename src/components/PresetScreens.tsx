import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CURATED_SCREENS, SCREEN_CATEGORIES } from '../data/screens';
import { executeScreenerQuery } from '../engine/screenerParser';
import type { Stock } from '../types/stock';
import { screenPath } from '../lib/routes';
import { summariseQuery } from '../lib/criteria';

interface PresetScreensProps {
  onRunScreen?: (query: string) => void;
  universe: Stock[];
}

const FILTERS = ['All', ...SCREEN_CATEGORIES];

export const PresetScreens: React.FC<PresetScreensProps> = ({ onRunScreen, universe }) => {
  const [category, setCategory] = useState('All');

  // Showing the hit count is the difference between a list of slogans and a
  // list of screens someone can choose between.
  const screens = useMemo(
    () =>
      CURATED_SCREENS.map((screen) => ({
        ...screen,
        matches: executeScreenerQuery(screen.query, universe).matches.length,
        criteria: summariseQuery(screen.query),
      })),
    [universe]
  );

  const filtered = category === 'All' ? screens : screens.filter((s) => s.category === category);

  return (
    <section aria-label="Screens">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-1 px-1 mb-1" role="tablist">
        {FILTERS.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={category === cat}
            onClick={() => setCategory(cat)}
            className={`filter-tab ${category === cat ? 'is-active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <ol className="border-t border-apple-border">
        {filtered.map((screen) => (
          <li key={screen.id} className="border-b border-apple-border">
            <Link
              to={screenPath(screen.query)}
              onClick={() => onRunScreen?.(screen.query)}
              className="group grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 py-3.5 sm:py-4 px-1 -mx-1 hover:bg-apple-surface-hover transition-colors"
            >
              <h3 className="text-callout font-semibold text-apple-primary group-hover:text-apple-blue">
                {screen.title}
              </h3>

              <p className="row-span-2 self-center text-right num whitespace-nowrap">
                <span className={`text-headline ${screen.matches === 0 ? 'text-apple-faint' : 'text-apple-primary'}`}>
                  {screen.matches}
                </span>
                <span className="block text-caption1 text-apple-muted">
                  {screen.matches === 1 ? 'match' : 'matches'}
                </span>
              </p>

              <p className="text-footnote text-apple-secondary">
                {screen.criteria ? (
                  screen.criteria.map((c, i) => (
                    <React.Fragment key={c}>
                      <span className="whitespace-nowrap">{c}</span>
                      {i < screen.criteria!.length - 1 && <span className="text-apple-faint">, </span>}
                    </React.Fragment>
                  ))
                ) : (
                  <code className="font-mono text-caption1">{screen.query}</code>
                )}
              </p>

              {screen.description && (
                <p className="col-span-2 sm:col-span-1 text-caption1 text-apple-muted mt-0.5 max-w-2xl">{screen.description}</p>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
};
