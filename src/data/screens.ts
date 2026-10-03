import { ScreenFilter } from '../types/stock';

/**
 * Curated screens.
 *
 * Each one is written against metrics this universe actually reports. The
 * dataset carries four years of annual statements, so five- and ten-year CAGRs
 * are unavailable and the screens use three-year and trailing-twelve-month
 * figures instead. Ownership deltas are excluded because the underlying series
 * is placeholder data (see src/engine/dataQuality.ts).
 *
 * The card shows the criteria, generated from the query, so a description
 * only says what the criteria cannot: where an idea comes from, or a caveat
 * about the data. Most screens need neither and have none.
 */
export const SCREEN_CATEGORIES = ['Quality', 'Value', 'Growth', 'Income', 'Technical'] as const;

export const CURATED_SCREENS: ScreenFilter[] = [
  {
    id: 'debt-free-compounders',
    title: 'Debt-free compounders',
    description: '',
    query:
      'Debt to equity < 0.1 AND Return on capital employed > 20 AND Profit growth 3Years > 12 AND Market Capitalization > 500',
    category: 'Quality',
  },
  {
    id: 'magic-formula',
    title: 'Magic formula',
    description:
      'Greenblatt ranks every company on return on capital and earnings yield and buys the top of the combined list. This is a cruder version with fixed cut-offs.',
    query:
      'Price to Earning < 25 AND Return on capital employed > 22 AND Return on equity > 18 AND Market Capitalization > 1000',
    category: 'Value',
    basedOn: 'Joel Greenblatt',
  },
  {
    id: 'growth-champions',
    title: 'Consistent growth',
    description: '',
    query:
      'Sales growth 3Years > 12 AND Profit growth 3Years > 15 AND Sales growth TTM > 5 AND Profit growth TTM > 5',
    category: 'Growth',
  },
  {
    id: 'undervalued-bargains',
    title: 'Below the Graham number',
    description: 'The Graham number is √(22.5 × EPS × book value per share).',
    query:
      'Current price < Graham Number AND Debt to equity < 0.5 AND Return on equity > 12 AND Market Capitalization > 300',
    category: 'Value',
    basedOn: 'Benjamin Graham',
  },
  {
    id: 'golden-crossover',
    title: 'Golden cross, not overbought',
    description: '',
    query: 'DMA 50 > DMA 200 AND Current price > DMA 50 AND RSI > 50 AND RSI < 70',
    category: 'Technical',
  },
  {
    id: 'quality-at-a-discount',
    title: 'Cheaper than its sector',
    description: 'Sector P/E is the median of the other companies in the same sector here, not an index figure.',
    query:
      'Return on capital employed > 18 AND Price to Earning < Industry PE AND Debt to equity < 0.6 AND Market Capitalization > 1000',
    category: 'Value',
  },
  {
    id: 'piotroski-high-score',
    title: 'Piotroski 7 or better',
    description:
      'Eight of the nine tests can be scored from the filings here. Banks have no Z-score, so none of them pass.',
    query: 'Piotroski score >= 7 AND Altman Z-Score > 2.9 AND Return on equity > 14',
    category: 'Quality',
    basedOn: 'Joseph Piotroski',
  },
  {
    id: 'cash-flow-kings',
    title: 'High free cash flow yield',
    description: 'Operating cash flow here is the sum of the last three years, in ₹ crore.',
    query: 'Free cash flow yield > 4 AND Operating cash flow 3Years > 200 AND Debt to equity < 0.8',
    category: 'Value',
  },
  {
    id: 'high-dividend-yield',
    title: 'Dividends with cover',
    description: '',
    query:
      'Dividend yield > 2.5 AND Debt to equity < 0.8 AND Return on capital employed > 15 AND Market Capitalization > 1000',
    category: 'Income',
  },
  {
    id: 'near-52w-high-breakout',
    title: 'Near the 52-week high',
    description: '',
    query: 'Distance from 52w High > -10 AND Price to Earning < 30 AND Return on equity > 15',
    category: 'Technical',
  },
  {
    id: 'low-peg-growth',
    title: 'Growth at a reasonable price',
    description: "Lynch's rule of thumb was a PEG under 1. This allows a little more room.",
    query:
      'PEG Ratio < 1.2 AND PEG Ratio > 0 AND Profit growth 3Years > 18 AND Return on capital employed > 18',
    category: 'Growth',
    basedOn: 'Peter Lynch',
  },
  {
    id: 'oversold-quality',
    title: 'Oversold, still profitable',
    description: '',
    query:
      'RSI < 40 AND Distance from 52w High < -20 AND Return on capital employed > 15 AND Debt to equity < 0.5',
    category: 'Technical',
  },
];
