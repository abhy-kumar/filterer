import { describe, expect, it } from 'vitest';
import { summariseQuery } from '../src/lib/criteria';
import { CURATED_SCREENS } from '../src/data/screens';

describe('summariseQuery', () => {
  it('reads a chain of ANDed comparisons as short criteria', () => {
    expect(summariseQuery('Price to Earning < 25 AND Market Capitalization > 1000')).toEqual([
      'P/E < 25',
      'Market cap > ₹1,000 Cr',
    ]);
  });

  it('joins a lower and upper bound on one metric into a range', () => {
    expect(summariseQuery('RSI > 50 AND RSI < 70 AND Return on equity >= 15')).toEqual(['RSI 50 to 70', 'ROE ≥ 15%']);
  });

  it('compares two metrics by name', () => {
    expect(summariseQuery('Price to Earning < Industry PE')).toEqual(['P/E < sector P/E']);
  });

  it('declines anything it would have to flatten', () => {
    expect(summariseQuery('ROCE > 20 OR ROE > 20')).toBeNull();
    expect(summariseQuery('NOT (ROCE > 20)')).toBeNull();
  });

  it('summarises every curated screen', () => {
    for (const screen of CURATED_SCREENS) {
      expect(summariseQuery(screen.query), screen.id).not.toBeNull();
    }
  });
});
