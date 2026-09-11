import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { chunkOf } from '../lib/quoteUniverse';
import { isIndianMarketOpen } from '../lib/marketHours';
import type { LiveQuote } from '../lib/liveStock';

/**
 * One poller for the whole app.
 *
 * Components say which symbols they are showing; the provider works out which
 * fixed chunks those fall in (see src/lib/quoteUniverse.ts), fetches each chunk
 * once however many components want it, and polls only while the market is
 * open and the tab is visible. With the market closed it fetches once, for the
 * official close, and stops.
 *
 * If /api/quotes does not exist — a static host with no functions — the first
 * 404 switches live quotes off for the session and the app shows its bundled
 * prices, labelled as such.
 */

/**
 * Every poll is a request to the host, and a free hosting plan counts them. At
 * 30 seconds one reader with the market open makes about 750 a day; the CDN
 * caches for 20, so polling faster would mostly re-read the same response.
 */
const POLL_MS = 30_000;

export interface LiveStatus {
  /** False when the quote endpoint is unavailable on this deployment. */
  available: boolean;
  marketOpen: boolean;
  /** Newest trade time across the quotes held, epoch ms. */
  asOf: number | null;
  lastFetched: number | null;
  error: string | null;
}

interface LiveQuotesValue {
  quotes: Record<string, LiveQuote>;
  status: LiveStatus;
  subscribe: (symbols: string[]) => () => void;
}

const LiveQuotesContext = createContext<LiveQuotesValue | null>(null);

export const LiveQuotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [status, setStatus] = useState<LiveStatus>({
    available: true,
    marketOpen: isIndianMarketOpen(),
    asOf: null,
    lastFetched: null,
    error: null,
  });
  const [wantedVersion, setWantedVersion] = useState(0);

  const refCounts = useRef(new Map<number, number>());
  const fetchedChunks = useRef(new Set<number>());
  const inFlight = useRef(new Set<number>());
  const available = useRef(true);

  const subscribe = useCallback((symbols: string[]) => {
    const chunks = Array.from(new Set(symbols.map(chunkOf).filter((c) => c >= 0)));
    let added = false;
    for (const c of chunks) {
      const n = refCounts.current.get(c) ?? 0;
      refCounts.current.set(c, n + 1);
      if (n === 0) added = true;
    }
    if (added) setWantedVersion((v) => v + 1);

    return () => {
      for (const c of chunks) {
        const n = (refCounts.current.get(c) ?? 1) - 1;
        if (n <= 0) refCounts.current.delete(c);
        else refCounts.current.set(c, n);
      }
    };
  }, []);

  const fetchChunks = useCallback(async (chunks: number[]) => {
    const todo = chunks.filter((c) => !inFlight.current.has(c));
    if (!todo.length || !available.current) return;
    todo.forEach((c) => inFlight.current.add(c));

    // A view spanning many chunks asks for all of them at once. Every poll is a
    // request to the host and a free plan counts them; a results table used to
    // cost seventeen per poll.
    const ALL_CHUNKS_FROM = 4;
    const requests: Array<{ key: string; covers: number[] }> =
      todo.length >= ALL_CHUNKS_FROM ? [{ key: 'all', covers: todo }] : todo.map((c) => ({ key: String(c), covers: [c] }));

    const results = await Promise.all(
      requests.map(async ({ key, covers }) => {
        try {
          const res = await fetch(`/api/quotes?chunk=${key}`);
          if (res.status === 404) {
            available.current = false;
            return { covers, error: 'unavailable' };
          }
          if (!res.ok) return { covers, error: `HTTP ${res.status}` };
          const type = res.headers.get('content-type') || '';
          // An SPA fallback answers an unknown path with index.html and a 200.
          if (!type.includes('json')) {
            available.current = false;
            return { covers, error: 'unavailable' };
          }
          const body = await res.json();
          return { covers, quotes: (body.quotes ?? {}) as Record<string, LiveQuote> };
        } catch (err) {
          return { covers, error: err instanceof Error ? err.message : 'network error' };
        } finally {
          covers.forEach((c) => inFlight.current.delete(c));
        }
      })
    );

    const merged: Record<string, LiveQuote> = {};
    let error: string | null = null;
    for (const r of results) {
      if ('quotes' in r && r.quotes) {
        Object.assign(merged, r.quotes);
        r.covers.forEach((c) => fetchedChunks.current.add(c));
      } else if (r.error) {
        error = r.error;
      }
    }

    if (Object.keys(merged).length) {
      setQuotes((prev) => {
        const next = { ...prev };
        for (const [symbol, quote] of Object.entries(merged)) {
          // Never replace a quote with an older one.
          if (!prev[symbol] || quote.time >= prev[symbol].time) next[symbol] = quote;
        }
        return next;
      });
    }

    setStatus((prev) => {
      const times = Object.values(merged).map((q) => q.time);
      return {
        available: available.current,
        marketOpen: isIndianMarketOpen(),
        asOf: times.length ? Math.max(prev.asOf ?? 0, ...times) : prev.asOf,
        lastFetched: Object.keys(merged).length ? Date.now() : prev.lastFetched,
        error: available.current ? error : null,
      };
    });
  }, []);

  // New chunks: fetch straight away rather than waiting for the next tick.
  useEffect(() => {
    const pending = Array.from(refCounts.current.keys()).filter((c) => !fetchedChunks.current.has(c));
    if (!pending.length) return;
    const timer = setTimeout(() => fetchChunks(pending), 120);
    return () => clearTimeout(timer);
  }, [wantedVersion, fetchChunks]);

  // Poll the chunks in view while the market is open.
  useEffect(() => {
    const tick = () => {
      const open = isIndianMarketOpen();
      setStatus((prev) => (prev.marketOpen === open ? prev : { ...prev, marketOpen: open }));
      if (!open || document.visibilityState !== 'visible') return;
      fetchChunks(Array.from(refCounts.current.keys()));
    };
    const interval = setInterval(tick, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchChunks]);

  const value = useMemo(() => ({ quotes, status, subscribe }), [quotes, status, subscribe]);
  return <LiveQuotesContext.Provider value={value}>{children}</LiveQuotesContext.Provider>;
};

function useLiveContext(): LiveQuotesValue {
  const ctx = useContext(LiveQuotesContext);
  if (!ctx) throw new Error('useLiveQuotes must be used within a LiveQuotesProvider');
  return ctx;
}

/** Live quotes for the given symbols. Symbols without a quote are simply absent. */
export function useLiveQuotes(symbols: readonly string[]): Record<string, LiveQuote> {
  const { quotes, subscribe } = useLiveContext();
  const key = useMemo(() => Array.from(new Set(symbols.map((s) => s.toUpperCase()))).sort().join(','), [symbols]);

  useEffect(() => {
    if (!key) return;
    return subscribe(key.split(','));
  }, [key, subscribe]);

  return useMemo(() => {
    const out: Record<string, LiveQuote> = {};
    for (const s of key ? key.split(',') : []) if (quotes[s]) out[s] = quotes[s];
    return out;
  }, [quotes, key]);
}

export function useLiveQuote(symbol: string | undefined): LiveQuote | undefined {
  const symbols = useMemo(() => (symbol ? [symbol] : []), [symbol]);
  return useLiveQuotes(symbols)[symbol?.toUpperCase() ?? ''];
}

export function useLiveStatus(): LiveStatus {
  return useLiveContext().status;
}
