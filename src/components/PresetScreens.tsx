import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, TrendingUp, Gem, Zap, Landmark, Award, Coins, PiggyBank,
  Flame, Activity, CheckCircle, Sparkles, Copy, Check,
} from 'lucide-react';
import { CURATED_SCREENS } from '../data/screens';
import { executeScreenerQuery } from '../engine/screenerParser';
import type { Stock } from '../types/stock';
import { screenPath } from '../lib/routes';

interface PresetScreensProps {
  onRunScreen?: (query: string) => void;
  universe: Stock[];
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck, Sparkles, TrendingUp, Gem, Zap, Landmark, Award, Coins, PiggyBank, Flame, Activity, CheckCircle,
};

const CATEGORIES = ['All', 'Popular', 'Valuation', 'Growth', 'Technicals', 'Safety', 'Dividends'];

export const PresetScreens: React.FC<PresetScreensProps> = ({ onRunScreen, universe }) => {
  const [category, setCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Showing the hit count on the card is the difference between a list of
  // slogans and a list of screens someone can choose between.
  const screens = useMemo(
    () =>
      CURATED_SCREENS.map((screen) => ({
        ...screen,
        matches: executeScreenerQuery(screen.query, universe).matches.length,
      })),
    [universe]
  );

  const filtered = category === 'All' ? screens : screens.filter((s) => s.category === category);

  const copy = (id: string, query: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(query);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-apple-primary font-display">Popular Screens</h2>
          <p className="text-xs text-apple-muted mt-1">
            Pre-built screens for value, growth, debt-free, and dividend stocks.
          </p>
        </div>

        <div className="apple-segmented overflow-x-auto no-scrollbar max-w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`apple-segmented-item ${category === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((screen) => {
          const Icon = ICONS[screen.iconName] ?? Sparkles;
          return (
            <Link
              key={screen.id}
              to={screenPath(screen.query)}
              onClick={() => onRunScreen?.(screen.query)}
              className="apple-card apple-card-interactive p-4 flex flex-col group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 text-apple-blue shrink-0" />
                  <h3 className="text-sm font-semibold text-apple-primary group-hover:text-apple-blue transition-colors truncate">
                    {screen.title}
                  </h3>
                </div>
                <span
                  className={`text-xs font-mono tabular-nums shrink-0 ${
                    screen.matches === 0 ? 'text-apple-faint' : 'text-apple-primary'
                  }`}
                  title={`${screen.matches} of ${universe.length} companies match`}
                >
                  {screen.matches}
                </span>
              </div>

              <p className="text-xs text-apple-secondary mt-2 leading-relaxed line-clamp-3">
                {screen.description}
              </p>

              <div className="mt-auto pt-3.5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-apple-faint truncate">{screen.author}</span>
                <button
                  onClick={(e) => copy(screen.id, screen.query, e)}
                  className="apple-btn apple-btn-quiet p-1 text-apple-faint hover:text-apple-primary"
                  title="Copy the formula"
                  aria-label={`Copy the formula for ${screen.title}`}
                >
                  {copiedId === screen.id ? (
                    <Check className="w-3.5 h-3.5 num-pos" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
