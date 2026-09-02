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

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const total = results.length;
  const totalPages = Math.ceil(total / limit) || 1;

  const paginated = results.slice((page - 1) * limit, page * limit);

  return res.status(200).json({
    stocks: paginated,
    total,
    page,
    limit,
    totalPages
  });
}
