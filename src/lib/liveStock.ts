import type { PeerInfo, Stock } from '../types/stock';

export interface LiveQuote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  time: number;
  source: 'yahoo' | 'bse';
}

function round(value: number, places = 2): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

/**
 * A stock with a live quote laid over it.
 *
 * Only the figures that move with the price are touched, and they are derived
 * the same way data_pipeline/refresh_quotes.py derives them, so a page viewed
 * live agrees with the one the next scheduled refresh will build: market cap
 * rescales with the price (the share count is implied by the stored figure),
 * and P/E and P/B divide by the reported EPS and book value.
 */
export function applyLiveQuote<T extends Stock>(stock: T, quote: LiveQuote | undefined): T {
  if (!quote || !(quote.price > 0)) return stock;
  if (quote.price === stock.current_price && quote.change === stock.change) return stock;

  const next: T = { ...stock, current_price: quote.price, change: quote.change, change_pct: quote.changePct };

  if (stock.current_price > 0 && stock.market_cap > 0) {
    next.market_cap = Math.round((stock.market_cap * quote.price) / stock.current_price);
  }
  if (stock.eps > 0) next.pe_ratio = round(quote.price / stock.eps);
  if (stock.book_value > 0) next.pb_ratio = round(quote.price / stock.book_value);

  const high = Math.max(stock.high_52w || 0, quote.price, quote.dayHigh ?? 0);
  const lows = [stock.low_52w, quote.price, quote.dayLow].filter((v): v is number => typeof v === 'number' && v > 0);
  const low = Math.min(...lows);
  next.high_52w = high;
  next.low_52w = low;
  if (high > 0) next.distance_52w_high = round(((quote.price - high) / high) * 100);
  if (low > 0) next.distance_52w_low = round(((quote.price - low) / low) * 100);

  return next;
}

export function applyLiveQuoteToPeer(peer: PeerInfo, quote: LiveQuote | undefined, eps?: number): PeerInfo {
  if (!quote || !(quote.price > 0) || quote.price === peer.current_price) return peer;
  const next = { ...peer, current_price: quote.price };
  if (peer.current_price > 0 && peer.market_cap > 0) {
    next.market_cap = Math.round((peer.market_cap * quote.price) / peer.current_price);
  }
  if (eps && eps > 0) next.pe_ratio = round(quote.price / eps);
  return next;
}
