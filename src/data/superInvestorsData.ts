import { STOCKS_DATA } from './stocksData';

export type DeltaType = 'new' | 'increased' | 'decreased' | 'unchanged' | 'sold';

export interface HoldingDelta {
  change: DeltaType;
  delta_pct?: number;
  previous_quarter_holding?: number;
}

export interface InvestorHolding {
  symbol: string;
  companyName: string;
  sector: string;
  holding_pct: number;
  holding_value_cr?: number;
  quarter: string;
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
    "id": "radhakishan-damani",
    "name": "Radhakishan Damani",
    "alias": "Derive Investments / DMart Founder",
    "type": "Individual HNI",
    "description": "Founder of Avenue Supermarts (DMart). Portfolio focuses on retail, consumer goods, and financial services.",
    "avatar_initials": "RD",
    "top_sectors": [
      "Consumer Defensive",
      "Consumer Cyclical",
      "Financial Services"
    ],
    "holdings": [
      {
        "symbol": "DMART",
        "companyName": "Avenue Supermarts Ltd.",
        "sector": "Consumer Defensive",
        "holding_pct": 67.24,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 67.24
        }
      },
      {
        "symbol": "TRENT",
        "companyName": "Trent Ltd.",
        "sector": "Consumer Cyclical",
        "holding_pct": 1.52,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 1.52
        }
      },
      {
        "symbol": "SUNDARMFIN",
        "companyName": "Sundaram Finance Ltd.",
        "sector": "Financial Services",
        "holding_pct": 2.38,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "increased",
          "delta_pct": 0.15,
          "previous_quarter_holding": 2.23
        }
      },
      {
        "symbol": "VSTIND",
        "companyName": "VST Industries Ltd.",
        "sector": "Consumer Defensive",
        "holding_pct": 3.47,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.85,
          "previous_quarter_holding": 4.32
        }
      }
    ]
  },
  {
    "id": "rekha-jhunjhunwala",
    "name": "Rekha Jhunjhunwala",
    "alias": "RARE Enterprises",
    "type": "Individual HNI",
    "description": "Partner at RARE Enterprises. Portfolio focuses on consumer brands, financial institutions, and hospitality.",
    "avatar_initials": "RJ",
    "top_sectors": [
      "Consumer Cyclical",
      "Financial Services",
      "Automobile"
    ],
    "holdings": [
      {
        "symbol": "TITAN",
        "companyName": "Titan Company Ltd.",
        "sector": "Consumer Cyclical",
        "holding_pct": 5.05,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.15,
          "previous_quarter_holding": 5.2
        }
      },
      {
        "symbol": "TATAMOTORS",
        "companyName": "Tata Motors Ltd.",
        "sector": "Automobile",
        "holding_pct": 1.3,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 1.3
        }
      },
      {
        "symbol": "CRISIL",
        "companyName": "CRISIL Ltd.",
        "sector": "Financial Services",
        "holding_pct": 5.42,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 5.42
        }
      },
      {
        "symbol": "CANBK",
        "companyName": "Canara Bank",
        "sector": "Financial Services",
        "holding_pct": 1.45,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.25,
          "previous_quarter_holding": 1.7
        }
      },
      {
        "symbol": "FEDERALBNK",
        "companyName": "The Federal Bank Ltd.",
        "sector": "Financial Services",
        "holding_pct": 3.2,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "increased",
          "delta_pct": 0.4,
          "previous_quarter_holding": 2.8
        }
      },
      {
        "symbol": "FORTIS",
        "companyName": "Fortis Healthcare Ltd.",
        "sector": "Healthcare",
        "holding_pct": 4.12,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 4.12
        }
      }
    ]
  },
  {
    "id": "ashish-kacholia",
    "name": "Ashish Kacholia",
    "alias": "Lucky Investment Managers",
    "type": "Individual HNI",
    "description": "Founder of Lucky Investment Managers. Focuses on small and mid-cap engineering, chemicals, and consumer companies.",
    "avatar_initials": "AK",
    "top_sectors": [
      "Industrials",
      "Basic Materials",
      "Technology"
    ],
    "holdings": [
      {
        "symbol": "SAFARI",
        "companyName": "Safari Industries (India) Ltd.",
        "sector": "Consumer Cyclical",
        "holding_pct": 2.05,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.25,
          "previous_quarter_holding": 2.3
        }
      },
      {
        "symbol": "BSOFT",
        "companyName": "Birlasoft Ltd.",
        "sector": "Technology",
        "holding_pct": 1.85,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.35,
          "previous_quarter_holding": 2.2
        }
      },
      {
        "symbol": "SHAILY",
        "companyName": "Shaily Engineering Plastics Ltd.",
        "sector": "Industrials",
        "holding_pct": 5.4,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "increased",
          "delta_pct": 0.6,
          "previous_quarter_holding": 4.8
        }
      },
      {
        "symbol": "FCL",
        "companyName": "Fineotex Chemical Ltd.",
        "sector": "Basic Materials",
        "holding_pct": 2.75,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 2.75
        }
      }
    ]
  },
  {
    "id": "vijay-kedia",
    "name": "Vijay Kedia",
    "alias": "Kedia Securities",
    "type": "Individual HNI",
    "description": "Managing Director of Kedia Securities. Focuses on emerging small and mid-cap industrial and technology companies.",
    "avatar_initials": "VK",
    "top_sectors": [
      "Technology",
      "Automobile",
      "Capital Goods"
    ],
    "holdings": [
      {
        "symbol": "TEJASNET",
        "companyName": "Tejas Networks Ltd.",
        "sector": "Technology",
        "holding_pct": 1.75,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.45,
          "previous_quarter_holding": 2.2
        }
      },
      {
        "symbol": "ATULAUTO",
        "companyName": "Atul Auto Ltd.",
        "sector": "Automobile",
        "holding_pct": 13.7,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 13.7
        }
      },
      {
        "symbol": "ELECON",
        "companyName": "Elecon Engineering Company Ltd.",
        "sector": "Capital Goods",
        "holding_pct": 1.35,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.25,
          "previous_quarter_holding": 1.6
        }
      },
      {
        "symbol": "VAIBHAVGBL",
        "companyName": "Vaibhav Global Ltd.",
        "sector": "Consumer Cyclical",
        "holding_pct": 1.95,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 1.95
        }
      }
    ]
  },
  {
    "id": "mukul-agrawal",
    "name": "Mukul Agrawal",
    "alias": "Param Capital",
    "type": "Individual HNI",
    "description": "Private investor. Portfolio focuses on precision engineering, defense, chemicals, and manufacturing companies.",
    "avatar_initials": "MA",
    "top_sectors": [
      "Capital Goods",
      "Consumer Cyclical",
      "Healthcare"
    ],
    "holdings": [
      {
        "symbol": "RAYMOND",
        "companyName": "Raymond Ltd.",
        "sector": "Consumer Cyclical",
        "holding_pct": 1.45,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "new",
          "delta_pct": 1.45,
          "previous_quarter_holding": 0
        }
      },
      {
        "symbol": "NEULANDLAB",
        "companyName": "Neuland Laboratories Ltd.",
        "sector": "Healthcare",
        "holding_pct": 2.85,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.35,
          "previous_quarter_holding": 3.2
        }
      },
      {
        "symbol": "ZENTEC",
        "companyName": "Zen Technologies Ltd.",
        "sector": "Capital Goods",
        "holding_pct": 1.25,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.2,
          "previous_quarter_holding": 1.45
        }
      }
    ]
  },
  {
    "id": "sunil-singhania",
    "name": "Sunil Singhania",
    "alias": "Abakkus Asset Manager",
    "type": "Institutional / PMS",
    "description": "Founder of Abakkus Asset Manager. Focuses on value and mid-cap Indian equities.",
    "avatar_initials": "SS",
    "top_sectors": [
      "Industrials",
      "Basic Materials",
      "Financial Services"
    ],
    "holdings": [
      {
        "symbol": "CMSINFO",
        "companyName": "CMS Info Systems Ltd.",
        "sector": "Industrials",
        "holding_pct": 2.15,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "increased",
          "delta_pct": 0.35,
          "previous_quarter_holding": 1.8
        }
      },
      {
        "symbol": "SARDAEN",
        "companyName": "Sarda Energy & Minerals Ltd.",
        "sector": "Basic Materials",
        "holding_pct": 2.45,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 2.45
        }
      },
      {
        "symbol": "JSL",
        "companyName": "Jindal Stainless Ltd.",
        "sector": "Basic Materials",
        "holding_pct": 1.15,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 1.15
        }
      }
    ]
  },
  {
    "id": "dolly-khanna",
    "name": "Dolly Khanna",
    "alias": "Rajiv Khanna Portfolio",
    "type": "Individual HNI",
    "description": "Private investor. Portfolio focuses on small and mid-cap manufacturing, chemicals, and consumer companies.",
    "avatar_initials": "DK",
    "top_sectors": [
      "Basic Materials",
      "Industrials",
      "Consumer Cyclical"
    ],
    "holdings": [
      {
        "symbol": "DEEPAKFERT",
        "companyName": "Deepak Fertilisers & Petrochemicals",
        "sector": "Basic Materials",
        "holding_pct": 1.35,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.25,
          "previous_quarter_holding": 1.6
        }
      },
      {
        "symbol": "NITINSPIN",
        "companyName": "Nitin Spinners Ltd.",
        "sector": "Consumer Cyclical",
        "holding_pct": 1.65,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 1.65
        }
      },
      {
        "symbol": "KCP",
        "companyName": "KCP Ltd.",
        "sector": "Basic Materials",
        "holding_pct": 2.1,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 2.1
        }
      }
    ]
  },
  {
    "id": "porinju-veliyath",
    "name": "Porinju Veliyath",
    "alias": "Equity Intelligence India",
    "type": "Institutional / PMS",
    "description": "Founder of Equity Intelligence India. Focuses on small-cap and turnaround investment opportunities.",
    "avatar_initials": "PV",
    "top_sectors": [
      "Healthcare",
      "Real Estate",
      "Consumer Cyclical"
    ],
    "holdings": [
      {
        "symbol": "MAXHEALTH",
        "companyName": "Max Healthcare Institute Ltd.",
        "sector": "Healthcare",
        "holding_pct": 1.05,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 1.05
        }
      },
      {
        "symbol": "ORIENTBELL",
        "companyName": "Orient Bell Ltd.",
        "sector": "Industrials",
        "holding_pct": 4.85,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "increased",
          "delta_pct": 0.4,
          "previous_quarter_holding": 4.45
        }
      }
    ]
  },
  {
    "id": "nemish-shah",
    "name": "Nemish Shah",
    "alias": "ENAM Holdings",
    "type": "Individual HNI",
    "description": "Director at ENAM Holdings. Long-term investor in manufacturing, automotive engineering, and capital goods.",
    "avatar_initials": "NS",
    "top_sectors": [
      "Industrials",
      "Automobile",
      "Capital Goods"
    ],
    "holdings": [
      {
        "symbol": "LAXMIMACH",
        "companyName": "Lakshmi Machine Works Ltd.",
        "sector": "Capital Goods",
        "holding_pct": 6.85,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 6.85
        }
      },
      {
        "symbol": "ASAHIINDIA",
        "companyName": "Asahi India Glass Ltd.",
        "sector": "Automobile",
        "holding_pct": 2.45,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 2.45
        }
      },
      {
        "symbol": "ELGIEQUIP",
        "companyName": "Elgi Equipments Ltd.",
        "sector": "Capital Goods",
        "holding_pct": 1.85,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.15,
          "previous_quarter_holding": 2.0
        }
      }
    ]
  },
  {
    "id": "ramesh-damani",
    "name": "Ramesh Damani",
    "alias": "Member, Bombay Stock Exchange",
    "type": "Individual HNI",
    "description": "Member of the Bombay Stock Exchange. Focuses on logistics, defense, and technology businesses.",
    "avatar_initials": "RD",
    "top_sectors": [
      "Industrials",
      "Consumer Cyclical",
      "Media"
    ],
    "holdings": [
      {
        "symbol": "GRSE",
        "companyName": "Garden Reach Shipbuilders & Engineers",
        "sector": "Industrials",
        "holding_pct": 1.05,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.2,
          "previous_quarter_holding": 1.25
        }
      },
      {
        "symbol": "TVTODAY",
        "companyName": "TV Today Network Ltd.",
        "sector": "Media",
        "holding_pct": 1.6,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 1.6
        }
      },
      {
        "symbol": "PANAMAPET",
        "companyName": "Panama Petrochem Ltd.",
        "sector": "Basic Materials",
        "holding_pct": 1.25,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 1.25
        }
      }
    ]
  },
  {
    "id": "prashant-jain",
    "name": "Prashant Jain",
    "alias": "3P Investment Managers",
    "type": "Institutional / PMS",
    "description": "Founder of 3P Investment Managers. Focuses on capital goods, public sector banks, and infrastructure.",
    "avatar_initials": "PJ",
    "top_sectors": [
      "Capital Goods",
      "Financial Services",
      "Energy"
    ],
    "holdings": [
      {
        "symbol": "SIEMENS",
        "companyName": "Siemens Ltd.",
        "sector": "Capital Goods",
        "holding_pct": 1.15,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "increased",
          "delta_pct": 0.25,
          "previous_quarter_holding": 0.9
        }
      },
      {
        "symbol": "LT",
        "companyName": "Larsen & Toubro Ltd.",
        "sector": "Capital Goods",
        "holding_pct": 1.05,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 1.05
        }
      },
      {
        "symbol": "BEML",
        "companyName": "BEML Ltd.",
        "sector": "Capital Goods",
        "holding_pct": 1.4,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "new",
          "delta_pct": 1.4,
          "previous_quarter_holding": 0
        }
      }
    ]
  },
  {
    "id": "kenneth-andrade",
    "name": "Kenneth Andrade",
    "alias": "Old Bridge Capital",
    "type": "Institutional / PMS",
    "description": "Founder of Old Bridge Capital. Focuses on capital-intensive manufacturing, agriculture, and commodity cycles.",
    "avatar_initials": "KA",
    "top_sectors": [
      "Basic Materials",
      "Agriculture",
      "Chemicals"
    ],
    "holdings": [
      {
        "symbol": "COROMANDEL",
        "companyName": "Coromandel International Ltd.",
        "sector": "Chemicals",
        "holding_pct": 1.2,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "increased",
          "delta_pct": 0.2,
          "previous_quarter_holding": 1.0
        }
      },
      {
        "symbol": "EIDPARRY",
        "companyName": "E.I.D. - Parry (India) Ltd.",
        "sector": "Agriculture",
        "holding_pct": 1.85,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 1.85
        }
      },
      {
        "symbol": "NOCIL",
        "companyName": "NOCIL Ltd.",
        "sector": "Chemicals",
        "holding_pct": 1.45,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.15,
          "previous_quarter_holding": 1.6
        }
      }
    ]
  },
  {
    "id": "madhusudan-kela",
    "name": "Madhusudan Kela",
    "alias": "MK Ventures",
    "type": "Family Office",
    "description": "Founder of MK Ventures. Focuses on financial services, infrastructure, and emerging industrial businesses.",
    "avatar_initials": "MK",
    "top_sectors": [
      "Financial Services",
      "Industrials",
      "Consumer Cyclical"
    ],
    "holdings": [
      {
        "symbol": "CHOICEIN",
        "companyName": "Choice International Ltd.",
        "sector": "Financial Services",
        "holding_pct": 8.45,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 8.45
        }
      },
      {
        "symbol": "SANGAMIND",
        "companyName": "Sangam (India) Ltd.",
        "sector": "Consumer Cyclical",
        "holding_pct": 3.85,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "increased",
          "delta_pct": 0.5,
          "previous_quarter_holding": 3.35
        }
      }
    ]
  },
  {
    "id": "ashish-dhawan",
    "name": "Ashish Dhawan",
    "alias": "ChrysCapital Co-founder",
    "type": "Individual HNI",
    "description": "Private equity investor and philanthropist. Portfolio focuses on private banking, healthcare, and specialty consumer brands.",
    "avatar_initials": "AD",
    "top_sectors": [
      "Financial Services",
      "Healthcare",
      "Consumer Cyclical"
    ],
    "holdings": [
      {
        "symbol": "IDFC",
        "companyName": "IDFC Ltd.",
        "sector": "Financial Services",
        "holding_pct": 2.45,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 2.45
        }
      },
      {
        "symbol": "GLENMARK",
        "companyName": "Glenmark Pharmaceuticals Ltd.",
        "sector": "Healthcare",
        "holding_pct": 1.75,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.3,
          "previous_quarter_holding": 2.05
        }
      },
      {
        "symbol": "RBLBANK",
        "companyName": "RBL Bank Ltd.",
        "sector": "Financial Services",
        "holding_pct": 2.15,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 2.15
        }
      }
    ]
  },
  {
    "id": "anil-kumar-goel",
    "name": "Anil Kumar Goel",
    "alias": "Micro-cap Value Investor",
    "type": "Individual HNI",
    "description": "Private investor. Portfolio focuses on sugar processing mills, textiles, and agricultural commodities.",
    "avatar_initials": "AG",
    "top_sectors": [
      "Agriculture",
      "Consumer Defensive",
      "Consumer Cyclical"
    ],
    "holdings": [
      {
        "symbol": "DHAMPURSUG",
        "companyName": "Dhampur Sugar Mills Ltd.",
        "sector": "Consumer Defensive",
        "holding_pct": 10.25,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 10.25
        }
      },
      {
        "symbol": "DWARKESH",
        "companyName": "Dwarikesh Sugar Industries Ltd.",
        "sector": "Consumer Defensive",
        "holding_pct": 5.15,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "increased",
          "delta_pct": 0.4,
          "previous_quarter_holding": 4.75
        }
      },
      {
        "symbol": "UTTAMSUGAR",
        "companyName": "Uttam Sugar Mills Ltd.",
        "sector": "Consumer Defensive",
        "holding_pct": 4.6,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 4.6
        }
      }
    ]
  },
  {
    "id": "shivanand-mankekar",
    "name": "Prof. Shivanand Mankekar",
    "alias": "Mankekar Family Office",
    "type": "Family Office",
    "description": "Academic and private investor. Portfolio focuses on automotive engineering, aerospace, and consumer growth companies.",
    "avatar_initials": "SM",
    "top_sectors": [
      "Automobile",
      "Capital Goods",
      "Consumer Defensive"
    ],
    "holdings": [
      {
        "symbol": "TALBROAUTO",
        "companyName": "Talbros Automotive Components",
        "sector": "Automobile",
        "holding_pct": 2.85,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 2.85
        }
      },
      {
        "symbol": "MTARTECH",
        "companyName": "MTAR Technologies Ltd.",
        "sector": "Capital Goods",
        "holding_pct": 1.35,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.2,
          "previous_quarter_holding": 1.55
        }
      }
    ]
  },
  {
    "id": "sumeet-nagar",
    "name": "Sumeet Nagar",
    "alias": "Malabar India Fund",
    "type": "Institutional / PMS",
    "description": "Managing Director of Malabar Investments. Focuses on small and mid-cap consumer, healthcare, and digital businesses.",
    "avatar_initials": "SN",
    "top_sectors": [
      "Consumer Cyclical",
      "Technology",
      "Healthcare"
    ],
    "holdings": [
      {
        "symbol": "SAFARI",
        "companyName": "Safari Industries (India) Ltd.",
        "sector": "Consumer Cyclical",
        "holding_pct": 4.15,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.3,
          "previous_quarter_holding": 4.45
        }
      },
      {
        "symbol": "AFFLE",
        "companyName": "Affle (India) Ltd.",
        "sector": "Technology",
        "holding_pct": 2.6,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 2.6
        }
      },
      {
        "symbol": "VAIBHAVGBL",
        "companyName": "Vaibhav Global Ltd.",
        "sector": "Consumer Cyclical",
        "holding_pct": 2.1,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "increased",
          "delta_pct": 0.35,
          "previous_quarter_holding": 1.75
        }
      }
    ]
  },
  {
    "id": "bhavook-tripathi",
    "name": "Bhavook Tripathi",
    "alias": "High Conviction Value Investor",
    "type": "Individual HNI",
    "description": "Private value investor. Focuses on concentrated, high-conviction positions in technology and healthcare.",
    "avatar_initials": "BT",
    "top_sectors": [
      "Technology",
      "Healthcare"
    ],
    "holdings": [
      {
        "symbol": "RSYSTEMS",
        "companyName": "R Systems International Ltd.",
        "sector": "Technology",
        "holding_pct": 28.5,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 28.5
        }
      },
      {
        "symbol": "SOLARA",
        "companyName": "Solara Active Pharma Sciences",
        "sector": "Healthcare",
        "holding_pct": 5.4,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "increased",
          "delta_pct": 0.8,
          "previous_quarter_holding": 4.6
        }
      }
    ]
  },
  {
    "id": "akash-bhanshali",
    "name": "Akash Bhanshali",
    "alias": "Enam Holdings Principal",
    "type": "Family Office",
    "description": "Principal at Enam Holdings. Focuses on mid-cap industrial engineering, consumer electronics, and financial institutions.",
    "avatar_initials": "AB",
    "top_sectors": [
      "Industrials",
      "Consumer Cyclical",
      "Financial Services"
    ],
    "holdings": [
      {
        "symbol": "WELCORP",
        "companyName": "Welspun Corp Ltd.",
        "sector": "Industrials",
        "holding_pct": 1.95,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "decreased",
          "delta_pct": -0.25,
          "previous_quarter_holding": 2.2
        }
      },
      {
        "symbol": "AMBER",
        "companyName": "Amber Enterprises India Ltd.",
        "sector": "Consumer Cyclical",
        "holding_pct": 2.45,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 2.45
        }
      },
      {
        "symbol": "IDFC",
        "companyName": "IDFC Ltd.",
        "sector": "Financial Services",
        "holding_pct": 1.8,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 1.8
        }
      }
    ]
  },
  {
    "id": "govindlal-gilada",
    "name": "Govindlal Gilada",
    "alias": "Textile & Manufacturing Investor",
    "type": "Individual HNI",
    "description": "Private investor. Focuses on export-oriented textile and apparel manufacturing companies.",
    "avatar_initials": "GG",
    "top_sectors": [
      "Consumer Cyclical",
      "Industrials"
    ],
    "holdings": [
      {
        "symbol": "KPRMILL",
        "companyName": "K.P.R. Mill Ltd.",
        "sector": "Consumer Cyclical",
        "holding_pct": 1.25,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "unchanged",
          "delta_pct": 0,
          "previous_quarter_holding": 1.25
        }
      },
      {
        "symbol": "HIMATSEIDE",
        "companyName": "Himatsingka Seide Ltd.",
        "sector": "Consumer Cyclical",
        "holding_pct": 3.4,
        "quarter": "Q3 FY25",
        "delta": {
          "change": "increased",
          "delta_pct": 0.45,
          "previous_quarter_holding": 2.95
        }
      }
    ]
  }
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
