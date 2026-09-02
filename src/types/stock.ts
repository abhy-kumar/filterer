export interface QuarterlyResult {
  period: string; // e.g. "Dec 2023", "Mar 2024", "Jun 2024", "Sep 2024", "Dec 2024"
  sales: number;
  expenses: number;
  operating_profit: number;
  opm_pct: number;
  other_income: number;
  interest: number;
  depreciation: number;
  profit_before_tax: number;
  tax_pct: number;
  net_profit: number;
  eps: number;
}

export interface AnnualPnL {
  year: string; // e.g. "Mar 2015" ... "Mar 2024", "TTM"
  sales: number;
  expenses: number;
  operating_profit: number;
  opm_pct: number;
  other_income: number;
  interest: number;
  depreciation: number;
  profit_before_tax: number;
  tax_pct: number;
  net_profit: number;
  eps: number;
  dividend_payout_pct: number;
}

export interface BalanceSheet {
  year: string; // e.g. "Mar 2015" ... "Mar 2024"
  equity_capital: number;
  reserves: number;
  borrowings: number;
  other_liabilities: number;
  total_liabilities: number;
  fixed_assets: number;
  cwip: number;
  investments: number;
  other_assets: number;
  total_assets: number;
}

export interface CashFlow {
  year: string; // e.g. "Mar 2015" ... "Mar 2024"
  operating_cf: number;
  investing_cf: number;
  financing_cf: number;
  net_cf: number;
  free_cf: number;
}

export interface RatioHistory {
  year: string;
  roce: number;
  roe: number;
  debtor_days: number;
  inventory_days: number;
  days_payable: number;
  working_capital_days: number;
  cash_conversion_cycle: number;
}

export interface ShareholdingPeriod {
  period: string; // e.g. "Sep 2023", "Dec 2023", "Mar 2024", "Jun 2024", "Sep 2024", "Dec 2024"
  promoter: number;
  fii: number;
  dii: number;
  public: number;
  others: number;
  pledged: number;
}

export interface PricePoint {
  date: string;
  price: number;
  dma_50?: number;
  dma_200?: number;
  volume?: number;
  pe?: number;
}

export interface PeerInfo {
  symbol: string;
  name: string;
  current_price: number;
  pe_ratio: number;
  market_cap: number;
  dividend_yield: number;
  net_profit_qtr: number;
  qtr_profit_var_pct: number;
  sales_qtr: number;
  qtr_sales_var_pct: number;
  roce: number;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  bse_code?: string;
  nse_symbol: string;
  sector: string;
  industry: string;
  about: string;
  website?: string;

  // Price & Market
  current_price: number;
  change: number;
  change_pct: number;
  market_cap: number; // in Cr
  high_52w: number;
  low_52w: number;
  all_time_high?: number;
  face_value: number;
  volume: number;
  avg_volume_30d?: number;

  // Valuation
  pe_ratio: number;
  industry_pe: number;
  pb_ratio: number;
  peg_ratio: number;
  graham_number: number;
  ev_ebitda: number;
  price_to_sales: number;
  price_to_fcf: number;
  dividend_yield: number;
  book_value: number;

  // Profitability & Margins
  roce: number;
  roe: number;
  roic?: number;
  opm: number; // Operating Profit Margin %
  npm: number; // Net Profit Margin %

  // Compounded Growth Rates (%)
  sales_growth_ttm?: number;
  sales_growth_3y: number;
  sales_growth_5y: number;
  sales_growth_10y: number;
  profit_growth_ttm?: number;
  profit_growth_3y: number;
  profit_growth_5y: number;
  profit_growth_10y: number;
  price_cagr_1y: number;
  price_cagr_3y: number;
  price_cagr_5y: number;
  price_cagr_10y: number;
  roe_3y: number;
  roe_5y: number;
  roe_10y: number;

  // Financial Health & Leverage
  debt: number; // in Cr
  debt_to_equity: number;
  interest_coverage: number;
  current_ratio: number;
  quick_ratio?: number;
  piotroski_score: number; // 0-9
  altman_z_score: number;

  // Working Capital Ratios
  debtor_days: number;
  inventory_days: number;
  days_payable: number;
  working_capital_days: number;
  cash_conversion_cycle: number;

  // Cash Flows
  cfo_latest: number;
  cfo_3y: number;
  cfo_5y: number;
  fcf_latest: number;
  fcf_3y: number;
  fcf_5y: number;
  fcf_yield: number;

  // Shareholding
  promoter_holding: number;
  change_in_promoter_holding_quarter: number;
  pledged_percentage: number;
  fii_holding: number;
  change_in_fii_holding_quarter: number;
  dii_holding: number;
  change_in_dii_holding_quarter: number;
  public_holding: number;

  // Technical Indicators
  dma_20?: number;
  dma_50: number;
  dma_200: number;
  rsi_14: number;
  distance_52w_high: number; // %
  distance_52w_low: number; // %

  // Financial Statements & Time-Series
  quarterly_results?: QuarterlyResult[];
  annual_pnl?: AnnualPnL[];
  balance_sheet?: BalanceSheet[];
  cash_flow?: CashFlow[];
  shareholding_history?: ShareholdingPeriod[];
  ratios_history?: RatioHistory[];
  historical_prices?: PricePoint[];
  peers?: PeerInfo[];
  pros?: string[];
  cons?: string[];
}

export interface MetricDefinition {
  id: string;
  name: string;
  short_name?: string;
  aliases: string[];
  category: 'Valuation' | 'Profitability' | 'Growth' | 'Financial Health' | 'Cash Flow' | 'Technicals' | 'Shareholding' | 'General';
  unit: 'Cr' | 'Rs' | '%' | 'x' | 'Days' | 'Score' | 'Number';
  description: string;
  formula?: string;
  defaultSortAscending?: boolean;
}

export interface ScreenFilter {
  id: string;
  title: string;
  description: string;
  query: string;
  category: 'Popular' | 'Growth' | 'Valuation' | 'Technicals' | 'Safety' | 'Dividends';
  iconName: string;
  author?: string;
}

export interface ScreenResult {
  stocks: Stock[];
  totalMatches: number;
  executionTimeMs: number;
  query: string;
  error?: string;
}
