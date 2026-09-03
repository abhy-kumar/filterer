import { useState, useEffect, useCallback, useRef } from 'react';

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  is_up: boolean;
}

interface CachedIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

/**
 * Index ticker.
 *
 * Reads the serverless endpoint in production and the static cache the Python
 * pipeline writes in development, where there is no serverless runtime. The
 * previous version shipped a hard-coded list of prices, never fetched on
 * mount, and read a `dataAsOf` field the API does not return - so the strip
 * showed invented numbers with a 2024 timestamp indefinitely.
 */
const SOURCES = ['/api/market_indices', '/data/market_indices.json'];

const MARKET_OPEN_MINUTES = 9 * 60 + 15;
const MARKET_CLOSE_MINUTES = 15 * 60 + 30;

function istNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 5.5);
}

function normalize(raw: unknown): MarketIndex[] | null {
  if (!raw || typeof raw !== 'object') return null;
  const list = (raw as { indices?: unknown }).indices;
  if (!Array.isArray(list)) return null;

  const indices = list
    .map((entry) => {
      const idx = entry as CachedIndex & { change_pct?: number };
      const changePct = typeof idx.changePct === 'number' ? idx.changePct : idx.change_pct;
      if (typeof idx.price !== 'number' || typeof changePct !== 'number') return null;
      return {
        symbol: idx.symbol,
        name: idx.name,
        price: idx.price,
        change: idx.change,
        change_pct: changePct,
        is_up: idx.change >= 0,
      };
    })
    .filter((i): i is MarketIndex => i !== null);

  return indices.length ? indices : null;
}

function readTimestamp(raw: unknown): string | null {
  const obj = raw as { lastUpdated?: string; last_updated?: string; dataAsOf?: string };
  return obj?.dataAsOf || obj?.lastUpdated || obj?.last_updated || null;
}

export function useMarketTicker() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [timeIST, setTimeIST] = useState('');
  const [dateIST, setDateIST] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashingIndex, setFlashingIndex] = useState<Record<string, 'up' | 'down'>>({});
  const [dataAsOf, setDataAsOf] = useState<string | null>(null);

  const indicesRef = useRef<MarketIndex[]>(indices);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    indicesRef.current = indices;
  }, [indices]);

  useEffect(() => {
    const updateTime = () => {
      const ist = istNow();
      const day = ist.getDay();
      const minutes = ist.getHours() * 60 + ist.getMinutes();

      setIsMarketOpen(day >= 1 && day <= 5 && minutes >= MARKET_OPEN_MINUTES && minutes <= MARKET_CLOSE_MINUTES);
      setTimeIST(
        ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST'
      );
      setDateIST(ist.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
    };

    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchIndices = useCallback(async () => {
    setIsRefreshing(true);

    for (const source of SOURCES) {
      try {
        const res = await fetch(source, { cache: 'no-store' });
        if (!res.ok) continue;
        const payload = await res.json();
        const next = normalize(payload);
        if (!next) continue;

        const flashes: Record<string, 'up' | 'down'> = {};
        for (const idx of next) {
          const previous = indicesRef.current.find((o) => o.name === idx.name);
          if (previous && previous.price !== idx.price) {
            flashes[idx.name] = idx.price > previous.price ? 'up' : 'down';
          }
        }

        setIndices(next);
        setDataAsOf(readTimestamp(payload));
        setError(null);
        setHasLoaded(true);
        setIsRefreshing(false);

        if (Object.keys(flashes).length) {
          setFlashingIndex(flashes);
          clearTimeout(flashTimer.current);
          flashTimer.current = setTimeout(() => setFlashingIndex({}), 1000);
        }
        return;
      } catch {
        // Try the next source.
      }
    }

    setError('Index feed unavailable');
    setHasLoaded(true);
    setIsRefreshing(false);
  }, []);

  // Load once on mount, then poll only while the market is open and the tab
  // is visible. Polling a static cache every 12 seconds around the clock, as
  // the previous version did, achieved nothing but requests.
  useEffect(() => {
    fetchIndices();
  }, [fetchIndices]);

  useEffect(() => {
    if (!isMarketOpen) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchIndices();
    }, 60000);
    return () => clearInterval(interval);
  }, [isMarketOpen, fetchIndices]);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  return {
    indices,
    isMarketOpen,
    timeIST,
    dateIST,
    dataAsOf,
    error,
    hasLoaded,
    isRefreshing,
    flashingIndex,
    refreshIndices: fetchIndices,
  };
}
