import { describe, it, expect } from 'vitest';
import { tokenize, executeScreenerQuery, parseQuery, formatScreenerQuery } from '../src/engine/screenerParser';
import { Stock } from '../src/types/stock';

function stock(overrides: Partial<Stock>): Stock {
  return {
    id: 'x', symbol: 'X', name: 'Example Ltd', nse_symbol: 'X',
    sector: 'Technology', industry: 'IT Services', about: '',
    current_price: 100, change: 1, change_pct: 1, market_cap: 10000,
    high_52w: 150, low_52w: 80, face_value: 1, volume: 1000,
    pe_ratio: 20, industry_pe: 22, pb_ratio: 3, peg_ratio: 1.5,
    graham_number: 90, ev_ebitda: 12, price_to_sales: 3, price_to_fcf: 20,
    dividend_yield: 1, book_value: 33, eps: 5,
    roce: 25, roe: 20, opm: 20, npm: 12,
    sales_growth_3y: 12, sales_growth_5y: null, sales_growth_10y: null,
    profit_growth_3y: 15, profit_growth_5y: null, profit_growth_10y: null,
    price_cagr_1y: 5, price_cagr_3y: 10, price_cagr_5y: 12, price_cagr_10y: 14,
    roe_3y: null, roe_5y: null, roe_10y: null,
    debt: 0, debt_to_equity: 0, interest_coverage: 50, current_ratio: null,
    piotroski_score: 8, altman_z_score: 5,
    debtor_days: null, inventory_days: null, days_payable: null,
    working_capital_days: null, cash_conversion_cycle: null,
    cfo_latest: 500, cfo_3y: 1400, cfo_5y: 2200,
    fcf_latest: 400, fcf_3y: 1100, fcf_5y: 1800, fcf_yield: 4,
    promoter_holding: 60, change_in_promoter_holding_quarter: null,
    pledged_percentage: 0, fii_holding: 20, change_in_fii_holding_quarter: null,
    dii_holding: 10, change_in_dii_holding_quarter: null, public_holding: 10,
    dma_50: 105, dma_200: 95, rsi_14: 55,
    distance_52w_high: -33, distance_52w_low: 25,
    ...overrides,
  } as Stock;
}

const TCS = stock({ symbol: 'TCS', name: 'Tata Consultancy Services', pe_ratio: 29.8, roe: 49.8, roce: 58.4, debt_to_equity: 0, sector: 'Technology' });
const TATAMOTORS = stock({ symbol: 'TATAMOTORS', name: 'Tata Motors', pe_ratio: 8.5, roe: 36.5, roce: 22.8, debt_to_equity: 0.62, sector: 'Consumer Cyclical', graham_number: 880, current_price: 725 });
const UNKNOWN_ROE = stock({ symbol: 'NOROE', roe: null, current_ratio: null });

const UNIVERSE = [TCS, TATAMOTORS];

describe('tokenizer', () => {
  it('keeps AND as a keyword when it directly follows a value', () => {
    // The old tokenizer ate "AND Return on equity" as one identifier, which
    // silently dropped every condition after the first.
    const types = tokenize('roce > 20 AND roe < 15').map((t) => t.type);
    expect(types).toEqual([
      'IDENTIFIER', 'COMPARISON', 'NUMBER',
      'LOGICAL_AND',
      'IDENTIFIER', 'COMPARISON', 'NUMBER',
      'EOF',
    ]);
  });

  it('keeps OR as a keyword inside a bracketed group', () => {
    const types = tokenize('Price to Earning < 25 AND (roce > 20 OR roe > 20)').map((t) => t.type);
    expect(types).toContain('LOGICAL_OR');
    expect(types.filter((t) => t === 'UNKNOWN')).toHaveLength(0);
  });

  it('matches the longest metric name at a position', () => {
    const [first] = tokenize('Sales growth 3Years > 15');
    expect(first.metricKey).toBe('sales_growth_3y');
  });

  it('matches a metric name that runs up against a keyword', () => {
    // "Graham Number AND ..." collapses to "grahamnumberand..." once spacing
    // is ignored, so the boundary has to be judged on the original text.
    const tokens = tokenize('Current price < Graham Number AND Debt to equity < 0.5');
    expect(tokens.filter((t) => t.type === 'UNKNOWN')).toHaveLength(0);
    expect(tokens.find((t) => t.metricKey === 'graham_number')).toBeDefined();
  });

  it('is insensitive to spacing inside a name', () => {
    expect(tokenize('P/E < 20')[0].metricKey).toBe('pe_ratio');
    expect(tokenize('p / e < 20')[0].metricKey).toBe('pe_ratio');
    expect(tokenize('DMA 200 > 100')[0].metricKey).toBe('dma_200');
  });
});

describe('parser', () => {
  it('applies every condition, not just the first', () => {
    const result = executeScreenerQuery('Price to Earning < 15 AND Return on equity > 30', UNIVERSE);
    expect(result.error).toBeUndefined();
    expect(result.matches.map((s) => s.symbol)).toEqual(['TATAMOTORS']);
  });

  it('honours OR inside brackets', () => {
    const both = executeScreenerQuery('roce > 50 OR debt to equity > 0.5', UNIVERSE);
    expect(both.matches.map((s) => s.symbol).sort()).toEqual(['TATAMOTORS', 'TCS']);

    const grouped = executeScreenerQuery('Price to Earning < 15 AND (roce > 50 OR roce > 20)', UNIVERSE);
    expect(grouped.matches.map((s) => s.symbol)).toEqual(['TATAMOTORS']);
  });

  it('binds NOT to the whole comparison', () => {
    const result = executeScreenerQuery('NOT Price to Earning < 15', UNIVERSE);
    expect(result.error).toBeUndefined();
    expect(result.matches.map((s) => s.symbol)).toEqual(['TCS']);
  });

  it('rejects an unknown metric instead of scoring it as zero', () => {
    const result = executeScreenerQuery('Fake Metric > 5', UNIVERSE);
    expect(result.error).toMatch(/Unknown metric/i);
    expect(result.matches).toHaveLength(0);
  });

  it('suggests a near miss', () => {
    const result = executeScreenerQuery('Retrun on equity > 5', UNIVERSE);
    expect(result.error).toMatch(/Return on Equity/i);
  });

  it('rejects trailing tokens rather than ignoring them', () => {
    const result = executeScreenerQuery('roce > 20 rubbish', UNIVERSE);
    expect(result.error).toBeTruthy();
  });

  it('reports an unclosed bracket', () => {
    expect(executeScreenerQuery('(roce > 20', UNIVERSE).error).toMatch(/\)/);
  });

  it('reports a query that ends early', () => {
    expect(executeScreenerQuery('roce >', UNIVERSE).error).toMatch(/ends early/i);
  });

  it('handles arithmetic between metrics', () => {
    const result = executeScreenerQuery('Current price < Graham Number', UNIVERSE);
    expect(result.matches.map((s) => s.symbol)).toEqual(['TATAMOTORS']);
  });

  it('supports equality against text', () => {
    const result = executeScreenerQuery('Sector == "Technology"', UNIVERSE);
    expect(result.matches.map((s) => s.symbol)).toEqual(['TCS']);
  });

  it('reports which metrics a query reads', () => {
    const { metrics } = parseQuery('roce > 20 AND Debt to equity < 0.5');
    expect(metrics).toEqual(['roce', 'debt_to_equity']);
  });
});

describe('missing figures', () => {
  it('never lets an unreported figure satisfy a comparison', () => {
    // current_ratio is null here. Treating null as 0 would pass "< 1".
    const result = executeScreenerQuery('Current ratio < 1', [UNKNOWN_ROE]);
    expect(result.matches).toHaveLength(0);
  });

  it('excludes an unreported figure from a greater-than test too', () => {
    const result = executeScreenerQuery('Current ratio > 0', [UNKNOWN_ROE]);
    expect(result.matches).toHaveLength(0);
  });

  it('counts companies dropped for a missing figure', () => {
    const result = executeScreenerQuery('Return on equity > 10', [TCS, UNKNOWN_ROE]);
    expect(result.matches.map((s) => s.symbol)).toEqual(['TCS']);
    expect(result.skippedForMissingData).toBe(1);
  });

  it('does not match a null against equality', () => {
    expect(executeScreenerQuery('Return on equity == 0', [UNKNOWN_ROE]).matches).toHaveLength(0);
  });
});

describe('formatting', () => {
  it('canonicalises names and breaks on boolean operators', () => {
    expect(formatScreenerQuery('roce>20 and pe<15')).toBe(
      'Return on Capital Employed > 20\nAND Price to Earning < 15'
    );
  });

  it('leaves an invalid query untouched', () => {
    expect(formatScreenerQuery('roce > > 20')).toBe('roce > > 20');
  });
});

describe('whole universe', () => {
  it('returns everything for an empty query', () => {
    expect(executeScreenerQuery('   ', UNIVERSE).matches).toHaveLength(2);
  });
});
