import React from 'react';
import {
  Filter,
  Search,
  Moon,
  Sun,
  TrendingUp,
  TrendingDown,
  Sparkles,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';
import { GithubLogo } from '@phosphor-icons/react';

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
  const indices = [
    { name: 'NIFTY 50', value: '24,852.40', change: '+124.60 (+0.50%)', isUp: true },
    { name: 'SENSEX', value: '81,460.15', change: '+380.25 (+0.47%)', isUp: true },
    { name: 'NIFTY BANK', value: '53,280.90', change: '+245.80 (+0.46%)', isUp: true },
    { name: 'NIFTY IT', value: '38,920.10', change: '-95.40 (-0.24%)', isUp: false },
    { name: 'NIFTY MIDCAP', value: '58,410.50', change: '+412.30 (+0.71%)', isUp: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 dark:border-white/10 bg-[#06090e]/90 dark:bg-[#06090e]/90 light:bg-white/95 backdrop-blur-md">
      {/* Top Indices Ticker */}
      <div className="border-b border-white/5 dark:border-white/5 py-1 px-4 text-xs overflow-x-auto no-scrollbar flex items-center justify-between gap-6 text-slate-400">
        <div className="flex items-center gap-6 shrink-0">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            NSE LIVE
          </span>
          {indices.map((idx) => (
            <div key={idx.name} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-medium text-slate-300 dark:text-slate-300 light:text-slate-700">{idx.name}</span>
              <span className="font-mono text-slate-200 dark:text-slate-200 light:text-slate-900">{idx.value}</span>
              <span
                className={`flex items-center text-[11px] font-mono ${
                  idx.isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {idx.isUp ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
                {idx.change}
              </span>
            </div>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
          <span>Free Screener.in Alternative</span>
          <span className="text-slate-600">•</span>
          <span className="text-sky-400 font-mono">100% Client + API Ready</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => onSelectTab('screens')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Filter className="w-5 h-5 fill-white/20 stroke-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white dark:text-white light:text-slate-900 font-mono">
                  FILTERER
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-widest">
                  ALPHA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none hidden sm:block">
                Free & Open Screener.in Alternative
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 p-1 rounded-xl border border-white/5 dark:border-white/5 light:border-slate-200">
            <button
              onClick={() => onSelectTab('screens')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'screens'
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Popular Screens
            </button>
            <button
              onClick={() => onSelectTab('query')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'query'
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Custom Screener
            </button>
            <button
              onClick={() => onSelectTab('saved')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'saved'
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved Screens
              {savedScreensCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-sky-400/20 text-sky-300 text-[10px] flex items-center justify-center font-bold">
                  {savedScreensCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Center/Right: Quick Search & Utilities */}
        <div className="flex items-center gap-3">
          {/* Quick Search Bar */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border border-white/10 dark:border-white/10 light:border-slate-200 hover:border-sky-500/40 text-slate-400 hover:text-slate-200 transition-all text-xs w-48 sm:w-64 justify-between group"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 transition-colors" />
              <span className="truncate">Search stocks, ratios...</span>
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 dark:bg-slate-800 light:bg-white text-slate-400 rounded border border-white/10 shadow-xs">
              Ctrl+K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border border-white/10 dark:border-white/10 light:border-slate-200 text-slate-400 hover:text-white light:hover:text-slate-900 transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* GitHub Repo */}
          <a
            href="https://github.com/abhy-kumar/filterer"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border border-white/10 dark:border-white/10 light:border-slate-200 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white light:hover:text-black hover:border-white/20 transition-all"
          >
            <GithubLogo className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
