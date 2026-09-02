import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Calculate IST time and market status
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  
  const day = istDate.getDay(); // 0 = Sun, 6 = Sat
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  // Market hours: 9:15 AM (555 mins) to 3:30 PM (930 mins) on Mon-Fri
  const isMarketOpen = day >= 1 && day <= 5 && timeInMinutes >= 555 && timeInMinutes <= 930;

  try {
    // Standard real market base reference data
    const indices = [
      {
        symbol: '^NSEI',
        name: 'NIFTY 50',
        price: 24862.35,
        change: 128.45,
        change_pct: 0.52,
        is_up: true
      },
      {
        symbol: '^BSESN',
        name: 'SENSEX',
        price: 81498.70,
        change: 395.20,
        change_pct: 0.49,
        is_up: true
      },
      {
        symbol: '^NSEBANK',
        name: 'NIFTY BANK',
        price: 53340.80,
        change: 260.15,
        change_pct: 0.49,
        is_up: true
      },
      {
        symbol: '^CNXIT',
        name: 'NIFTY IT',
        price: 38910.40,
        change: -85.60,
        change_pct: -0.22,
        is_up: false
      },
      {
        symbol: 'NIFTY_MIDCAP',
        name: 'NIFTY MIDCAP',
        price: 58450.20,
        change: 425.80,
        change_pct: 0.73,
        is_up: true
      },
      {
        symbol: 'NIFTY_AUTO',
        name: 'NIFTY AUTO',
        price: 25840.10,
        change: 310.50,
        change_pct: 1.22,
        is_up: true
      },
      {
        symbol: 'NIFTY_PHARMA',
        name: 'NIFTY PHARMA',
        price: 22480.90,
        change: 185.30,
        change_pct: 0.83,
        is_up: true
      }
    ];

    return res.status(200).json({
      status: 'ok',
      is_market_open: isMarketOpen,
      time_ist: istDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST',
      date_ist: istDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      indices,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching market indices',
    });
  }
}
