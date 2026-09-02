import type { VercelRequest, VercelResponse } from '@vercel/node';
import { STOCKS_DATA } from '../src/data/stocksData';
import { executeScreenerQuery } from '../src/engine/screenerParser';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = (req.query.q as string) || (req.body && req.body.query) || '';
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;

  try {
    const result = executeScreenerQuery(query, STOCKS_DATA);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error,
        query,
      });
    }

    const totalMatches = result.matches.length;
    const paginated = result.matches.slice((page - 1) * limit, page * limit);

    return res.status(200).json({
      success: true,
      query,
      totalMatches,
      page,
      limit,
      executionTimeMs: result.executionTimeMs,
      stocks: paginated,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while executing screener query',
    });
  }
}
