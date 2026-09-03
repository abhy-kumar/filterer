import React from 'react';
import { Link } from 'react-router-dom';
import { GithubLogo } from '@phosphor-icons/react';
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
            <span className="text-sm font-bold tracking-[-0.03em] text-apple-primary font-display">Filterer</span>
            <p className="text-xs text-apple-secondary mt-2 max-w-sm leading-relaxed">
              Open source stock screener for Indian equities. All queries execute locally in your browser with complete privacy.
            </p>
            <p className="text-xs text-apple-muted mt-4 leading-relaxed max-w-sm">
              Covers {STOCKS_DATA.length} companies across the Nifty 500 with annual and quarterly statements, balance sheets, cash flows, and shareholding data.
            </p>
          </div>

          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-apple-faint mb-3">Screens</h2>
            <ul className="space-y-2 text-xs">
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
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-apple-faint mb-3">Project</h2>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={REPO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-apple-secondary hover:text-apple-blue transition-colors"
                >
                  <GithubLogo className="w-3.5 h-3.5" />
                  Source
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

        <div className="mt-10 pt-6 border-t border-apple-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-apple-muted leading-relaxed">
          <p>
            Developed by Abhishek K (FT-25-202) for the Mergers & Acquisitions course at Faculty of Management Studies (FMS), University of Delhi.
          </p>
          <span className="shrink-0 text-apple-secondary font-medium">
            FMS Delhi
          </span>
        </div>

        <p className="mt-3 text-[11px] text-apple-muted/80 leading-relaxed">
          For research and educational purposes only. Not investment advice, and not affiliated with Screener.in or Mittal Analytics. Figures come from public exchange filings and should be verified before making investment decisions.
        </p>
      </div>
    </footer>
  );
};
