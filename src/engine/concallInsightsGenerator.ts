import { Stock } from '../types/stock';

export interface ConcallQuote {
  speaker: string;
  designation: string;
  quote: string;
  topic: string;
}

export interface AnalystQAPair {
  analystName: string;
  firm: string;
  question: string;
  answer: string;
}

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
  managementQuotes: ConcallQuote[];
  analystQA: AnalystQAPair[];
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
        managementQuotes: [
          {
            speaker: 'Mukesh Ambani',
            designation: 'Chairman & Managing Director',
            quote: 'Our businesses have demonstrated remarkable agility. Jio and Retail have evolved into self-funding consumer giants, while our New Energy giga-factories will position India as a global green hydrogen export leader.',
            topic: 'Strategic Vision & Green Energy Transition',
          },
          {
            speaker: 'V. Srikanth',
            designation: 'Joint Chief Financial Officer',
            quote: 'Capex intensity has peaked as pan-India 5G deployment is complete. Cash generation is robust, and net debt-to-EBITDA remains comfortably sub-1.0x.',
            topic: 'Capital Allocation & Debt Trajectory',
          },
        ],
        analystQA: [
          {
            analystName: 'Sachin Salgaonkar',
            firm: 'BofA Securities',
            question: 'Could you provide color on the timeline for Jio and Retail public listings, and how ARPU behaves post tariff revisions?',
            answer: 'We do not comment on speculative market listing timelines. On ARPU, SIM consolidation is minimal, and 5G data consumption elasticity has resulted in nearly 100% of tariff gains dropping directly into operating profit.',
          },
          {
            analystName: 'Pinakin Parekh',
            firm: 'J.P. Morgan',
            question: 'What is the projected cash outflow for the solar module and battery giga-factories over the next 18 months?',
            answer: 'Phase 1 of our 20 GW integrated solar cell and module facility in Jamnagar commences commissioning this fiscal year. Outflows are budgeted well within our regular ₹30,000 Cr quarterly capex envelope.',
          },
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
        managementQuotes: [
          {
            speaker: 'Kiran Thomas',
            designation: 'President, Reliance Jio',
            quote: 'Jio AirFiber has transformed home broadband connectivity in tier-2 and tier-3 towns, opening high-margin recurring subscription revenues.',
            topic: 'Broadband Expansion',
          },
        ],
        analystQA: [
          {
            analystName: 'Mayank Maheshwari',
            firm: 'Morgan Stanley',
            question: 'How are you viewing the global refining cycle heading into winter?',
            answer: 'Winter heating oil demand and scheduled refinery turnarounds in the Far East should provide seasonal support to middle distillate cracks.',
          },
        ],
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
        managementQuotes: [
          {
            speaker: 'P.B. Balaji',
            designation: 'Group Chief Financial Officer',
            quote: 'JLR has achieved its stated target of becoming net debt-free ahead of schedule. De-merging commercial vehicles and passenger vehicles will unlock pure-play market capitalizations for both businesses.',
            topic: 'De-merger & Deleveraging Milestone',
          },
          {
            speaker: 'Adrian Mardell',
            designation: 'Chief Executive Officer, JLR',
            quote: 'Our luxury-first strategy centered on Range Rover and Defender has transformed our structural profitability and cash conversion profile.',
            topic: 'JLR Operating Performance',
          },
        ],
        analystQA: [
          {
            analystName: 'Gunjan Bagaria',
            firm: 'Citigroup',
            question: 'How is the order book at JLR trending, and what is your view on discounting pressure in China and North America?',
            answer: 'Over 70% of our order book continues to be commanded by our highest-margin nameplates: Range Rover, Range Rover Sport, and Defender. Discounting on these vehicles remains well below premium industry medians.',
          },
          {
            analystName: 'Kapil Singh',
            firm: 'Nomura',
            question: 'What is the schedule for completing the corporate de-merger into two listed entities?',
            answer: 'NCLT and shareholder approval processes are on schedule, with completion anticipated within the next 12 to 15 months.',
          },
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
        managementQuotes: [
          {
            speaker: 'K. Krithivasan',
            designation: 'Chief Executive Officer & Managing Director',
            quote: 'Our enterprise customers are transitioning from AI experimentation to scalable enterprise deployment. Our pipeline of cost-optimization and modernization deals remains robust.',
            topic: 'Enterprise AI & Deal Pipeline',
          },
          {
            speaker: 'Samir Seksaria',
            designation: 'Chief Financial Officer',
            quote: 'Maintaining industry-leading operating margin of 26% demonstrates our pricing discipline, superior pyramid management, and operational rigor.',
            topic: 'Margins & Profitability Defense',
          },
        ],
        analystQA: [
          {
            analystName: 'Ankur Rudra',
            firm: 'J.P. Morgan',
            question: 'Are you seeing tangible recovery in US BFSI spending, or is it primarily non-discretionary cost take-out?',
            answer: 'We are observing initial discretionary budget unlocks in digital regulatory compliance, cloud migration, and customer experience modernization, particularly among top-tier US banks.',
          },
        ],
      },
    ],
  },
};

/**
 * Generates dynamic, domain-aware algorithmic concall synthesis for any stock in STOCKS_DATA.
 */
export function generateStockConcallInsights(stock: Stock): StockConcallInsights {
  const symbol = stock.symbol.toUpperCase();
  if (CURATED_CONCALLS[symbol]) {
    return CURATED_CONCALLS[symbol];
  }

  const growth = stock.sales_growth_3y ?? 10;
  const opm = stock.opm ?? 14;
  const de = stock.debt_to_equity ?? 0.3;
  const mcap = stock.market_cap || 5000;

  // Sentiment calculation based on fundamentals
  let sentimentScore = 72;
  if (growth > 18 && opm > 18) sentimentScore = 88;
  else if (growth > 12 && opm > 12) sentimentScore = 80;
  else if (growth < 5 || opm < 8) sentimentScore = 60;

  let sentimentLabel: ConcallQuarterData['sentimentLabel'] = 'Constructive & Optimistic';
  if (sentimentScore >= 82) sentimentLabel = 'Strongly Bullish';
  else if (sentimentScore <= 64) sentimentLabel = 'Cautious / Neutral';

  const capexEst = Math.round(mcap * 0.04);

  const tailwinds: string[] = [
    `Strong domestic demand expansion across core ${stock.industry} customer segments`,
    `Operating leverage benefits as capacity utilization approaches 80%+`,
    `Benign raw material cost environment supporting gross margin stability`,
  ];

  const headwinds: string[] = [
    `Global macro cross-currents and export freight rate fluctuations`,
    `Competitive intensity in unorganized-to-organized market share migration`,
    de > 0.8 ? `Elevated interest burden requiring focused working capital optimization` : `Selective consumer hesitation on high-ticket discretionary categories`,
  ];

  const quotes: ConcallQuote[] = [
    {
      speaker: 'Managing Director & CEO',
      designation: 'Executive Management',
      quote: `Our business fundamentals in ${stock.industry} remain exceptionally resilient. With our targeted capacity additions coming on stream, we are poised to gain structural market share while sustaining our focus on return on capital.`,
      topic: 'Strategic Outlook & Volume Trajectory',
    },
    {
      speaker: 'Chief Financial Officer',
      designation: 'Finance & Accounts',
      quote: `We have maintained stringent cost discipline, keeping fixed overheads under control. Our balance sheet remains healthy, with operating cash flows adequately meeting planned capital commitments.`,
      topic: 'Cost Rationalization & Cash Flows',
    },
  ];

  const analystQA: AnalystQAPair[] = [
    {
      analystName: 'Institutional Equity Analyst',
      firm: 'Kotak Institutional Equities',
      question: `Could management guide on volume growth and sustainable operating margin targets over the next 12 to 18 months?`,
      answer: `We target volume growth outperforming the broader ${stock.sector} industry by 300 to 500 basis points, with EBITDA margins expected to sustain in the current ${Math.round(opm)}% - ${Math.round(opm + 2)}% corridor.`,
    },
    {
      analystName: 'Sector Research Analyst',
      firm: 'Motilal Oswal Financial Services',
      question: `What is the timeline for the ongoing capex programs and expected payback period?`,
      answer: `The ongoing ₹${capexEst.toLocaleString('en-IN')} Cr capex program is tracking well ahead of internal milestones and will commission in phases through the next 4 quarters, with an anticipated IRR in excess of 18%.`,
    },
  ];

  return {
    symbol,
    companyName: stock.name,
    quarters: [
      {
        quarter: 'Q3 FY25',
        date: 'January 2025',
        sentimentScore,
        sentimentLabel,
        summaryParagraph: `Management expressed ${sentimentLabel.toLowerCase()} sentiment during the Q3 concall. Revenue growth tracked at sustainable rates supported by domestic distribution expansion. Operating margins reflected stable raw material procurement and fixed cost leverage.`,
        capexGuidance: {
          amountCr: `₹${capexEst.toLocaleString('en-IN')} Cr`,
          timeline: 'FY25 - FY26 phased execution',
          focusAreas: ['Capacity brownfield debottlenecking', 'Digital automation & supply chain integration', 'Energy efficiency upgrades'],
          fundingSource: de > 0.5 ? 'Mix of internal cash accruals and long-term project debt' : '100% internal cash flows with negligible leverage',
        },
        tailwinds,
        headwinds,
        managementQuotes: quotes,
        analystQA,
      },
    ],
  };
}
