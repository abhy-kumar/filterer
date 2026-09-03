import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Hash, Compass, CornerDownLeft } from 'lucide-react';
import { STOCKS_DATA } from '../data/stocksData';
import { CURATED_SCREENS } from '../data/screens';
import { METRICS_DICTIONARY } from '../engine/metricsDictionary';
import { price, signClass } from '../lib/format';
import { screenPath, stockPath } from '../lib/routes';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  /** Receives a metric id, to append to the working query. */
  onInsertMetric?: (metricId: string) => void;
}

type Item =
  | { kind: 'stock'; id: string; symbol: string; name: string; sector: string; price: number; changePct: number }
  | { kind: 'screen'; id: string; title: string; description: string; query: string }
  | { kind: 'metric'; id: string; name: string; description: string; unit: string };

const SECTION_LABEL: Record<Item['kind'], { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  stock: { label: 'Companies', Icon: Building2 },
  screen: { label: 'Screens', Icon: Compass },
  metric: { label: 'Ratios', Icon: Hash },
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onInsertMetric }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSearchTerm('');
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [isOpen]);

  const query = searchTerm.toLowerCase().trim();

  const items = useMemo<Item[]>(() => {
    if (!isOpen) return [];

    const stocks = STOCKS_DATA
      .filter(
        (s) =>
          !query ||
          s.symbol.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query) ||
          s.sector.toLowerCase().includes(query)
      )
      // An exact ticker prefix is almost always what was meant.
      .sort((a, b) => {
        const rank = (s: typeof a) =>
          s.symbol.toLowerCase() === query ? 0 : s.symbol.toLowerCase().startsWith(query) ? 1 : 2;
        return rank(a) - rank(b) || b.market_cap - a.market_cap;
      })
      .slice(0, 6)
      .map<Item>((s) => ({
        kind: 'stock',
        id: `stock:${s.symbol}`,
        symbol: s.symbol,
        name: s.name,
        sector: s.sector,
        price: s.current_price,
        changePct: s.change_pct,
      }));

    const screens = CURATED_SCREENS
      .filter(
        (s) =>
          !query ||
          s.title.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
      )
      .slice(0, 4)
      .map<Item>((s) => ({ kind: 'screen', id: `screen:${s.id}`, title: s.title, description: s.description, query: s.query }));

    const metrics = METRICS_DICTIONARY
      .filter(
        (m) =>
          !query ||
          m.name.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          m.aliases.some((a) => a.includes(query))
      )
      .slice(0, 5)
      .map<Item>((m) => ({ kind: 'metric', id: `metric:${m.id}`, name: m.name, description: m.description, unit: m.unit }));

    return [...stocks, ...screens, ...metrics];
  }, [isOpen, query]);

  useEffect(() => setActiveIndex(0), [query]);

  const runItem = useCallback(
    (item: Item) => {
      if (item.kind === 'stock') navigate(stockPath(item.symbol));
      else if (item.kind === 'screen') navigate(screenPath(item.query));
      else onInsertMetric?.(item.id.replace(/^metric:/, ''));
      onClose();
    },
    [navigate, onClose, onInsertMetric]
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (items.length ? (i + 1) % items.length : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[activeIndex];
        if (item) runItem(item);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, items, activeIndex, onClose, runItem]);

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  let cursor = -1;
  const sections: Array<{ kind: Item['kind']; items: Item[] }> = [];
  for (const item of items) {
    const last = sections[sections.length - 1];
    if (last && last.kind === item.kind) last.items.push(item);
    else sections.push({ kind: item.kind, items: [item] });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh] animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="apple-card w-full max-w-xl overflow-hidden flex flex-col max-h-[70vh] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-3.5 h-12 border-b border-apple-border">
          <Search className="w-4 h-4 text-apple-faint shrink-0" />
          <input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${STOCKS_DATA.length} companies, screens and ratios`}
            className="w-full bg-transparent text-sm text-apple-primary placeholder-apple-faint focus:outline-none"
            aria-label="Search"
          />
        </div>

        <div ref={listRef} className="overflow-y-auto p-1.5 flex-1">
          {items.length === 0 ? (
            <p className="py-12 text-center text-xs text-apple-muted">
              Nothing matches “{searchTerm}”. Try a ticker, a screen name, or a ratio.
            </p>
          ) : (
            sections.map((section) => {
              const { label, Icon } = SECTION_LABEL[section.kind];
              return (
                <div key={section.kind} className="mb-1.5 last:mb-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-apple-faint">
                    <Icon className="w-3 h-3" />
                    {label}
                  </div>

                  {section.items.map((item) => {
                    cursor += 1;
                    const index = cursor;
                    const active = index === activeIndex;

                    return (
                      <button
                        key={item.id}
                        data-active={active}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => runItem(item)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-3 transition-colors ${
                          active ? 'bg-apple-blue-subtle' : ''
                        }`}
                      >
                        {item.kind === 'stock' && (
                          <>
                            <span className="flex items-baseline gap-2.5 min-w-0">
                              <span className="font-mono text-xs font-semibold text-apple-blue shrink-0">{item.symbol}</span>
                              <span className="text-xs text-apple-primary truncate">{item.name}</span>
                            </span>
                            <span className="flex items-baseline gap-2.5 font-mono text-xs shrink-0">
                              <span className="text-apple-primary">{price(item.price)}</span>
                              <span className={`${signClass(item.changePct)} w-14 text-right`}>
                                {item.changePct >= 0 ? '+' : ''}
                                {item.changePct.toFixed(2)}%
                              </span>
                            </span>
                          </>
                        )}

                        {item.kind === 'screen' && (
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold text-apple-primary">{item.title}</span>
                            <span className="block text-[11px] text-apple-muted truncate mt-0.5">{item.description}</span>
                          </span>
                        )}

                        {item.kind === 'metric' && (
                          <>
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold text-apple-primary">{item.name}</span>
                              <span className="block text-[11px] text-apple-muted truncate mt-0.5">{item.description}</span>
                            </span>
                            <span className="text-[10px] font-mono text-apple-faint shrink-0">{item.unit}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="px-3.5 py-2 border-t border-apple-border flex items-center gap-4 text-[10px] text-apple-faint">
          <span className="flex items-center gap-1">
            <kbd className="font-mono">↑</kbd>
            <kbd className="font-mono">↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" /> open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono">esc</kbd> dismiss
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};
