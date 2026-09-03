import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Watchlist } from '../types/stock';

const WATCHLISTS_STORAGE_KEY = 'filterer_custom_watchlists';

const DEFAULT_WATCHLISTS: Watchlist[] = [
  {
    id: 'wl-compounders',
    name: 'Compounders',
    description: 'High ROCE, low debt consistent wealth creators',
    symbols: ['TITAN', 'TCS', 'ASIANPAINT', 'HDFCBANK', 'PIDILITIND'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wl-dividend',
    name: 'High Dividend',
    description: 'Generous cash returns and dividend yields > 4%',
    symbols: ['COALINDIA', 'VEDL', 'IOC', 'PFC', 'RECLTD'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'wl-turnaround',
    name: 'Turnarounds',
    description: 'Operational inflections and balance sheet cleanups',
    symbols: ['TATAMOTORS', 'SUZLON', 'ZOMATO', 'BHEL'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface WatchlistContextType {
  watchlists: Watchlist[];
  activeWatchlistId: string;
  setActiveWatchlistId: (id: string) => void;
  createWatchlist: (name: string, description?: string, initialSymbols?: string[]) => Watchlist;
  renameWatchlist: (id: string, newName: string) => void;
  deleteWatchlist: (id: string) => void;
  addStockToWatchlist: (watchlistId: string, symbol: string) => void;
  removeStockFromWatchlist: (watchlistId: string, symbol: string) => void;
  toggleStockInWatchlist: (watchlistId: string, symbol: string) => void;
  isStockInWatchlist: (watchlistId: string, symbol: string) => boolean;
  getWatchlistsForStock: (symbol: string) => Watchlist[];
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(() => {
    try {
      const stored = localStorage.getItem(WATCHLISTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore parse errors, fallback to defaults
    }
    return DEFAULT_WATCHLISTS;
  });

  const [activeWatchlistId, setActiveWatchlistId] = useState<string>(() => {
    return watchlists[0]?.id || 'wl-compounders';
  });

  useEffect(() => {
    try {
      localStorage.setItem(WATCHLISTS_STORAGE_KEY, JSON.stringify(watchlists));
    } catch {
      // Private mode or storage quota
    }
  }, [watchlists]);

  // Keep activeWatchlistId valid
  useEffect(() => {
    if (!watchlists.some((w) => w.id === activeWatchlistId) && watchlists.length > 0) {
      setActiveWatchlistId(watchlists[0].id);
    }
  }, [watchlists, activeWatchlistId]);

  const createWatchlist = useCallback((name: string, description?: string, initialSymbols: string[] = []): Watchlist => {
    const newWl: Watchlist = {
      id: `wl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || 'Untitled Watchlist',
      description: description?.trim() || '',
      symbols: initialSymbols.map((s) => s.toUpperCase()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWatchlists((prev) => [...prev, newWl]);
    setActiveWatchlistId(newWl.id);
    return newWl;
  }, []);

  const renameWatchlist = useCallback((id: string, newName: string) => {
    if (!newName.trim()) return;
    setWatchlists((prev) =>
      prev.map((wl) =>
        wl.id === id
          ? { ...wl, name: newName.trim(), updatedAt: new Date().toISOString() }
          : wl
      )
    );
  }, []);

  const deleteWatchlist = useCallback((id: string) => {
    setWatchlists((prev) => {
      const next = prev.filter((wl) => wl.id !== id);
      return next.length > 0 ? next : DEFAULT_WATCHLISTS;
    });
  }, []);

  const addStockToWatchlist = useCallback((watchlistId: string, symbol: string) => {
    const sym = symbol.toUpperCase().trim();
    setWatchlists((prev) =>
      prev.map((wl) => {
        if (wl.id !== watchlistId) return wl;
        if (wl.symbols.includes(sym)) return wl;
        return {
          ...wl,
          symbols: [...wl.symbols, sym],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const removeStockFromWatchlist = useCallback((watchlistId: string, symbol: string) => {
    const sym = symbol.toUpperCase().trim();
    setWatchlists((prev) =>
      prev.map((wl) => {
        if (wl.id !== watchlistId) return wl;
        return {
          ...wl,
          symbols: wl.symbols.filter((s) => s !== sym),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const toggleStockInWatchlist = useCallback((watchlistId: string, symbol: string) => {
    const sym = symbol.toUpperCase().trim();
    setWatchlists((prev) =>
      prev.map((wl) => {
        if (wl.id !== watchlistId) return wl;
        const exists = wl.symbols.includes(sym);
        return {
          ...wl,
          symbols: exists ? wl.symbols.filter((s) => s !== sym) : [...wl.symbols, sym],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const isStockInWatchlist = useCallback(
    (watchlistId: string, symbol: string): boolean => {
      const sym = symbol.toUpperCase().trim();
      const wl = watchlists.find((w) => w.id === watchlistId);
      return wl ? wl.symbols.includes(sym) : false;
    },
    [watchlists]
  );

  const getWatchlistsForStock = useCallback(
    (symbol: string): Watchlist[] => {
      const sym = symbol.toUpperCase().trim();
      return watchlists.filter((w) => w.symbols.includes(sym));
    },
    [watchlists]
  );

  return (
    <WatchlistContext.Provider
      value={{
        watchlists,
        activeWatchlistId,
        setActiveWatchlistId,
        createWatchlist,
        renameWatchlist,
        deleteWatchlist,
        addStockToWatchlist,
        removeStockFromWatchlist,
        toggleStockInWatchlist,
        isStockInWatchlist,
        getWatchlistsForStock,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlists = (): WatchlistContextType => {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error('useWatchlists must be used within a WatchlistProvider');
  }
  return ctx;
};
