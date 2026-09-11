import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleQuotes } from './_lib/quotes';

/**
 * GET /api/quotes?chunk=N
 *
 * Live quotes for one fixed chunk of the universe. See src/lib/quoteUniverse.ts
 * for why requests are chunked rather than per symbol.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = new URL(req.url ?? '/', 'http://localhost');
  const result = await handleQuotes(url.searchParams);
  for (const [key, value] of Object.entries(result.headers)) res.setHeader(key, value);
  return res.status(result.status).json(result.body);
}
