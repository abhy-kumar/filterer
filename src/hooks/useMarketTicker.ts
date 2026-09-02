import { useState, useEffect, useCallback, useRef } from 'react';

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  is_up: boolean;
}

const INITIAL_INDICES: MarketIndex[] = [
  { symbol: '^NSEI', name: 'NIFTY 50', price: 24862.35, change: 128.45, change_pct: 0.52, is_up: true },
  { symbol: '^BSESN', name: 'SENSEX', price: 81498.70, change: 395.20, change_pct: 0.49, is_up: true },
  { symbol: '^NSEBANK', name: 'NIFTY BANK', price: 53340.80, change: 260.15, change_pct: 0.49, is_up: true },
  { symbol: '^CNXIT', name: 'NIFTY IT', price: 38910.40, change: -85.60, change_pct: -0.22, is_up: false },
  { symbol: 'NIFTY_MIDCAP', name: 'NIFTY MIDCAP', price: 58450.20, change: 425.80, change_pct: 0.73, is_up: true },
  { symbol: 'NIFTY_AUTO', name: 'NIFTY AUTO', price: 25840.10, change: 310.50, change_pct: 1.22, is_up: true },
  { symbol: 'NIFTY_PHARMA', name: 'NIFTY PHARMA', price: 22480.90, change: 185.30, change_pct: 0.83, is_up: true },
];

export function useMarketTicker() {
  const [indices, setIndices] = useState<MarketIndex[]>(INITIAL_INDICES);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [timeIST, setTimeIST] = useState('');
  const [dateIST, setDateIST] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [flashingIndex, setFlashingIndex] = useState<Record<string, 'up' | 'down'>>({});
  const indicesRef = useRef<MarketIndex[]>(indices);

  useEffect(() => {
    indicesRef.current = indices;
  }, [indices]);

  // Update IST clock & Open/Closed status every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istDate = new Date(utc + (3600000 * 5.5));
      
      const day = istDate.getDay();
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const timeInMinutes = hours * 60 + minutes;
      
      // Mon-Fri 9:15 AM to 3:30 PM IST
      const open = day >= 1 && day <= 5 && timeInMinutes >= 555 && timeInMinutes <= 930;
      setIsMarketOpen(open);
      
      setTimeIST(
        istDate.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' IST'
      );
      
      setDateIST(
        istDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const [dataAsOf, setDataAsOf] = useState<string>('2024-03-15 15:30:00 IST');

  // Fetch live index data
  const fetchIndices = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/market_indices');
      if (res.ok) {
        const data = await res.json();
        if (data && data.indices && Array.isArray(data.indices)) {
          // Detect price changes for flash highlights
          const newFlashes: Record<string, 'up' | 'down'> = {};
          data.indices.forEach((idx: MarketIndex) => {
            const old = indicesRef.current.find((o) => o.name === idx.name);
            if (old && old.price !== idx.price) {
              newFlashes[idx.name] = idx.price > old.price ? 'up' : 'down';
            }
          });

          setIndices(data.indices);
          if (data.dataAsOf) setDataAsOf(data.dataAsOf);
          
          if (Object.keys(newFlashes).length > 0) {
            setFlashingIndex(newFlashes);
            setTimeout(() => setFlashingIndex({}), 1000);
          }
          setIsRefreshing(false);
          return;
        }
      }
    } catch {}

    setIsRefreshing(false);
  }, []);

  // Continuous live polling every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchIndices();
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [fetchIndices]);

  return {
    indices,
    isMarketOpen,
    timeIST,
    dateIST,
    dataAsOf,
    isRefreshing,
    flashingIndex,
    refreshIndices: fetchIndices,
  };
}
