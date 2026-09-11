import { STOCKS_DATA } from '../data/stocksData';

/**
 * Which symbols the quote endpoint will answer for, and how they are grouped.
 *
 * Quotes are requested in fixed chunks (`/api/quotes?chunk=7`) rather than as
 * whatever set of symbols a table happens to show. A table sorted or filtered
 * differently would otherwise produce a new URL every time, and every new URL
 * is a cache miss that reaches Yahoo. With fixed chunks the CDN answers every
 * visitor from one cached response per chunk, so upstream load is bounded by
 * the number of chunks, not the number of people using the site.
 *
 * The allowlist also stops the endpoint being used as an open proxy.
 */
export const QUOTE_CHUNK_SIZE = 20;

// Largest companies first. The views that show many prices mostly sort by
// market cap (the default results table, a company's peers), so chunking in the
// same order keeps what is on screen within a few chunks. Chunked alphabetically,
// the first page of results spanned 17 of the 25.
const SYMBOLS: string[] = Array.from(
  new Map(STOCKS_DATA.map((s) => [s.symbol.toUpperCase(), s.market_cap || 0] as const)).entries()
)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([symbol]) => symbol);
const INDEX = new Map(SYMBOLS.map((s, i) => [s, i]));
const BSE_CODES = new Map(
  STOCKS_DATA.filter((s) => s.bse_code).map((s) => [s.symbol.toUpperCase(), String(s.bse_code)])
);

export function quoteSymbols(): readonly string[] {
  return SYMBOLS;
}

export function chunkCount(): number {
  return Math.ceil(SYMBOLS.length / QUOTE_CHUNK_SIZE);
}

/** -1 for a symbol the endpoint does not serve. */
export function chunkOf(symbol: string): number {
  const i = INDEX.get(symbol.toUpperCase());
  return i === undefined ? -1 : Math.floor(i / QUOTE_CHUNK_SIZE);
}

export function chunkSymbols(chunk: number): string[] {
  if (!Number.isInteger(chunk) || chunk < 0) return [];
  return SYMBOLS.slice(chunk * QUOTE_CHUNK_SIZE, (chunk + 1) * QUOTE_CHUNK_SIZE);
}

export function bseCodeOf(symbol: string): string | undefined {
  return BSE_CODES.get(symbol.toUpperCase());
}
