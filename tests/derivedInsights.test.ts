import { describe, it, expect } from 'vitest';
import { deriveInsights } from '../src/engine/derivedInsights';
import type { Stock } from '../src/types/stock';

const quarter = (period: string, sales: number, net_profit: number, opm_pct = 20) => ({
  period,
  sales,
  expenses: sales * (1 - opm_pct / 100),
  operating_profit: (sales * opm_pct) / 100,
  opm_pct,
  other_income: 1,
  interest: 1,
  depreciation: 1,
  profit_before_tax: net_profit * 1.3,
  tax_pct: 25,
  net_profit,
  eps: net_profit / 10,
});

const PERIODS = ['Mar 2024', 'Jun 2024', 'Sep 2024', 'Dec 2024', 'Mar 2025', 'Jun 2025', 'Sep 2025', 'Dec 2025', 'Mar 2026', 'Jun 2026'];

function makeStock(overrides: Record<string, unknown> = {}): Stock {
  return {
    symbol: 'TEST',
    name: 'Test Ltd',
    sector: 'Industrials',
    current_price: 200,
    eps: 5,
    fii_holding: null,
    dii_holding: null,
    quarterly_source: 'NSE XBRL',
    quarterly_results: PERIODS.map((p, i) => quarter(p, 100 + i * 5, 10 + i)),
    annual_pnl: [],
    balance_sheet: [],
    cash_flow: [],
    shareholding_history: [],
    historical_prices: [],
    ...overrides,
  } as unknown as Stock;
}

const find = (stock: Stock, id: string) => deriveInsights(stock).find((i) => i.id === id);

describe('derived insights', () => {
  it('compares the latest quarter with the same quarter a year earlier, not the one before', () => {
    const insight = find(makeStock(), 'latest-quarter')!;
    // Jun 2026 is index 9 (sales 145, profit 19); Jun 2025 is index 5 (sales 125, profit 15).
    expect(insight.headline).toBe('In the Jun 2026 quarter, sales grew 16.0% and net profit rose 26.7% from a year earlier.');
    expect(insight.tone).toBe('positive');
    expect(insight.basis).toBe('NSE filings (XBRL), Jun 2026 against Jun 2025');
    expect(insight.figures.find((f) => f.label === 'Sales, quarter on quarter')?.value).toBe('+3.6%');
  });

  it('says so when the source is the Yahoo fallback', () => {
    expect(find(makeStock({ quarterly_source: undefined }), 'latest-quarter')!.basis).toMatch(/^Yahoo Finance/);
  });

  it('skips the quarter comparison without a year-ago quarter', () => {
    const recent = makeStock({ quarterly_results: PERIODS.slice(-4).map((p) => quarter(p, 100, 10)) });
    expect(find(recent, 'latest-quarter')).toBeUndefined();
  });

  it('describes a return to profit rather than a percentage off a loss', () => {
    const rows = PERIODS.map((p, i) => quarter(p, 100, i === 5 ? -5 : i === 9 ? 8 : 3));
    const insight = find(makeStock({ quarterly_results: rows }), 'latest-quarter')!;
    expect(insight.headline).toContain('returned to a profit of ₹8 Cr from a loss');
    expect(insight.figures.some((f) => f.label === 'Net profit, year on year')).toBe(false);
  });

  it('needs eight contiguous quarters for a trailing-year comparison', () => {
    expect(find(makeStock(), 'trailing-year')).toBeDefined();
    const gapped = makeStock({ quarterly_results: PERIODS.filter((p) => p !== 'Dec 2025').map((p) => quarter(p, 100, 10)) });
    expect(find(gapped, 'trailing-year')).toBeUndefined();
  });

  it('leaves out margin, cash conversion and debt for financial companies', () => {
    const annual = ['Mar 2022', 'Mar 2023', 'Mar 2024', 'Mar 2025'].map((year, i) => ({
      year, sales: 1000 + i * 100, opm_pct: 20 + i, net_profit: 100, interest: 10, profit_before_tax: 130, eps: 5,
    }));
    const bank = makeStock({ sector: 'Financial Services', annual_pnl: annual });
    const ids = deriveInsights(bank).map((i) => i.id);
    expect(ids).not.toContain('margin-trajectory');
    expect(ids).not.toContain('cash-conversion');
    expect(ids).not.toContain('leverage');
    expect(ids).toContain('growth-record');
  });

  it('says a company without promoters is widely held', () => {
    const history = [
      { period: 'Mar 2026', promoter: 0, fii: 40, dii: 42, public: 100 },
      { period: 'Jun 2026', promoter: 0, fii: 41.83, dii: 41.92, public: 100 },
    ];
    const insight = find(makeStock({ shareholding_history: history, fii_holding: 41.83, dii_holding: 41.92, change_in_fii_holding_quarter: 1.83 }), 'ownership')!;
    expect(insight.headline).toContain('no promoter group');
    expect(insight.headline).toContain('foreign institutions added 1.83 points');
  });

  it('values past prices only on earnings that had been published by then', () => {
    const annual = [2020, 2021, 2022, 2023, 2024, 2025, 2026].map((y) => ({ year: `Mar ${y}`, eps: 5, sales: 100, net_profit: 10 }));
    const prices = [];
    for (let t = Date.parse('2021-07-01'); t <= Date.parse('2026-08-31'); t += 7 * 24 * 3600 * 1000) {
      prices.push({ date: new Date(t).toISOString().slice(0, 10), price: 100 });
    }
    const insight = find(makeStock({ annual_pnl: annual, historical_prices: prices, current_price: 200 }), 'valuation-history')!;
    expect(insight.figures.find((f) => f.label === 'Five-year median')?.value).toBe('20.0x');
    expect(insight.headline).toContain('At 40.0x its Mar 2026 earnings, the stock trades above the range it usually traded in');
  });

  it('drops an insight whose inputs are malformed instead of failing the page', () => {
    const broken = makeStock({ balance_sheet: [{ year: 'Mar 2025' }, null] });
    expect(() => deriveInsights(broken)).not.toThrow();
  });
});
