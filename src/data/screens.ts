import { ScreenFilter } from '../types/stock';

/**
 * Curated screens.
 *
 * Each one is written against metrics this universe actually reports. The
 * dataset carries four years of annual statements, so five- and ten-year CAGRs
 * are unavailable and the screens use three-year and trailing-twelve-month
 * figures instead. Ownership deltas are excluded because the underlying series
 * is placeholder data (see src/engine/dataQuality.ts).
 */
export const CURATED_SCREENS: ScreenFilter[] = [
  {
    id: 'debt-free-compounders',
    title: 'Debt-Free Compounders',
    description:
      'Almost no borrowings, a high return on the capital they do employ, and three-year profit growth to show it compounds.',
    query:
      'Debt to equity < 0.1 AND Return on capital employed > 20 AND Profit growth 3Years > 12 AND Market Capitalization > 500',
    category: 'Popular',
    iconName: 'ShieldCheck',
    author: 'Filterer',
  },
  {
    id: 'magic-formula',
    title: 'Magic Formula',
    description:
      'Greenblatt in two lines: a high return on capital bought at an undemanding multiple. Size floor keeps out the illiquid.',
    query:
      'Price to Earning < 25 AND Return on capital employed > 22 AND Return on equity > 18 AND Market Capitalization > 1000',
    category: 'Valuation',
    iconName: 'Sparkles',
    author: 'Joel Greenblatt',
  },
  {
    id: 'growth-champions',
    title: 'Consistent Growth',
    description:
      'Both the top and bottom line compounding above 15% over three years, and still growing in the trailing twelve months.',
    query:
      'Sales growth 3Years > 12 AND Profit growth 3Years > 15 AND Sales growth TTM > 5 AND Profit growth TTM > 5',
    category: 'Growth',
    iconName: 'TrendingUp',
    author: 'Filterer',
  },
  {
    id: 'undervalued-bargains',
    title: 'Graham Bargains',
    description:
      'Trading under the Graham number, with a balance sheet that is not carrying the business and a real return on equity.',
    query:
      'Current price < Graham Number AND Debt to equity < 0.5 AND Return on equity > 12 AND Market Capitalization > 300',
    category: 'Valuation',
    iconName: 'Gem',
    author: 'Benjamin Graham',
  },
  {
    id: 'golden-crossover',
    title: 'Golden Cross, Not Overbought',
    description:
      'The 50-day average above the 200-day, price above both, and RSI in the band that has not yet run away.',
    query: 'DMA 50 > DMA 200 AND Current price > DMA 50 AND RSI > 50 AND RSI < 70',
    category: 'Technicals',
    iconName: 'Zap',
    author: 'Filterer',
  },
  {
    id: 'quality-at-a-discount',
    title: 'Quality Below Its Sector',
    description:
      'Companies earning above 18% on capital while trading at a discount to their own industry multiple.',
    query:
      'Return on capital employed > 18 AND Price to Earning < Industry PE AND Debt to equity < 0.6 AND Market Capitalization > 1000',
    category: 'Valuation',
    iconName: 'Landmark',
    author: 'Filterer',
  },
  {
    id: 'piotroski-high-score',
    title: 'High Piotroski F-Score',
    description:
      'Seven or more of the nine Piotroski tests passed, paired with an Altman Z-score out of the distress zone.',
    query: 'Piotroski score >= 7 AND Altman Z-Score > 2.9 AND Return on equity > 14',
    category: 'Safety',
    iconName: 'Award',
    author: 'Joseph Piotroski',
  },
  {
    id: 'cash-flow-kings',
    title: 'Cash Flow Kings',
    description:
      'Free cash flow that is material against the market capitalisation, backed by three years of positive operating cash.',
    query: 'Free cash flow yield > 4 AND Operating cash flow 3Years > 200 AND Debt to equity < 0.8',
    category: 'Growth',
    iconName: 'Coins',
    author: 'Filterer',
  },
  {
    id: 'high-dividend-yield',
    title: 'Dividend Payers That Can Afford It',
    description:
      'Yield above 2.5%, leverage kept in check, and a return on capital high enough that the payout is not being borrowed.',
    query:
      'Dividend yield > 2.5 AND Debt to equity < 0.8 AND Return on capital employed > 15 AND Market Capitalization > 1000',
    category: 'Dividends',
    iconName: 'PiggyBank',
    author: 'Filterer',
  },
  {
    id: 'near-52w-high-breakout',
    title: 'Near Highs, Still Reasonable',
    description:
      'Within 10% of the 52-week high but not yet priced past 30x earnings, with a return on equity to justify it.',
    query: 'Distance from 52w High > -10 AND Price to Earning < 30 AND Return on equity > 15',
    category: 'Technicals',
    iconName: 'Flame',
    author: 'Filterer',
  },
  {
    id: 'low-peg-growth',
    title: 'Growth at a Reasonable Price',
    description:
      'Lynch in one line: earnings growth the market has not fully paid for, filtered to businesses that earn their capital back.',
    query:
      'PEG Ratio < 1.2 AND PEG Ratio > 0 AND Profit growth 3Years > 18 AND Return on capital employed > 18',
    category: 'Valuation',
    iconName: 'Activity',
    author: 'Peter Lynch',
  },
  {
    id: 'oversold-quality',
    title: 'Oversold, Not Broken',
    description:
      'Well off the highs with RSI under 40, but still earning above 15% on capital and carrying little debt.',
    query:
      'RSI < 40 AND Distance from 52w High < -20 AND Return on capital employed > 15 AND Debt to equity < 0.5',
    category: 'Popular',
    iconName: 'CheckCircle',
    author: 'Filterer',
  },
];
