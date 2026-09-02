import React from 'react';
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
  Layers,
  Circle
} from 'lucide-react';
import { GithubLogo } from '@phosphor-icons/react';
import { useMarketTicker } from '../hooks/useMarketTicker';

interface HeaderProps {
  currentTab: 'screens' | 'query' | 'saved';
  onSelectTab: (tab: 'screens' | 'query' | 'saved') => void;
  onOpenSearch: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  savedScreensCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenSearch,
  isDark,
  onToggleTheme,
  savedScreensCount,
}) => {
  const {
    indices,
    isMarketOpen,
    timeIST,
    dateIST,
    isRefreshing,
    flashingIndex,
    refreshIndices
  } = useMarketTicker();

  return (
    <header className="sticky top-0 z-40 w-full apple-glass border-b border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.06]">
      {/* Top Live Market Indices Ticker Bar */}
      <div className="border-b border-white/[0.06] dark:border-white/[0.06] light:border-black/[0.04] py-1.5 px-4 sm:px-6 text-xs flex items-center justify-between gap-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-5 shrink-0">
          {/* Live Market Status Pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.05] dark:bg-white/[0.05] light:bg-black/[0.04] border border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.06] text-[11px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isMarketOpen ? 'bg-[#30d158] animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-800">
              {isMarketOpen ? 'NSE OPEN' : 'NSE CLOSED'}
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">{timeIST}</span>
          </div>

          {/* Indices Stream */}
          {indices.map((idx) => {
            const flash = flashingIndex[idx.name];
            return (
              <div
                key={idx.name}
                className={`flex items-center gap-1.5 py-0.5 px-2 rounded-lg transition-all ${
                  flash === 'up'
                    ? 'bg-[#30d158]/20 text-[#30d158]'
                    : flash === 'down'
                    ? 'bg-[#ff453a]/20 text-[#ff453a]'
                    : ''
                }`}
              >
                <span className="text-slate-400 font-medium text-[11px]">{idx.name}</span>
                <span className="font-mono font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs">
                  {idx.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`flex items-center text-[11px] font-mono font-medium ${
                    idx.is_up ? 'text-[#30d158]' : 'text-[#ff453a]'
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
        <div className="hidden lg:flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
          <button
            onClick={refreshIndices}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/[0.08] dark:hover:bg-white/[0.08] light:hover:bg-black/[0.05] transition-colors"
            title="Refresh Live Market Data"
          >
            <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#2997ff]' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Live'}</span>
          </button>
          <span>•</span>
          <span className="text-slate-400">{dateIST}</span>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Apple Brand Logo */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => onSelectTab('screens')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-b from-[#2997ff] to-[#0071e3] flex items-center justify-center text-white shadow-lg shadow-[#0071e3]/25 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 fill-white/20 stroke-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white dark:text-white light:text-slate-900 font-sans">
                  Filterer
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-[#2997ff]/15 text-[#2997ff] border border-[#2997ff]/30 tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none hidden sm:block">
                Open Screener.in Platform
              </p>
            </div>
          </div>

          {/* Center: Apple Segmented Pill Navigation */}
          <nav className="hidden md:flex items-center apple-segmented p-1">
            <button
              onClick={() => onSelectTab('screens')}
              className={`apple-segmented-item flex items-center gap-1.5 ${
                currentTab === 'screens' ? 'active' : ''
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Screens</span>
            </button>

            <button
              onClick={() => onSelectTab('query')}
              className={`apple-segmented-item flex items-center gap-1.5 ${
                currentTab === 'query' ? 'active' : ''
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Query Editor</span>
            </button>

            <button
              onClick={() => onSelectTab('saved')}
              className={`apple-segmented-item flex items-center gap-1.5 ${
                currentTab === 'saved' ? 'active' : ''
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved</span>
              {savedScreensCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#2997ff]/20 text-[#2997ff] text-[10px] flex items-center justify-center font-bold">
                  {savedScreensCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right: Quick Search & Utilities */}
        <div className="flex items-center gap-2.5">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.04] dark:bg-white/[0.04] light:bg-black/[0.04] border border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.06] hover:border-[#2997ff]/50 text-slate-400 hover:text-slate-200 transition-all text-xs w-44 sm:w-60 justify-between group"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2997ff] transition-colors" />
              <span className="truncate text-[11px]">Search stocks & ratios...</span>
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white/[0.08] dark:bg-white/[0.08] light:bg-white text-slate-400 rounded-md border border-white/[0.08]">
              ⌘K
            </kbd>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-white/[0.04] dark:bg-white/[0.04] light:bg-black/[0.04] border border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.06] text-slate-400 hover:text-white light:hover:text-black transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#ff9f0a]" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/abhy-kumar/filterer"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] dark:bg-white/[0.04] light:bg-black/[0.04] border border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.06] text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white light:hover:text-black transition-all"
          >
            <GithubLogo className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
