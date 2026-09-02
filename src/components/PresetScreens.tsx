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
  ShieldCheck: <ShieldCheck className="w-5 h-5 text-[#30d158]" />,
  Sparkles: <Sparkles className="w-5 h-5 text-[#ff9f0a]" />,
  TrendingUp: <TrendingUp className="w-5 h-5 text-[#2997ff]" />,
  Gem: <Gem className="w-5 h-5 text-[#5e5ce6]" />,
  Zap: <Zap className="w-5 h-5 text-[#ffd60a]" />,
  Landmark: <Landmark className="w-5 h-5 text-[#64d2ff]" />,
  Award: <Award className="w-5 h-5 text-[#bf5af2]" />,
  Coins: <Coins className="w-5 h-5 text-[#30d158]" />,
  PiggyBank: <PiggyBank className="w-5 h-5 text-[#ff375f]" />,
  Flame: <Flame className="w-5 h-5 text-[#ff9f0a]" />,
  Activity: <Activity className="w-5 h-5 text-[#64d2ff]" />,
  CheckCircle: <CheckCircle className="w-5 h-5 text-[#30d158]" />,
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
    <div className="w-full mb-10">
      {/* Category Tabs */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2997ff]" />
            Curated Screen Strategies
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Proven quantitative investment formulas and screening rules for Indian equities.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center apple-segmented p-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`apple-segmented-item ${
                selectedCategory === cat ? 'active' : ''
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
            className="apple-card p-5 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.04] dark:bg-white/[0.04] light:bg-black/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {iconMap[screen.iconName] || <Sparkles className="w-5 h-5 text-[#2997ff]" />}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  {screen.category}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-semibold text-white dark:text-white light:text-slate-900 group-hover:text-[#2997ff] transition-colors">
                {screen.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                {screen.description}
              </p>

              {/* Query Box */}
              <div className="mt-3.5 p-2.5 rounded-xl bg-black/40 border border-white/[0.04] font-mono text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {screen.query}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-medium">
                By {screen.author || 'Quant Team'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleCopy(screen.id, screen.query, e)}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all text-xs border border-white/[0.06]"
                  title="Copy Query"
                >
                  {copiedId === screen.id ? <Check className="w-3.5 h-3.5 text-[#30d158]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunScreen(screen.query);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2997ff]/15 hover:bg-[#2997ff] text-[#2997ff] hover:text-white border border-[#2997ff]/30 text-xs font-semibold transition-all shadow-xs"
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
