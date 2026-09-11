import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { bseCodeOf, chunkCount, chunkSymbols, QUOTE_CHUNK_SIZE } from '../../src/lib/quoteUniverse';
import { isIndianMarketOpen, istNow } from '../../src/lib/marketHours';

/**
 * Live quotes, shared by the Vercel functions in api/ and the Vite dev server
 * (vite.config.ts), so production and development cannot drift apart.
 *
 * The app's prices used to change three times a trading day: a GitHub Action
 * rewrote the bundled data and redeployed. The ticker polled every minute, but
 * it polled a file that only changed on those three runs.
 *
 * Sources, in order:
 *   1. Yahoo's spark endpoint: up to 20 symbols a call, about 200 ms, no key.
 *   2. BSE's quote API, for any symbol Yahoo leaves out.
 *
 * Both are unofficial and free. Responses are cached at the CDN (see
 * cacheHeaders), so the number of upstream calls depends on how many chunks
 * are being viewed, not on how many people are viewing them.
 */

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  /** Epoch milliseconds of the last trade the source reported. */
  time: number;
  source: 'yahoo' | 'bse';
}

export interface ApiResult {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36';
const SPARK_URL = 'https://query1.finance.yahoo.com/v7/finance/spark';
const BSE_QUOTE_URL = 'https://api.bseindia.com/BseIndiaAPI/api/getScripHeaderData/w?Debtflag=&seriesid=&scripcode=';
const UPSTREAM_TIMEOUT_MS = 4000;
/** Yahoo rejects a spark call with more than 20 symbols. */
const SPARK_BATCH = 20;

/** Symbols that do not map to <SYMBOL>.NS on Yahoo. Keep in step with YAHOO_TICKER_ALIASES in data_fetcher.py. */
const YAHOO_ALIASES: Record<string, string> = {
  'L&TFH': 'LTF.NS',
  TATAMOTORS: 'TMCV.NS',
};

export const INDICES = [
  { yahoo: '^NSEI', id: 'NIFTY50', name: 'NIFTY 50', exchange: 'NSE' },
  { yahoo: '^BSESN', id: 'SENSEX', name: 'SENSEX', exchange: 'BSE' },
  { yahoo: '^NSEBANK', id: 'BANKNIFTY', name: 'NIFTY BANK', exchange: 'NSE' },
  { yahoo: '^CNXIT', id: 'NIFTYIT', name: 'NIFTY IT', exchange: 'NSE' },
  { yahoo: '^CNXPHARMA', id: 'NIFTYPHARMA', name: 'NIFTY PHARMA', exchange: 'NSE' },
  { yahoo: '^CNXAUTO', id: 'NIFTYAUTO', name: 'NIFTY AUTO', exchange: 'NSE' },
] as const;

function finite(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value.replace(/,/g, '')) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function round(value: number, places = 2): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

async function getJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...headers },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}`);
  return res.json();
}

/** One spark result into a Quote. Exported for tests. */
export function quoteFromSpark(symbol: string, result: any): Quote | null {
  const meta = result?.response?.[0]?.meta;
  const price = finite(meta?.regularMarketPrice);
  if (!meta || price === null || price <= 0) return null;
  const previousClose = finite(meta.previousClose) ?? finite(meta.chartPreviousClose);
  const change = previousClose ? price - previousClose : 0;
  const time = finite(meta.regularMarketTime);
  return {
    symbol,
    price: round(price),
    change: round(change),
    changePct: previousClose ? round((change / previousClose) * 100) : 0,
    previousClose: previousClose === null ? null : round(previousClose),
    dayHigh: finite(meta.regularMarketDayHigh),
    dayLow: finite(meta.regularMarketDayLow),
    volume: finite(meta.regularMarketVolume),
    time: time === null ? Date.now() : time * 1000,
    source: 'yahoo',
  };
}

async function fetchYahoo(pairs: Array<[symbol: string, ticker: string]>): Promise<Map<string, Quote>> {
  const out = new Map<string, Quote>();
  const batches: Array<Array<[string, string]>> = [];
  for (let i = 0; i < pairs.length; i += SPARK_BATCH) batches.push(pairs.slice(i, i + SPARK_BATCH));

  await Promise.all(
    batches.map(async (batch) => {
      const bySymbol = new Map(batch.map(([symbol, ticker]) => [ticker, symbol]));
      const url = `${SPARK_URL}?symbols=${batch.map(([, t]) => encodeURIComponent(t)).join(',')}&range=1d&interval=5m`;
      try {
        const json = await getJson(url);
        for (const result of json?.spark?.result ?? []) {
          const symbol = bySymbol.get(result?.symbol);
          const quote = symbol ? quoteFromSpark(symbol, result) : null;
          if (quote) out.set(symbol!, quote);
        }
      } catch {
        // Whatever this batch should have returned falls through to BSE.
      }
    })
  );
  return out;
}

/** One BSE quote header into a Quote. Exported for tests. */
export function quoteFromBse(symbol: string, json: any, now = Date.now()): Quote | null {
  const rate = json?.CurrRate;
  const price = finite(rate?.LTP);
  if (price === null || price <= 0) return null;
  const change = finite(rate?.Chg) ?? 0;
  const previousClose = price - change;
  return {
    symbol,
    price: round(price),
    change: round(change),
    changePct: finite(rate?.PcChg) ?? (previousClose ? round((change / previousClose) * 100) : 0),
    previousClose: round(previousClose),
    dayHigh: null,
    dayLow: null,
    volume: null,
    // BSE's header does not carry a trade time; this is when it was read.
    time: now,
    source: 'bse',
  };
}

async function fetchBse(symbols: string[]): Promise<Map<string, Quote>> {
  const out = new Map<string, Quote>();
  await Promise.all(
    symbols.map(async (symbol) => {
      const code = bseCodeOf(symbol);
      if (!code) return;
      try {
        const json = await getJson(BSE_QUOTE_URL + code, {
          Origin: 'https://www.bseindia.com',
          Referer: 'https://www.bseindia.com/',
        });
        const quote = quoteFromBse(symbol, json);
        if (quote) out.set(symbol, quote);
      } catch {
        // Leave it out; the client keeps showing the last close it has.
      }
    })
  );
  return out;
}

export async function fetchQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  const pairs = symbols.map((s): [string, string] => [s, YAHOO_ALIASES[s] ?? `${s}.NS`]);
  const quotes = await fetchYahoo(pairs);
  const missing = symbols.filter((s) => !quotes.has(s));
  if (missing.length) {
    for (const [symbol, quote] of await fetchBse(missing)) quotes.set(symbol, quote);
  }
  return Object.fromEntries(quotes);
}

/**
 * How long the CDN may serve a response. While the market is open a quote is
 * worth about twenty seconds; once it closes the last price does not change
 * until the next session, so there is no reason to keep asking.
 */
export function cacheHeaders(marketOpen: boolean): Record<string, string> {
  return {
    'Cache-Control': marketOpen
      ? 'public, max-age=0, s-maxage=20, stale-while-revalidate=40'
      : 'public, max-age=60, s-maxage=900, stale-while-revalidate=3600',
  };
}

/**
 * The symbols a request asks for, or null if it is malformed.
 *
 * `chunk=all` is for views that span many chunks, such as a long results
 * table. It is still a single entry in the CDN cache, and it spares the browser
 * a dozen or more requests per poll, each of which counts against a free
 * hosting plan's request allowance.
 */
export function requestedSymbols(params: URLSearchParams): string[] | null {
  const raw = params.get('chunk');
  if (raw === 'all') return Array.from({ length: chunkCount() }, (_, i) => chunkSymbols(i)).flat();
  // Number('') is 0, which would quietly serve the first chunk.
  if (raw === null || raw.trim() === '') return null;
  const chunk = Number(raw);
  if (!Number.isInteger(chunk) || chunk < 0 || chunk >= chunkCount()) return null;
  return chunkSymbols(chunk);
}

export async function handleQuotes(params: URLSearchParams): Promise<ApiResult> {
  const marketOpen = isIndianMarketOpen();
  const symbols = requestedSymbols(params);

  if (!symbols) {
    return {
      status: 400,
      headers: { 'Cache-Control': 'no-store' },
      body: { error: `chunk must be "all" or an integer from 0 to ${chunkCount() - 1}`, chunkSize: QUOTE_CHUNK_SIZE },
    };
  }

  const quotes = await fetchQuotes(symbols);
  const times = Object.values(quotes).map((q) => q.time);

  return {
    status: 200,
    headers: cacheHeaders(marketOpen),
    body: {
      chunk: params.get('chunk'),
      marketOpen,
      asOf: times.length ? Math.max(...times) : null,
      fetchedAt: Date.now(),
      requested: symbols.length,
      quotes,
    },
  };
}

function readIndicesCache(): any {
  for (const path of [join(process.cwd(), 'public', 'data', 'market_indices.json'), join(process.cwd(), 'data', 'market_indices.json')]) {
    if (existsSync(path)) {
      try {
        return JSON.parse(readFileSync(path, 'utf-8'));
      } catch {
        // Try the next copy.
      }
    }
  }
  return null;
}

export async function handleIndices(): Promise<ApiResult> {
  const marketOpen = isIndianMarketOpen();
  const ist = istNow();
  const live = await fetchYahoo(INDICES.map((i) => [i.yahoo, i.yahoo]));

  let source = 'yahoo';
  let indices = INDICES.map((idx) => {
    const q = live.get(idx.yahoo);
    return q
      ? { id: idx.id, symbol: idx.yahoo, name: idx.name, exchange: idx.exchange, price: q.price, change: q.change, change_pct: q.changePct, is_up: q.change >= 0, time: q.time }
      : null;
  }).filter(Boolean) as any[];

  // The pipeline's cached copy, if Yahoo is unreachable.
  if (indices.length < INDICES.length) {
    const cache = readIndicesCache();
    const cached = (cache?.indices ?? []).map((idx: any) => ({
      id: idx.id,
      symbol: idx.symbol,
      name: idx.name,
      exchange: idx.exchange,
      price: idx.price,
      change: idx.change,
      change_pct: idx.changePct,
      is_up: idx.change >= 0,
      time: cache?.lastUpdated ? Date.parse(cache.lastUpdated) : null,
    }));
    if (!indices.length) {
      indices = cached;
      source = 'cache';
    } else {
      const have = new Set(indices.map((i) => i.id));
      indices.push(...cached.filter((c: any) => !have.has(c.id)));
      source = 'yahoo+cache';
    }
  }

  const times = indices.map((i) => i.time).filter((t): t is number => typeof t === 'number');
  const asOf = times.length ? new Date(Math.max(...times)).toISOString() : null;

  return {
    status: indices.length ? 200 : 503,
    headers: cacheHeaders(marketOpen),
    body: {
      status: indices.length ? 'ok' : 'error',
      is_market_open: marketOpen,
      time_ist: ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST',
      date_ist: ist.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      last_updated: asOf,
      dataAsOf: asOf,
      source,
      indices,
    },
  };
}
