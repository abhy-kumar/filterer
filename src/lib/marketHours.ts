/**
 * NSE's regular session, in IST. Exchange holidays are not modelled: on a
 * holiday the market reads as open, but quotes simply do not move and their
 * timestamp says so.
 */
export const MARKET_OPEN_MINUTES = 9 * 60 + 15;
export const MARKET_CLOSE_MINUTES = 15 * 60 + 30;

export function istNow(now: Date = new Date()): Date {
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 5.5);
}

export function isIndianMarketOpen(now: Date = new Date()): boolean {
  const ist = istNow(now);
  const day = ist.getDay();
  const minutes = ist.getHours() * 60 + ist.getMinutes();
  return day >= 1 && day <= 5 && minutes >= MARKET_OPEN_MINUTES && minutes <= MARKET_CLOSE_MINUTES;
}
