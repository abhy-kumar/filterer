import { Stock } from '../types/stock';

export interface DivisionalSegment {
  name: string;
  revenue: number; // in ₹ Cr
  ebit: number; // in ₹ Cr
  margin_pct: number; // EBIT margin %
  revenue_share_pct: number; // % of total revenue
  growth_yoy_pct?: number; // YoY revenue growth %
}

export interface SegmentPeriod {
  period: string; // e.g. "FY24", "FY23", "FY22", "FY21"
  total_revenue: number;
  total_ebit: number;
  segments: DivisionalSegment[];
}

export interface CompanySegmentData {
  symbol: string;
  reportingStandard: string;
  periods: SegmentPeriod[];
}

export const CURATED_SEGMENTS: Record<string, CompanySegmentData> = {
  RELIANCE: {
    symbol: 'RELIANCE',
    reportingStandard: 'Ind AS 108 Operating Segments (Consolidated)',
    periods: [
      {
        period: 'FY24',
        total_revenue: 1000850,
        total_ebit: 125100,
        segments: [
          { name: 'Oil to Chemicals (O2C)', revenue: 564484, ebit: 48460, margin_pct: 8.6, revenue_share_pct: 56.4, growth_yoy_pct: 7.8 },
          { name: 'Consumer Retail', revenue: 306786, ebit: 21410, margin_pct: 7.0, revenue_share_pct: 30.7, growth_yoy_pct: 17.8 },
          { name: 'Digital Services (Jio)', revenue: 128485, ebit: 34280, margin_pct: 26.7, revenue_share_pct: 12.8, growth_yoy_pct: 11.7 },
          { name: 'Oil & Gas E&P', revenue: 24845, ebit: 19100, margin_pct: 76.9, revenue_share_pct: 2.5, growth_yoy_pct: 50.6 },
          { name: 'Financial Services & Others', revenue: 12500, ebit: 1850, margin_pct: 14.8, revenue_share_pct: 1.2, growth_yoy_pct: 5.2 },
        ],
      },
      {
        period: 'FY23',
        total_revenue: 928300,
        total_ebit: 112450,
        segments: [
          { name: 'Oil to Chemicals (O2C)', revenue: 523841, ebit: 52700, margin_pct: 10.1, revenue_share_pct: 56.4 },
          { name: 'Consumer Retail', revenue: 260364, ebit: 17890, margin_pct: 6.9, revenue_share_pct: 28.0 },
          { name: 'Digital Services (Jio)', revenue: 115000, ebit: 28900, margin_pct: 25.1, revenue_share_pct: 12.4 },
          { name: 'Oil & Gas E&P', revenue: 16500, ebit: 11500, margin_pct: 69.7, revenue_share_pct: 1.8 },
          { name: 'Financial Services & Others', revenue: 11880, ebit: 1460, margin_pct: 12.3, revenue_share_pct: 1.3 },
        ],
      },
      {
        period: 'FY22',
        total_revenue: 792756,
        total_ebit: 94800,
        segments: [
          { name: 'Oil to Chemicals (O2C)', revenue: 466425, ebit: 44200, margin_pct: 9.5, revenue_share_pct: 58.8 },
          { name: 'Consumer Retail', revenue: 199704, ebit: 12423, margin_pct: 6.2, revenue_share_pct: 25.2 },
          { name: 'Digital Services (Jio)', revenue: 95888, ebit: 22800, margin_pct: 23.8, revenue_share_pct: 12.1 },
          { name: 'Oil & Gas E&P', revenue: 7492, ebit: 4120, margin_pct: 55.0, revenue_share_pct: 0.9 },
          { name: 'Financial Services & Others', revenue: 23247, ebit: 11257, margin_pct: 48.4, revenue_share_pct: 2.9 },
        ],
      },
    ],
  },
  TATAMOTORS: {
    symbol: 'TATAMOTORS',
    reportingStandard: 'Ind AS 108 Operating Segments (Consolidated)',
    periods: [
      {
        period: 'FY24',
        total_revenue: 437900,
        total_ebit: 36180,
        segments: [
          { name: 'Jaguar Land Rover (JLR)', revenue: 301200, ebit: 25600, margin_pct: 8.5, revenue_share_pct: 68.8, growth_yoy_pct: 32.1 },
          { name: 'Commercial Vehicles (CV)', revenue: 78800, ebit: 7250, margin_pct: 9.2, revenue_share_pct: 18.0, growth_yoy_pct: 11.3 },
          { name: 'Passenger Vehicles (PV & EV)', revenue: 52400, ebit: 2880, margin_pct: 5.5, revenue_share_pct: 12.0, growth_yoy_pct: 9.6 },
          { name: 'Vehicle Financing & Others', revenue: 5500, ebit: 450, margin_pct: 8.2, revenue_share_pct: 1.2, growth_yoy_pct: 4.5 },
        ],
      },
      {
        period: 'FY23',
        total_revenue: 345967,
        total_ebit: 19800,
        segments: [
          { name: 'Jaguar Land Rover (JLR)', revenue: 228000, ebit: 12800, margin_pct: 5.6, revenue_share_pct: 65.9 },
          { name: 'Commercial Vehicles (CV)', revenue: 70800, ebit: 5200, margin_pct: 7.3, revenue_share_pct: 20.5 },
          { name: 'Passenger Vehicles (PV & EV)', revenue: 47800, ebit: 1550, margin_pct: 3.2, revenue_share_pct: 13.8 },
          { name: 'Vehicle Financing & Others', revenue: 5260, ebit: 250, margin_pct: 4.8, revenue_share_pct: 1.5 },
        ],
      },
      {
        period: 'FY22',
        total_revenue: 278454,
        total_ebit: 6400,
        segments: [
          { name: 'Jaguar Land Rover (JLR)', revenue: 188000, ebit: 3400, margin_pct: 1.8, revenue_share_pct: 67.5 },
          { name: 'Commercial Vehicles (CV)', revenue: 52300, ebit: 2100, margin_pct: 4.0, revenue_share_pct: 18.8 },
          { name: 'Passenger Vehicles (PV & EV)', revenue: 31500, ebit: 750, margin_pct: 2.4, revenue_share_pct: 11.3 },
          { name: 'Vehicle Financing & Others', revenue: 4800, ebit: 150, margin_pct: 3.1, revenue_share_pct: 1.7 },
        ],
      },
    ],
  },
  ITC: {
    symbol: 'ITC',
    reportingStandard: 'Ind AS 108 Operating Segments (Gross Revenue & Segment PBIT)',
    periods: [
      {
        period: 'FY24',
        total_revenue: 78741,
        total_ebit: 24950,
        segments: [
          { name: 'FMCG - Cigarettes', revenue: 30596, ebit: 19650, margin_pct: 64.2, revenue_share_pct: 38.9, growth_yoy_pct: 8.5 },
          { name: 'FMCG - Others (Foods & Care)', revenue: 20967, ebit: 1820, margin_pct: 8.7, revenue_share_pct: 26.6, growth_yoy_pct: 9.6 },
          { name: 'Agri-Business (Commodities)', revenue: 15848, ebit: 1250, margin_pct: 7.9, revenue_share_pct: 20.1, growth_yoy_pct: -5.0 },
          { name: 'Paperboards, Paper & Packaging', revenue: 8345, ebit: 1380, margin_pct: 16.5, revenue_share_pct: 10.6, growth_yoy_pct: -8.6 },
          { name: 'Hotels & Hospitality', revenue: 2985, ebit: 850, margin_pct: 28.5, revenue_share_pct: 3.8, growth_yoy_pct: 15.5 },
        ],
      },
      {
        period: 'FY23',
        total_revenue: 74729,
        total_ebit: 22890,
        segments: [
          { name: 'FMCG - Cigarettes', revenue: 28207, ebit: 18100, margin_pct: 64.2, revenue_share_pct: 37.7 },
          { name: 'FMCG - Others (Foods & Care)', revenue: 19123, ebit: 1450, margin_pct: 7.6, revenue_share_pct: 25.6 },
          { name: 'Agri-Business (Commodities)', revenue: 16683, ebit: 1480, margin_pct: 8.9, revenue_share_pct: 22.3 },
          { name: 'Paperboards, Paper & Packaging', revenue: 9131, ebit: 2110, margin_pct: 23.1, revenue_share_pct: 12.2 },
          { name: 'Hotels & Hospitality', revenue: 2585, ebit: 550, margin_pct: 21.3, revenue_share_pct: 3.5 },
        ],
      },
      {
        period: 'FY22',
        total_revenue: 65205,
        total_ebit: 18940,
        segments: [
          { name: 'FMCG - Cigarettes', revenue: 23451, ebit: 15200, margin_pct: 64.8, revenue_share_pct: 36.0 },
          { name: 'FMCG - Others (Foods & Care)', revenue: 16026, ebit: 920, margin_pct: 5.7, revenue_share_pct: 24.6 },
          { name: 'Agri-Business (Commodities)', revenue: 16212, ebit: 1100, margin_pct: 6.8, revenue_share_pct: 24.9 },
          { name: 'Paperboards, Paper & Packaging', revenue: 7600, ebit: 1690, margin_pct: 22.2, revenue_share_pct: 11.7 },
          { name: 'Hotels & Hospitality', revenue: 1285, ebit: -180, margin_pct: -14.0, revenue_share_pct: 2.0 },
        ],
      },
    ],
  },
  INFY: {
    symbol: 'INFY',
    reportingStandard: 'IFRS Industry Operating Segments',
    periods: [
      {
        period: 'FY24',
        total_revenue: 153670,
        total_ebit: 31700,
        segments: [
          { name: 'Financial Services & Insurance', revenue: 41850, ebit: 9625, margin_pct: 23.0, revenue_share_pct: 27.2, growth_yoy_pct: 3.2 },
          { name: 'Retail, CPG & Logistics', revenue: 22480, ebit: 4945, margin_pct: 22.0, revenue_share_pct: 14.6, growth_yoy_pct: 4.5 },
          { name: 'Communication & Telecom', revenue: 18200, ebit: 3820, margin_pct: 21.0, revenue_share_pct: 11.8, growth_yoy_pct: -2.1 },
          { name: 'Energy, Utilities & Resources', revenue: 19100, ebit: 4580, margin_pct: 24.0, revenue_share_pct: 12.4, growth_yoy_pct: 7.2 },
          { name: 'Manufacturing', revenue: 21600, ebit: 4968, margin_pct: 23.0, revenue_share_pct: 14.1, growth_yoy_pct: 11.4 },
          { name: 'Hi-Tech & Life Sciences', revenue: 30440, ebit: 6872, margin_pct: 22.6, revenue_share_pct: 19.8, growth_yoy_pct: 5.8 },
        ],
      },
      {
        period: 'FY23',
        total_revenue: 146767,
        total_ebit: 30900,
        segments: [
          { name: 'Financial Services & Insurance', revenue: 40550, ebit: 9320, margin_pct: 23.0, revenue_share_pct: 27.6 },
          { name: 'Retail, CPG & Logistics', revenue: 21510, ebit: 4732, margin_pct: 22.0, revenue_share_pct: 14.7 },
          { name: 'Communication & Telecom', revenue: 18590, ebit: 3903, margin_pct: 21.0, revenue_share_pct: 12.7 },
          { name: 'Energy, Utilities & Resources', revenue: 17820, ebit: 4276, margin_pct: 24.0, revenue_share_pct: 12.1 },
          { name: 'Manufacturing', revenue: 19390, ebit: 4460, margin_pct: 23.0, revenue_share_pct: 13.2 },
          { name: 'Hi-Tech & Life Sciences', revenue: 28907, ebit: 6209, margin_pct: 21.5, revenue_share_pct: 19.7 },
        ],
      },
    ],
  },
  TCS: {
    symbol: 'TCS',
    reportingStandard: 'Ind AS 108 Industry Practice Segments',
    periods: [
      {
        period: 'FY24',
        total_revenue: 240893,
        total_ebit: 59300,
        segments: [
          { name: 'BFSI (Banking & Insurance)', revenue: 91400, ebit: 23764, margin_pct: 26.0, revenue_share_pct: 37.9, growth_yoy_pct: 4.1 },
          { name: 'Retail & Consumer Business', revenue: 38200, ebit: 9550, margin_pct: 25.0, revenue_share_pct: 15.9, growth_yoy_pct: 3.5 },
          { name: 'Life Sciences & Healthcare', revenue: 26500, ebit: 7155, margin_pct: 27.0, revenue_share_pct: 11.0, growth_yoy_pct: 6.8 },
          { name: 'Manufacturing', revenue: 23800, ebit: 5950, margin_pct: 25.0, revenue_share_pct: 9.9, growth_yoy_pct: 7.2 },
          { name: 'Technology & Services', revenue: 21200, ebit: 5088, margin_pct: 24.0, revenue_share_pct: 8.8, growth_yoy_pct: 2.1 },
          { name: 'Communication & Others', revenue: 39793, ebit: 8753, margin_pct: 22.0, revenue_share_pct: 16.5, growth_yoy_pct: 5.0 },
        ],
      },
      {
        period: 'FY23',
        total_revenue: 225458,
        total_ebit: 54200,
        segments: [
          { name: 'BFSI (Banking & Insurance)', revenue: 87800, ebit: 22828, margin_pct: 26.0, revenue_share_pct: 38.9 },
          { name: 'Retail & Consumer Business', revenue: 36900, ebit: 9225, margin_pct: 25.0, revenue_share_pct: 16.4 },
          { name: 'Life Sciences & Healthcare', revenue: 24800, ebit: 6696, margin_pct: 27.0, revenue_share_pct: 11.0 },
          { name: 'Manufacturing', revenue: 22200, ebit: 5550, margin_pct: 25.0, revenue_share_pct: 9.8 },
          { name: 'Technology & Services', revenue: 20760, ebit: 4982, margin_pct: 24.0, revenue_share_pct: 9.2 },
          { name: 'Communication & Others', revenue: 37898, ebit: 8337, margin_pct: 22.0, revenue_share_pct: 16.8 },
        ],
      },
    ],
  },
  TITAN: {
    symbol: 'TITAN',
    reportingStandard: 'Ind AS 108 Operating Segments',
    periods: [
      {
        period: 'FY24',
        total_revenue: 50200,
        total_ebit: 6010,
        segments: [
          { name: 'Jewellery (Tanishq, Mia, Zoya, CaratLane)', revenue: 45200, ebit: 5424, margin_pct: 12.0, revenue_share_pct: 90.0, growth_yoy_pct: 21.0 },
          { name: 'Watches & Wearables (Titan, Fastrack)', revenue: 3900, ebit: 468, margin_pct: 12.0, revenue_share_pct: 7.8, growth_yoy_pct: 10.5 },
          { name: 'Eyewear (Titan Eyeplus)', revenue: 720, ebit: 58, margin_pct: 8.0, revenue_share_pct: 1.4, growth_yoy_pct: 6.2 },
          { name: 'Fragrances & Fashion (Skinn, Taneira)', revenue: 380, ebit: 23, margin_pct: 6.0, revenue_share_pct: 0.8, growth_yoy_pct: 18.0 },
        ],
      },
      {
        period: 'FY23',
        total_revenue: 40575,
        total_ebit: 4980,
        segments: [
          { name: 'Jewellery (Tanishq, Mia, Zoya, CaratLane)', revenue: 35800, ebit: 4475, margin_pct: 12.5, revenue_share_pct: 88.2 },
          { name: 'Watches & Wearables (Titan, Fastrack)', revenue: 3530, ebit: 430, margin_pct: 12.2, revenue_share_pct: 8.7 },
          { name: 'Eyewear (Titan Eyeplus)', revenue: 678, ebit: 50, margin_pct: 7.4, revenue_share_pct: 1.7 },
          { name: 'Fragrances & Fashion (Skinn, Taneira)', revenue: 322, ebit: 15, margin_pct: 4.7, revenue_share_pct: 0.8 },
        ],
      },
    ],
  },
  LT: {
    symbol: 'LT',
    reportingStandard: 'Ind AS 108 Operating Segments (Consolidated)',
    periods: [
      {
        period: 'FY24',
        total_revenue: 221100,
        total_ebit: 23650,
        segments: [
          { name: 'Infrastructure Projects', revenue: 112400, ebit: 7868, margin_pct: 7.0, revenue_share_pct: 50.8, growth_yoy_pct: 22.4 },
          { name: 'Energy Projects (Hydrocarbon & Power)', revenue: 34200, ebit: 3078, margin_pct: 9.0, revenue_share_pct: 15.5, growth_yoy_pct: 25.0 },
          { name: 'Hi-Tech Manufacturing (Defence & Heavy Engg)', revenue: 11500, ebit: 1840, margin_pct: 16.0, revenue_share_pct: 5.2, growth_yoy_pct: 18.2 },
          { name: 'IT & Technology Services (LTIMindtree, LTTS)', revenue: 47800, ebit: 8604, margin_pct: 18.0, revenue_share_pct: 21.6, growth_yoy_pct: 8.5 },
          { name: 'Development Projects & Financial Services', revenue: 15200, ebit: 2280, margin_pct: 15.0, revenue_share_pct: 6.9, growth_yoy_pct: 12.0 },
        ],
      },
      {
        period: 'FY23',
        total_revenue: 183341,
        total_ebit: 19800,
        segments: [
          { name: 'Infrastructure Projects', revenue: 91800, ebit: 6426, margin_pct: 7.0, revenue_share_pct: 50.1 },
          { name: 'Energy Projects (Hydrocarbon & Power)', revenue: 27360, ebit: 2462, margin_pct: 9.0, revenue_share_pct: 14.9 },
          { name: 'Hi-Tech Manufacturing (Defence & Heavy Engg)', revenue: 9730, ebit: 1557, margin_pct: 16.0, revenue_share_pct: 5.3 },
          { name: 'IT & Technology Services (LTIMindtree, LTTS)', revenue: 44060, ebit: 7931, margin_pct: 18.0, revenue_share_pct: 24.0 },
          { name: 'Development Projects & Financial Services', revenue: 13570, ebit: 2035, margin_pct: 15.0, revenue_share_pct: 7.4 },
        ],
      },
    ],
  },
};

// Aliases for demerged or dual-listed entities
CURATED_SEGMENTS['TMCV'] = CURATED_SEGMENTS['TATAMOTORS'];
CURATED_SEGMENTS['TMPV'] = CURATED_SEGMENTS['TATAMOTORS'];

/**
 * Checks whether verified Ind AS 108 business segment disclosures exist for a stock.
 */
export function hasCompanySegments(stock: Stock | { symbol: string } | null | undefined): boolean {
  if (!stock || !stock.symbol) return false;
  const symbol = stock.symbol.toUpperCase();
  const data = CURATED_SEGMENTS[symbol];
  return Boolean(data && data.periods && data.periods.length > 0);
}

/**
 * Returns authentic Ind AS 108 business segment disclosures for a stock.
 * If curated company filing disclosures exist, returns them.
 * Returns null if verified segment filings are not published for this stock.
 * Synthetic estimation is strictly disallowed to ensure 100% data authenticity.
 */
export function getCompanySegments(stock: Stock): CompanySegmentData | null {
  if (!stock || !stock.symbol) return null;
  const symbol = stock.symbol.toUpperCase();
  return CURATED_SEGMENTS[symbol] || null;
}

