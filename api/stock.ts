import type { VercelRequest, VercelResponse } from '@vercel/node';
import { STOCKS_DATA } from '../src/data/stocksData';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const symbol = (req.query.symbol as string || '').toUpperCase().trim();

  if (!symbol) {
    return res.status(400).json({ success: false, error: 'Symbol query parameter is required' });
  }

  const stock = STOCKS_DATA.find((s) => s.symbol.toUpperCase() === symbol || s.id.toUpperCase() === symbol);

  if (!stock) {
    return res.status(404).json({ success: false, error: `Stock '${symbol}' not found` });
  }

  return res.status(200).json({
    success: true,
    stock,
  });
}
