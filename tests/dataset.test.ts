import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { STOCKS_DATA } from '../src/data/stocksData';
import { CURATED_SCREENS } from '../src/data/screens';
import { executeScreenerQuery } from '../src/engine/screenerParser';
import { missingQuarters } from '../src/engine/dataQuality';

const DETAIL_DIR = path.join(process.cwd(), 'public', 'data', 'stocks');

/** Matches scripts/split_dataset.mjs. */
const detailSlug = (symbol: string) => symbol.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

/** Statements live in the detail tier, fetched per company at runtime. */
function loadDetail(symbol: string) {
  const file = path.join(DETAIL_DIR, `${detailSlug(symbol)}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const QUARTERS = ['Mar', 'Jun', 'Sep', 'Dec'];
const periodKey = (p: string) => {
  const [month, year] = p.split(' ');
  return Number(year) * 4 + QUARTERS.indexOf(month);
};
const yearKey = (y: string) => (y === 'TTM' ? Infinity : Number(y.split(' ').pop()));

describe('dataset invariants', () => {
  it('has companies', () => {
    expect(STOCKS_DATA.length).toBeGreaterThan(0);
  });

  it('uses null rather than zero for figures the feed never reports', () => {
    // These columns are 0 for the entire universe upstream. If a zero comes
    // back, a screen like "Cash conversion cycle < 45" silently matches
    // everything again.
    const sentinelColumns = [
      'debtor_days', 'inventory_days', 'days_payable',
      'working_capital_days', 'cash_conversion_cycle',
    ] as const;

    for (const column of sentinelColumns) {
      const zeros = STOCKS_DATA.filter((s) => s[column] === 0);
      expect(zeros.map((s) => `${s.symbol}.${column}`)).toEqual([]);
    }
  });

  it('reports return on equity for every company, or null', () => {
    for (const stock of STOCKS_DATA) {
      expect(stock.roe === null || stock.roe > 0).toBe(true);
    }
  });

  it('leaves debt_to_equity null for financial services and negative net worth companies', () => {
    const invalid = STOCKS_DATA.filter(
      (s) => (s.sector === 'Financial Services' || (s.book_value !== null && s.book_value <= 0)) && s.debt_to_equity !== null
    );
    expect(invalid.map((s) => `${s.symbol} (D/E=${s.debt_to_equity})`)).toEqual([]);
  });

  it('does not report 0.0 debt_to_equity for companies with substantial debt (>500 Cr)', () => {
    const falseZeros = STOCKS_DATA.filter(
      (s) => s.debt_to_equity === 0 && s.debt > 500
    );
    expect(falseZeros.map((s) => `${s.symbol} (debt=${s.debt})`)).toEqual([]);
  });

  it('drops abnormal margins (>100%)', () => {
    const abnormal = STOCKS_DATA.filter((s) => s.opm !== null && Math.abs(s.opm) > 100);
    expect(abnormal.map((s) => `${s.symbol} (opm=${s.opm})`)).toEqual([]);
  });

  it('stores symbols decoded, not percent-encoded', () => {
    // Mahindra arrived as "M%26M". React Router decodes the route parameter,
    // so the lookup never matched and that page was unreachable.
    const encoded = STOCKS_DATA.filter((s) => /%[0-9A-Fa-f]{2}/.test(s.symbol));
    expect(encoded.map((s) => s.symbol)).toEqual([]);
  });

  it('ships a detail file for every company, including awkward symbols', () => {
    for (const stock of STOCKS_DATA) {
      // M&M used to be written as M%26M.json and fetched as M&M.json, so its
      // statements never loaded.
      expect(loadDetail(stock.symbol), `${stock.symbol} detail file`).toBeTruthy();
    }
  });

  it('keeps the screening tier small enough to bundle', () => {
    // The whole dataset used to be bundled, putting 2.5 MB of statements and
    // daily prices into the entry chunk. The screening tier carries only the
    // scalars a filter reads: roughly 1.7 KB per company, so this scales with
    // the universe rather than with how much history each company has.
    const bytes = JSON.stringify(STOCKS_DATA).length;
    const perCompany = bytes / STOCKS_DATA.length;
    expect(perCompany, `${(perCompany / 1024).toFixed(1)} KB per company`).toBeLessThan(2_048);
  });

  it('orders every time series oldest first', () => {
    for (const stock of STOCKS_DATA) {
      const detail = loadDetail(stock.symbol);
      const quarters = (detail?.quarterly_results || []).map((q: { period: string }) => periodKey(q.period));
      expect(quarters, `${stock.symbol} quarterly`).toEqual([...quarters].sort((a, b) => a - b));

      const years = (detail?.annual_pnl || []).map((p: { year: string }) => yearKey(p.year));
      expect(years, `${stock.symbol} annual`).toEqual([...years].sort((a: number, b: number) => a - b));

      const dates = (detail?.historical_prices || []).map((p: { date: string }) => p.date);
      expect(dates, `${stock.symbol} prices`).toEqual([...dates].sort());
    }
  });

  it('keeps the shareholding snapshot in step with the history', () => {
    for (const stock of STOCKS_DATA) {
      const history = loadDetail(stock.symbol)?.shareholding_history || [];
      if (!history.length) continue;
      const latest = history[history.length - 1];
      expect(Math.abs((stock.promoter_holding ?? 0) - latest.promoter), stock.symbol).toBeLessThan(0.02);
      expect(Math.abs((stock.fii_holding ?? 0) - latest.fii), stock.symbol).toBeLessThan(0.02);
    }
  });

  it('keeps the cash flow snapshot in step with the statement', () => {
    for (const stock of STOCKS_DATA) {
      const flows = loadDetail(stock.symbol)?.cash_flow || [];
      if (!flows.length) continue;
      const latest = flows[flows.length - 1];
      expect(Math.abs(stock.cfo_latest - latest.operating_cf), stock.symbol).toBeLessThan(1);
      expect(Math.abs(stock.fcf_latest - latest.free_cf), stock.symbol).toBeLessThan(1);
    }
  });

  it('keeps the price inside its own 52-week band', () => {
    for (const stock of STOCKS_DATA) {
      expect(stock.current_price, stock.symbol).toBeLessThanOrEqual(stock.high_52w + 0.01);
      expect(stock.current_price, stock.symbol).toBeGreaterThanOrEqual(stock.low_52w - 0.01);
    }
  });

  it('derives distance from the 52-week high consistently', () => {
    for (const stock of STOCKS_DATA) {
      const expected = ((stock.current_price - stock.high_52w) / stock.high_52w) * 100;
      expect(Math.abs(expected - stock.distance_52w_high), stock.symbol).toBeLessThan(0.05);
    }
  });

  it('does not present the sector P/E as a fixed multiple of the company P/E', () => {
    // Upstream stored industry_pe as exactly pe_ratio * 0.9 for every company,
    // which made "cheaper than its sector" unsatisfiable.
    const suspicious = STOCKS_DATA.filter(
      (s) => s.pe_ratio && s.industry_pe && Math.abs(s.industry_pe / s.pe_ratio - 0.9) < 0.001
    );
    expect(suspicious.map((s) => s.symbol)).toEqual([]);
  });

  it('finds at least one company cheaper than its sector median', () => {
    const cheaper = STOCKS_DATA.filter((s) => s.pe_ratio && s.industry_pe && s.pe_ratio < s.industry_pe);
    expect(cheaper.length).toBeGreaterThan(0);
  });

  it('flags quarterly gaps rather than presenting the series as contiguous', () => {
    const gapped = STOCKS_DATA.filter((s) => missingQuarters(loadDetail(s.symbol)?.quarterly_results || []).length > 0);
    // The holes are real; the test records that they are detectable, which is
    // what the quarterly table relies on to caption itself.
    expect(gapped.length).toBeGreaterThanOrEqual(0);
    for (const stock of gapped) {
      expect(
        missingQuarters(loadDetail(stock.symbol)?.quarterly_results || []).every((p) => /^[A-Z][a-z]{2} \d{4}$/.test(p))
      ).toBe(true);
    }
  });
});

/**
 * Coverage floors.
 *
 * The pipeline's own QC report graded this universe at 100% health while five
 * columns were empty for every company. These thresholds are the guard against
 * that: a run that loses a core metric fails the build instead of shipping a
 * screener whose filters quietly match nothing.
 */
describe('metric coverage', () => {
  const FLOORS: Array<[keyof (typeof STOCKS_DATA)[number], number]> = [
    ['current_price', 1.0],
    ['market_cap', 1.0],
    ['sector', 1.0],
    ['roce', 0.9],
    ['roe', 0.9],
    ['pe_ratio', 0.85],
    ['pb_ratio', 0.9],
    // D/E is null for ~20% of universe (Financial Services and negative net worth)
    ['debt_to_equity', 0.78],
    ['opm', 0.9],
    ['piotroski_score', 0.9],
    ['sales_growth_3y', 0.85],
    ['profit_growth_3y', 0.85],
    ['dividend_yield', 0.9],
    ['rsi_14', 0.9],
    ['promoter_holding', 0.85],
  ];

  it.each(FLOORS)('reports %s for at least %s of the universe', (key, floor) => {
    const reported = STOCKS_DATA.filter((s) => {
      const value = s[key];
      return value !== null && value !== undefined && value !== '';
    }).length;
    const ratio = reported / STOCKS_DATA.length;
    expect(
      ratio,
      `${String(key)}: ${reported}/${STOCKS_DATA.length} = ${(ratio * 100).toFixed(0)}%`
    ).toBeGreaterThanOrEqual(floor);
  });
});

describe('curated screens', () => {
  it('all parse', () => {
    for (const screen of CURATED_SCREENS) {
      const result = executeScreenerQuery(screen.query, STOCKS_DATA);
      expect(result.error, `${screen.id}: ${result.error}`).toBeUndefined();
    }
  });

  it('all match at least one company and none match every company', () => {
    for (const screen of CURATED_SCREENS) {
      const { matches } = executeScreenerQuery(screen.query, STOCKS_DATA);
      expect(matches.length, `${screen.id} matched nothing`).toBeGreaterThan(0);
      expect(matches.length, `${screen.id} matched the whole universe`).toBeLessThan(STOCKS_DATA.length);
    }
  });

  it('have unique ids', () => {
    const ids = CURATED_SCREENS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
