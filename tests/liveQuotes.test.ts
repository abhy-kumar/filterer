import { describe, it, expect } from 'vitest';
import { cacheHeaders, handleQuotes, quoteFromBse, quoteFromSpark, requestedSymbols } from '../api/_lib/quotes';
import { chunkCount, chunkOf, chunkSymbols, quoteSymbols, QUOTE_CHUNK_SIZE } from '../src/lib/quoteUniverse';
import { applyLiveQuote, type LiveQuote } from '../src/lib/liveStock';
import { STOCKS_DATA } from '../src/data/stocksData';
import type { Stock } from '../src/types/stock';

describe('quote sources', () => {
  it('reads a Yahoo spark result', () => {
    const quote = quoteFromSpark('TCS', {
      symbol: 'TCS.NS',
      response: [
        {
          meta: {
            regularMarketPrice: 2215.6,
            previousClose: 2204.1,
            chartPreviousClose: 2190,
            regularMarketDayHigh: 2232.6,
            regularMarketDayLow: 2185.5,
            regularMarketVolume: 666909,
            regularMarketTime: 1789100192,
          },
        },
      ],
    });
    expect(quote).toMatchObject({
      symbol: 'TCS',
      price: 2215.6,
      previousClose: 2204.1,
      change: 11.5,
      changePct: 0.52,
      volume: 666909,
      time: 1789100192000,
      source: 'yahoo',
    });
  });

  it('refuses a spark result with no usable price', () => {
    expect(quoteFromSpark('X', { response: [{ meta: { regularMarketPrice: 0 } }] })).toBeNull();
    expect(quoteFromSpark('X', {})).toBeNull();
  });

  it('reads BSE figures, which arrive as strings with separators', () => {
    const quote = quoteFromBse('RELIANCE', { CurrRate: { LTP: '1,260.00', Chg: '-15.00', PcChg: '-1.18' } }, 42);
    expect(quote).toMatchObject({ price: 1260, change: -15, changePct: -1.18, previousClose: 1275, time: 42, source: 'bse' });
  });

  it('caches for seconds while the market is open and for minutes once it closes', () => {
    expect(cacheHeaders(true)['Cache-Control']).toContain('s-maxage=20');
    expect(cacheHeaders(false)['Cache-Control']).toContain('s-maxage=900');
  });

  it('reads the chunk parameter, including all, without calling upstream', () => {
    expect(requestedSymbols(new URLSearchParams({ chunk: '0' }))).toEqual(chunkSymbols(0));
    expect(requestedSymbols(new URLSearchParams({ chunk: 'all' }))).toHaveLength(quoteSymbols().length);
    // Number('') is 0, which must not quietly serve the first chunk.
    expect(requestedSymbols(new URLSearchParams({ chunk: '' }))).toBeNull();
    expect(requestedSymbols(new URLSearchParams({ chunk: '1.5' }))).toBeNull();
    expect(requestedSymbols(new URLSearchParams())).toBeNull();
  });

  it('rejects a request outside the chunk range without calling upstream', async () => {
    expect((await handleQuotes(new URLSearchParams())).status).toBe(400);
    expect((await handleQuotes(new URLSearchParams({ chunk: String(chunkCount()) }))).status).toBe(400);
    expect((await handleQuotes(new URLSearchParams({ chunk: 'RELIANCE' }))).status).toBe(400);
  });
});

describe('quote chunks', () => {
  it('put every symbol in exactly one chunk of at most the batch size', () => {
    const seen = new Set<string>();
    for (let c = 0; c < chunkCount(); c++) {
      const symbols = chunkSymbols(c);
      expect(symbols.length).toBeGreaterThan(0);
      expect(symbols.length).toBeLessThanOrEqual(QUOTE_CHUNK_SIZE);
      for (const s of symbols) {
        expect(seen.has(s)).toBe(false);
        seen.add(s);
        expect(chunkOf(s)).toBe(c);
      }
    }
    expect(seen.size).toBe(quoteSymbols().length);
  });

  it('puts the largest companies in the first chunk', () => {
    // Views that show many prices mostly sort by market cap, so this keeps a
    // page of results within a few chunks.
    const byCap = new Map(STOCKS_DATA.map((s) => [s.symbol.toUpperCase(), s.market_cap || 0]));
    const smallestInFirst = Math.min(...chunkSymbols(0).map((s) => byCap.get(s)!));
    const largestInSecond = Math.max(...chunkSymbols(1).map((s) => byCap.get(s)!));
    expect(smallestInFirst).toBeGreaterThanOrEqual(largestInSecond);
  });

  it('serves nothing outside the universe', () => {
    expect(chunkOf('NOT-A-LISTED-COMPANY')).toBe(-1);
    expect(chunkSymbols(-1)).toEqual([]);
  });
});

describe('applying a live quote', () => {
  const base = {
    symbol: 'ABC',
    current_price: 100,
    change: 1,
    change_pct: 1.01,
    market_cap: 5000,
    eps: 5,
    book_value: 40,
    pe_ratio: 20,
    pb_ratio: 2.5,
    high_52w: 110,
    low_52w: 80,
    distance_52w_high: -9.09,
    distance_52w_low: 25,
  } as unknown as Stock;

  const quote = (overrides: Partial<LiveQuote>): LiveQuote => ({
    symbol: 'ABC',
    price: 120,
    change: 20,
    changePct: 20,
    previousClose: 100,
    dayHigh: 121,
    dayLow: 99,
    volume: 1,
    time: 1,
    source: 'yahoo',
    ...overrides,
  });

  it('moves the figures that follow the price, as the scheduled refresh does', () => {
    const live = applyLiveQuote(base, quote({}));
    expect(live.current_price).toBe(120);
    expect(live.market_cap).toBe(6000);
    expect(live.pe_ratio).toBe(24);
    expect(live.pb_ratio).toBe(3);
    // A new high widens the band rather than leaving the price outside it.
    expect(live.high_52w).toBe(121);
    expect(live.distance_52w_high).toBeCloseTo(-0.83, 2);
  });

  it('leaves the stock untouched without a quote or when nothing moved', () => {
    expect(applyLiveQuote(base, undefined)).toBe(base);
    expect(applyLiveQuote(base, quote({ price: 100, change: 1 }))).toBe(base);
  });

  it('does not invent a P/E for a loss-making company', () => {
    const lossMaking = { ...base, eps: -2, pe_ratio: null } as unknown as Stock;
    expect(applyLiveQuote(lossMaking, quote({})).pe_ratio).toBeNull();
  });
});
