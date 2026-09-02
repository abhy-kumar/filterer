import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Check,
  Compass
} from 'lucide-react';
import { ScreenFilter } from '../types/stock';
import { CURATED_SCREENS } from '../data/screens';

interface PresetScreensProps {
  onSelectScreen?: (screen: ScreenFilter) => void;
  onRunScreen?: (query: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck className="w-4 h-4 text-apple-green" />,
  Sparkles: <Zap className="w-4 h-4 text-apple-amber" />,
  TrendingUp: <TrendingUp className="w-4 h-4 text-apple-blue" />,
  Gem: <Gem className="w-4 h-4 text-apple-indigo" />,
  Zap: <Zap className="w-4 h-4 text-apple-amber" />,
  Landmark: <Landmark className="w-4 h-4 text-apple-blue" />,
  Award: <Award className="w-4 h-4 text-apple-indigo" />,
  Coins: <Coins className="w-4 h-4 text-apple-green" />,
  PiggyBank: <PiggyBank className="w-4 h-4 text-apple-red" />,
  Flame: <Flame className="w-4 h-4 text-apple-amber" />,
  Activity: <Activity className="w-4 h-4 text-apple-blue" />,
  CheckCircle: <CheckCircle className="w-4 h-4 text-apple-green" />,
};

export const PresetScreens: React.FC<PresetScreensProps> = ({
  onSelectScreen,
  onRunScreen,
}) => {
  const navigate = useNavigate();
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
      {/* Category Tabs & Section Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-apple-primary font-display flex items-center gap-2">
            <Compass className="w-5 h-5 text-apple-blue" />
            Curated Investment Strategies
          </h2>
          <p className="text-xs text-apple-muted mt-1">
            Pre-configured valuation models and quantitative screens for Indian equities.
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
            onClick={() => {
              navigate(`/screen?q=${encodeURIComponent(screen.query)}`);
              if (onSelectScreen) onSelectScreen(screen);
            }}
            className="apple-card p-5 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-apple-subtle border border-apple-border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {iconMap[screen.iconName] || <Zap className="w-4 h-4 text-apple-blue" />}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-apple-subtle text-[10px] font-mono text-apple-muted uppercase tracking-wider border border-apple-border-subtle">
                  {screen.category}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-semibold text-apple-primary group-hover:text-apple-blue transition-colors">
                {screen.title}
              </h3>
              <p className="text-xs text-apple-secondary mt-1.5 line-clamp-2 leading-relaxed">
                {screen.description}
              </p>

              {/* Query Box */}
              <div className="mt-3.5 p-2.5 rounded-xl bg-apple-subtle border border-apple-border-subtle font-mono text-[11px] text-apple-secondary line-clamp-2 leading-relaxed">
                {screen.query}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-5 pt-3.5 border-t border-apple-border-subtle flex items-center justify-between gap-2">
              <span className="text-[11px] text-apple-muted font-medium">
                {screen.author || 'Quant Model'}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => handleCopy(screen.id, screen.query, e)}
                  className="p-1.5 rounded-lg bg-apple-subtle hover:bg-apple-surface-active text-apple-muted hover:text-apple-primary border border-apple-border transition-all text-xs"
                  title="Copy Query"
                  aria-label="Copy Query Formula"
                >
                  {copiedId === screen.id ? <Check className="w-3.5 h-3.5 text-apple-green" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/screen?q=${encodeURIComponent(screen.query)}`);
                    if (onRunScreen) onRunScreen(screen.query);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-apple-blue hover:opacity-90 text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
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
