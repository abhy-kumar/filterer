import { MetricDefinition } from '../types/stock';

export const METRICS_DICTIONARY: MetricDefinition[] = [
  // Valuation
  {
    id: 'market_cap',
    name: 'Market Capitalization',
    short_name: 'Market Cap',
    aliases: ['market cap', 'market capitalization', 'mcap', 'mar cap', 'market_cap', 'marketcap'],
    category: 'Valuation',
    unit: 'Cr',
    description: 'Total market value of a company’s outstanding shares in Crores (₹ Cr).',
  },
  {
    id: 'current_price',
    name: 'Current Price',
    short_name: 'CMP',
    aliases: ['current price', 'cmp', 'price', 'share price', 'stock price', 'current_price'],
    category: 'Valuation',
    unit: 'Rs',
    description: 'Latest closing or traded market price per share in Rupees.',
  },
  {
    id: 'pe_ratio',
    name: 'Price to Earning',
    short_name: 'P/E',
    aliases: ['price to earning', 'pe', 'p/e', 'stock p/e', 'pe ratio', 'p/e ratio', 'price to earnings', 'pe_ratio'],
    category: 'Valuation',
    unit: 'x',
    description: 'Ratio of current market price to trailing twelve months (TTM) earnings per share.',
    defaultSortAscending: true,
  },
  {
    id: 'industry_pe',
    name: 'Industry PE',
    short_name: 'Ind P/E',
    aliases: ['industry pe', 'industry p/e', 'sector pe', 'sector p/e', 'industry_pe'],
    category: 'Valuation',
    unit: 'x',
    description: 'Median P/E of the other companies in the same sector within this universe. A narrower peer set than a full industry aggregate.',
  },
  {
    id: 'book_value',
    name: 'Book Value',
    short_name: 'BV',
    aliases: ['book value', 'bv', 'book value per share', 'bvps', 'book_value'],
    category: 'Valuation',
    unit: 'Rs',
    description: 'Net asset value per share according to the latest balance sheet.',
  },
  {
    id: 'pb_ratio',
    name: 'Price to Book Value',
    short_name: 'P/BV',
    aliases: ['price to book', 'price to book value', 'pb', 'p/bv', 'p/b', 'pb ratio', 'pb_ratio'],
    category: 'Valuation',
    unit: 'x',
    description: 'Ratio of stock price to book value per share.',
    defaultSortAscending: true,
  },
  {
    id: 'peg_ratio',
    name: 'PEG Ratio',
    short_name: 'PEG',
    aliases: ['peg ratio', 'peg', 'price to earning to growth', 'peg_ratio'],
    category: 'Valuation',
    unit: 'x',
    description: 'P/E ratio divided by the growth rate of its earnings.',
    defaultSortAscending: true,
  },
  {
    id: 'dividend_yield',
    name: 'Dividend Yield',
    short_name: 'Div Yield',
    aliases: ['dividend yield', 'div yield', 'div yield %', 'dividend_yield', 'div_yield'],
    category: 'Valuation',
    unit: '%',
    description: 'Annual dividend payout as a percentage of current share price.',
  },
  {
    id: 'ev_ebitda',
    name: 'EV / EBITDA',
    short_name: 'EV/EBITDA',
    aliases: ['ev / ebitda', 'ev/ebitda', 'enterprise value to ebitda', 'ev_ebitda'],
    category: 'Valuation',
    unit: 'x',
    description: 'Enterprise Value divided by Earnings Before Interest, Taxes, Depreciation, and Amortization.',
  },
  {
    id: 'price_to_sales',
    name: 'Price to Sales',
    short_name: 'P/S',
    aliases: ['price to sales', 'p/s', 'ps ratio', 'price / sales', 'price_to_sales'],
    category: 'Valuation',
    unit: 'x',
    description: 'Ratio of market cap to total annual revenue.',
  },
  {
    id: 'price_to_fcf',
    name: 'Price to Free Cash Flow',
    short_name: 'P/FCF',
    aliases: ['price to free cash flow', 'p/fcf', 'pfcf', 'price to fcf', 'price_to_fcf'],
    category: 'Valuation',
    unit: 'x',
    description: 'Ratio of market cap to trailing twelve months Free Cash Flow.',
  },
  {
    id: 'graham_number',
    name: 'Graham Number',
    short_name: 'Graham No',
    aliases: ['graham number', 'graham value', 'graham_number'],
    category: 'Valuation',
    unit: 'Rs',
    description: 'Upper bound of the price range an investor should pay for a stock (√(22.5 * EPS * Book Value)).',
  },
  {
    id: 'face_value',
    name: 'Face Value',
    short_name: 'FV',
    aliases: ['face value', 'fv', 'face_value'],
    category: 'Valuation',
    unit: 'Rs',
    description: 'Nominal or original value of a share stated by the issuer.',
  },

  // Profitability
  {
    id: 'roce',
    name: 'Return on Capital Employed',
    short_name: 'ROCE',
    aliases: ['roce', 'return on capital employed', 'roce %', 'roce_pct'],
    category: 'Profitability',
    unit: '%',
    description: 'Percentage return a company generates on all capital employed (Equity + Debt).',
  },
  {
    id: 'roe',
    name: 'Return on Equity',
    short_name: 'ROE',
    aliases: ['roe', 'return on equity', 'roe %', 'roe_pct'],
    category: 'Profitability',
    unit: '%',
    description: 'Measure of financial performance calculated by dividing net income by shareholders equity.',
  },
  {
    id: 'opm',
    name: 'Operating Profit Margin',
    short_name: 'OPM',
    aliases: ['opm', 'opm %', 'operating margin', 'operating profit margin', 'ebit margin'],
    category: 'Profitability',
    unit: '%',
    description: 'Operating profit as a percentage of total sales.',
  },
  {
    id: 'npm',
    name: 'Net Profit Margin',
    short_name: 'NPM',
    aliases: ['npm', 'npm %', 'net profit margin', 'net margin', 'pat margin'],
    category: 'Profitability',
    unit: '%',
    description: 'Net profit after taxes as a percentage of total sales.',
  },

  // Growth
  {
    id: 'sales_growth_3y',
    name: 'Sales Growth 3Years',
    short_name: 'Sales Gr 3Y',
    aliases: ['sales growth 3years', 'sales growth 3y', 'sales growth 3 years', 'sales 3y cagr', 'sales_growth_3y'],
    category: 'Growth',
    unit: '%',
    description: 'Compounded annual growth rate (CAGR) of sales over the past 3 years.',
  },
  {
    id: 'sales_growth_5y',
    name: 'Sales Growth 5Years',
    short_name: 'Sales Gr 5Y',
    aliases: ['sales growth 5years', 'sales growth 5y', 'sales growth 5 years', 'sales 5y cagr', 'sales_growth_5y'],
    category: 'Growth',
    unit: '%',
    description: 'Compounded annual growth rate (CAGR) of sales over the past 5 years.',
  },
  {
    id: 'sales_growth_10y',
    name: 'Sales Growth 10Years',
    short_name: 'Sales Gr 10Y',
    aliases: ['sales growth 10years', 'sales growth 10y', 'sales growth 10 years', 'sales_growth_10y'],
    category: 'Growth',
    unit: '%',
    description: 'Compounded annual growth rate of sales over 10 years.',
  },
  {
    id: 'profit_growth_3y',
    name: 'Profit Growth 3Years',
    short_name: 'Profit Gr 3Y',
    aliases: ['profit growth 3years', 'profit growth 3y', 'profit growth 3 years', 'profit 3y cagr', 'profit_growth_3y', 'eps growth 3years'],
    category: 'Growth',
    unit: '%',
    description: 'Compounded annual growth rate of net profit over the past 3 years.',
  },
  {
    id: 'profit_growth_5y',
    name: 'Profit Growth 5Years',
    short_name: 'Profit Gr 5Y',
    aliases: ['profit growth 5years', 'profit growth 5y', 'profit growth 5 years', 'profit 5y cagr', 'profit_growth_5y', 'eps growth 5years'],
    category: 'Growth',
    unit: '%',
    description: 'Compounded annual growth rate of net profit over the past 5 years.',
  },
  {
    id: 'profit_growth_10y',
    name: 'Profit Growth 10Years',
    short_name: 'Profit Gr 10Y',
    aliases: ['profit growth 10years', 'profit growth 10y', 'profit growth 10 years', 'profit_growth_10y'],
    category: 'Growth',
    unit: '%',
    description: 'Compounded annual growth rate of net profit over 10 years.',
  },
  {
    id: 'price_cagr_1y',
    name: 'Stock Price CAGR 1Year',
    short_name: '1Y Return',
    aliases: ['stock price cagr 1year', '1y return', 'return 1y', 'price cagr 1y', 'price_cagr_1y'],
    category: 'Growth',
    unit: '%',
    description: '1-Year stock price return percentage.',
  },
  {
    id: 'price_cagr_3y',
    name: 'Stock Price CAGR 3Years',
    short_name: '3Y Return CAGR',
    aliases: ['stock price cagr 3years', '3y return', 'return 3y', 'price cagr 3y', 'price_cagr_3y'],
    category: 'Growth',
    unit: '%',
    description: 'Compounded stock price return CAGR over 3 years.',
  },
  {
    id: 'price_cagr_5y',
    name: 'Stock Price CAGR 5Years',
    short_name: '5Y Return CAGR',
    aliases: ['stock price cagr 5years', '5y return', 'return 5y', 'price cagr 5y', 'price_cagr_5y'],
    category: 'Growth',
    unit: '%',
    description: 'Compounded stock price return CAGR over 5 years.',
  },

  // Financial Health
  {
    id: 'debt',
    name: 'Debt',
    short_name: 'Debt',
    aliases: ['debt', 'total debt', 'borrowings', 'debt_in_cr'],
    category: 'Financial Health',
    unit: 'Cr',
    description: 'Total outstanding short-term and long-term borrowings in ₹ Cr.',
    defaultSortAscending: true,
  },
  {
    id: 'debt_to_equity',
    name: 'Debt to Equity',
    short_name: 'D/E',
    aliases: ['debt to equity', 'd/e', 'debt / equity', 'de ratio', 'debt_to_equity'],
    category: 'Financial Health',
    unit: 'x',
    description: 'Total debt divided by total shareholders equity.',
    defaultSortAscending: true,
  },
  {
    id: 'interest_coverage',
    name: 'Interest Coverage',
    short_name: 'Int Coverage',
    aliases: ['interest coverage', 'interest coverage ratio', 'icr', 'interest_coverage'],
    category: 'Financial Health',
    unit: 'x',
    description: 'Operating profit (EBIT) divided by annual interest expense.',
  },
  {
    id: 'current_ratio',
    name: 'Current Ratio',
    short_name: 'Current Ratio',
    aliases: ['current ratio', 'cr', 'current_ratio'],
    category: 'Financial Health',
    unit: 'x',
    description: 'Current Assets divided by Current Liabilities.',
  },
  {
    id: 'piotroski_score',
    name: 'Piotroski Score',
    short_name: 'Piotroski',
    aliases: ['piotroski score', 'piotroski', 'f-score', 'f score', 'piotroski_score'],
    category: 'Financial Health',
    unit: 'Score',
    description: '9-point fundamental financial strength score developed by Joseph Piotroski.',
  },
  {
    id: 'altman_z_score',
    name: 'Altman Z-Score',
    short_name: 'Altman Z',
    aliases: ['altman z-score', 'altman z score', 'z-score', 'z score', 'altman_z_score'],
    category: 'Financial Health',
    unit: 'Score',
    description: 'Formula for predicting bankruptcy risk (>2.99 safe, <1.81 distressed).',
  },

  // Cash Flow & Working Capital
  {
    id: 'fcf_latest',
    name: 'Free Cash Flow',
    short_name: 'FCF Latest',
    aliases: ['free cash flow', 'fcf', 'free cash flow latest', 'fcf_latest'],
    category: 'Cash Flow',
    unit: 'Cr',
    description: 'Cash flow from operations minus capital expenditures for the latest year.',
  },
  {
    id: 'fcf_3y',
    name: 'Free Cash Flow 3Years',
    short_name: 'FCF 3Y Sum',
    aliases: ['free cash flow 3years', 'free cash flow 3y', 'fcf 3y', 'fcf_3y'],
    category: 'Cash Flow',
    unit: 'Cr',
    description: 'Total accumulated Free Cash Flow over the last 3 years.',
  },
  {
    id: 'cfo_3y',
    name: 'Operating Cash Flow 3Years',
    short_name: 'CFO 3Y Sum',
    aliases: ['operating cash flow 3years', 'operating cash flow 3y', 'cfo 3y', 'cfo_3y', 'cash from operations 3y'],
    category: 'Cash Flow',
    unit: 'Cr',
    description: 'Total Operating Cash Flow generated over the past 3 years in ₹ Cr.',
  },
  {
    id: 'fcf_yield',
    name: 'Free Cash Flow Yield',
    short_name: 'FCF Yield',
    aliases: ['fcf yield', 'free cash flow yield', 'fcf_yield'],
    category: 'Cash Flow',
    unit: '%',
    description: 'Free Cash Flow per share divided by Current Market Price.',
  },
  {
    id: 'working_capital_days',
    name: 'Working Capital Days',
    short_name: 'WC Days',
    aliases: ['working capital days', 'wc days', 'working_capital_days'],
    category: 'Cash Flow',
    unit: 'Days',
    description: 'Number of days it takes for a company to convert working capital into revenue.',
    defaultSortAscending: true,
  },
  {
    id: 'debtor_days',
    name: 'Debtor Days',
    short_name: 'Debtor Days',
    aliases: ['debtor days', 'days sales outstanding', 'dso', 'debtor_days'],
    category: 'Cash Flow',
    unit: 'Days',
    description: 'Average number of days required to collect payment after sales.',
    defaultSortAscending: true,
  },
  {
    id: 'inventory_days',
    name: 'Inventory Days',
    short_name: 'Inventory Days',
    aliases: ['inventory days', 'days inventory outstanding', 'dio', 'inventory_days'],
    category: 'Cash Flow',
    unit: 'Days',
    description: 'Average number of days a company holds its inventory before selling it.',
    defaultSortAscending: true,
  },
  {
    id: 'cash_conversion_cycle',
    name: 'Cash Conversion Cycle',
    short_name: 'CCC',
    aliases: ['cash conversion cycle', 'ccc', 'cash_conversion_cycle'],
    category: 'Cash Flow',
    unit: 'Days',
    description: 'Debtor Days + Inventory Days - Days Payable.',
    defaultSortAscending: true,
  },

  // Shareholding
  {
    id: 'promoter_holding',
    name: 'Promoter Holding',
    short_name: 'Promoter %',
    aliases: ['promoter holding', 'promoter stake', 'promoters holding', 'promoter_holding'],
    category: 'Shareholding',
    unit: '%',
    description: 'Percentage of shares held by the promoter group.',
  },
  {
    id: 'pledged_percentage',
    name: 'Pledged Percentage',
    short_name: 'Pledged %',
    aliases: ['pledged percentage', 'pledge %', 'promoter pledge', 'pledged shares', 'pledged_percentage'],
    category: 'Shareholding',
    unit: '%',
    description: 'Percentage of promoter shares pledged as collateral.',
    defaultSortAscending: true,
  },
  {
    id: 'fii_holding',
    name: 'FII Holding',
    short_name: 'FII %',
    aliases: ['fii holding', 'fii stake', 'foreign institutional holding', 'fii_holding'],
    category: 'Shareholding',
    unit: '%',
    description: 'Percentage of shares held by Foreign Institutional Investors.',
  },
  {
    id: 'change_in_fii_holding_quarter',
    name: 'Change in FII Holding',
    short_name: 'FII Δ Qtr',
    aliases: ['change in fii holding', 'fii holding change', 'fii change', 'change_in_fii_holding_quarter'],
    category: 'Shareholding',
    unit: '%',
    description: 'Quarter-over-quarter percentage change in FII ownership.',
  },
  {
    id: 'dii_holding',
    name: 'DII Holding',
    short_name: 'DII %',
    aliases: ['dii holding', 'dii stake', 'domestic institutional holding', 'dii_holding'],
    category: 'Shareholding',
    unit: '%',
    description: 'Percentage of shares held by Domestic Institutional Investors (Mutual Funds, Insurance, etc.).',
  },
  {
    id: 'change_in_dii_holding_quarter',
    name: 'Change in DII Holding',
    short_name: 'DII Δ Qtr',
    aliases: ['change in dii holding', 'dii holding change', 'dii change', 'change_in_dii_holding_quarter'],
    category: 'Shareholding',
    unit: '%',
    description: 'Quarter-over-quarter percentage change in DII ownership.',
  },
  {
    id: 'public_holding',
    name: 'Public Holding',
    short_name: 'Public %',
    aliases: ['public holding', 'retail holding', 'public_holding'],
    category: 'Shareholding',
    unit: '%',
    description: 'Percentage of shares held by retail and general public.',
  },

  // Technicals
  {
    id: 'dma_50',
    name: 'DMA 50',
    short_name: '50 DMA',
    aliases: ['dma 50', '50 dma', 'dma50', '50-day ma', '50 day moving average', 'dma_50'],
    category: 'Technicals',
    unit: 'Rs',
    description: '50-day simple moving average price in Rupees.',
  },
  {
    id: 'dma_200',
    name: 'DMA 200',
    short_name: '200 DMA',
    aliases: ['dma 200', '200 dma', 'dma200', '200-day ma', '200 day moving average', 'dma_200'],
    category: 'Technicals',
    unit: 'Rs',
    description: '200-day simple moving average price in Rupees.',
  },
  {
    id: 'rsi_14',
    name: 'RSI',
    short_name: 'RSI (14)',
    aliases: ['rsi', 'rsi 14', 'relative strength index', 'rsi_14'],
    category: 'Technicals',
    unit: 'Score',
    description: '14-day Relative Strength Index (0-100 momentum oscillator).',
  },
  {
    id: 'high_52w',
    name: 'High Price',
    short_name: '52W High',
    aliases: ['high price', '52w high', '52 week high', 'high_52w', '52_week_high'],
    category: 'Technicals',
    unit: 'Rs',
    description: 'Highest traded price in the last 52 weeks.',
  },
  {
    id: 'low_52w',
    name: 'Low Price',
    short_name: '52W Low',
    aliases: ['low price', '52w low', '52 week low', 'low_52w', '52_week_low'],
    category: 'Technicals',
    unit: 'Rs',
    description: 'Lowest traded price in the last 52 weeks.',
  },
  {
    id: 'distance_52w_high',
    name: 'Distance from 52w High',
    short_name: 'Dist 52W High',
    aliases: ['distance from 52w high', 'distance from high', 'down from 52w high', 'distance_52w_high'],
    category: 'Technicals',
    unit: '%',
    description: 'Percentage difference between current price and 52-week high.',
  },
  {
    id: 'volume',
    name: 'Volume',
    short_name: 'Volume',
    aliases: ['volume', 'vol', 'trade volume', 'shares traded'],
    category: 'Technicals',
    unit: 'Number',
    description: 'Latest trading volume in number of shares.',
  },
];


// ── Additional figures the dataset actually carries ─────────
export const EXTRA_METRICS: MetricDefinition[] = [
  {
    id: 'eps',
    name: 'Earnings Per Share',
    short_name: 'EPS',
    aliases: ['earnings per share', 'eps', 'eps ttm'],
    category: 'Valuation',
    unit: 'Rs',
    description: 'Trailing twelve month net profit attributable to each share.',
  },
  {
    id: 'change_pct',
    name: 'Day Change',
    short_name: 'Day %',
    aliases: ['day change', 'day %', 'change %', 'change_pct', 'daily change'],
    category: 'Technicals',
    unit: '%',
    description: 'Percentage move in the share price during the latest session.',
  },
  {
    id: 'days_payable',
    name: 'Days Payable',
    short_name: 'Days Payable',
    aliases: ['days payable', 'creditor days', 'days payable outstanding', 'dpo', 'days_payable'],
    category: 'Cash Flow',
    unit: 'Days',
    description: 'Average number of days the company takes to pay its suppliers.',
  },
  {
    id: 'cfo_latest',
    name: 'Operating Cash Flow',
    short_name: 'CFO',
    aliases: ['operating cash flow', 'cash from operations', 'cfo', 'cfo_latest'],
    category: 'Cash Flow',
    unit: 'Cr',
    description: 'Cash generated by operations in the latest reported year.',
  },
  {
    id: 'cfo_5y',
    name: 'Operating Cash Flow 5Years',
    short_name: 'CFO 5Y Sum',
    aliases: ['operating cash flow 5years', 'operating cash flow 5y', 'cfo 5y', 'cfo_5y'],
    category: 'Cash Flow',
    unit: 'Cr',
    description: 'Total operating cash flow generated over the past 5 years.',
  },
  {
    id: 'fcf_5y',
    name: 'Free Cash Flow 5Years',
    short_name: 'FCF 5Y Sum',
    aliases: ['free cash flow 5years', 'free cash flow 5y', 'fcf 5y', 'fcf_5y'],
    category: 'Cash Flow',
    unit: 'Cr',
    description: 'Total free cash flow accumulated over the last 5 years.',
  },
  {
    id: 'roe_3y',
    name: 'Average Return on Equity 3Years',
    short_name: 'ROE 3Y',
    aliases: ['average return on equity 3years', 'average roe 3years', 'roe 3years', 'roe 3y', 'roe_3y'],
    category: 'Profitability',
    unit: '%',
    description: 'Mean return on equity across the last 3 reported financial years.',
  },
  {
    id: 'roe_5y',
    name: 'Average Return on Equity 5Years',
    short_name: 'ROE 5Y',
    aliases: ['average return on equity 5years', 'average roe 5years', 'roe 5years', 'roe 5y', 'roe_5y'],
    category: 'Profitability',
    unit: '%',
    description: 'Mean return on equity across the last 5 reported financial years.',
  },
  {
    id: 'roe_10y',
    name: 'Average Return on Equity 10Years',
    short_name: 'ROE 10Y',
    aliases: ['average return on equity 10years', 'average roe 10years', 'roe 10years', 'roe 10y', 'roe_10y'],
    category: 'Profitability',
    unit: '%',
    description: 'Mean return on equity across the last 10 reported financial years.',
  },
  {
    id: 'sales_growth_ttm',
    name: 'Sales Growth TTM',
    short_name: 'Sales Gr TTM',
    aliases: ['sales growth ttm', 'sales growth 12months', 'sales growth 1y', 'sales_growth_ttm'],
    category: 'Growth',
    unit: '%',
    description: 'Sales growth over the trailing twelve months against the year before.',
  },
  {
    id: 'profit_growth_ttm',
    name: 'Profit Growth TTM',
    short_name: 'Profit Gr TTM',
    aliases: ['profit growth ttm', 'profit growth 12months', 'profit growth 1y', 'profit_growth_ttm'],
    category: 'Growth',
    unit: '%',
    description: 'Net profit growth over the trailing twelve months against the year before.',
  },
  {
    id: 'price_cagr_10y',
    name: 'Stock Price CAGR 10Years',
    short_name: '10Y Return CAGR',
    aliases: ['stock price cagr 10years', '10y return', 'return 10y', 'price cagr 10y', 'price_cagr_10y'],
    category: 'Growth',
    unit: '%',
    description: 'Compounded stock price return over 10 years.',
  },
  {
    id: 'distance_52w_low',
    name: 'Distance from 52w Low',
    short_name: 'Dist 52W Low',
    aliases: ['distance from 52w low', 'up from 52w low', 'distance from low', 'distance_52w_low'],
    category: 'Technicals',
    unit: '%',
    description: 'Percentage the current price sits above the 52-week low.',
  },
  {
    id: 'change_in_promoter_holding_quarter',
    name: 'Change in Promoter Holding',
    short_name: 'Promoter D Qtr',
    aliases: ['change in promoter holding', 'promoter holding change', 'promoter change', 'change_in_promoter_holding_quarter'],
    category: 'Shareholding',
    unit: '%',
    description: 'Quarter-over-quarter change in promoter ownership.',
  },
  {
    id: 'sector',
    name: 'Sector',
    aliases: ['sector'],
    category: 'General',
    unit: 'Text',
    valueType: 'text',
    description: 'Broad sector classification. Compare against a quoted value, e.g. Sector == "Technology".',
  },
  {
    id: 'industry',
    name: 'Industry',
    aliases: ['industry'],
    category: 'General',
    unit: 'Text',
    valueType: 'text',
    description: 'Narrow industry classification within the sector.',
  },
  {
    id: 'nse_industry',
    name: 'NSE Industry',
    aliases: ['nse industry', 'nse_industry', 'index industry'],
    category: 'General',
    unit: 'Text',
    valueType: 'text',
    description: "NSE's own industry classification, taken from the index constituent file.",
  },
  {
    id: 'isin',
    name: 'ISIN',
    aliases: ['isin', 'isin code'],
    category: 'General',
    unit: 'Text',
    valueType: 'text',
    description: 'International Securities Identification Number.',
  },
  {
    id: 'symbol',
    name: 'Symbol',
    short_name: 'Ticker',
    aliases: ['symbol', 'ticker', 'nse symbol', 'nse_symbol'],
    category: 'General',
    unit: 'Text',
    valueType: 'text',
    description: 'NSE trading symbol for the company.',
  },
  {
    id: 'name',
    name: 'Company Name',
    aliases: ['company name', 'name'],
    category: 'General',
    unit: 'Text',
    valueType: 'text',
    description: 'Registered company name.',
  },
];

METRICS_DICTIONARY.push(...EXTRA_METRICS);

// ── Lookup indexes ──────────────────────────────────────────

/** Every spelling that resolves to a metric, mapped to its Stock field. */
export const METRIC_ALIAS_MAP: Record<string, string> = {};

const METRIC_BY_ID = new Map<string, MetricDefinition>();

function addAlias(alias: string, id: string) {
  const normalized = alias.trim().toLowerCase().replace(/\s+/g, ' ');
  if (normalized) METRIC_ALIAS_MAP[normalized] = id;
}

METRICS_DICTIONARY.forEach((metric) => {
  METRIC_BY_ID.set(metric.id, metric);
  addAlias(metric.id, metric.id);
  addAlias(metric.name, metric.id);
  if (metric.short_name) addAlias(metric.short_name, metric.id);
  metric.aliases.forEach((alias) => addAlias(alias, metric.id));
});

export interface MetricPhrase {
  /** Lower-cased with every space removed, for whitespace-insensitive matching. */
  canon: string;
  /** The Stock field this phrase resolves to. */
  key: string;
  display: string;
}

/**
 * All spellings, longest first, so the tokenizer takes the longest match:
 * "sales growth 3years" has to win over "sales growth 3y".
 */
export const METRIC_PHRASES: MetricPhrase[] = Object.entries(METRIC_ALIAS_MAP)
  .map(([alias, key]) => ({ canon: alias.replace(/\s+/g, ''), key, display: alias }))
  .filter((p) => p.canon.length > 0)
  .sort((a, b) => b.canon.length - a.canon.length || a.canon.localeCompare(b.canon));

export function resolveMetricKey(input: string): string | null {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ');
  return METRIC_ALIAS_MAP[normalized] || null;
}

export function getMetric(id: string): MetricDefinition | undefined {
  return METRIC_BY_ID.get(id);
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** Nearest canonical metric names for an unrecognised word, used in error hints. */
export function suggestMetrics(input: string, limit = 2): string[] {
  const needle = input.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!needle) return [];

  const scored = METRICS_DICTIONARY.map((metric) => {
    const candidates = [metric.name, metric.short_name, ...metric.aliases].filter(Boolean) as string[];
    const best = Math.min(
      ...candidates.map((c) => {
        const lower = c.toLowerCase();
        if (lower.includes(needle) || needle.includes(lower)) return 0;
        return editDistance(needle, lower);
      })
    );
    return { name: metric.name, score: best };
  });

  const threshold = Math.max(3, Math.floor(needle.length / 2));
  return scored
    .filter((s) => s.score <= threshold)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((s) => s.name);
}
