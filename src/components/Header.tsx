import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Bookmark, Search, Moon, Sun, Compass, RefreshCw } from 'lucide-react';
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

  const {
    indices,
    isMarketOpen,
    timeIST,
    dataAsOf,
    error,
    hasLoaded,
    isRefreshing,
    flashingIndex,
    refreshIndices,
  } = useMarketTicker();

  return (
    <header className="sticky top-0 z-40 w-full apple-glass border-b border-apple-border">
      {/* Redesigned Market Indices Ticker Bar */}
      <div className="border-b border-apple-border/60 bg-apple-bg-subtle/60 dark:bg-[#111114]/80 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-3 text-xs">
          {/* Left: Market Live Status Pill */}
          <div className="flex items-center gap-2.5 shrink-0 pr-3 border-r border-apple-border/50">
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wider uppercase select-none transition-colors ${
                isMarketOpen
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                  : 'bg-apple-surface text-apple-muted border border-apple-border'
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                {isMarketOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                    isMarketOpen ? 'bg-emerald-500' : 'bg-apple-muted'
                  }`}
                />
              </span>
              <span>{isMarketOpen ? 'NSE Live' : 'Market Closed'}</span>
            </div>
            <span className="text-[11px] font-mono text-apple-secondary font-medium tabular-nums hidden sm:inline select-none">
              {timeIST}
            </span>
          </div>

          {/* Middle: Scrollable Indices Capsules */}
          <div className="flex-1 min-w-0 overflow-hidden relative">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {!hasLoaded ? (
                <div className="flex items-center gap-3 shrink-0">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="skeleton h-6 w-32 rounded-lg" />
                  ))}
                </div>
              ) : error ? (
                <span className="text-apple-muted shrink-0 text-[11px]">{error}</span>
              ) : (
                indices.map((idx) => {
                  const isPositive = idx.change_pct >= 0;
                  const flash = flashingIndex[idx.name];
                  return (
                    <div
                      key={idx.name}
                      className={`flex items-center gap-2 px-2.5 py-1 rounded-lg bg-apple-surface/70 border border-apple-border/50 hover:border-apple-border hover:bg-apple-surface transition-all shrink-0 select-none text-[11.5px] shadow-sm ${
                        flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
                      }`}
                    >
                      <span className="font-semibold text-apple-secondary text-[11px] tracking-tight">
                        {idx.name}
                      </span>
                      <span className="font-mono font-bold text-apple-primary tabular-nums">
                        {idx.price.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tabular-nums ${
                          isPositive
                            ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        <span>{isPositive ? '▲' : '▼'}</span>
                        <span>{Math.abs(idx.change_pct).toFixed(2)}%</span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Refresh button and status */}
          <div className="flex items-center gap-2 shrink-0 pl-3 border-l border-apple-border/50">
            <button
              onClick={() => refreshIndices()}
              disabled={isRefreshing}
              className="p-1 rounded-md text-apple-muted hover:text-apple-primary hover:bg-apple-surface transition-colors"
              title={
                dataAsOf
                  ? `Last updated: ${new Date(dataAsOf).toLocaleTimeString('en-IN')}. Click to refresh.`
                  : 'Refresh quotes'
              }
              aria-label="Refresh market quotes"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-apple-primary' : ''}`} />
            </button>
            <span className="text-[10.5px] text-apple-muted hidden md:inline font-mono font-medium select-none">
              {isMarketOpen ? 'Real-time' : 'Prev Close'}
            </span>
          </div>
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
