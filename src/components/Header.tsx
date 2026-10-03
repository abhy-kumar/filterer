import React from 'react';
import { useLocation, Link, NavLink } from 'react-router-dom';
import { Search, Moon, Sun, RefreshCw } from 'lucide-react';
import { GithubLogo } from '@phosphor-icons/react';
import { useMarketTicker } from '../hooks/useMarketTicker';
import { useTheme } from '../context/ThemeContext';
import { modKey } from '../lib/platform';

interface HeaderProps {
  onOpenSearch?: () => void;
  savedScreensCount?: number;
}

export const NAV_ITEMS = [
  { to: '/', label: 'Screens', match: (p: string) => p === '/' },
  { to: '/screen', label: 'Query', match: (p: string) => p.startsWith('/screen') },
  { to: '/saved', label: 'Watchlists', match: (p: string) => p === '/saved' || p === '/watchlists' },
  { to: '/people', label: 'Super-investors', match: (p: string) => p.startsWith('/people') || p.startsWith('/investors') },
];

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, savedScreensCount = 0 }) => {
  const { pathname } = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const { indices, isMarketOpen, timeIST, dataAsOf, error, hasLoaded, isRefreshing, flashingIndex, refreshIndices } =
    useMarketTicker();

  return (
    <header className="sticky top-0 z-40 w-full bg-apple-bg border-b border-apple-border">
      {/* Index strip. One row, never wraps; scrolls sideways on a phone. */}
      <div className="border-b border-apple-border-subtle">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 h-8 flex items-center gap-4 text-caption1 select-none">
          <span className="flex items-center gap-1.5 shrink-0 text-apple-muted">
            {isMarketOpen && <span className="w-1.5 h-1.5 rounded-full bg-apple-green" aria-hidden="true" />}
            <span className={isMarketOpen ? 'text-apple-primary' : ''}>{isMarketOpen ? 'Market open' : 'Market closed'}</span>
            <span className="num hidden sm:inline">{timeIST}</span>
          </span>

          <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
            {!hasLoaded ? (
              <div className="flex items-center gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-3.5 w-24" />
                ))}
              </div>
            ) : error ? (
              <span className="text-apple-muted whitespace-nowrap">{error}</span>
            ) : (
              <ul className="flex items-center gap-5 whitespace-nowrap">
                {indices.map((idx) => {
                  const flash = flashingIndex[idx.name];
                  return (
                    <li
                      key={idx.name}
                      className={`flex items-baseline gap-1.5 ${flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''}`}
                    >
                      <span className="text-apple-muted">{idx.name}</span>
                      <span className="num text-apple-primary">
                        {idx.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className={`num ${idx.change_pct >= 0 ? 'num-pos' : 'num-neg'}`}>
                        {idx.change_pct >= 0 ? "+" : "-"}
                        {Math.abs(idx.change_pct).toFixed(2)}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <button
            onClick={() => refreshIndices()}
            disabled={isRefreshing}
            className="p-1 -mr-1 rounded text-apple-faint hover:text-apple-primary transition-colors shrink-0"
            title={dataAsOf ? `Updated ${new Date(dataAsOf).toLocaleTimeString('en-IN')}` : 'Refresh'}
            aria-label="Refresh index levels"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 lg:gap-8 min-w-0 h-full">
          <Link to="/" className="text-headline font-semibold tracking-[-0.02em] text-apple-primary shrink-0">
            Filterer
          </Link>

          <nav className="hidden md:flex items-stretch gap-5 h-full" aria-label="Main">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center text-footnote transition-colors ${
                    active ? 'text-apple-primary font-medium' : 'text-apple-muted hover:text-apple-primary'
                  }`}
                >
                  {item.label}
                  {item.to === '/saved' && savedScreensCount > 0 && (
                    <span className="ml-1.5 text-caption1 num text-apple-faint">{savedScreensCount}</span>
                  )}
                  {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-apple-primary" />}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {onOpenSearch && (
            <>
              <button
                onClick={onOpenSearch}
                className="apple-btn apple-btn-quiet p-2 md:hidden"
                aria-label="Search companies and ratios"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenSearch}
                className="hidden md:flex apple-input items-center gap-2 px-2.5 h-8 text-caption1 text-apple-muted hover:text-apple-primary hover:border-apple-border-strong transition-colors w-40 lg:w-52 xl:w-64"
              >
                <Search className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Company or ratio</span>
                <kbd className="hidden lg:inline ml-auto text-caption2 font-mono text-apple-faint">{modKey} K</kbd>
              </button>
            </>
          )}

          <button
            onClick={toggleTheme}
            className="apple-btn apple-btn-quiet px-2"
            title={isDark ? 'Light' : 'Dark'}
            aria-label={isDark ? 'Switch to light' : 'Switch to dark'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <a
            href="https://github.com/abhy-kumar/filterer"
            target="_blank"
            rel="noopener noreferrer"
            className="apple-btn apple-btn-quiet px-2 hidden sm:inline-flex"
            aria-label="Source on GitHub"
          >
            <GithubLogo className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
