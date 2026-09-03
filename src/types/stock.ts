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
  roe: number | null;
  debtor_days: number | null;
  inventory_days: number | null;
  days_payable: number | null;
  working_capital_days: number | null;
  cash_conversion_cycle: number | null;
}

export interface ShareholdingPeriod {
  period: string; // e.g. "Jun 2026"
  promoter: number | null;
  /**
   * NSE's filing endpoint reports the public holding as one figure and does
   * not split it into foreign and domestic institutions, so these are null
   * for filed data rather than estimated. BSE publishes the fuller breakdown.
   */
  fii: number | null;
  dii: number | null;
  public: number | null;
  /** Shares held by employee trusts, where disclosed. */
  others: number | null;
  total?: number | null;
  pledged: number | null;
  /** Where the row came from, e.g. "NSE filings". */
  source?: string;
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
  pe_ratio: number | null;
  market_cap: number;
  dividend_yield: number;
  net_profit_qtr: number;
  qtr_profit_var_pct: number;
  sales_qtr: number;
  qtr_sales_var_pct: number;
  roce: number;
  pb_ratio?: number | null;
  opm?: number | null;
  debt_to_equity?: number | null;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  bse_code?: string;
  nse_symbol: string;
  /** ISIN from the NSE constituent file, where the ingest captured one. */
  isin?: string;
  sector: string;
  industry: string;
  /** NSE's own industry classification, which is what a domestic screener should show. */
  nse_industry?: string;
  /** Loaded with the detail tier, not bundled. */
  about?: string;
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
  industry_pe: number | null;
  pb_ratio: number;
  peg_ratio: number | null;
  graham_number: number | null;
  ev_ebitda: number | null;
  price_to_sales: number;
  price_to_fcf: number | null;
  dividend_yield: number;
  book_value: number;
  eps: number;

  // Profitability & Margins
  roce: number;
  roe: number;
  roic?: number;
  opm: number; // Operating Profit Margin %
  npm: number; // Net Profit Margin %

  // Compounded Growth Rates (%)
  sales_growth_ttm?: number;
  sales_growth_3y: number | null;
  sales_growth_5y: number | null;
  sales_growth_10y: number | null;
  profit_growth_ttm?: number;
  profit_growth_3y: number | null;
  profit_growth_5y: number | null;
  profit_growth_10y: number | null;
  price_cagr_1y: number;
  price_cagr_3y: number;
  price_cagr_5y: number;
  price_cagr_10y: number;
  roe_3y: number | null;
  roe_5y: number | null;
  roe_10y: number | null;

  // Financial Health & Leverage
  debt: number; // in Cr
  debt_to_equity: number;
  interest_coverage: number | null;
  current_ratio: number | null;
  quick_ratio?: number;
  piotroski_score: number; // 0-9
  altman_z_score: number | null;

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
  /** Provenance for the shareholding block, e.g. "NSE filings". */
  shareholding_source?: string;
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
  unit: 'Cr' | 'Rs' | '%' | 'x' | 'Days' | 'Score' | 'Number' | 'Text';
  /** Text metrics compare with quoted strings; everything else is numeric. */
  valueType?: 'number' | 'text';
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
  createdAt?: string;
}

export interface ScreenResult {
  stocks: Stock[];
  totalMatches: number;
  executionTimeMs: number;
  query: string;
  error?: string;
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  symbols: string[];
  createdAt: string;
  updatedAt: string;
}

