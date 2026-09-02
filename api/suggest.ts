import type { VercelRequest, VercelResponse } from '@vercel/node';
import { METRICS_DICTIONARY } from '../src/engine/metricsDictionary';
import { tokenize, ScreenerParser } from '../src/engine/screenerParser';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = (req.query.q as string) || '';

  let isValid = true;
  let error = null;

  if (query.trim()) {
    try {
      const tokens = tokenize(query);
      const parser = new ScreenerParser(tokens);
      parser.parse();
    } catch (err: any) {
      isValid = false;
      error = err.message;
    }
  }

  const q = query.toLowerCase().trim();
  let filteredMetrics = METRICS_DICTIONARY;
  
  if (q) {
    filteredMetrics = filteredMetrics.filter((m) => {
      const matchName = m.name.toLowerCase().startsWith(q);
      const matchShortName = m.short_name?.toLowerCase().startsWith(q);
      const matchAlias = m.aliases?.some(alias => alias.toLowerCase().startsWith(q));
      return matchName || matchShortName || matchAlias;
    });
  }

  const suggestions = filteredMetrics.slice(0, 15).map((m) => ({
    name: m.name,
    category: m.category,
    unit: m.unit,
    description: m.description,
  }));

  return res.status(200).json({
    success: true,
    isValid,
    error,
    suggestions,
  });
}
