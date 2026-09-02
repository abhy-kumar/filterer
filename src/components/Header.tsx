import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  Bookmark,
  Sparkles,
  Search,
  Moon,
  Sun,
  RotateCw,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react';
import { GithubLogo } from '@phosphor-icons/react';
import { useMarketTicker } from '../hooks/useMarketTicker';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onOpenSearch?: () => void;
  savedScreensCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  savedScreensCount = 0,
}) => {
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
    isRefreshing,
    flashingIndex,
    refreshIndices
  } = useMarketTicker();

  return (
    <header className="sticky top-0 z-40 w-full apple-glass border-b border-apple transition-colors duration-200">
      {/* Top Live Market Indices Ticker Bar */}
      <div className="border-b border-apple-border-subtle py-1.5 px-4 sm:px-6 text-xs flex items-center justify-between gap-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 shrink-0">
          {/* Live Market Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-apple-subtle border border-apple-border text-[11px] font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isMarketOpen ? 'bg-apple-green animate-pulse' : 'bg-apple-muted'
              }`}
            />
            <span className="font-semibold text-apple-primary">
              {isMarketOpen ? 'NSE OPEN' : 'NSE CLOSED'}
            </span>
            <span className="text-apple-muted hidden sm:inline">•</span>
            <span className="text-apple-secondary hidden sm:inline">{timeIST}</span>
          </div>

          {/* Indices Stream */}
          {indices.map((idx) => {
            const flash = flashingIndex[idx.name];
            return (
              <div
                key={idx.name}
                className={`flex items-center gap-1.5 py-0.5 px-2 rounded-lg transition-colors ${
                  flash === 'up'
                    ? 'bg-apple-green-subtle text-apple-green'
                    : flash === 'down'
                    ? 'bg-apple-red-subtle text-apple-red'
                    : ''
                }`}
              >
                <span className="text-apple-muted font-medium text-[11px]">{idx.name}</span>
                <span className="font-mono font-semibold text-apple-primary text-xs">
                  {idx.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`flex items-center text-[11px] font-mono font-medium ${
                    idx.is_up ? 'text-apple-green' : 'text-apple-red'
                  }`}
                >
                  {idx.is_up ? (
                    <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                  )}
                  {idx.is_up ? '+' : ''}
                  {idx.change_pct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Refresh Trigger */}
        <div className="hidden lg:flex items-center gap-3 shrink-0 text-[11px] text-apple-muted">
          <button
            onClick={refreshIndices}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-apple-subtle transition-colors text-apple-secondary hover:text-apple-primary"
            title="Refresh Live Market Data"
          >
            <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-apple-blue' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Live'}</span>
          </button>
          <span>•</span>
          <span className="text-apple-muted">Data as of {dataAsOf}</span>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Apple Brand Logo */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-b from-[#2997ff] to-[#0071e3] flex items-center justify-center text-white shadow-md shadow-[#0071e3]/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 fill-white/20 stroke-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-apple-primary font-display">
                  Filterer
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-apple-green-subtle text-apple-green border border-apple-green/20 tracking-wider">
                  NIFTY 500
                </span>
              </div>
              <p className="text-[10px] text-apple-muted leading-none hidden sm:block">
                Quantitative Equity Screener
              </p>
            </div>
          </Link>

          {/* Center: Apple Segmented Pill Navigation */}
          <nav className="hidden md:flex items-center apple-segmented p-1">
            <button
              onClick={() => navigate('/')}
              className={`apple-segmented-item flex items-center gap-1.5 ${
                currentTab === 'screens' ? 'active' : ''
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Screens</span>
            </button>

            <button
              onClick={() => navigate('/screen')}
              className={`apple-segmented-item flex items-center gap-1.5 ${
                currentTab === 'query' ? 'active' : ''
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Query Editor</span>
            </button>

            <button
              onClick={() => navigate('/saved')}
              className={`apple-segmented-item flex items-center gap-1.5 ${
                currentTab === 'saved' ? 'active' : ''
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved</span>
              {savedScreensCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-apple-blue-subtle text-apple-blue text-[10px] flex items-center justify-center font-bold">
                  {savedScreensCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right: Quick Search & Utilities */}
        <div className="flex items-center gap-2.5">
          {/* Search Trigger */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-apple-subtle border border-apple-border hover:border-apple-blue/50 text-apple-muted hover:text-apple-primary transition-all text-xs w-44 sm:w-60 justify-between group shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-apple-muted group-hover:text-apple-blue transition-colors" />
                <span className="truncate text-[11px]">Search stocks & ratios...</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-apple-card text-apple-muted rounded-md border border-apple-border shadow-xs">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Apple-Grade Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-apple-subtle hover:bg-apple-surface-active border border-apple-border text-apple-secondary hover:text-apple-primary transition-all shadow-xs"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-apple-amber" />
            ) : (
              <Moon className="w-4 h-4 text-apple-blue" />
            )}
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/abhy-kumar/filterer"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-apple-subtle hover:bg-apple-surface-active border border-apple-border text-xs text-apple-secondary hover:text-apple-primary transition-all shadow-xs"
          >
            <GithubLogo className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
