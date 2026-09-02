import type { Stock } from '../types/stock';

/**
 * Normalise statements arriving from Firestore or the static JSON cache.
 *
 * The bundled dataset is repaired offline by scripts/repair_dataset.mjs, but
 * the detail page also merges in statements fetched at runtime, and those come
 * straight from the pipeline. Without this pass the fetched copy reintroduces
 * exactly what the repair removed: zero as a stand-in for "not reported", and
 * all-zero rows for years the source had no data for.
 */

const QUARTERS = ['Mar', 'Jun', 'Sep', 'Dec'];

function periodKey(period: string): number {
  const [month, year] = String(period).split(' ');
  return Number(year) * 4 + QUARTERS.indexOf(month);
}

function yearKey(year: string): number {
  if (year === 'TTM') return Number.POSITIVE_INFINITY;
  return Number(String(year).split(' ').pop());
}

function read(row: object, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

/** Zero is a real figure for some fields and a missing marker for others. */
function blankIfZero<T extends object>(row: T, keys: string[]): T {
  const next = { ...(row as Record<string, unknown>) };
  for (const key of keys) {
    if (next[key] === 0) next[key] = null;
  }
  return next as T;
}

/** A statement row where every headline figure is zero carries no information. */
function isEmptyRow(row: object, keys: string[]): boolean {
  return keys.every((key) => {
    const value = read(row, key);
    return value === 0 || value === null || value === undefined;
  });
}

function byYear<T extends { year: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => yearKey(a.year) - yearKey(b.year));
}

export function normalizeRemoteStock(data: Partial<Stock> | null): Partial<Stock> | null {
  if (!data) return null;
  const next: Partial<Stock> = { ...data };

  const HEADLINE = ['sales', 'operating_profit', 'net_profit'];

  if (Array.isArray(next.annual_pnl)) {
    next.annual_pnl = byYear(
      next.annual_pnl
        .filter((row) => !isEmptyRow(row, HEADLINE))
        .map((row) => blankIfZero(row, ['other_income', 'dividend_payout_pct']))
    );
  }

  if (Array.isArray(next.quarterly_results)) {
    next.quarterly_results = next.quarterly_results
      .filter((row) => !isEmptyRow(row, HEADLINE))
      .map((row) => blankIfZero(row, ['other_income']))
      .sort((a, b) => periodKey(a.period) - periodKey(b.period));
  }

  if (Array.isArray(next.balance_sheet)) {
    next.balance_sheet = byYear(
      next.balance_sheet.filter((row) => !isEmptyRow(row, ['total_assets', 'total_liabilities']))
    );
  }

  if (Array.isArray(next.cash_flow)) {
    next.cash_flow = byYear(
      next.cash_flow.filter(
        (row) => !isEmptyRow(row, ['operating_cf', 'investing_cf', 'financing_cf', 'net_cf', 'free_cf'])
      )
    );
  }

  if (Array.isArray(next.ratios_history)) {
    next.ratios_history = byYear(
      next.ratios_history.map((row) =>
        blankIfZero(row, [
          'roce', 'roe', 'debtor_days', 'inventory_days',
          'days_payable', 'working_capital_days', 'cash_conversion_cycle',
        ])
      )
    );
  }

  if (Array.isArray(next.shareholding_history)) {
    next.shareholding_history = [...next.shareholding_history].sort(
      (a, b) => periodKey(a.period) - periodKey(b.period)
    );
  }

  if (Array.isArray(next.historical_prices)) {
    next.historical_prices = [...next.historical_prices].sort((a, b) => a.date.localeCompare(b.date));
  }

  return next;
}
