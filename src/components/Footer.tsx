import React from 'react';
import { Link } from 'react-router-dom';
import { CURATED_SCREENS } from '../data/screens';
import { STOCKS_DATA } from '../data/stocksData';
import { screenPath } from '../lib/routes';

const REPO = 'https://github.com/abhy-kumar/filterer';

const FEATURED = ['magic-formula', 'debt-free-compounders', 'undervalued-bargains', 'piotroski-high-score'];

export const Footer: React.FC = () => {
  const screenUrl = (id: string) => {
    const screen = CURATED_SCREENS.find((s) => s.id === id);
    return screen ? screenPath(screen.query) : '/screen';
  };

  return (
    <footer className="w-full border-t border-apple-border mt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <span className="text-subheadline font-bold tracking-[-0.03em] text-apple-primary font-display">Filterer</span>
            <p className="text-caption1 text-apple-secondary mt-2 max-w-sm leading-relaxed">
              A stock screener for the {STOCKS_DATA.length} companies in the Nifty 500. Queries run in your browser
              against data shipped with the page. Results, shareholding and prices come from NSE and BSE filings and
              quotes.
            </p>
          </div>

          <div>
            <h2 className="text-caption1 font-medium text-apple-muted mb-3">Screens</h2>
            <ul className="space-y-2 text-caption1">
              {FEATURED.map((id) => {
                const screen = CURATED_SCREENS.find((s) => s.id === id);
                if (!screen) return null;
                return (
                  <li key={id}>
                    <Link to={screenUrl(id)} className="text-apple-secondary hover:text-apple-blue transition-colors">
                      {screen.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="text-caption1 font-medium text-apple-muted mb-3">Project</h2>
            <ul className="space-y-2 text-caption1">
              <li>
                <a
                  href={REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-apple-secondary hover:text-apple-blue transition-colors"
                >
                  Source on GitHub
                </a>
              </li>
              <li>
                <Link to="/screen" className="text-apple-secondary hover:text-apple-blue transition-colors">
                  Query syntax
                </Link>
              </li>
              <li>
                <a
                  href={`${REPO}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-apple-secondary hover:text-apple-blue transition-colors"
                >
                  Report an issue
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-apple-border-subtle space-y-2 text-caption1 text-apple-muted leading-relaxed max-w-3xl">
          <p>
            Made by Abhishek K (FT-25-202) for the Mergers and Acquisitions course at the Faculty of Management
            Studies, University of Delhi.
          </p>
          <p>
            Not investment advice. Not affiliated with Screener.in or Mittal Analytics. Check any figure against the
            company's own filing before you rely on it.
          </p>
        </div>
      </div>
    </footer>
  );
};
