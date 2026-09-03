/**
 * Route builders.
 *
 * Ticker symbols are not all URL-safe - Mahindra trades as M&M - so links are
 * built through here rather than interpolated directly. Getting this wrong
 * made that company's page unreachable from every table on the site.
 */
export function stockPath(symbol: string): string {
  return `/stock/${encodeURIComponent(symbol)}`;
}

export function screenPath(query: string): string {
  return `/screen?q=${encodeURIComponent(query)}`;
}
