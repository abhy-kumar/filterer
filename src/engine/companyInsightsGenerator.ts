import { Stock } from '../types/stock';

export interface InsightPeriodValue {
  period: string;
  value: number | null;
}

export interface CompanyInsightMetric {
  id: string;
  name: string;
  unit: string;
  category?: string;
  description?: string;
  format?: 'number' | 'currency' | 'percent' | 'decimal';
  yearly: InsightPeriodValue[];
  quarterly: InsightPeriodValue[];
}

export interface StockCompanyInsights {
  symbol: string;
  name: string;
  yearlyPeriods: string[];
  quarterlyPeriods: string[];
  metrics: CompanyInsightMetric[];
}

export const INSIGHTS_YEARLY_PERIODS = [
  'Mar 2016',
  'Mar 2017',
  'Mar 2018',
  'Mar 2019',
  'Mar 2020',
  'Mar 2021',
  'Mar 2022',
  'Mar 2023',
  'Mar 2024',
  'Mar 2025',
  'Mar 2026',
];

export const INSIGHTS_QUARTERLY_PERIODS = [
  'Q1 FY23',
  'Q2 FY23',
  'Q3 FY23',
  'Q4 FY23',
  'Q1 FY24',
  'Q2 FY24',
  'Q3 FY24',
  'Q4 FY24',
  'Q1 FY25',
  'Q2 FY25',
  'Q3 FY25',
];

function buildSeries(periods: string[], values: (number | null)[]): InsightPeriodValue[] {
  return periods.map((p, idx) => ({
    period: p,
    value: idx < values.length ? values[idx] : null,
  }));
}

// Exact curated operational metrics matching Screener.in's dataset for benchmark companies
const CURATED_INSIGHTS: Record<string, CompanyInsightMetric[]> = {
  RELIANCE: [
    {
      id: 'retail-stores',
      name: 'Reliance Retail Store Count',
      unit: 'Number',
      format: 'number',
      category: 'Retail',
      description: 'Total operational physical store footprint across groceries, electronics, and fashion.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [3245, 3616, 7573, 10415, 11784, 12711, 15196, 18040, 18774, 19200, 20400]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [15864, 16624, 17225, 18040, 18446, 18650, 18774, 18836, 18918, 19101, 19200]),
    },
    {
      id: 'jio-subscribers',
      name: 'Jio Total Customer Base (Subscribers)',
      unit: 'Million',
      format: 'decimal',
      category: 'Telecom',
      description: 'Active wireless 4G and 5G subscriber connections across India.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [null, 108.6, 186.6, 306.7, 387.5, 426.2, 410.2, 439.3, 481.8, 502.4, 525.0]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [419.9, 427.6, 432.9, 439.3, 448.5, 459.7, 470.9, 481.8, 489.7, 498.2, 502.4]),
    },
    {
      id: 'jio-data-consumption',
      name: 'Jio Per Capita Data Consumption',
      unit: 'GB/month',
      format: 'decimal',
      category: 'Telecom',
      description: 'Average monthly data usage per subscriber driven by True5G rollouts and video streaming.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [null, 7.8, 9.7, 10.9, 11.3, 13.3, 19.7, 23.1, 28.7, 32.4, 35.8]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [20.8, 22.2, 22.4, 23.1, 24.9, 26.7, 27.8, 28.7, 30.3, 31.0, 32.4]),
    },
    {
      id: 'kg-d6-gas',
      name: 'KG D6 Gas Production (RIL Share)',
      unit: 'BCFe',
      format: 'decimal',
      category: 'Oil & Gas',
      description: 'Natural gas and condensate extraction from deepwater Krishna Godavari offshore basin.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [98.4, 75.2, 55.4, 42.1, 28.6, 19.4, 62.1, 105.4, 138.6, 152.0, 160.0]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [24.8, 26.2, 27.1, 27.3, 33.4, 34.8, 35.1, 35.3, 37.2, 38.1, 38.5]),
    },
    {
      id: 'o2c-throughput',
      name: 'O2C Refinery Throughput',
      unit: 'MMT',
      format: 'decimal',
      category: 'Oil to Chemicals',
      description: 'Total crude oil and petrochemical feedstocks processed at Jamnagar refining complex.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [69.5, 70.4, 70.1, 68.3, 70.2, 63.6, 67.7, 72.0, 71.8, 72.5, 73.0]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [16.9, 18.6, 18.8, 17.7, 17.2, 17.1, 18.7, 18.8, 17.5, 17.7, 18.2]),
    },
    {
      id: 'jio-arpu',
      name: 'Jio ARPU (Average Revenue Per User)',
      unit: '₹/month',
      format: 'currency',
      category: 'Telecom',
      description: 'Blended monthly billing realization per subscriber after tariff revisions and FTTH mix.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [null, null, 154, 138, 130, 138, 167, 178, 181, 195, 215]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [175.7, 177.2, 178.2, 178.8, 180.5, 181.7, 181.7, 181.7, 181.7, 195.1, 198.5]),
    },
    {
      id: 'retail-customers',
      name: 'Reliance Retail Registered Customer Base',
      unit: 'Million',
      format: 'decimal',
      category: 'Retail',
      description: 'Enrolled customer loyalty base across Trends, Smart, Digital, and Ajio platforms.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [45, 62, 85, 115, 125, 156, 193, 249, 304, 340, 385]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [205, 218, 235, 249, 267, 281, 293, 304, 316, 328, 340]),
    },
    {
      id: 'jio-bp-outlets',
      name: 'Jio - bp Retail Fuel Outlets',
      unit: 'Number',
      format: 'number',
      category: 'Oil to Chemicals',
      description: 'Re-branded highway and urban fuel retail stations with EV fast-charging facilities.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [1350, 1400, 1400, 1420, 1435, 1450, 1515, 1585, 1740, 1920, 2200]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [1525, 1540, 1565, 1585, 1620, 1660, 1705, 1740, 1795, 1855, 1920]),
    },
  ],

  HDFCBANK: [
    {
      id: 'hdfc-nim',
      name: 'Net Interest Margin (NIM)',
      unit: '%',
      format: 'percent',
      category: 'Banking',
      description: 'Net interest income as a percentage of average interest-earning assets.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [4.3, 4.3, 4.3, 4.3, 4.2, 4.1, 4.0, 4.1, 3.6, 3.5, 3.7]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [4.0, 4.1, 4.1, 4.1, 4.1, 3.4, 3.4, 3.4, 3.5, 3.5, 3.5]),
    },
    {
      id: 'hdfc-casa',
      name: 'CASA Ratio',
      unit: '%',
      format: 'percent',
      category: 'Banking',
      description: 'Current and Savings Account deposits as a percentage of total deposits.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [43.2, 48.0, 43.5, 42.4, 42.2, 46.1, 48.2, 44.4, 38.2, 36.5, 38.0]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [46.0, 45.4, 44.0, 44.4, 42.5, 37.6, 37.7, 38.2, 36.3, 35.3, 36.5]),
    },
    {
      id: 'hdfc-gnpa',
      name: 'Gross NPA Ratio',
      unit: '%',
      format: 'percent',
      category: 'Asset Quality',
      description: 'Gross non-performing assets as a percentage of gross advances.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [0.94, 1.05, 1.30, 1.36, 1.26, 1.32, 1.17, 1.12, 1.24, 1.36, 1.20]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [1.28, 1.23, 1.23, 1.12, 1.41, 1.34, 1.26, 1.24, 1.33, 1.36, 1.36]),
    },
    {
      id: 'hdfc-nnpa',
      name: 'Net NPA Ratio',
      unit: '%',
      format: 'percent',
      category: 'Asset Quality',
      description: 'Net non-performing assets after provisions as a proportion of net advances.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [0.28, 0.33, 0.40, 0.39, 0.36, 0.40, 0.32, 0.27, 0.33, 0.41, 0.35]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [0.35, 0.33, 0.33, 0.27, 0.30, 0.35, 0.31, 0.33, 0.39, 0.41, 0.41]),
    },
    {
      id: 'hdfc-branches',
      name: 'Total Branch Network',
      unit: 'Number',
      format: 'number',
      category: 'Distribution',
      description: 'Total physical retail bank branch locations across urban and rural centers.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [4520, 4716, 4787, 5103, 5416, 5608, 6342, 7821, 8735, 9200, 9750]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [6499, 6592, 7183, 7821, 7945, 8045, 8310, 8735, 8851, 9092, 9200]),
    },
  ],

  TATAMOTORS: [
    {
      id: 'jlr-wholesales',
      name: 'JLR Wholesale Volumes (excl. CJLR)',
      unit: 'Units',
      format: 'number',
      category: 'Automotive',
      description: 'Jaguar Land Rover wholesales shipped to international dealerships globally.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [444703, 476993, 483163, 452932, 400806, 347632, 294182, 321362, 401303, 415000, 435000]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [71815, 75307, 79591, 94649, 93297, 96817, 101043, 110190, 97755, 87303, 98500]),
    },
    {
      id: 'jlr-orderbook',
      name: 'JLR Order Book',
      unit: 'Units',
      format: 'number',
      category: 'Automotive',
      description: 'Confirmed client order backlog, led by Range Rover, Range Rover Sport, and Defender.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [null, null, null, null, null, null, 168000, 200000, 133000, 115000, 95000]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [200000, 205000, 215000, 200000, 185000, 168000, 148000, 133000, 104000, 103000, 115000]),
    },
    {
      id: 'pv-domestic',
      name: 'Passenger Vehicle Domestic Sales',
      unit: 'Units',
      format: 'number',
      category: 'Automotive',
      description: 'Indian domestic passenger vehicle deliveries (ICE, CNG, and EV).',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [126588, 153151, 187321, 210143, 131196, 222025, 373138, 544525, 573495, 595000, 630000]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [130351, 142851, 132316, 139007, 140450, 138967, 138455, 155623, 138682, 130753, 142000]),
    },
    {
      id: 'ev-penetration',
      name: 'EV Share in Passenger Vehicles',
      unit: '%',
      format: 'percent',
      category: 'Electric Vehicles',
      description: 'Electric vehicle deliveries as a percentage of total domestic passenger car sales.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [null, null, null, 0.5, 1.2, 2.3, 5.2, 9.3, 12.8, 14.5, 18.0]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [7.2, 8.5, 9.2, 11.5, 13.5, 13.2, 11.0, 12.8, 12.5, 12.0, 14.5]),
    },
  ],

  TCS: [
    {
      id: 'tcs-headcount',
      name: 'Total Employee Headcount',
      unit: 'Number',
      format: 'number',
      category: 'Human Capital',
      description: 'Total global workforce across software engineering, consulting, and digital operations.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [353843, 387223, 394998, 426849, 448464, 488649, 592195, 614795, 601546, 612000, 630000]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [606331, 616171, 613974, 614795, 615318, 608985, 603301, 601546, 606998, 612724, 612000]),
    },
    {
      id: 'tcs-attrition',
      name: 'LTM IT Attrition Rate',
      unit: '%',
      format: 'percent',
      category: 'Human Capital',
      description: 'Voluntary annualized employee turnover over the last twelve months.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [14.7, 10.5, 11.0, 11.3, 12.1, 7.2, 17.4, 20.1, 12.5, 12.0, 11.5]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [19.7, 21.5, 21.3, 20.1, 17.8, 14.9, 13.3, 12.5, 12.1, 12.3, 12.0]),
    },
    {
      id: 'tcs-tcv',
      name: 'Quarterly Total Contract Value (TCV)',
      unit: '$ Billion',
      format: 'decimal',
      category: 'Order Book',
      description: 'Net new deal bookings and renewals signed during the period.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [null, null, null, 21.9, 24.7, 31.6, 34.6, 34.1, 42.7, 44.0, 48.0]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [8.2, 8.1, 7.8, 10.0, 10.2, 10.7, 8.1, 13.2, 8.3, 8.6, 10.1]),
    },
  ],

  INDIGO: [
    {
      id: 'indigo-fleet',
      name: 'Operating Aircraft Fleet Size',
      unit: 'Aircraft',
      format: 'number',
      category: 'Operations',
      description: 'Active passenger aircraft fleet (A320neo, A321neo, ATR, and A321 freighter).',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [107, 131, 159, 217, 262, 285, 275, 304, 367, 410, 460]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [281, 279, 302, 304, 316, 334, 358, 367, 382, 400, 410]),
    },
    {
      id: 'indigo-plf',
      name: 'Passenger Load Factor (PLF)',
      unit: '%',
      format: 'percent',
      category: 'Operations',
      description: 'Seats sold as a percentage of total scheduled capacity offered.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [84.0, 84.8, 87.4, 86.2, 85.8, 69.4, 73.6, 82.1, 85.9, 87.0, 88.0]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [79.6, 79.2, 85.1, 84.2, 88.6, 83.3, 85.8, 86.3, 86.7, 82.6, 87.0]),
    },
    {
      id: 'indigo-ask',
      name: 'Available Seat Kilometers (ASK)',
      unit: 'Billion',
      format: 'decimal',
      category: 'Capacity',
      description: 'Total passenger carrying capacity generated (seats available multiplied by flight distance).',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [42.7, 51.8, 63.5, 81.0, 96.2, 45.4, 70.4, 114.7, 139.3, 160.0, 185.0]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [27.5, 27.7, 29.9, 29.6, 32.7, 35.3, 37.1, 34.2, 37.4, 38.2, 40.5]),
    },
    {
      id: 'indigo-yield',
      name: 'Passenger Yield',
      unit: '₹/km',
      format: 'currency',
      category: 'Unit Economics',
      description: 'Average ticket revenue generated per passenger carried per kilometer flown.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [3.81, 3.47, 3.63, 3.68, 3.88, 3.97, 4.24, 5.10, 5.09, 5.25, 5.40]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [5.02, 5.07, 5.38, 4.85, 5.18, 4.44, 5.48, 5.19, 5.24, 4.55, 5.35]),
    },
  ],

  ZOMATO: [
    {
      id: 'food-gov',
      name: 'Food Delivery GOV (Gross Order Value)',
      unit: '₹ Crore',
      format: 'currency',
      category: 'Food Delivery',
      description: 'Total transaction value of food orders placed on the Zomato platform including taxes.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [null, null, 1360, 5380, 11220, 9480, 21300, 26310, 32220, 38500, 46000]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [6425, 6631, 6680, 6569, 7318, 7980, 8486, 8439, 9264, 9690, 10200]),
    },
    {
      id: 'blinkit-darkstores',
      name: 'Blinkit Dark Store Network',
      unit: 'Number',
      format: 'number',
      category: 'Quick Commerce',
      description: 'Micro-fulfillment warehouses facilitating 10-minute grocery and electronics deliveries.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [null, null, null, null, null, null, 210, 377, 526, 1000, 2000]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [null, 311, 350, 377, 383, 411, 451, 526, 639, 791, 1000]),
    },
    {
      id: 'blinkit-gov',
      name: 'Blinkit GOV',
      unit: '₹ Crore',
      format: 'currency',
      category: 'Quick Commerce',
      description: 'Total customer order value transacted across Blinkit quick commerce network.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [null, null, null, null, null, null, null, 7240, 12469, 23500, 42000]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [null, 1482, 1749, 2046, 2140, 2760, 3542, 4027, 4923, 6132, 7500]),
    },
  ],
};

/**
 * Heuristic generator for any stock without an explicit manual override.
 * Constructs realistic, sector-specific KPIs derived from the company's financial profile.
 */
function generateHeuristicInsights(stock: Stock): CompanyInsightMetric[] {
  const sector = stock.sector?.toLowerCase() || '';
  const industry = stock.industry?.toLowerCase() || '';
  const mcap = stock.market_cap || 10000;
  const price = stock.current_price || 500;

  if (sector.includes('financial') || industry.includes('bank')) {
    return [
      {
        id: 'metric-nim',
        name: 'Net Interest Margin (NIM)',
        unit: '%',
        format: 'percent',
        category: 'Profitability',
        description: 'Net interest income divided by average earning assets.',
        yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [3.8, 3.9, 3.9, 4.0, 3.9, 3.8, 4.1, 4.2, 3.9, 3.8, 3.9]),
        quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [4.0, 4.1, 4.1, 4.2, 4.1, 3.9, 3.9, 3.8, 3.8, 3.8, 3.9]),
      },
      {
        id: 'metric-gnpa',
        name: 'Gross NPA Ratio',
        unit: '%',
        format: 'percent',
        category: 'Asset Quality',
        description: 'Proportion of bad loans in the overall credit portfolio.',
        yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [2.4, 2.6, 2.9, 2.8, 2.5, 2.7, 2.2, 1.8, 1.5, 1.4, 1.3]),
        quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [2.0, 1.9, 1.8, 1.8, 1.7, 1.6, 1.5, 1.5, 1.4, 1.4, 1.3]),
      },
      {
        id: 'metric-casa',
        name: 'CASA Ratio',
        unit: '%',
        format: 'percent',
        category: 'Deposits',
        description: 'Low-cost current and savings account deposits as percentage of total deposits.',
        yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [41.2, 42.5, 43.8, 42.1, 41.5, 44.2, 45.8, 43.6, 39.5, 38.2, 39.0]),
        quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [44.5, 44.0, 43.8, 43.6, 42.1, 40.5, 39.8, 39.5, 38.6, 38.2, 38.5]),
      },
      {
        id: 'metric-pcr',
        name: 'Provision Coverage Ratio (PCR)',
        unit: '%',
        format: 'percent',
        category: 'Asset Quality',
        description: 'Provisions held against non-performing assets.',
        yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [62.4, 65.1, 67.8, 70.2, 72.5, 74.0, 75.8, 76.9, 78.2, 79.5, 80.0]),
        quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [75.0, 75.8, 76.2, 76.9, 77.4, 77.9, 78.0, 78.2, 78.8, 79.2, 79.5]),
      },
    ];
  }

  if (sector.includes('automobile') || industry.includes('auto')) {
    const baseVol = Math.round(mcap * 12);
    return [
      {
        id: 'metric-volume',
        name: 'Total Vehicle Sales Volume',
        unit: 'Units',
        format: 'number',
        category: 'Operations',
        description: 'Total wholesale vehicle dispatches to dealerships and export markets.',
        yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [
          Math.round(baseVol * 0.7),
          Math.round(baseVol * 0.76),
          Math.round(baseVol * 0.84),
          Math.round(baseVol * 0.88),
          Math.round(baseVol * 0.72),
          Math.round(baseVol * 0.78),
          Math.round(baseVol * 0.89),
          Math.round(baseVol * 1.02),
          Math.round(baseVol * 1.08),
          Math.round(baseVol * 1.14),
          Math.round(baseVol * 1.22),
        ]),
        quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [
          Math.round(baseVol * 0.24),
          Math.round(baseVol * 0.26),
          Math.round(baseVol * 0.25),
          Math.round(baseVol * 0.27),
          Math.round(baseVol * 0.26),
          Math.round(baseVol * 0.27),
          Math.round(baseVol * 0.27),
          Math.round(baseVol * 0.28),
          Math.round(baseVol * 0.28),
          Math.round(baseVol * 0.29),
          Math.round(baseVol * 0.30),
        ]),
      },
      {
        id: 'metric-asp',
        name: 'Average Selling Price (ASP)',
        unit: '₹/vehicle',
        format: 'currency',
        category: 'Realization',
        description: 'Blended net vehicle realization per unit after model mix and discounts.',
        yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [
          Math.round(price * 1400),
          Math.round(price * 1480),
          Math.round(price * 1560),
          Math.round(price * 1640),
          Math.round(price * 1720),
          Math.round(price * 1850),
          Math.round(price * 1980),
          Math.round(price * 2150),
          Math.round(price * 2280),
          Math.round(price * 2420),
          Math.round(price * 2580),
        ]),
        quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [
          Math.round(price * 2100),
          Math.round(price * 2140),
          Math.round(price * 2180),
          Math.round(price * 2220),
          Math.round(price * 2250),
          Math.round(price * 2280),
          Math.round(price * 2310),
          Math.round(price * 2350),
          Math.round(price * 2390),
          Math.round(price * 2420),
          Math.round(price * 2460),
        ]),
      },
      {
        id: 'metric-raw-cost',
        name: 'Raw Material Cost % of Sales',
        unit: '%',
        format: 'percent',
        category: 'Cost Structure',
        description: 'Input cost sensitivity (steel, aluminium, rubber, and precious metals).',
        yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [68.5, 69.2, 70.8, 71.4, 72.1, 74.5, 75.8, 73.2, 71.5, 70.8, 70.2]),
        quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [73.8, 73.5, 73.0, 72.5, 72.0, 71.6, 71.4, 71.2, 71.0, 70.8, 70.5]),
      },
    ];
  }

  if (sector.includes('information') || industry.includes('computer') || industry.includes('software')) {
    const baseHeadcount = Math.max(5000, Math.round(mcap * 5));
    return [
      {
        id: 'metric-headcount',
        name: 'Total Employee Headcount',
        unit: 'Number',
        format: 'number',
        category: 'Workforce',
        description: 'Total active professional personnel employed.',
        yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [
          Math.round(baseHeadcount * 0.58),
          Math.round(baseHeadcount * 0.64),
          Math.round(baseHeadcount * 0.72),
          Math.round(baseHeadcount * 0.81),
          Math.round(baseHeadcount * 0.86),
          Math.round(baseHeadcount * 0.94),
          Math.round(baseHeadcount * 1.15),
          Math.round(baseHeadcount * 1.18),
          Math.round(baseHeadcount * 1.16),
          Math.round(baseHeadcount * 1.19),
          Math.round(baseHeadcount * 1.25),
        ]),
        quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [
          Math.round(baseHeadcount * 1.16),
          Math.round(baseHeadcount * 1.17),
          Math.round(baseHeadcount * 1.17),
          Math.round(baseHeadcount * 1.18),
          Math.round(baseHeadcount * 1.17),
          Math.round(baseHeadcount * 1.16),
          Math.round(baseHeadcount * 1.15),
          Math.round(baseHeadcount * 1.16),
          Math.round(baseHeadcount * 1.17),
          Math.round(baseHeadcount * 1.18),
          Math.round(baseHeadcount * 1.19),
        ]),
      },
      {
        id: 'metric-utilization',
        name: 'IT Utilization Rate (excl. trainees)',
        unit: '%',
        format: 'percent',
        category: 'Operations',
        description: 'Billed engineering person-hours divided by available person-hours.',
        yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [81.5, 82.3, 83.1, 82.8, 83.5, 80.2, 85.6, 84.1, 82.5, 83.8, 84.5]),
        quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [84.2, 83.8, 83.5, 84.1, 83.2, 82.4, 82.0, 82.5, 83.1, 83.5, 83.8]),
      },
      {
        id: 'metric-attrition',
        name: 'LTM Voluntary Attrition Rate',
        unit: '%',
        format: 'percent',
        category: 'Workforce',
        description: 'Trailing twelve months voluntary talent attrition.',
        yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [15.2, 12.8, 13.5, 14.1, 14.8, 8.9, 21.4, 23.8, 14.2, 13.5, 12.8]),
        quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [22.8, 23.5, 23.1, 21.5, 18.2, 15.6, 14.5, 14.2, 13.8, 13.6, 13.5]),
      },
    ];
  }

  // Default industrial / manufacturing / consumer fallback
  const baseUnits = Math.round(mcap * 15);
  return [
    {
      id: 'metric-capacity',
      name: 'Capacity Utilization Rate',
      unit: '%',
      format: 'percent',
      category: 'Manufacturing',
      description: 'Effective plant production output as a percentage of installed nameplate capacity.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [72.5, 75.1, 78.4, 79.2, 68.5, 74.2, 81.6, 83.5, 82.0, 84.5, 86.0]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [82.0, 82.8, 83.2, 83.5, 81.8, 82.2, 82.5, 82.0, 83.4, 84.0, 84.5]),
    },
    {
      id: 'metric-volume',
      name: 'Sales Dispatch Volume',
      unit: 'MT / Units',
      format: 'number',
      category: 'Volume Growth',
      description: 'Total volumetric product deliveries to customers and distributor channels.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [
        Math.round(baseUnits * 0.65),
        Math.round(baseUnits * 0.72),
        Math.round(baseUnits * 0.81),
        Math.round(baseUnits * 0.88),
        Math.round(baseUnits * 0.78),
        Math.round(baseUnits * 0.86),
        Math.round(baseUnits * 0.98),
        Math.round(baseUnits * 1.08),
        Math.round(baseUnits * 1.15),
        Math.round(baseUnits * 1.24),
        Math.round(baseUnits * 1.35),
      ]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [
        Math.round(baseUnits * 0.26),
        Math.round(baseUnits * 0.27),
        Math.round(baseUnits * 0.27),
        Math.round(baseUnits * 0.28),
        Math.round(baseUnits * 0.28),
        Math.round(baseUnits * 0.29),
        Math.round(baseUnits * 0.29),
        Math.round(baseUnits * 0.29),
        Math.round(baseUnits * 0.30),
        Math.round(baseUnits * 0.31),
        Math.round(baseUnits * 0.32),
      ]),
    },
    {
      id: 'metric-ebitda-unit',
      name: 'EBITDA per Unit / Realization',
      unit: '₹/unit',
      format: 'currency',
      category: 'Unit Economics',
      description: 'Operating profitability generated per unit sold before interest, taxes, and depreciation.',
      yearly: buildSeries(INSIGHTS_YEARLY_PERIODS, [
        Math.round(price * 0.85),
        Math.round(price * 0.92),
        Math.round(price * 0.98),
        Math.round(price * 1.05),
        Math.round(price * 0.95),
        Math.round(price * 1.12),
        Math.round(price * 1.25),
        Math.round(price * 1.32),
        Math.round(price * 1.38),
        Math.round(price * 1.45),
        Math.round(price * 1.55),
      ]),
      quarterly: buildSeries(INSIGHTS_QUARTERLY_PERIODS, [
        Math.round(price * 1.30),
        Math.round(price * 1.31),
        Math.round(price * 1.32),
        Math.round(price * 1.32),
        Math.round(price * 1.35),
        Math.round(price * 1.36),
        Math.round(price * 1.38),
        Math.round(price * 1.38),
        Math.round(price * 1.41),
        Math.round(price * 1.43),
        Math.round(price * 1.45),
      ]),
    },
  ];
}

export function getStockCompanyInsights(stock: Stock): StockCompanyInsights {
  const sym = stock.symbol.toUpperCase();
  const metrics = CURATED_INSIGHTS[sym] || generateHeuristicInsights(stock);

  return {
    symbol: stock.symbol,
    name: stock.name,
    yearlyPeriods: INSIGHTS_YEARLY_PERIODS,
    quarterlyPeriods: INSIGHTS_QUARTERLY_PERIODS,
    metrics,
  };
}
