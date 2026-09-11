import React from 'react';
import { useLiveStatus } from '../context/LiveQuotesContext';
import type { LiveQuote } from '../lib/liveStock';

/** A quote older than this is not called live, whatever the clock says. */
const FRESH_MS = 3 * 60 * 1000;

const istTime = (t: number) =>
  new Date(t).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
const istDate = (t: number) =>
  new Date(t).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' });

/**
 * Says how current a price is, in words.
 *
 * "Live" is only claimed while the market is open and the last trade is a few
 * minutes old at most. Otherwise the badge says when the price is from, and if
 * live quotes are unavailable on this deployment it says the price comes from
 * the last scheduled refresh rather than implying it is current.
 */
export const LiveBadge: React.FC<{ quote?: LiveQuote; className?: string }> = ({ quote, className = '' }) => {
  const status = useLiveStatus();

  let label: string;
  let live = false;

  if (quote) {
    if (status.marketOpen && Date.now() - quote.time < FRESH_MS) {
      live = true;
      label = `Live, ${istTime(quote.time)} IST`;
    } else {
      label = `Last traded ${istDate(quote.time)}, ${istTime(quote.time)} IST`;
    }
    if (quote.source === 'bse') label += ' (BSE)';
  } else if (!status.available || status.error) {
    label = 'Price from the last scheduled refresh';
  } else {
    label = 'Fetching the latest price';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-caption2 text-apple-muted ${className}`} aria-live="polite">
      <span className={`live-dot ${live ? 'is-live' : ''}`} aria-hidden="true" />
      {label}
    </span>
  );
};

export default LiveBadge;
