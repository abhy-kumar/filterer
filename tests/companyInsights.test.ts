import { describe, it, expect } from 'vitest';
import {
  getStockCompanyInsights,
  hasStockCompanyInsights,
  CURATED_INSIGHTS,
} from '../src/engine/companyInsightsGenerator';
import {
  getCompanySegments,
  hasCompanySegments,
} from '../src/data/segmentData';
import {
  generateStockConcallInsights,
  hasStockConcallInsights,
} from '../src/engine/concallInsightsGenerator';
import { Stock } from '../src/types/stock';

const createMockStock = (symbol: string, sector = '', industry = ''): Stock => ({
  symbol,
  name: `${symbol} Test Company`,
  id: symbol.toLowerCase(),
  sector,
  industry,
  current_price: 1500,
  market_cap: 75000,
  pe_ratio: 24,
  opm: 18,
  sales_growth_3y: 12,
  debt_to_equity: 0.2,
});

describe('Company Operational Insights Data Authenticity', () => {
  it('returns authentic curated insights for major benchmark stocks across sectors', () => {
    const verifiedSymbols = [
      'RELIANCE',
      'HDFCBANK',
      'ICICIBANK',
      'SBIN',
      'BAJFINANCE',
      'TATAMOTORS',
      'TMCV',
      'TMPV',
      'MARUTI',
      'BAJAJ-AUTO',
      'M&M',
      'TCS',
      'INFY',
      'WIPRO',
      'BHARTIARTL',
      'ITC',
      'HINDUNILVR',
      'NTPC',
      'POWERGRID',
      'ULTRACEMCO',
      'TATASTEEL',
      'SUNPHARMA',
      'CIPLA',
      'LT',
      'DLF',
      'INDIGO',
      'ZOMATO',
    ];

    for (const sym of verifiedSymbols) {
      const stock = createMockStock(sym);
      expect(hasStockCompanyInsights(stock), `Expected insights to exist for ${sym}`).toBe(true);
      const data = getStockCompanyInsights(stock);
      expect(data).not.toBeNull();
      expect(data?.metrics.length).toBeGreaterThan(0);

      // Verify that every metric has authentic data series
      for (const metric of data!.metrics) {
        expect(metric.id).toBeTruthy();
        expect(metric.name).toBeTruthy();
        expect(metric.unit).toBeTruthy();
        expect(metric.yearly.length).toBe(data!.yearlyPeriods.length);
        expect(metric.quarterly.length).toBe(data!.quarterlyPeriods.length);

        // Verify at least some actual non-null numbers exist
        const hasYearlyNumbers = metric.yearly.some((y) => typeof y.value === 'number');
        const hasQuarterlyNumbers = metric.quarterly.some((q) => typeof q.value === 'number');
        expect(hasYearlyNumbers, `Metric ${metric.name} for ${sym} has no yearly numbers`).toBe(true);
        expect(hasQuarterlyNumbers, `Metric ${metric.name} for ${sym} has no quarterly numbers`).toBe(true);
      }
    }
  });

  it('ensures distinct operational metrics across different industries', () => {
    const pharmaStock = createMockStock('SUNPHARMA', 'Healthcare', 'Pharmaceuticals');
    const fmcgStock = createMockStock('ITC', 'Consumer Staples', 'Tobacco');
    const bankStock = createMockStock('HDFCBANK', 'Financial Services', 'Private Banking');
    const autoStock = createMockStock('MARUTI', 'Consumer Cyclical', 'Automobile');
    const itStock = createMockStock('TCS', 'Technology', 'IT Services');
    const cementStock = createMockStock('ULTRACEMCO', 'Basic Materials', 'Cement');
    const telecomStock = createMockStock('BHARTIARTL', 'Communication Services', 'Telecom');

    const pharmaInsights = getStockCompanyInsights(pharmaStock)!;
    const fmcgInsights = getStockCompanyInsights(fmcgStock)!;
    const bankInsights = getStockCompanyInsights(bankStock)!;
    const autoInsights = getStockCompanyInsights(autoStock)!;
    const itInsights = getStockCompanyInsights(itStock)!;
    const cementInsights = getStockCompanyInsights(cementStock)!;
    const telecomInsights = getStockCompanyInsights(telecomStock)!;

    const pharmaMetricNames = pharmaInsights.metrics.map((m) => m.name);
    const fmcgMetricNames = fmcgInsights.metrics.map((m) => m.name);
    const bankMetricNames = bankInsights.metrics.map((m) => m.name);
    const autoMetricNames = autoInsights.metrics.map((m) => m.name);
    const itMetricNames = itInsights.metrics.map((m) => m.name);
    const cementMetricNames = cementInsights.metrics.map((m) => m.name);
    const telecomMetricNames = telecomInsights.metrics.map((m) => m.name);

    // Pharma has formulation and R&D metrics
    expect(pharmaMetricNames).toContain('India Formulations Gross Sales');
    expect(pharmaMetricNames).toContain('US Formulations Gross Sales');

    // FMCG has segment revenues and volume metrics
    expect(fmcgMetricNames).toContain('Cigarette Segment Gross Revenue');
    expect(fmcgMetricNames).toContain('FMCG - Others Gross Revenue');

    // Bank has NIM, CASA, NPAs
    expect(bankMetricNames).toContain('Net Interest Margin (NIM)');
    expect(bankMetricNames).toContain('CASA Ratio');

    // Auto has vehicle sales volumes
    expect(autoMetricNames).toContain('Total Vehicle Sales Volume');
    expect(autoMetricNames).toContain('Domestic Passenger Vehicle Sales');

    // IT has headcount and attrition
    expect(itMetricNames).toContain('Total Employee Headcount');
    expect(itMetricNames).toContain('LTM IT Attrition Rate');

    // Cement has capacity and realization per ton
    expect(cementMetricNames).toContain('Consolidated Cement Capacity');
    expect(cementMetricNames).toContain('Blended Realization per Ton');

    // Telecom has ARPU and subscriber base
    expect(telecomMetricNames).toContain('India Mobile ARPU (Average Revenue Per User)');
    expect(telecomMetricNames).toContain('India Mobile Active Customer Base');

    // Verify none of them use the old generic heuristic fallback metrics
    const legacyHeuristicNames = ['Capacity Utilization Rate', 'Sales Dispatch Volume', 'EBITDA per Unit / Realization'];
    for (const legacyName of legacyHeuristicNames) {
      expect(pharmaMetricNames).not.toContain(legacyName);
      expect(fmcgMetricNames).not.toContain(legacyName);
      expect(bankMetricNames).not.toContain(legacyName);
      expect(telecomMetricNames).not.toContain(legacyName);
    }
  });

  it('returns null and zero synthetic data for uncurated stocks', () => {
    const uncuratedStock = createMockStock('UNTRACKED_CORP', 'Industrial Goods', 'Forgings');
    expect(hasStockCompanyInsights(uncuratedStock)).toBe(false);
    expect(getStockCompanyInsights(uncuratedStock)).toBeNull();

    const emptyStock = createMockStock('360ONE', 'Financial Services', 'Asset Management');
    expect(hasStockCompanyInsights(emptyStock)).toBe(false);
    expect(getStockCompanyInsights(emptyStock)).toBeNull();
  });
});

describe('Business Segments Data Authenticity', () => {
  it('returns authentic segment disclosures for curated companies', () => {
    const reliance = createMockStock('RELIANCE');
    expect(hasCompanySegments(reliance)).toBe(true);
    const data = getCompanySegments(reliance);
    expect(data).not.toBeNull();
    expect(data?.reportingStandard).toContain('Ind AS 108');
    expect(data?.periods.length).toBeGreaterThan(0);
  });

  it('returns null and does not fabricate synthetic segments for uncurated stocks', () => {
    const uncuratedStock = createMockStock('UNTRACKED_CORP');
    expect(hasCompanySegments(uncuratedStock)).toBe(false);
    expect(getCompanySegments(uncuratedStock)).toBeNull();
  });
});

describe('Concall Highlights Data Authenticity', () => {
  it('returns authentic concall highlights for curated companies', () => {
    const reliance = createMockStock('RELIANCE');
    expect(hasStockConcallInsights(reliance)).toBe(true);
    const data = generateStockConcallInsights(reliance);
    expect(data).not.toBeNull();
    expect(data?.quarters.length).toBeGreaterThan(0);
  });

  it('returns null and does not fabricate quotes or analyst Q&A for uncurated stocks', () => {
    const uncuratedStock = createMockStock('UNTRACKED_CORP');
    expect(hasStockConcallInsights(uncuratedStock)).toBe(false);
    expect(generateStockConcallInsights(uncuratedStock)).toBeNull();
  });
});
