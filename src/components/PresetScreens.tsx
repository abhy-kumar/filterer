import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Gem,
  Zap,
  Landmark,
  Award,
  Coins,
  PiggyBank,
  Flame,
  Activity,
  CheckCircle,
  Play,
  Copy,
  Check
} from 'lucide-react';
import { ScreenFilter } from '../types/stock';
import { CURATED_SCREENS } from '../data/screens';

interface PresetScreensProps {
  onSelectScreen: (screen: ScreenFilter) => void;
  onRunScreen: (query: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
  Sparkles: <Sparkles className="w-5 h-5 text-amber-400" />,
  TrendingUp: <TrendingUp className="w-5 h-5 text-sky-400" />,
  Gem: <Gem className="w-5 h-5 text-indigo-400" />,
  Zap: <Zap className="w-5 h-5 text-yellow-400" />,
  Landmark: <Landmark className="w-5 h-5 text-blue-400" />,
  Award: <Award className="w-5 h-5 text-purple-400" />,
  Coins: <Coins className="w-5 h-5 text-emerald-400" />,
  PiggyBank: <PiggyBank className="w-5 h-5 text-rose-400" />,
  Flame: <Flame className="w-5 h-5 text-orange-400" />,
  Activity: <Activity className="w-5 h-5 text-cyan-400" />,
  CheckCircle: <CheckCircle className="w-5 h-5 text-teal-400" />,
};

export const PresetScreens: React.FC<PresetScreensProps> = ({
  onSelectScreen,
  onRunScreen,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Popular', 'Valuation', 'Growth', 'Technicals', 'Safety', 'Dividends'];

  const filteredScreens = selectedCategory === 'All'
    ? CURATED_SCREENS
    : CURATED_SCREENS.filter((s) => s.category === selectedCategory);

  const handleCopy = (id: string, query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(query);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full mb-8">
      {/* Category Tabs */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            Curated Stock Screens
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Proven quantitative investment formulas and screening criteria for Indian equities.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 p-1.5 rounded-xl border border-white/5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30 font-semibold'
                  : 'text-slate-400 hover:text-white light:text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Screen Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScreens.map((screen) => (
          <div
            key={screen.id}
            onClick={() => onSelectScreen(screen)}
            className="group relative bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 p-5 hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/5 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {iconMap[screen.iconName] || <Sparkles className="w-5 h-5 text-sky-400" />}
                </div>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  {screen.category}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900 group-hover:text-sky-400 transition-colors">
                {screen.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                {screen.description}
              </p>

              {/* Query Pill */}
              <div className="mt-3.5 p-2 rounded-lg bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 border border-white/5 font-mono text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {screen.query}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-medium">
                By {screen.author || 'Quant Team'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleCopy(screen.id, screen.query, e)}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-xs border border-white/5"
                  title="Copy Query"
                >
                  {copiedId === screen.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunScreen(screen.query);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/20 text-xs font-bold transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
