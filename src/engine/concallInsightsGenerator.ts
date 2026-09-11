import { Stock } from '../types/stock';

/**
 * A hand-compiled summary of one earnings call.
 *
 * These entries were written by hand and are not traced to a transcript in
 * this app. Verbatim quotations attributed to named executives, and questions
 * attributed to named analysts at named firms, used to live here too; they were
 * removed, because a quotation that cannot be sourced puts words in a real
 * person's mouth.
 */
export interface ConcallQuarterData {
  quarter: string; // e.g. "Q3 FY25", "Q2 FY25", "Q1 FY25"
  date: string;
  sentimentScore: number; // 0 to 100
  sentimentLabel: 'Strongly Bullish' | 'Constructive & Optimistic' | 'Cautious / Neutral' | 'Defensive';
  summaryParagraph: string;
  capexGuidance: {
    amountCr: number | string;
    timeline: string;
    focusAreas: string[];
    fundingSource: string;
  };
  tailwinds: string[];
  headwinds: string[];
}

export interface StockConcallInsights {
  symbol: string;
  companyName: string;
  quarters: ConcallQuarterData[];
}

export const CURATED_CONCALLS: Record<string, StockConcallInsights> = {
  RELIANCE: {
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries Ltd.',
    quarters: [
      {
        quarter: 'Q3 FY25',
        date: 'January 2025',
        sentimentScore: 84,
        sentimentLabel: 'Constructive & Optimistic',
        summaryParagraph: 'Management highlighted robust double-digit EBITDA expansion in Consumer Retail and Digital Services (Jio True 5G monetization). Upstream KG-D6 gas output remained at peak plateau of 30 MMSCMD. Downstream O2C margins experienced seasonal diesel crack moderation but remained resilient on fuel export flexibilities.',
        capexGuidance: {
          amountCr: '₹1,25,000 - 1,35,000 Cr annual run-rate',
          timeline: 'FY25 - FY27 phased commissioning',
          focusAreas: ['Dhirdbhai Ambani Green Energy Giga-complex (Solar PV & Battery)', '5G FWA AirFiber scale-up', 'Retail dark store and omni-channel infrastructure'],
          fundingSource: 'Fully funded via consolidated internal cash accruals without net debt expansion',
        },
        tailwinds: [
          'Jio 5G tariff hike flow-through driving ARPU expansion towards ₹200 threshold',
          'Retail grocery and electronics footfalls growing 18% YoY with rapid quick-commerce integration',
          'Domestic petchem demand growing at 1.5x Indian GDP',
        ],
        headwinds: [
          'Global refining capacity additions in Middle East pressuring diesel cracks',
          'Raw cotton and synthetic textile intermediates price volatility',
        ],
      },
      {
        quarter: 'Q2 FY25',
        date: 'October 2024',
        sentimentScore: 78,
        sentimentLabel: 'Constructive & Optimistic',
        summaryParagraph: 'Digital services and retail delivered steady quarter-on-quarter improvements, balancing softer global petrochemical spreads. Free cash flow generation showed noticeable improvement as 5G network rollout commitments tapered off.',
        capexGuidance: {
          amountCr: '₹34,000 Cr (Quarterly)',
          timeline: 'FY25 run-rate',
          focusAreas: ['5G coverage completion', 'Retail store optimization'],
          fundingSource: 'Internal operating cash flows',
        },
        tailwinds: ['AirFiber subscriber additions reaching 1 million quarterly run-rate', 'Gas production stability at KG-D6'],
        headwinds: ['Soft European fuel export arbitrage', 'Inflationary pressures on discretionary lifestyle retail'],
      },
    ],
  },
  TATAMOTORS: {
    symbol: 'TATAMOTORS',
    companyName: 'Tata Motors Ltd.',
    quarters: [
      {
        quarter: 'Q3 FY25',
        date: 'February 2025',
        sentimentScore: 82,
        sentimentLabel: 'Constructive & Optimistic',
        summaryParagraph: 'Strong performance anchored by Jaguar Land Rover (JLR) EBIT margin expansion above 8.5%, propelled by record wholesale volumes of Range Rover and Defender. Domestic commercial vehicles sustained strong pricing discipline despite pre-election volume lulls, while EV market leadership remained solid with the launch of Curvv.ev.',
        capexGuidance: {
          amountCr: '£3.0 Billion at JLR; ₹8,000 Cr in Domestic PV & CV',
          timeline: 'FY25 - FY26',
          focusAreas: ['Reimagine EV Architecture (Range Rover Electric)', 'Domestic Sanand 2 plant expansion', 'Hydrogen ICE & LNG truck development'],
          fundingSource: 'JLR is net debt-free with £4.3B cash reserves; domestic business self-funding',
        },
        tailwinds: [
          'Range Rover order book remains strong at over 140,000 units with high option realization',
          'Sanand plant acquisition adds 300,000 units flexible PV capacity',
          'Heavy Commercial Vehicle (HCV) infrastructure replacement demand supported by highway capex',
        ],
        headwinds: [
          'European EV adoption deceleration forcing ICE/PHEV product flexibility',
          'Domestic small passenger car segment demand sluggishness',
        ],
      },
    ],
  },
  TCS: {
    symbol: 'TCS',
    companyName: 'Tata Consultancy Services Ltd.',
    quarters: [
      {
        quarter: 'Q3 FY25',
        date: 'January 2025',
        sentimentScore: 76,
        sentimentLabel: 'Constructive & Optimistic',
        summaryParagraph: 'Order book total contract value (TCV) stood resilient at $10.2 billion. BFSI showed early green shoots of discretionary tech recovery in North America, while manufacturing and regional markets exhibited steady deal velocity. Operating margin held firm at 26.0% supported by operational efficiencies and reduced attrition.',
        capexGuidance: {
          amountCr: '₹3,000 - 3,500 Cr',
          timeline: 'FY25 routine infrastructure & cloud labs',
          focusAreas: ['Enterprise AI Centers of Excellence', 'Tier-2 delivery centers expansion', 'Campus infra in Indore and Nagpur'],
          fundingSource: '100% internal cash flows; continues policy of returning 80-100% free cash flow to shareholders',
        },
        tailwinds: [
          'Accelerated adoption of GenAI platforms (TCS AI WisdomNext) across 600+ enterprise POCs',
          'Vendor consolidation megadeals in UK and European insurance and retail banking',
          'Attrition normalized to pre-pandemic level of 12.5%',
        ],
        headwinds: [
          'Cautious enterprise decision-making cycles on short-term discretionary consulting',
          'Telecom sector capex moderation globally',
        ],
      },
    ],
  },
};

// Aliases for demerged or dual-listed entities
CURATED_CONCALLS['TMCV'] = CURATED_CONCALLS['TATAMOTORS'];
CURATED_CONCALLS['TMPV'] = CURATED_CONCALLS['TATAMOTORS'];

/** Whether a hand-compiled concall summary exists for a stock. */
export function hasStockConcallInsights(stock: Stock | { symbol: string } | null | undefined): boolean {
  if (!stock || !stock.symbol) return false;
  const symbol = stock.symbol.toUpperCase();
  const data = CURATED_CONCALLS[symbol];
  return Boolean(data && data.quarters && data.quarters.length > 0);
}

/**
 * The hand-compiled concall summary for a stock, or null. These are not traced
 * to a transcript; the page labels them as compiled by hand.
 */
export function generateStockConcallInsights(stock: Stock): StockConcallInsights | null {
  if (!stock || !stock.symbol) return null;
  const symbol = stock.symbol.toUpperCase();
  return CURATED_CONCALLS[symbol] || null;
}

