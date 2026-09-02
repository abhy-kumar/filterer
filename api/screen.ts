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
  const limitStr = req.query.limit as string;
  const pageStr = req.query.page as string;
  const limit = limitStr ? parseInt(limitStr, 10) : 25;
  const page = pageStr ? parseInt(pageStr, 10) : 1;

  if (isNaN(limit) || limit <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid limit parameter' });
  }

  if (isNaN(page) || page <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid page parameter' });
  }

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
