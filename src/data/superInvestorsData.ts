import { STOCKS_DATA } from './stocksData';

export type DeltaType = 'new' | 'increased' | 'decreased' | 'unchanged' | 'sold';

export interface HoldingDelta {
  change: DeltaType;
  delta_pct?: number; // e.g. +0.25%, -0.10%
  previous_quarter_holding?: number;
}

export interface InvestorHolding {
  symbol: string;
  companyName: string;
  sector: string;
  holding_pct: number; // e.g. 2.45%
  holding_value_cr?: number; // computed or base
  quarter: string; // e.g. "Q3 FY25"
  delta: HoldingDelta;
  shares_count?: number;
}

export interface SuperInvestor {
  id: string;
  name: string;
  alias?: string;
  type: 'Individual HNI' | 'Institutional / PMS' | 'Family Office';
  description: string;
  avatar_initials: string;
  top_sectors: string[];
  holdings: InvestorHolding[];
}

export const SUPER_INVESTORS_DATA: SuperInvestor[] = [
  {
    id: 'radhakishan-damani',
    name: 'Radhakishan Damani',
    alias: 'Derive Investments / DMart Founder',
    type: 'Individual HNI',
    description: 'Billionaire veteran investor and founder of Avenue Supermarts (DMart). Renowned for long-term value investing, high consumer moat companies, and low churn.',
    avatar_initials: 'RD',
    top_sectors: ['Consumer Defensive', 'Consumer Cyclical', 'Financial Services'],
    holdings: [
      {
        symbol: 'DMART',
        companyName: 'Avenue Supermarts Ltd.',
        sector: 'Consumer Defensive',
        holding_pct: 67.24,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 67.24 },
      },
      {
        symbol: 'TRENT',
        companyName: 'Trent Ltd.',
        sector: 'Consumer Cyclical',
        holding_pct: 1.52,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 1.52 },
      },
      {
        symbol: 'SUNDARMFIN',
        companyName: 'Sundaram Finance Ltd.',
        sector: 'Financial Services',
        holding_pct: 2.38,
        quarter: 'Q3 FY25',
        delta: { change: 'increased', delta_pct: 0.15, previous_quarter_holding: 2.23 },
      },
      {
        symbol: '3MINDIA',
        companyName: '3M India Ltd.',
        sector: 'Industrials',
        holding_pct: 1.48,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 1.48 },
      },
      {
        symbol: 'APOLLOHOSP',
        companyName: 'Apollo Hospitals Enterprise Ltd.',
        sector: 'Healthcare',
        holding_pct: 1.15,
        quarter: 'Q3 FY25',
        delta: { change: 'new', delta_pct: 1.15, previous_quarter_holding: 0 },
      },
    ],
  },
  {
    id: 'rekha-jhunjhunwala',
    name: 'Rekha Jhunjhunwala',
    alias: 'Rare Enterprises',
    type: 'Family Office',
    description: 'Carries forward the legendary portfolio of late Rakesh Jhunjhunwala. High conviction bets on structural Indian growth themes, financialization, and consumer aspirational brands.',
    avatar_initials: 'RJ',
    top_sectors: ['Consumer Cyclical', 'Financial Services', 'Healthcare', 'Automobile'],
    holdings: [
      {
        symbol: 'TITAN',
        companyName: 'Titan Company Ltd.',
        sector: 'Consumer Cyclical',
        holding_pct: 5.12,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 5.12 },
      },
      {
        symbol: 'TATAMOTORS',
        companyName: 'Tata Motors Ltd.',
        sector: 'Consumer Cyclical',
        holding_pct: 1.32,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 1.32 },
      },
      {
        symbol: 'CRISIL',
        companyName: 'CRISIL Ltd.',
        sector: 'Financial Services',
        holding_pct: 5.48,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 5.48 },
      },
      {
        symbol: 'CANBK',
        companyName: 'Canara Bank',
        sector: 'Financial Services',
        holding_pct: 1.45,
        quarter: 'Q3 FY25',
        delta: { change: 'decreased', delta_pct: -0.22, previous_quarter_holding: 1.67 },
      },
      {
        symbol: 'METROPOLIS',
        companyName: 'Metropolis Healthcare Ltd.',
        sector: 'Healthcare',
        holding_pct: 4.02,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 4.02 },
      },
      {
        symbol: 'FORTIS',
        companyName: 'Fortis Healthcare Ltd.',
        sector: 'Healthcare',
        holding_pct: 4.15,
        quarter: 'Q3 FY25',
        delta: { change: 'increased', delta_pct: 0.35, previous_quarter_holding: 3.80 },
      },
      {
        symbol: 'FEDERALBNK',
        companyName: 'The Federal Bank Ltd.',
        sector: 'Financial Services',
        holding_pct: 2.15,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 2.15 },
      },
    ],
  },
  {
    id: 'ashish-kacholia',
    name: 'Ashish Kacholia',
    alias: 'Lucky Securities / Smallcap Whiz',
    type: 'Individual HNI',
    description: 'Known in D-Street as the "Big Whale" of Indian smallcaps. Focuses on high operating leverage, niche manufacturing, specialty chemicals, and emerging capital goods franchises.',
    avatar_initials: 'AK',
    top_sectors: ['Industrials', 'Basic Materials', 'Consumer Cyclical'],
    holdings: [
      {
        symbol: 'SAFARI',
        companyName: 'Safari Industries (India) Ltd.',
        sector: 'Consumer Cyclical',
        holding_pct: 2.28,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 2.28 },
      },
      {
        symbol: 'GRAVITA',
        companyName: 'Gravita India Ltd.',
        sector: 'Basic Materials',
        holding_pct: 2.15,
        quarter: 'Q3 FY25',
        delta: { change: 'increased', delta_pct: 0.20, previous_quarter_holding: 1.95 },
      },
      {
        symbol: 'BALAJIAMINE',
        companyName: 'Balaji Amines Ltd.',
        sector: 'Basic Materials',
        holding_pct: 1.42,
        quarter: 'Q3 FY25',
        delta: { change: 'decreased', delta_pct: -0.18, previous_quarter_holding: 1.60 },
      },
      {
        symbol: 'FINEOTEX',
        companyName: 'Fineotex Chemical Ltd.',
        sector: 'Basic Materials',
        holding_pct: 2.84,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 2.84 },
      },
      {
        symbol: 'ASTRAL',
        companyName: 'Astral Ltd.',
        sector: 'Industrials',
        holding_pct: 1.10,
        quarter: 'Q3 FY25',
        delta: { change: 'new', delta_pct: 1.10, previous_quarter_holding: 0 },
      },
      {
        symbol: 'POLYCAB',
        companyName: 'Polycab India Ltd.',
        sector: 'Industrials',
        holding_pct: 1.25,
        quarter: 'Q3 FY25',
        delta: { change: 'increased', delta_pct: 0.12, previous_quarter_holding: 1.13 },
      },
    ],
  },
  {
    id: 'vijay-kedia',
    name: 'Vijay Kedia',
    alias: 'Kedia Securities',
    type: 'Individual HNI',
    description: 'Pioneer of the SMILE philosophy (Small in size, Medium in experience, Large in aspiration, Extra-large in market potential). Known for holding through multi-year cycles.',
    avatar_initials: 'VK',
    top_sectors: ['Technology', 'Industrials', 'Automobile'],
    holdings: [
      {
        symbol: 'TEJASNET',
        companyName: 'Tejas Networks Ltd.',
        sector: 'Technology',
        holding_pct: 1.84,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 1.84 },
      },
      {
        symbol: 'ELECON',
        companyName: 'Elecon Engineering Company Ltd.',
        sector: 'Industrials',
        holding_pct: 1.65,
        quarter: 'Q3 FY25',
        delta: { change: 'increased', delta_pct: 0.25, previous_quarter_holding: 1.40 },
      },
      {
        symbol: 'ATULAUTO',
        companyName: 'Atul Auto Ltd.',
        sector: 'Consumer Cyclical',
        holding_pct: 18.20,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 18.20 },
      },
      {
        symbol: 'VAIBHAVGBL',
        companyName: 'Vaibhav Global Ltd.',
        sector: 'Consumer Cyclical',
        holding_pct: 1.95,
        quarter: 'Q3 FY25',
        delta: { change: 'decreased', delta_pct: -0.15, previous_quarter_holding: 2.10 },
      },
      {
        symbol: 'BHEL',
        companyName: 'Bharat Heavy Electricals Ltd.',
        sector: 'Industrials',
        holding_pct: 1.12,
        quarter: 'Q3 FY25',
        delta: { change: 'new', delta_pct: 1.12, previous_quarter_holding: 0 },
      },
    ],
  },
  {
    id: 'mukul-agrawal',
    name: 'Mukul Agrawal',
    alias: 'Aggressive Smallcap & Midcap Maverick',
    type: 'Individual HNI',
    description: 'Prolific D-Street momentum and turnaround investor with over 50 public 1%+ disclosures across defense, electronics manufacturing, aerospace, and specialized packaging.',
    avatar_initials: 'MA',
    top_sectors: ['Technology', 'Consumer Cyclical', 'Industrials'],
    holdings: [
      {
        symbol: 'BSOFT',
        companyName: 'Birlasoft Ltd.',
        sector: 'Technology',
        holding_pct: 1.94,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 1.94 },
      },
      {
        symbol: 'RAYMOND',
        companyName: 'Raymond Ltd.',
        sector: 'Consumer Cyclical',
        holding_pct: 1.58,
        quarter: 'Q3 FY25',
        delta: { change: 'increased', delta_pct: 0.22, previous_quarter_holding: 1.36 },
      },
      {
        symbol: 'SULA',
        companyName: 'Sula Vineyards Ltd.',
        sector: 'Consumer Defensive',
        holding_pct: 2.10,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 2.10 },
      },
      {
        symbol: 'SUZLON',
        companyName: 'Suzlon Energy Ltd.',
        sector: 'Utilities',
        holding_pct: 1.28,
        quarter: 'Q3 FY25',
        delta: { change: 'decreased', delta_pct: -0.30, previous_quarter_holding: 1.58 },
      },
      {
        symbol: 'ZOMATO',
        companyName: 'Zomato Ltd.',
        sector: 'Consumer Cyclical',
        holding_pct: 1.05,
        quarter: 'Q3 FY25',
        delta: { change: 'new', delta_pct: 1.05, previous_quarter_holding: 0 },
      },
    ],
  },
  {
    id: 'sunil-singhania',
    name: 'Sunil Singhania',
    alias: 'Abakkus Asset Manager',
    type: 'Institutional / PMS',
    description: 'Former CIO of Reliance Mutual Fund. Manages over ₹25,000 Cr at Abakkus focusing on MEETS framework (Management, Execution, Expansion, Technology, Sustainability).',
    avatar_initials: 'SS',
    top_sectors: ['Industrials', 'Technology', 'Financial Services'],
    holdings: [
      {
        symbol: 'ROUTE',
        companyName: 'Route Mobile Ltd.',
        sector: 'Technology',
        holding_pct: 2.82,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 2.82 },
      },
      {
        symbol: 'IIFL',
        companyName: 'IIFL Finance Ltd.',
        sector: 'Financial Services',
        holding_pct: 3.10,
        quarter: 'Q3 FY25',
        delta: { change: 'increased', delta_pct: 0.45, previous_quarter_holding: 2.65 },
      },
      {
        symbol: 'JINDALSTEL',
        companyName: 'Jindal Steel & Power Ltd.',
        sector: 'Basic Materials',
        holding_pct: 1.45,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 1.45 },
      },
      {
        symbol: 'LT',
        companyName: 'Larsen & Toubro Ltd.',
        sector: 'Industrials',
        holding_pct: 1.08,
        quarter: 'Q3 FY25',
        delta: { change: 'increased', delta_pct: 0.18, previous_quarter_holding: 0.90 },
      },
    ],
  },
  {
    id: 'dolly-khanna',
    name: 'Dolly Khanna',
    alias: 'Managed by Rajiv Khanna',
    type: 'Individual HNI',
    description: 'Chennai-based value investor with exceptional track record in paper, textiles, chemicals, fertilizers, and traditional manufacturing turnarounds.',
    avatar_initials: 'DK',
    top_sectors: ['Basic Materials', 'Consumer Cyclical', 'Energy'],
    holdings: [
      {
        symbol: 'TATACHEM',
        companyName: 'Tata Chemicals Ltd.',
        sector: 'Basic Materials',
        holding_pct: 1.34,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 1.34 },
      },
      {
        symbol: 'PAGEIND',
        companyName: 'Page Industries Ltd.',
        sector: 'Consumer Cyclical',
        holding_pct: 1.12,
        quarter: 'Q3 FY25',
        delta: { change: 'new', delta_pct: 1.12, previous_quarter_holding: 0 },
      },
      {
        symbol: 'GUJALKALI',
        companyName: 'Gujarat Alkalies and Chemicals Ltd.',
        sector: 'Basic Materials',
        holding_pct: 2.45,
        quarter: 'Q3 FY25',
        delta: { change: 'decreased', delta_pct: -0.25, previous_quarter_holding: 2.70 },
      },
      {
        symbol: 'COALINDIA',
        companyName: 'Coal India Ltd.',
        sector: 'Energy',
        holding_pct: 1.05,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 1.05 },
      },
    ],
  },
  {
    id: 'porinju-veliyath',
    name: 'Porinju Veliyath',
    alias: 'Equity Intelligence India',
    type: 'Institutional / PMS',
    description: 'Kochi-based contrarian value hunter famous for uncovering beaten-down microcaps and turnaround stories before institutional radar.',
    avatar_initials: 'PV',
    top_sectors: ['Real Estate', 'Consumer Cyclical', 'Healthcare'],
    holdings: [
      {
        symbol: 'DLF',
        companyName: 'DLF Ltd.',
        sector: 'Real Estate',
        holding_pct: 1.15,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 1.15 },
      },
      {
        symbol: 'VOLTAS',
        companyName: 'Voltas Ltd.',
        sector: 'Consumer Cyclical',
        holding_pct: 1.40,
        quarter: 'Q3 FY25',
        delta: { change: 'increased', delta_pct: 0.30, previous_quarter_holding: 1.10 },
      },
      {
        symbol: 'ASIANPAINT',
        companyName: 'Asian Paints Ltd.',
        sector: 'Basic Materials',
        holding_pct: 1.08,
        quarter: 'Q3 FY25',
        delta: { change: 'new', delta_pct: 1.08, previous_quarter_holding: 0 },
      },
    ],
  },
  {
    id: 'nemish-shah',
    name: 'Nemish Shah',
    alias: 'ENAM Holdings',
    type: 'Individual HNI',
    description: 'Co-founder of ENAM Securities. Renowned for multi-decade compounding holdings in capital equipment, agro-processing, and high-ROIC engineering businesses.',
    avatar_initials: 'NS',
    top_sectors: ['Industrials', 'Healthcare', 'Consumer Defensive'],
    holdings: [
      {
        symbol: 'HINDUNILVR',
        companyName: 'Hindustan Unilever Ltd.',
        sector: 'Consumer Defensive',
        holding_pct: 1.22,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 1.22 },
      },
      {
        symbol: 'ASAHIINDIA',
        companyName: 'Asahi India Glass Ltd.',
        sector: 'Consumer Cyclical',
        holding_pct: 3.45,
        quarter: 'Q3 FY25',
        delta: { change: 'increased', delta_pct: 0.15, previous_quarter_holding: 3.30 },
      },
      {
        symbol: 'ITC',
        companyName: 'ITC Ltd.',
        sector: 'Consumer Defensive',
        holding_pct: 1.80,
        quarter: 'Q3 FY25',
        delta: { change: 'unchanged', delta_pct: 0, previous_quarter_holding: 1.80 },
      },
    ],
  },
];

/**
 * Calculates live holding value in Crores using actual stock market cap from STOCKS_DATA.
 */
export function computeHoldingValueCr(symbol: string, holdingPct: number): number {
  const stock = STOCKS_DATA.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
  if (!stock || !stock.market_cap) return 0;
  return Math.round(((stock.market_cap * holdingPct) / 100) * 10) / 10;
}

/**
 * Calculates total live portfolio net worth in Crores for an investor.
 */
export function computeInvestorNetWorthCr(investor: SuperInvestor): number {
  return Math.round(
    investor.holdings.reduce((sum, h) => sum + computeHoldingValueCr(h.symbol, h.holding_pct), 0)
  );
}

/**
 * Returns consensus super-investor stock picks (stocks owned by 2 or more super-investors).
 */
export function getConsensusPicks(): Array<{ symbol: string; companyName: string; investorCount: number; investors: string[] }> {
  const map = new Map<string, { companyName: string; investors: string[] }>();
  for (const inv of SUPER_INVESTORS_DATA) {
    for (const h of inv.holdings) {
      const entry = map.get(h.symbol) || { companyName: h.companyName, investors: [] };
      entry.investors.push(inv.name);
      map.set(h.symbol, entry);
    }
  }

  const consensus: Array<{ symbol: string; companyName: string; investorCount: number; investors: string[] }> = [];
  for (const [symbol, data] of map.entries()) {
    if (data.investors.length >= 2) {
      consensus.push({
        symbol,
        companyName: data.companyName,
        investorCount: data.investors.length,
        investors: data.investors,
      });
    }
  }

  return consensus.sort((a, b) => b.investorCount - a.investorCount);
}
