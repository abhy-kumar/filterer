import { describe, it, expect } from 'vitest';
import { tokenize, ScreenerParser, executeScreenerQuery } from '../src/engine/screenerParser';
import { Stock } from '../src/types/stock';

const mockStocks: Stock[] = [
  {
    id: 'tcs',
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    nse_symbol: 'TCS',
    sector: 'Information Technology',
    industry: 'IT Services',
    about: 'IT Services Company',
    current_price: 3880,
    change: 20,
    change_pct: 0.5,
    market_cap: 1400000,
    high_52w: 4500,
    low_52w: 3500,
    face_value: 1,
    volume: 1000000,
    pe_ratio: 29.8,
    industry_pe: 28.5,
    pb_ratio: 14.2,
    peg_ratio: 2.4,
    graham_number: 1150,
    ev_ebitda: 20.4,
    price_to_sales: 5.8,
    price_to_fcf: 28.2,
    dividend_yield: 1.95,
    book_value: 273.2,
    roce: 58.4,
    roe: 49.8,
    opm: 26.2,
    npm: 19.3,
    sales_growth_3y: 11.8,
    sales_growth_5y: 10.9,
    sales_growth_10y: 11.2,
    profit_growth_3y: 10.5,
    profit_growth_5y: 9.2,
    profit_growth_10y: 9.8,
    price_cagr_1y: -2.4,
    price_cagr_3y: 6.8,
    price_cagr_5y: 14.2,
    price_cagr_10y: 16.5,
    roe_3y: 48.6,
    roe_5y: 45.2,
    roe_10y: 42.0,
    debt: 0,
    debt_to_equity: 0,
    interest_coverage: 120,
    current_ratio: 2.6,
    piotroski_score: 8,
    altman_z_score: 14.8,
    debtor_days: 68,
    inventory_days: 0,
    days_payable: 22,
    working_capital_days: 46,
    cash_conversion_cycle: 46,
    cfo_latest: 44500,
    cfo_3y: 125000,
    cfo_5y: 195000,
    fcf_latest: 41200,
    fcf_3y: 116000,
    fcf_5y: 182000,
    fcf_yield: 2.93,
    promoter_holding: 71.77,
    change_in_promoter_holding_quarter: 0,
    pledged_percentage: 0,
    fii_holding: 12.35,
    change_in_fii_holding_quarter: -0.15,
    dii_holding: 10.42,
    change_in_dii_holding_quarter: 0.28,
    public_holding: 5.46,
    dma_50: 3950,
    dma_200: 4120,
    rsi_14: 46.2,
    distance_52w_high: -15,
    distance_52w_low: 7,
  },
  {
    id: 'tatamotors',
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Ltd',
    nse_symbol: 'TATAMOTORS',
    sector: 'Automobile',
    industry: 'Automobiles',
    about: 'Automobile Company',
    current_price: 725,
    change: -10,
    change_pct: -1.4,
    market_cap: 266800,
    high_52w: 1179,
    low_52w: 690,
    face_value: 2,
    volume: 16000000,
    pe_ratio: 8.5,
    industry_pe: 28.0,
    pb_ratio: 2.8,
    peg_ratio: 0.22,
    graham_number: 880,
    ev_ebitda: 4.2,
    price_to_sales: 0.6,
    price_to_fcf: 8.5,
    dividend_yield: 0.83,
    book_value: 258.9,
    roce: 22.8,
    roe: 36.5,
    opm: 14.5,
    npm: 7.2,
    sales_growth_3y: 28.5,
    sales_growth_5y: 10.8,
    sales_growth_10y: 6.8,
    profit_growth_3y: 85.0,
    profit_growth_5y: 45.0,
    profit_growth_10y: 18.0,
    price_cagr_1y: -22.5,
    price_cagr_3y: 18.5,
    price_cagr_5y: 38.5,
    price_cagr_10y: 4.8,
    roe_3y: 24.5,
    roe_5y: 12.5,
    roe_10y: 8.2,
    debt: 58000,
    debt_to_equity: 0.62,
    interest_coverage: 6.8,
    current_ratio: 0.95,
    piotroski_score: 7,
    altman_z_score: 3.1,
    debtor_days: 18,
    inventory_days: 45,
    days_payable: 78,
    working_capital_days: -15,
    cash_conversion_cycle: -15,
    cfo_latest: 42000,
    cfo_3y: 95000,
    cfo_5y: 135000,
    fcf_latest: 31500,
    fcf_3y: 68000,
    fcf_5y: 92000,
    fcf_yield: 11.8,
    promoter_holding: 46.36,
    change_in_promoter_holding_quarter: 0,
    pledged_percentage: 0,
    fii_holding: 19.85,
    change_in_fii_holding_quarter: -1.45,
    dii_holding: 15.60,
    change_in_dii_holding_quarter: 0.95,
    public_holding: 18.19,
    dma_50: 785,
    dma_200: 920,
    rsi_14: 38.5,
    distance_52w_high: -38.5,
    distance_52w_low: 5.0,
  }
];

describe('Screener Query Parser', () => {
  it('tokenizes simple comparison query', () => {
    const tokens = tokenize('Market Capitalization > 500 AND ROCE > 20');
    expect(tokens.length).toBeGreaterThan(3);
    expect(tokens[0].type).toBe('IDENTIFIER');
  });

  it('parses and filters stocks correctly', () => {
    const result = executeScreenerQuery('ROCE > 30', mockStocks);
    expect(result.error).toBeUndefined();
    expect(result.matches.length).toBe(1);
    expect(result.matches[0].symbol).toBe('TCS');
  });

  it('handles compound boolean queries with AND / OR', () => {
    const result = executeScreenerQuery('Price to Earning < 15 AND Return on equity > 30', mockStocks);
    expect(result.matches.length).toBe(1);
    expect(result.matches[0].symbol).toBe('TATAMOTORS');
  });

  it('handles debt to equity and zero debt filters', () => {
    const result = executeScreenerQuery('Debt to equity == 0', mockStocks);
    expect(result.matches.length).toBe(1);
    expect(result.matches[0].symbol).toBe('TCS');
  });

  it('handles mathematical arithmetic expressions', () => {
    const result = executeScreenerQuery('Current price < Graham Number', mockStocks);
    expect(result.matches.length).toBe(1);
    expect(result.matches[0].symbol).toBe('TATAMOTORS');
  });
});
