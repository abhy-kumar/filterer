import type { VercelRequest, VercelResponse } from '@vercel/node';
import { STOCKS_DATA } from '../src/data/stocksData';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const search = (req.query.search as string || '').toLowerCase().trim();
  const sector = (req.query.sector as string || 'All');

  let results = STOCKS_DATA;

  if (sector && sector !== 'All') {
    results = results.filter((s) => s.sector.toLowerCase() === sector.toLowerCase());
  }

  if (search) {
    results = results.filter(
      (s) =>
        s.symbol.toLowerCase().includes(search) ||
        s.name.toLowerCase().includes(search) ||
        s.sector.toLowerCase().includes(search)
    );
  }

  return res.status(200).json({
    success: true,
    count: results.length,
    stocks: results,
  });
}
