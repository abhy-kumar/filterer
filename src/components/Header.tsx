import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Bookmark, Search, Moon, Sun, Compass, RefreshCw, Users, Activity, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const currentTab = location.pathname === '/'
    ? 'screens'
    : location.pathname.startsWith('/screen')
      ? 'query'
      : location.pathname === '/saved' || location.pathname === '/watchlists'
        ? 'saved'
        : location.pathname.startsWith('/people') || location.pathname.startsWith('/investors')
          ? 'people'
          : location.pathname.startsWith('/commodities')
            ? 'commodities'
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
      {/* Sleek Financial Market Ticker Bar - strictly single row, never wraps */}
      <div className="border-b border-apple-border/50 bg-apple-bg-subtle/50 dark:bg-[#0f0f12]/90 backdrop-blur-md overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-3 text-xs select-none">
          {/* Left: Market Live / Closed Status */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-colors ${
                isMarketOpen
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                  : 'bg-apple-surface/60 text-apple-muted border border-apple-border/50'
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                {isMarketOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                    isMarketOpen ? 'bg-emerald-500' : 'bg-apple-muted/60'
                  }`}
                />
              </span>
              <span>{isMarketOpen ? 'NSE Live' : 'Market Closed'}</span>
            </span>
            <span className="text-[10.5px] font-mono text-apple-muted hidden sm:inline tabular-nums">
              {timeIST}
            </span>
          </div>

          {/* Middle: Sleek, non-wrapping horizontally scrollable ticker strip */}
          <div className="flex-1 min-w-0 flex items-center justify-center overflow-x-auto no-scrollbar py-0.5">
            {!hasLoaded ? (
              <div className="flex items-center gap-4 shrink-0">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-5 w-24 rounded" />
                ))}
              </div>
            ) : error ? (
              <span className="text-apple-muted text-[11px] whitespace-nowrap">{error}</span>
            ) : (
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 flex-nowrap whitespace-nowrap shrink-0">
                {indices.map((idx) => {
                  const isPositive = idx.change_pct >= 0;
                  const flash = flashingIndex[idx.name];

                  return (
                    <div
                      key={idx.name}
                      className={`flex items-center gap-1.5 text-[11px] transition-colors py-0.5 shrink-0 ${
                        flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
                      }`}
                    >
                      <span className="font-medium text-apple-muted text-[10.5px] tracking-tight">
                        {idx.name}
                      </span>
                      <span className="font-mono font-semibold text-apple-primary tabular-nums">
                        {idx.price.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span
                        className={`font-mono text-[10px] font-semibold tabular-nums ${
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isPositive ? '▲' : '▼'}&nbsp;{Math.abs(idx.change_pct).toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Refresh button and status */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono text-apple-muted hidden lg:inline">
              {isMarketOpen ? 'Real-time' : 'Prev Close'}
            </span>
            <button
              onClick={() => refreshIndices()}
              disabled={isRefreshing}
              className="p-1 rounded text-apple-muted hover:text-apple-primary hover:bg-apple-surface/60 transition-colors"
              title={
                dataAsOf
                  ? `Last updated: ${new Date(dataAsOf).toLocaleTimeString('en-IN')}. Click to refresh.`
                  : 'Refresh market quotes'
              }
              aria-label="Refresh market quotes"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-apple-primary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 lg:gap-6 min-w-0">
          <Link to="/" className="flex items-baseline gap-2 select-none shrink-0">
            <span className="text-[17px] font-bold tracking-[-0.03em] text-apple-primary font-display">
              Filterer
            </span>
            <span className="text-[11px] text-apple-faint font-mono hidden sm:inline">NSE / BSE</span>
          </Link>

          <nav className="hidden md:flex items-center apple-segmented overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => navigate('/')}
              className={`apple-segmented-item flex items-center gap-1.5 text-xs py-1.5 px-3 ${currentTab === 'screens' ? 'active' : ''}`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>Screens</span>
            </button>
            <button
              onClick={() => navigate('/screen')}
              className={`apple-segmented-item flex items-center gap-1.5 text-xs py-1.5 px-3 ${currentTab === 'query' ? 'active' : ''}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>Query</span>
            </button>
            <button
              onClick={() => navigate('/saved')}
              className={`apple-segmented-item flex items-center gap-1.5 text-xs py-1.5 px-3 ${currentTab === 'saved' ? 'active' : ''}`}
            >
              <Bookmark className="w-3.5 h-3.5 shrink-0" />
              <span>Watchlists</span>
              {savedScreensCount > 0 && (
                <span className="text-[10px] font-mono text-apple-muted">{savedScreensCount}</span>
              )}
            </button>
            <button
              onClick={() => navigate('/people')}
              className={`apple-segmented-item flex items-center gap-1.5 text-xs py-1.5 px-3 ${currentTab === 'people' ? 'active' : ''}`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Super-Investors</span>
            </button>
            <button
              onClick={() => navigate('/commodities')}
              className={`apple-segmented-item flex items-center gap-1.5 text-xs py-1.5 px-3 ${currentTab === 'commodities' ? 'active' : ''}`}
            >
              <Activity className="w-3.5 h-3.5 shrink-0" />
              <span>Commodities</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="apple-input flex items-center gap-2 px-2.5 h-8 text-xs text-apple-muted hover:text-apple-primary hover:border-apple-border-strong transition-colors w-32 sm:w-44 xl:w-60"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Search companies, ratios</span>
              <kbd className="hidden xl:inline ml-auto text-[10px] font-mono text-apple-faint">⌘K</kbd>
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

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="apple-btn apple-btn-quiet px-2 md:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-apple-border bg-apple-card/95 backdrop-blur-xl px-4 py-3 space-y-1 animate-fade-in shadow-lg">
          <button
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'screens' ? 'bg-apple-surface-active text-apple-primary font-semibold' : 'text-apple-secondary hover:bg-apple-surface-hover'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Screens</span>
          </button>
          <button
            onClick={() => {
              navigate('/screen');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'query' ? 'bg-apple-surface-active text-apple-primary font-semibold' : 'text-apple-secondary hover:bg-apple-surface-hover'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Query</span>
          </button>
          <button
            onClick={() => {
              navigate('/saved');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'saved' ? 'bg-apple-surface-active text-apple-primary font-semibold' : 'text-apple-secondary hover:bg-apple-surface-hover'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4" />
              <span>Watchlists</span>
            </div>
            {savedScreensCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-apple-bg-subtle text-apple-muted">
                {savedScreensCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              navigate('/people');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'people' ? 'bg-apple-surface-active text-apple-primary font-semibold' : 'text-apple-secondary hover:bg-apple-surface-hover'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Super-Investors</span>
          </button>
          <button
            onClick={() => {
              navigate('/commodities');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentTab === 'commodities' ? 'bg-apple-surface-active text-apple-primary font-semibold' : 'text-apple-secondary hover:bg-apple-surface-hover'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Commodities</span>
          </button>
        </div>
      )}
    </header>
  );
};
