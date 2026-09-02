import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Bookmark, Search, Moon, Sun, Compass } from 'lucide-react';
import { GithubLogo } from '@phosphor-icons/react';
import { useMarketTicker } from '../hooks/useMarketTicker';
import { useTheme } from '../context/ThemeContext';
import { signClass } from '../lib/format';

interface HeaderProps {
  onOpenSearch?: () => void;
  savedScreensCount?: number;
}

function relativeAge(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;

  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, savedScreensCount = 0 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const currentTab = location.pathname === '/'
    ? 'screens'
    : location.pathname.startsWith('/screen')
      ? 'query'
      : location.pathname === '/saved'
        ? 'saved'
        : '';

  const { indices, isMarketOpen, timeIST, dataAsOf, error, hasLoaded, flashingIndex } = useMarketTicker();
  const age = relativeAge(dataAsOf);

  return (
    <header className="sticky top-0 z-40 w-full apple-glass border-b border-apple-border">
      {/* Index strip */}
      <div className="border-b border-apple-border-subtle">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center gap-5 overflow-x-auto no-scrollbar text-[11px]">
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-apple-green' : 'bg-apple-text-faint'}`}
              style={isMarketOpen ? undefined : { background: 'var(--apple-text-faint)' }}
            />
            <span className="font-semibold text-apple-primary tracking-tight">
              {isMarketOpen ? 'NSE open' : 'NSE closed'}
            </span>
            <span className="text-apple-faint font-mono tabular-nums">{timeIST}</span>
          </div>

          <div className="w-px h-3.5 bg-apple-border shrink-0" />

          {!hasLoaded ? (
            <div className="flex items-center gap-5 shrink-0">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-3 w-28" />
              ))}
            </div>
          ) : error ? (
            <span className="text-apple-muted shrink-0">{error} — showing no index prices rather than stale ones.</span>
          ) : (
            indices.map((idx) => {
              const flash = flashingIndex[idx.name];
              return (
                <div
                  key={idx.name}
                  className={`flex items-baseline gap-1.5 shrink-0 px-1 rounded ${
                    flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
                  }`}
                >
                  <span className="text-apple-muted">{idx.name}</span>
                  <span className="font-mono font-medium text-apple-primary tabular-nums">
                    {idx.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`font-mono tabular-nums ${signClass(idx.change_pct)}`}>
                    {idx.change_pct >= 0 ? '+' : ''}
                    {idx.change_pct.toFixed(2)}%
                  </span>
                </div>
              );
            })
          )}

          {age && (
            <span className="ml-auto shrink-0 text-apple-faint hidden lg:inline pl-6">
              Prices {age}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-7 min-w-0">
          <Link to="/" className="flex items-baseline gap-2 select-none shrink-0">
            <span className="text-[17px] font-bold tracking-[-0.03em] text-apple-primary font-display">
              Filterer
            </span>
            <span className="text-[11px] text-apple-faint font-mono hidden sm:inline">NSE / BSE</span>
          </Link>

          <nav className="hidden md:flex items-center apple-segmented">
            <button
              onClick={() => navigate('/')}
              className={`apple-segmented-item flex items-center gap-1.5 ${currentTab === 'screens' ? 'active' : ''}`}
            >
              <Compass className="w-3.5 h-3.5" />
              Screens
            </button>
            <button
              onClick={() => navigate('/screen')}
              className={`apple-segmented-item flex items-center gap-1.5 ${currentTab === 'query' ? 'active' : ''}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Query
            </button>
            <button
              onClick={() => navigate('/saved')}
              className={`apple-segmented-item flex items-center gap-1.5 ${currentTab === 'saved' ? 'active' : ''}`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved
              {savedScreensCount > 0 && (
                <span className="text-[10px] font-mono text-apple-muted">{savedScreensCount}</span>
              )}
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="apple-input flex items-center gap-2 px-2.5 h-8 text-xs text-apple-muted hover:text-apple-primary hover:border-apple-border-strong transition-colors w-40 lg:w-64"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Search companies, ratios</span>
              <kbd className="hidden lg:inline ml-auto text-[10px] font-mono text-apple-faint">⌘K</kbd>
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="apple-btn apple-btn-quiet px-2"
            title={isDark ? 'Switch to light appearance' : 'Switch to dark appearance'}
            aria-label="Toggle appearance"
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
