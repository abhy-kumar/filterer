import generated from './superInvestors.generated.json';
import { STOCKS_DATA } from './stocksData';

/**
 * Super-investor portfolios, generated from exchange shareholding filings by
 * data_pipeline/super_investors.py. Nothing here is typed in by hand: the
 * previous version was, with every holding stamped "Q3 FY25" and 26 of 61
 * holdings pointing at companies outside the universe, which valued at zero.
 */

export type DeltaType = 'new' | 'increased' | 'decreased' | 'unchanged' | 'sold';
export type InvestorType = 'Individual HNI' | 'Institutional / PMS' | 'Family Office' | 'Corporate Holder';

export interface HoldingDelta {
  change: DeltaType;
  /** Change in percentage points of the company's shares, not a percentage change. */
  delta_pct?: number;
  previous_quarter_holding?: number;
}

export interface InvestorHolding {
  symbol: string;
  companyName: string;
  sector: string;
  holding_pct: number;
  shares_count: number | null;
  /** At the prices known when the file was generated. See holdingValueCr for a current value. */
  holding_value_cr: number | null;
  quarter: string;
  role: 'promoter' | 'public';
  in_universe: boolean;
  /** The names this stake was filed under, which can be several. */
  filed_names: string[];
  delta: HoldingDelta;
}

export interface InvestorExit {
  symbol: string;
  companyName: string;
  previous_quarter_holding: number;
  quarter: string;
}

export interface SuperInvestor {
  id: string;
  name: string;
  alias?: string | null;
  type: InvestorType;
  description: string;
  avatar_initials: string;
  top_sectors: string[];
  /** Curated investors are named in the registry; discovered ones were found in the filings. */
  origin: 'curated' | 'discovered';
  value_cr: number;
  holdings: InvestorHolding[];
  exits: InvestorExit[];
}

interface GeneratedInvestors {
  generated_at: string | null;
  source: string;
  latest_period: string | null;
  price_date: string | null;
  investors: SuperInvestor[];
  companies: Record<string, { name: string; sector: string; in_universe: boolean; price: number | null; price_date: string | null }>;
}

const FILE = generated as unknown as GeneratedInvestors;

export const SUPER_INVESTORS_DATA: SuperInvestor[] = FILE.investors ?? [];

/** Name, sector and NSE closing price for every company a tracked investor holds. */
export const INVESTOR_COMPANIES = FILE.companies ?? {};

export const SUPER_INVESTORS_META = {
  generatedAt: FILE.generated_at,
  source: FILE.source,
  latestPeriod: FILE.latest_period,
  /** Date of the closing prices used for companies outside the universe. */
  priceDate: FILE.price_date,
};

const STOCK_BY_SYMBOL = new Map(STOCKS_DATA.map((s) => [s.symbol.toUpperCase(), s]));

const round1 = (v: number) => Math.round(v * 10) / 10;

/**
 * A holding's value in crore: the filed share count at the given price, the
 * bundled price, or the closing price the generator recorded, in that order.
 * Without a share count it falls back to the stake times market cap.
 */
export function holdingValueCr(holding: InvestorHolding, livePrice?: number): number | null {
  const stock = STOCK_BY_SYMBOL.get(holding.symbol.toUpperCase());
  const priceNow = livePrice ?? stock?.current_price ?? FILE.companies?.[holding.symbol]?.price ?? null;
  if (holding.shares_count && priceNow) return round1((holding.shares_count * priceNow) / 1e7);
  if (stock?.market_cap) return round1((stock.market_cap * holding.holding_pct) / 100);
  return holding.holding_value_cr;
}

export function investorValueCr(investor: SuperInvestor): number {
  return Math.round(investor.holdings.reduce((sum, h) => sum + (holdingValueCr(h) ?? 0), 0));
}

/** Companies in which two or more tracked investors each hold 1% or more. */
export function getConsensusPicks(): Array<{ symbol: string; companyName: string; inUniverse: boolean; investorCount: number; investors: string[] }> {
  const map = new Map<string, { companyName: string; inUniverse: boolean; investors: string[] }>();
  for (const investor of SUPER_INVESTORS_DATA) {
    for (const h of investor.holdings) {
      const entry = map.get(h.symbol) ?? { companyName: h.companyName, inUniverse: h.in_universe, investors: [] };
      entry.investors.push(investor.name);
      map.set(h.symbol, entry);
    }
  }
  return Array.from(map.entries())
    .filter(([, e]) => e.investors.length >= 2)
    .map(([symbol, e]) => ({ symbol, companyName: e.companyName, inUniverse: e.inUniverse, investorCount: e.investors.length, investors: e.investors }))
    .sort((a, b) => b.investorCount - a.investorCount);
}

/** Tracked investors holding 1% or more of one company. */
export function getInvestorsHolding(symbol: string): Array<{ id: string; name: string; pct: number; quarter: string; role: 'promoter' | 'public' }> {
  const target = symbol.toUpperCase();
  const out = [];
  for (const investor of SUPER_INVESTORS_DATA) {
    const h = investor.holdings.find((x) => x.symbol.toUpperCase() === target);
    if (h) out.push({ id: investor.id, name: investor.name, pct: h.holding_pct, quarter: h.quarter, role: h.role });
  }
  return out.sort((a, b) => b.pct - a.pct);
}
