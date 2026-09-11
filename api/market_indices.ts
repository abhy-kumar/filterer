import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleIndices } from './_lib/quotes';

/**
 * GET /api/market_indices
 *
 * Live index levels from Yahoo, falling back to the copy the pipeline caches.
 * This used to read only that cached copy, which changed three times a trading
 * day, so the "live" ticker was as stale as the last scheduled run.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const result = await handleIndices();
  for (const [key, value] of Object.entries(result.headers)) res.setHeader(key, value);
  return res.status(result.status).json(result.body);
}
