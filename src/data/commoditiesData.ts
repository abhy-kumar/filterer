export type CycleStage = 'Bottoming Out' | 'Expansion / Bull' | 'Peaking' | 'Cooling / Bear';

export interface CommodityImpactedStock {
  symbol: string;
  name: string;
  role: 'producer' | 'consumer';
  impactType: 'Positive' | 'Negative';
  impactDescription: string;
}

export interface CommodityPricePoint {
  date: string;
  price: number;
}

export interface Commodity {
  id: string;
  name: string;
  category: 'Energy' | 'Chemicals' | 'Metals' | 'Agriculture' | 'Polymers';
  unit: string;
  currentPrice: number;
  change1mPct: number;
  change6mPct: number;
  change1yPct: number;
  cycleStage: CycleStage;
  description: string;
  macroContext: string;
  history: CommodityPricePoint[];
  impactedStocks: CommodityImpactedStock[];
}

export const COMMODITIES_DATA: Commodity[] = [
  {
    "id": "brent-crude",
    "name": "Brent Crude Oil",
    "category": "Energy",
    "unit": "$/barrel",
    "currentPrice": 78.5,
    "change1mPct": -3.2,
    "change6mPct": -6.8,
    "change1yPct": -11.4,
    "cycleStage": "Cooling / Bear",
    "description": "Global benchmark for sweet light crude oil extracted from the North Sea. Dictates transport fuels, petchem feedstocks, and solvent costs.",
    "macroContext": "US shale production reaching record highs coupled with moderate Chinese manufacturing demand has kept crude capped below $85, providing significant tailwinds for Indian consumer and paint manufacturers.",
    "history": [
      {
        "date": "Oct 23",
        "price": 88.5
      },
      {
        "date": "Nov 23",
        "price": 82.3
      },
      {
        "date": "Dec 23",
        "price": 77.4
      },
      {
        "date": "Jan 24",
        "price": 79.1
      },
      {
        "date": "Feb 24",
        "price": 81.6
      },
      {
        "date": "Mar 24",
        "price": 85.4
      },
      {
        "date": "Apr 24",
        "price": 89.0
      },
      {
        "date": "May 24",
        "price": 83.2
      },
      {
        "date": "Jun 24",
        "price": 82.5
      },
      {
        "date": "Jul 24",
        "price": 85.1
      },
      {
        "date": "Aug 24",
        "price": 80.2
      },
      {
        "date": "Sep 24",
        "price": 74.5
      },
      {
        "date": "Oct 24",
        "price": 75.8
      },
      {
        "date": "Nov 24",
        "price": 73.2
      },
      {
        "date": "Dec 24",
        "price": 74.0
      },
      {
        "date": "Jan 25",
        "price": 77.2
      },
      {
        "date": "Feb 25",
        "price": 78.5
      }
    ],
    "impactedStocks": [
      {
        "symbol": "ONGC",
        "name": "Oil and Natural Gas Corporation Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Direct realization on domestic crude output capped by windfall tax regime above $75/bbl."
      },
      {
        "symbol": "RELIANCE",
        "name": "Reliance Industries Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Gross Refining Margins (GRMs) expand when crude differentials and diesel cracks widen."
      },
      {
        "symbol": "ASIANPAINT",
        "name": "Asian Paints Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Crude derivatives (monomers, solvents, titanium dioxide feedstocks) form ~50% of raw material costs; falling crude expands gross margins."
      },
      {
        "symbol": "INDIGO",
        "name": "InterGlobe Aviation Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Aviation Turbine Fuel (ATF) accounts for ~40% of operating expenses; falling crude dramatically reduces seat kilometer costs."
      },
      {
        "symbol": "MRF",
        "name": "MRF Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Synthetic rubber and carbon black are oil derivatives; lower crude eases input costs."
      }
    ]
  },
  {
    "id": "natural-gas",
    "name": "Natural Gas (Henry Hub)",
    "category": "Energy",
    "unit": "$/mmBtu",
    "currentPrice": 2.85,
    "change1mPct": 7.5,
    "change6mPct": 26.7,
    "change1yPct": 18.8,
    "cycleStage": "Expansion / Bull",
    "description": "Clean burning fossil fuel benchmark. Critical feedstock for fertilizer synthesis (ammonia/urea) and fuel for city gas distribution (CGD).",
    "macroContext": "Freezing winter temperatures across the Northern Hemisphere and growing LNG export terminal utilization in the US Gulf Coast have tightened prompt month gas supplies.",
    "history": [
      {
        "date": "Oct 23",
        "price": 3.15
      },
      {
        "date": "Nov 23",
        "price": 2.95
      },
      {
        "date": "Dec 23",
        "price": 2.55
      },
      {
        "date": "Jan 24",
        "price": 2.7
      },
      {
        "date": "Feb 24",
        "price": 1.72
      },
      {
        "date": "Mar 24",
        "price": 1.65
      },
      {
        "date": "Apr 24",
        "price": 1.78
      },
      {
        "date": "May 24",
        "price": 2.12
      },
      {
        "date": "Jun 24",
        "price": 2.65
      },
      {
        "date": "Jul 24",
        "price": 2.15
      },
      {
        "date": "Aug 24",
        "price": 2.05
      },
      {
        "date": "Sep 24",
        "price": 2.28
      },
      {
        "date": "Oct 24",
        "price": 2.35
      },
      {
        "date": "Nov 24",
        "price": 2.75
      },
      {
        "date": "Dec 24",
        "price": 3.2
      },
      {
        "date": "Jan 25",
        "price": 3.1
      },
      {
        "date": "Feb 25",
        "price": 2.85
      }
    ],
    "impactedStocks": [
      {
        "symbol": "GAIL",
        "name": "GAIL (India) Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Benefits from natural gas transmission volumes and domestic gas marketing spreads."
      },
      {
        "symbol": "IGL",
        "name": "Indraprastha Gas Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Higher LNG spot prices increase pooled gas feedstock costs for CNG and PNG distribution."
      },
      {
        "symbol": "MGL",
        "name": "Mahanagar Gas Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Feedstock cost pressure compressed EBITDA/scm margins during gas price spikes."
      },
      {
        "symbol": "CHAMBLFERT",
        "name": "Chambal Fertilisers and Chemicals Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Gas is the primary raw material for urea manufacturing; higher gas prices raise subsidy working capital requirements."
      }
    ]
  },
  {
    "id": "thermal-coal",
    "name": "Thermal Coal (Newcastle 6000)",
    "category": "Energy",
    "unit": "$/tonne",
    "currentPrice": 142.0,
    "change1mPct": -1.4,
    "change6mPct": -4.7,
    "change1yPct": -12.3,
    "cycleStage": "Cooling / Bear",
    "description": "Primary fuel for base-load electricity generation across Indian utility thermal power plants and captive cement kilns.",
    "macroContext": "Surging domestic Coal India production above 770 MT and high port inventories have moderated seaborne thermal coal prices, reducing fuel under-recovery risks for domestic gencos.",
    "history": [
      {
        "date": "Oct 23",
        "price": 162.0
      },
      {
        "date": "Nov 23",
        "price": 148.5
      },
      {
        "date": "Dec 23",
        "price": 145.0
      },
      {
        "date": "Jan 24",
        "price": 138.0
      },
      {
        "date": "Feb 24",
        "price": 132.5
      },
      {
        "date": "Mar 24",
        "price": 136.0
      },
      {
        "date": "Apr 24",
        "price": 141.0
      },
      {
        "date": "May 24",
        "price": 146.5
      },
      {
        "date": "Jun 24",
        "price": 142.0
      },
      {
        "date": "Jul 24",
        "price": 139.5
      },
      {
        "date": "Aug 24",
        "price": 144.0
      },
      {
        "date": "Sep 24",
        "price": 147.0
      },
      {
        "date": "Oct 24",
        "price": 148.5
      },
      {
        "date": "Nov 24",
        "price": 145.0
      },
      {
        "date": "Dec 24",
        "price": 143.5
      },
      {
        "date": "Jan 25",
        "price": 144.0
      },
      {
        "date": "Feb 25",
        "price": 142.0
      }
    ],
    "impactedStocks": [
      {
        "symbol": "COALINDIA",
        "name": "Coal India Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Higher global benchmark supports e-auction premiums above Fuel Supply Agreement (FSA) baseline prices."
      },
      {
        "symbol": "NTPC",
        "name": "NTPC Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Pass-through fuel costs under regulated CERC tariff, but higher prices require higher working capital."
      },
      {
        "symbol": "TATAPOWER",
        "name": "Tata Power Co. Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Mundra UMPP import coal dependence; lower seaborne coal narrows under-recovery losses."
      }
    ]
  },
  {
    "id": "coking-coal",
    "name": "Premium Hard Coking Coal",
    "category": "Energy",
    "unit": "$/tonne",
    "currentPrice": 215.0,
    "change1mPct": -5.3,
    "change6mPct": -16.7,
    "change1yPct": -31.7,
    "cycleStage": "Bottoming Out",
    "description": "Metallurgical coal essential for blast furnace steelmaking. India imports over 85% of its coking coal requirements, primarily from Australia.",
    "macroContext": "Softer Chinese blast furnace run-rates combined with steady Queensland supply shipments have pushed met coal below $220/t, delivering major cost relief to Indian primary steelmakers.",
    "history": [
      {
        "date": "Oct 23",
        "price": 315.0
      },
      {
        "date": "Nov 23",
        "price": 320.0
      },
      {
        "date": "Dec 23",
        "price": 312.0
      },
      {
        "date": "Jan 24",
        "price": 310.0
      },
      {
        "date": "Feb 24",
        "price": 305.0
      },
      {
        "date": "Mar 24",
        "price": 275.0
      },
      {
        "date": "Apr 24",
        "price": 255.0
      },
      {
        "date": "May 24",
        "price": 260.0
      },
      {
        "date": "Jun 24",
        "price": 258.0
      },
      {
        "date": "Jul 24",
        "price": 250.0
      },
      {
        "date": "Aug 24",
        "price": 235.0
      },
      {
        "date": "Sep 24",
        "price": 220.0
      },
      {
        "date": "Oct 24",
        "price": 225.0
      },
      {
        "date": "Nov 24",
        "price": 222.0
      },
      {
        "date": "Dec 24",
        "price": 218.0
      },
      {
        "date": "Jan 25",
        "price": 227.0
      },
      {
        "date": "Feb 25",
        "price": 215.0
      }
    ],
    "impactedStocks": [
      {
        "symbol": "TATASTEEL",
        "name": "Tata Steel Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Consumes ~0.8 tonnes of coking coal per tonne of crude steel; every $20/t drop in coking coal expands blast furnace spreads by \u20b91,400/t."
      },
      {
        "symbol": "JSWSTEEL",
        "name": "JSW Steel Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Highly dependent on imported coking coal; falling met coal prices directly expand blended EBITDA margins."
      },
      {
        "symbol": "SAIL",
        "name": "Steel Authority of India Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "High specific coke consumption makes SAIL disproportionately sensitive to coking coal price contractions."
      }
    ]
  },
  {
    "id": "hr-steel",
    "name": "Hot Rolled (HRC) Steel",
    "category": "Metals",
    "unit": "\u20b9/tonne",
    "currentPrice": 51200,
    "change1mPct": 1.8,
    "change6mPct": -2.5,
    "change1yPct": -7.7,
    "cycleStage": "Bottoming Out",
    "description": "Base industrial flat steel product used in automobiles, capital goods, infrastructure, construction, and pipe manufacturing.",
    "macroContext": "Subdued Chinese real estate demand led to aggressive regional Chinese exports at sub-$500/t CFR. Indian mills are pushing for safeguard duties or minimum import prices to defend domestic realizations.",
    "history": [
      {
        "date": "Oct 23",
        "price": 55500
      },
      {
        "date": "Nov 23",
        "price": 54800
      },
      {
        "date": "Dec 23",
        "price": 54200
      },
      {
        "date": "Jan 24",
        "price": 53900
      },
      {
        "date": "Feb 24",
        "price": 53500
      },
      {
        "date": "Mar 24",
        "price": 52800
      },
      {
        "date": "Apr 24",
        "price": 53200
      },
      {
        "date": "May 24",
        "price": 53600
      },
      {
        "date": "Jun 24",
        "price": 53000
      },
      {
        "date": "Jul 24",
        "price": 52400
      },
      {
        "date": "Aug 24",
        "price": 51500
      },
      {
        "date": "Sep 24",
        "price": 49800
      },
      {
        "date": "Oct 24",
        "price": 50500
      },
      {
        "date": "Nov 24",
        "price": 50200
      },
      {
        "date": "Dec 24",
        "price": 50100
      },
      {
        "date": "Jan 25",
        "price": 50300
      },
      {
        "date": "Feb 25",
        "price": 51200
      }
    ],
    "impactedStocks": [
      {
        "symbol": "TATASTEEL",
        "name": "Tata Steel Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Direct price realization on domestic deliveries; each \u20b91,000/t change alters standalone operating EBITDA by ~\u20b91,900 Cr annually."
      },
      {
        "symbol": "JSWSTEEL",
        "name": "JSW Steel Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "India's largest private flat steel maker; profit closely mirrors HRC-iron ore-coking coal spread."
      },
      {
        "symbol": "SAIL",
        "name": "Steel Authority of India Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Operating leverage makes earnings highly levered to domestic flat steel realization cycles."
      }
    ]
  },
  {
    "id": "copper-lme",
    "name": "LME Copper",
    "category": "Metals",
    "unit": "$/tonne",
    "currentPrice": 9180,
    "change1mPct": 3.4,
    "change6mPct": -2.1,
    "change1yPct": 9.2,
    "cycleStage": "Expansion / Bull",
    "description": "Doctor Copper: primary barometer of global electrification, power grids, renewable energy generation, data centers, and EV drivetrains.",
    "macroContext": "Tight global copper concentrate TC/RC fees, supply disruption at major South American mines, and explosive demand from EV wiring harnesses and AI data centers underpin multi-year structural support.",
    "history": [
      {
        "date": "Oct 23",
        "price": 8050
      },
      {
        "date": "Nov 23",
        "price": 8200
      },
      {
        "date": "Dec 23",
        "price": 8500
      },
      {
        "date": "Jan 24",
        "price": 8450
      },
      {
        "date": "Feb 24",
        "price": 8400
      },
      {
        "date": "Mar 24",
        "price": 8850
      },
      {
        "date": "Apr 24",
        "price": 9750
      },
      {
        "date": "May 24",
        "price": 10850
      },
      {
        "date": "Jun 24",
        "price": 9650
      },
      {
        "date": "Jul 24",
        "price": 9200
      },
      {
        "date": "Aug 24",
        "price": 9100
      },
      {
        "date": "Sep 24",
        "price": 9850
      },
      {
        "date": "Oct 24",
        "price": 9550
      },
      {
        "date": "Nov 24",
        "price": 9050
      },
      {
        "date": "Dec 24",
        "price": 9000
      },
      {
        "date": "Jan 25",
        "price": 8880
      },
      {
        "date": "Feb 25",
        "price": 9180
      }
    ],
    "impactedStocks": [
      {
        "symbol": "HINDALCO",
        "name": "Hindalco Industries Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Custom copper smelting business at Dahej benefits from robust cathode sales and acid by-product credits."
      },
      {
        "symbol": "VEDL",
        "name": "Vedanta Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Copper smelting and refining operations contribute directly to diversified base metals EBITDA."
      },
      {
        "symbol": "HAVELLS",
        "name": "Havells India Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Copper is the primary input cost for industrial cables, domestic wires, and motor windings."
      }
    ]
  },
  {
    "id": "aluminium-lme",
    "name": "LME Aluminium",
    "category": "Metals",
    "unit": "$/tonne",
    "currentPrice": 2580,
    "change1mPct": 2.8,
    "change6mPct": 6.2,
    "change1yPct": 15.7,
    "cycleStage": "Expansion / Bull",
    "description": "Lightweight structural metal critical for EV lightweighting, aerospace, packaging foils, and renewable solar panel framing.",
    "macroContext": "Chinese production hitting the 45 MT statutory cap coupled with high European electricity costs has sustained tight primary smelting balances globally.",
    "history": [
      {
        "date": "Oct 23",
        "price": 2230
      },
      {
        "date": "Nov 23",
        "price": 2210
      },
      {
        "date": "Dec 23",
        "price": 2320
      },
      {
        "date": "Jan 24",
        "price": 2240
      },
      {
        "date": "Feb 24",
        "price": 2220
      },
      {
        "date": "Mar 24",
        "price": 2310
      },
      {
        "date": "Apr 24",
        "price": 2550
      },
      {
        "date": "May 24",
        "price": 2680
      },
      {
        "date": "Jun 24",
        "price": 2510
      },
      {
        "date": "Jul 24",
        "price": 2390
      },
      {
        "date": "Aug 24",
        "price": 2420
      },
      {
        "date": "Sep 24",
        "price": 2610
      },
      {
        "date": "Oct 24",
        "price": 2640
      },
      {
        "date": "Nov 24",
        "price": 2590
      },
      {
        "date": "Dec 24",
        "price": 2540
      },
      {
        "date": "Jan 25",
        "price": 2510
      },
      {
        "date": "Feb 25",
        "price": 2580
      }
    ],
    "impactedStocks": [
      {
        "symbol": "NATIONALUM",
        "name": "National Aluminium Co. Ltd. (NALCO)",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Low-cost bauxite mines at Panchpatmali allow NALCO to capture massive EBITDA expansion when LME aluminium exceeds $2,400/t."
      },
      {
        "symbol": "HINDALCO",
        "name": "Hindalco Industries Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Integrated Indian smelters boast first-quartile cash costs; upstream margins expand with LME."
      },
      {
        "symbol": "VEDL",
        "name": "Vedanta Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Aluminium is Vedanta's largest single EBITDA contributor (Jharsuguda and BALCO smelters)."
      }
    ]
  },
  {
    "id": "zinc-lme",
    "name": "LME Zinc",
    "category": "Metals",
    "unit": "$/tonne",
    "currentPrice": 2980,
    "change1mPct": 4.2,
    "change6mPct": 5.7,
    "change1yPct": 21.6,
    "cycleStage": "Expansion / Bull",
    "description": "Essential anti-corrosion coating metal used in galvanizing steel sheets, structural components, and die-casting alloys.",
    "macroContext": "Depleted mine concentrates in Europe and North America have created extreme smelting deficit, driving Treatment Charges (TCs) to historic lows and supporting elevated LME cash prices.",
    "history": [
      {
        "date": "Oct 23",
        "price": 2450
      },
      {
        "date": "Nov 23",
        "price": 2520
      },
      {
        "date": "Dec 23",
        "price": 2580
      },
      {
        "date": "Jan 24",
        "price": 2500
      },
      {
        "date": "Feb 24",
        "price": 2410
      },
      {
        "date": "Mar 24",
        "price": 2480
      },
      {
        "date": "Apr 24",
        "price": 2820
      },
      {
        "date": "May 24",
        "price": 3050
      },
      {
        "date": "Jun 24",
        "price": 2880
      },
      {
        "date": "Jul 24",
        "price": 2720
      },
      {
        "date": "Aug 24",
        "price": 2780
      },
      {
        "date": "Sep 24",
        "price": 3120
      },
      {
        "date": "Oct 24",
        "price": 3150
      },
      {
        "date": "Nov 24",
        "price": 3020
      },
      {
        "date": "Dec 24",
        "price": 2950
      },
      {
        "date": "Jan 25",
        "price": 2860
      },
      {
        "date": "Feb 25",
        "price": 2980
      }
    ],
    "impactedStocks": [
      {
        "symbol": "HINDZINC",
        "name": "Hindustan Zinc Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "World's second-largest zinc producer with lowest-cost zinc assets globally (Rampura Agucha mine); earnings heavily geared to LME zinc."
      },
      {
        "symbol": "VEDL",
        "name": "Vedanta Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Holds 64.9% controlling stake in Hindustan Zinc; robust dividend flow and consolidated EBITDA."
      },
      {
        "symbol": "TATASTEEL",
        "name": "Tata Steel Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Zinc is used extensively for steel galvanizing (GP/GC sheets); higher zinc adds to steel coating costs."
      }
    ]
  },
  {
    "id": "gold-mcx",
    "name": "Gold 24K (MCX)",
    "category": "Metals",
    "unit": "\u20b9/10g",
    "currentPrice": 79200,
    "change1mPct": 2.5,
    "change6mPct": 11.8,
    "change1yPct": 28.4,
    "cycleStage": "Expansion / Bull",
    "description": "Global monetary safe-haven and prime consumer jewelry asset in India, influenced by central bank accumulation and real rates.",
    "macroContext": "Historic net buying by global central banks (including RBI, PBOC) and escalating geopolitical frictions have pushed domestic gold past \u20b979,000/10g despite customs duty reductions.",
    "history": [
      {
        "date": "Oct 23",
        "price": 61200
      },
      {
        "date": "Nov 23",
        "price": 62500
      },
      {
        "date": "Dec 23",
        "price": 63400
      },
      {
        "date": "Jan 24",
        "price": 62800
      },
      {
        "date": "Feb 24",
        "price": 62200
      },
      {
        "date": "Mar 24",
        "price": 66500
      },
      {
        "date": "Apr 24",
        "price": 72800
      },
      {
        "date": "May 24",
        "price": 71900
      },
      {
        "date": "Jun 24",
        "price": 72400
      },
      {
        "date": "Jul 24",
        "price": 68500
      },
      {
        "date": "Aug 24",
        "price": 71800
      },
      {
        "date": "Sep 24",
        "price": 75200
      },
      {
        "date": "Oct 24",
        "price": 78900
      },
      {
        "date": "Nov 24",
        "price": 76500
      },
      {
        "date": "Dec 24",
        "price": 77200
      },
      {
        "date": "Jan 25",
        "price": 77300
      },
      {
        "date": "Feb 25",
        "price": 79200
      }
    ],
    "impactedStocks": [
      {
        "symbol": "TITAN",
        "name": "Titan Company Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Rapid spikes in gold prices temporarily deter grammage demand, though higher inventory holding value and gold exchange schemes buffer sales."
      },
      {
        "symbol": "MUTHOOTFIN",
        "name": "Muthoot Finance Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Rising gold prices expand collateral buffer, lower Loan-to-Value (LTV) risks, and boost Gold Loan Assets Under Management (AUM)."
      }
    ]
  },
  {
    "id": "silver-mcx",
    "name": "Silver (MCX)",
    "category": "Metals",
    "unit": "\u20b9/kg",
    "currentPrice": 92500,
    "change1mPct": 3.8,
    "change6mPct": 9.4,
    "change1yPct": 30.2,
    "cycleStage": "Expansion / Bull",
    "description": "Dual-purpose precious and industrial metal vital for solar photovoltaic cells (PV paste), electronic contacts, and jewelry.",
    "macroContext": "Soaring solar cell production (N-type TOPCon cells consuming 30% more silver paste) has driven silver into its fourth consecutive year of structural market deficit.",
    "history": [
      {
        "date": "Oct 23",
        "price": 71500
      },
      {
        "date": "Nov 23",
        "price": 74200
      },
      {
        "date": "Dec 23",
        "price": 74800
      },
      {
        "date": "Jan 24",
        "price": 72300
      },
      {
        "date": "Feb 24",
        "price": 70800
      },
      {
        "date": "Mar 24",
        "price": 75500
      },
      {
        "date": "Apr 24",
        "price": 83200
      },
      {
        "date": "May 24",
        "price": 94500
      },
      {
        "date": "Jun 24",
        "price": 88500
      },
      {
        "date": "Jul 24",
        "price": 84200
      },
      {
        "date": "Aug 24",
        "price": 85000
      },
      {
        "date": "Sep 24",
        "price": 91800
      },
      {
        "date": "Oct 24",
        "price": 97500
      },
      {
        "date": "Nov 24",
        "price": 89800
      },
      {
        "date": "Dec 24",
        "price": 90500
      },
      {
        "date": "Jan 25",
        "price": 89100
      },
      {
        "date": "Feb 25",
        "price": 92500
      }
    ],
    "impactedStocks": [
      {
        "symbol": "HINDZINC",
        "name": "Hindustan Zinc Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "India's sole primary silver producer (~750 tonnes annually); silver contributes over 35% of total operating EBITDA with virtually zero cash cost as a by-product."
      },
      {
        "symbol": "TITAN",
        "name": "Titan Company Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Mia and Zoya jewelry lines consume silver; rapid price increases elevate inventory carrying costs."
      }
    ]
  },
  {
    "id": "iron-ore",
    "name": "Iron Ore 62% Fe (CFR China)",
    "category": "Metals",
    "unit": "$/tonne",
    "currentPrice": 102.5,
    "change1mPct": -2.8,
    "change6mPct": -6.4,
    "change1yPct": -22.3,
    "cycleStage": "Bottoming Out",
    "description": "Fundamental feed for blast furnace and DRI sponge iron steel manufacturing. Priced on 62% Fe fines basis.",
    "macroContext": "High port stockpiles at Chinese ports (>150 MT) and disciplined Australian & Brazilian supply shipments have established a trading channel between $95 and $110/t.",
    "history": [
      {
        "date": "Oct 23",
        "price": 121.0
      },
      {
        "date": "Nov 23",
        "price": 131.5
      },
      {
        "date": "Dec 23",
        "price": 136.0
      },
      {
        "date": "Jan 24",
        "price": 135.0
      },
      {
        "date": "Feb 24",
        "price": 125.0
      },
      {
        "date": "Mar 24",
        "price": 105.0
      },
      {
        "date": "Apr 24",
        "price": 115.0
      },
      {
        "date": "May 24",
        "price": 118.0
      },
      {
        "date": "Jun 24",
        "price": 107.0
      },
      {
        "date": "Jul 24",
        "price": 104.0
      },
      {
        "date": "Aug 24",
        "price": 98.0
      },
      {
        "date": "Sep 24",
        "price": 108.0
      },
      {
        "date": "Oct 24",
        "price": 105.0
      },
      {
        "date": "Nov 24",
        "price": 102.0
      },
      {
        "date": "Dec 24",
        "price": 101.5
      },
      {
        "date": "Jan 25",
        "price": 105.5
      },
      {
        "date": "Feb 25",
        "price": 102.5
      }
    ],
    "impactedStocks": [
      {
        "symbol": "NMDC",
        "name": "NMDC Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "India's largest merchant iron ore miner (~45 MT); monthly iron ore lump/fine price revisions directly dictate top-line and operating margins."
      },
      {
        "symbol": "VEDL",
        "name": "Vedanta Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Iron ore mining division in Goa and Karnataka benefits from higher lump realizations and exports."
      },
      {
        "symbol": "JSWSTEEL",
        "name": "JSW Steel Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Non-captive merchant iron ore purchases in Odisha and Karnataka make JSW sensitive to domestic iron ore prices."
      }
    ]
  },
  {
    "id": "lead-lme",
    "name": "LME Lead",
    "category": "Metals",
    "unit": "$/tonne",
    "currentPrice": 2045,
    "change1mPct": 1.2,
    "change6mPct": 0.5,
    "change1yPct": -1.8,
    "cycleStage": "Bottoming Out",
    "description": "Primary material in automotive starting, lighting, ignition (SLI) batteries, telecommunications backup power, and industrial energy storage.",
    "macroContext": "Stable automotive battery replacement demand in North America and India offset by weak European industrial demand keeps lead in a balanced supply-demand state around $2,050/t.",
    "history": [
      {
        "date": "Oct 23",
        "price": 2120
      },
      {
        "date": "Nov 23",
        "price": 2180
      },
      {
        "date": "Dec 23",
        "price": 2060
      },
      {
        "date": "Jan 24",
        "price": 2080
      },
      {
        "date": "Feb 24",
        "price": 2070
      },
      {
        "date": "Mar 24",
        "price": 2050
      },
      {
        "date": "Apr 24",
        "price": 2160
      },
      {
        "date": "May 24",
        "price": 2220
      },
      {
        "date": "Jun 24",
        "price": 2180
      },
      {
        "date": "Jul 24",
        "price": 2110
      },
      {
        "date": "Aug 24",
        "price": 2040
      },
      {
        "date": "Sep 24",
        "price": 2090
      },
      {
        "date": "Oct 24",
        "price": 2070
      },
      {
        "date": "Nov 24",
        "price": 2030
      },
      {
        "date": "Dec 24",
        "price": 2010
      },
      {
        "date": "Jan 25",
        "price": 2020
      },
      {
        "date": "Feb 25",
        "price": 2045
      }
    ],
    "impactedStocks": [
      {
        "symbol": "HINDZINC",
        "name": "Hindustan Zinc Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Refined lead is produced as a co-product alongside zinc (~210 kt annually), contributing high margin cash flows."
      },
      {
        "symbol": "EXIDEIND",
        "name": "Exide Industries Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Lead represents ~65% of total raw material costs for lead-acid battery manufacturing."
      },
      {
        "symbol": "AMARAJABAT",
        "name": "Amara Raja Energy & Mobility Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Domestic and imported lead prices directly dictate gross margins in the automotive and industrial battery divisions."
      }
    ]
  },
  {
    "id": "caustic-soda",
    "name": "Caustic Soda (Lye)",
    "category": "Chemicals",
    "unit": "\u20b9/tonne",
    "currentPrice": 34500,
    "change1mPct": 4.5,
    "change6mPct": 12.8,
    "change1yPct": -3.6,
    "cycleStage": "Bottoming Out",
    "description": "Essential alkali chemical produced via chlor-alkali electrolysis. Crucial for alumina refining, textiles, pulp & paper, and soap manufacturing.",
    "macroContext": "Electrochemical Unit (ECU) realizations have shown sequential recovery from cyclically depressed levels as chlorine demand stabilized and domestic caustic capacity additions slowed down.",
    "history": [
      {
        "date": "Oct 23",
        "price": 36500
      },
      {
        "date": "Nov 23",
        "price": 35200
      },
      {
        "date": "Dec 23",
        "price": 34000
      },
      {
        "date": "Jan 24",
        "price": 33200
      },
      {
        "date": "Feb 24",
        "price": 32500
      },
      {
        "date": "Mar 24",
        "price": 31800
      },
      {
        "date": "Apr 24",
        "price": 31200
      },
      {
        "date": "May 24",
        "price": 30800
      },
      {
        "date": "Jun 24",
        "price": 30500
      },
      {
        "date": "Jul 24",
        "price": 30200
      },
      {
        "date": "Aug 24",
        "price": 30600
      },
      {
        "date": "Sep 24",
        "price": 31500
      },
      {
        "date": "Oct 24",
        "price": 32800
      },
      {
        "date": "Nov 24",
        "price": 33400
      },
      {
        "date": "Dec 24",
        "price": 33100
      },
      {
        "date": "Jan 25",
        "price": 33000
      },
      {
        "date": "Feb 25",
        "price": 34500
      }
    ],
    "impactedStocks": [
      {
        "symbol": "GRASIM",
        "name": "Grasim Industries Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "India's largest chlor-alkali producer (capacity ~1.4 MTPA); ECU price recovery drives direct chemical division margin expansion."
      },
      {
        "symbol": "NATIONALUM",
        "name": "National Aluminium Co. Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Bayer alumina refining process consumes ~0.1 tonnes of caustic soda per tonne of alumina produced."
      }
    ]
  },
  {
    "id": "soda-ash",
    "name": "Soda Ash (Dense)",
    "category": "Chemicals",
    "unit": "\u20b9/tonne",
    "currentPrice": 24800,
    "change1mPct": -1.2,
    "change6mPct": -7.5,
    "change1yPct": -18.4,
    "cycleStage": "Cooling / Bear",
    "description": "Sodium carbonate used fundamentally in glass manufacturing (flat glass for architectural/automotive and container glass) and powdered detergents.",
    "macroContext": "Massive natural soda ash commissioning in Inner Mongolia (China) added over 5 MTPA of low-cost capacity, depressing international synthetic soda ash export benchmarks.",
    "history": [
      {
        "date": "Oct 23",
        "price": 31200
      },
      {
        "date": "Nov 23",
        "price": 30500
      },
      {
        "date": "Dec 23",
        "price": 29800
      },
      {
        "date": "Jan 24",
        "price": 29200
      },
      {
        "date": "Feb 24",
        "price": 28500
      },
      {
        "date": "Mar 24",
        "price": 27800
      },
      {
        "date": "Apr 24",
        "price": 27200
      },
      {
        "date": "May 24",
        "price": 26900
      },
      {
        "date": "Jun 24",
        "price": 27400
      },
      {
        "date": "Jul 24",
        "price": 27100
      },
      {
        "date": "Aug 24",
        "price": 26500
      },
      {
        "date": "Sep 24",
        "price": 25800
      },
      {
        "date": "Oct 24",
        "price": 25400
      },
      {
        "date": "Nov 24",
        "price": 25100
      },
      {
        "date": "Dec 24",
        "price": 24900
      },
      {
        "date": "Jan 25",
        "price": 25100
      },
      {
        "date": "Feb 25",
        "price": 24800
      }
    ],
    "impactedStocks": [
      {
        "symbol": "TATACHEM",
        "name": "Tata Chemicals Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "World's third-largest soda ash producer; global synthetic vs natural spread directly controls basic chemistry EBITDA."
      },
      {
        "symbol": "HINDUNILVR",
        "name": "Hindustan Unilever Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Soda ash is an essential builder in laundry powders (Surf Excel, Rin); declining prices expand fabric wash gross margins."
      }
    ]
  },
  {
    "id": "urea-fertilizer",
    "name": "Urea Fertilizer (FOB Middle East)",
    "category": "Chemicals",
    "unit": "$/tonne",
    "currentPrice": 365.0,
    "change1mPct": 4.9,
    "change6mPct": 14.1,
    "change1yPct": 7.4,
    "cycleStage": "Expansion / Bull",
    "description": "Primary nitrogenous fertilizer globally, produced by reacting ammonia with carbon dioxide. Critical for crop yields and food security.",
    "macroContext": "Egyptian gas curtailments and Chinese export quota restrictions have tightened spot availability, lifting international tenders above $360/t.",
    "history": [
      {
        "date": "Oct 23",
        "price": 385.0
      },
      {
        "date": "Nov 23",
        "price": 370.0
      },
      {
        "date": "Dec 23",
        "price": 340.0
      },
      {
        "date": "Jan 24",
        "price": 345.0
      },
      {
        "date": "Feb 24",
        "price": 360.0
      },
      {
        "date": "Mar 24",
        "price": 335.0
      },
      {
        "date": "Apr 24",
        "price": 310.0
      },
      {
        "date": "May 24",
        "price": 295.0
      },
      {
        "date": "Jun 24",
        "price": 315.0
      },
      {
        "date": "Jul 24",
        "price": 320.0
      },
      {
        "date": "Aug 24",
        "price": 318.0
      },
      {
        "date": "Sep 24",
        "price": 330.0
      },
      {
        "date": "Oct 24",
        "price": 340.0
      },
      {
        "date": "Nov 24",
        "price": 348.0
      },
      {
        "date": "Dec 24",
        "price": 352.0
      },
      {
        "date": "Jan 25",
        "price": 348.0
      },
      {
        "date": "Feb 25",
        "price": 365.0
      }
    ],
    "impactedStocks": [
      {
        "symbol": "CHAMBLFERT",
        "name": "Chambal Fertilisers and Chemicals Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Operates high-efficiency Gadepan I, II, and III plants; benefits from energy-norm savings on baseline natural gas consumption."
      },
      {
        "symbol": "COROMANDEL",
        "name": "Coromandel International Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Manufactures and distributes crop nutrition nutrients across rural India."
      }
    ]
  },
  {
    "id": "dap-fertilizer",
    "name": "DAP Fertilizer (CFR India)",
    "category": "Chemicals",
    "unit": "$/tonne",
    "currentPrice": 625.0,
    "change1mPct": 1.6,
    "change6mPct": 8.7,
    "change1yPct": 9.6,
    "cycleStage": "Expansion / Bull",
    "description": "Diammonium Phosphate (18-46-0): primary source of phosphorus for root development in cereals, pulses, and oilseeds across India.",
    "macroContext": "Chinese phosphate export restrictions and elevated Moroccan rock phosphate & phosphoric acid contracts have maintained elevated import prices for Indian procurement agencies.",
    "history": [
      {
        "date": "Oct 23",
        "price": 585.0
      },
      {
        "date": "Nov 23",
        "price": 590.0
      },
      {
        "date": "Dec 23",
        "price": 595.0
      },
      {
        "date": "Jan 24",
        "price": 590.0
      },
      {
        "date": "Feb 24",
        "price": 585.0
      },
      {
        "date": "Mar 24",
        "price": 575.0
      },
      {
        "date": "Apr 24",
        "price": 550.0
      },
      {
        "date": "May 24",
        "price": 535.0
      },
      {
        "date": "Jun 24",
        "price": 540.0
      },
      {
        "date": "Jul 24",
        "price": 560.0
      },
      {
        "date": "Aug 24",
        "price": 575.0
      },
      {
        "date": "Sep 24",
        "price": 605.0
      },
      {
        "date": "Oct 24",
        "price": 620.0
      },
      {
        "date": "Nov 24",
        "price": 615.0
      },
      {
        "date": "Dec 24",
        "price": 610.0
      },
      {
        "date": "Jan 25",
        "price": 615.0
      },
      {
        "date": "Feb 25",
        "price": 625.0
      }
    ],
    "impactedStocks": [
      {
        "symbol": "COROMANDEL",
        "name": "Coromandel International Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "India's largest private phosphatic fertilizer manufacturer; backward integrated into phosphoric acid via joint ventures in Tunisia and South Africa."
      }
    ]
  },
  {
    "id": "phenol-acetone",
    "name": "Phenol",
    "category": "Chemicals",
    "unit": "\u20b9/kg",
    "currentPrice": 96.0,
    "change1mPct": 3.2,
    "change6mPct": 5.5,
    "change1yPct": -5.9,
    "cycleStage": "Bottoming Out",
    "description": "Aromatic petrochemical derivative of benzene and propylene. Vital intermediate for phenolic resins, bisphenol-A (polycarbonates), laminates, and pharmaceuticals.",
    "macroContext": "Gradual demand improvement from domestic building material laminate makers and anti-dumping investigations against dumped imports from China/Thailand have supported domestic pricing.",
    "history": [
      {
        "date": "Oct 23",
        "price": 105.0
      },
      {
        "date": "Nov 23",
        "price": 102.0
      },
      {
        "date": "Dec 23",
        "price": 98.0
      },
      {
        "date": "Jan 24",
        "price": 99.0
      },
      {
        "date": "Feb 24",
        "price": 101.0
      },
      {
        "date": "Mar 24",
        "price": 96.0
      },
      {
        "date": "Apr 24",
        "price": 94.0
      },
      {
        "date": "May 24",
        "price": 92.0
      },
      {
        "date": "Jun 24",
        "price": 93.5
      },
      {
        "date": "Jul 24",
        "price": 91.0
      },
      {
        "date": "Aug 24",
        "price": 89.0
      },
      {
        "date": "Sep 24",
        "price": 92.0
      },
      {
        "date": "Oct 24",
        "price": 94.5
      },
      {
        "date": "Nov 24",
        "price": 93.0
      },
      {
        "date": "Dec 24",
        "price": 91.5
      },
      {
        "date": "Jan 25",
        "price": 93.0
      },
      {
        "date": "Feb 25",
        "price": 96.0
      }
    ],
    "impactedStocks": [
      {
        "symbol": "DEEPAKNTR",
        "name": "Deepak Nitrite Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Deepak Phenolics subsidiary operates India's largest single-site phenol-acetone plant at Dahej (~300 ktpa); directly drives consolidated profitability."
      }
    ]
  },
  {
    "id": "titanium-dioxide",
    "name": "Titanium Dioxide (TiO2)",
    "category": "Chemicals",
    "unit": "$/tonne",
    "currentPrice": 2850,
    "change1mPct": -1.7,
    "change6mPct": -5.0,
    "change1yPct": -7.4,
    "cycleStage": "Cooling / Bear",
    "description": "Prime white pigment providing opacity and brightness in decorative paints, industrial coatings, plastics, and paper.",
    "macroContext": "Weak Chinese construction activity has caused Chinese sulfate-process TiO2 producers to export aggressively into Asian markets, depressing regional prices.",
    "history": [
      {
        "date": "Oct 23",
        "price": 3150
      },
      {
        "date": "Nov 23",
        "price": 3100
      },
      {
        "date": "Dec 23",
        "price": 3050
      },
      {
        "date": "Jan 24",
        "price": 3080
      },
      {
        "date": "Feb 24",
        "price": 3120
      },
      {
        "date": "Mar 24",
        "price": 3150
      },
      {
        "date": "Apr 24",
        "price": 3180
      },
      {
        "date": "May 24",
        "price": 3150
      },
      {
        "date": "Jun 24",
        "price": 3080
      },
      {
        "date": "Jul 24",
        "price": 3020
      },
      {
        "date": "Aug 24",
        "price": 2980
      },
      {
        "date": "Sep 24",
        "price": 2950
      },
      {
        "date": "Oct 24",
        "price": 2920
      },
      {
        "date": "Nov 24",
        "price": 2880
      },
      {
        "date": "Dec 24",
        "price": 2870
      },
      {
        "date": "Jan 25",
        "price": 2900
      },
      {
        "date": "Feb 25",
        "price": 2850
      }
    ],
    "impactedStocks": [
      {
        "symbol": "ASIANPAINT",
        "name": "Asian Paints Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "TiO2 constitutes ~18-20% of decorative paint raw material costs; falling TiO2 prices directly expand gross margin buffers."
      },
      {
        "symbol": "BERGEPAINT",
        "name": "Berger Paints India Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Lower imported pigment prices expand operating margin cushion across decorative emulsions."
      }
    ]
  },
  {
    "id": "methanol",
    "name": "Methanol (Domestic Ex-Tank)",
    "category": "Chemicals",
    "unit": "\u20b9/kg",
    "currentPrice": 27.5,
    "change1mPct": 1.9,
    "change6mPct": 7.8,
    "change1yPct": 5.8,
    "cycleStage": "Expansion / Bull",
    "description": "Versatile chemical building block used for formaldehyde (plywood resins), acetic acid, MTBE, and active pharmaceutical ingredients (APIs).",
    "macroContext": "Iranian gas feed curtailments to petrochemical complexes during peak winter months created temporary supply tightening across Indian west coast ports.",
    "history": [
      {
        "date": "Oct 23",
        "price": 26.5
      },
      {
        "date": "Nov 23",
        "price": 27.0
      },
      {
        "date": "Dec 23",
        "price": 28.5
      },
      {
        "date": "Jan 24",
        "price": 28.0
      },
      {
        "date": "Feb 24",
        "price": 26.0
      },
      {
        "date": "Mar 24",
        "price": 25.5
      },
      {
        "date": "Apr 24",
        "price": 25.0
      },
      {
        "date": "May 24",
        "price": 24.5
      },
      {
        "date": "Jun 24",
        "price": 24.8
      },
      {
        "date": "Jul 24",
        "price": 25.2
      },
      {
        "date": "Aug 24",
        "price": 25.0
      },
      {
        "date": "Sep 24",
        "price": 25.8
      },
      {
        "date": "Oct 24",
        "price": 26.4
      },
      {
        "date": "Nov 24",
        "price": 26.8
      },
      {
        "date": "Dec 24",
        "price": 27.2
      },
      {
        "date": "Jan 25",
        "price": 27.0
      },
      {
        "date": "Feb 25",
        "price": 27.5
      }
    ],
    "impactedStocks": [
      {
        "symbol": "GNFC",
        "name": "Gujarat Narmada Valley Fertilizers & Chemicals Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "One of India's largest domestic merchant methanol producers; benefits from healthy price realizations."
      }
    ]
  },
  {
    "id": "cotton-shankar",
    "name": "Cotton Shankar-6",
    "category": "Agriculture",
    "unit": "\u20b9/candy",
    "currentPrice": 56500,
    "change1mPct": 0.9,
    "change6mPct": -2.6,
    "change1yPct": -8.9,
    "cycleStage": "Bottoming Out",
    "description": "Standard benchmark Indian raw cotton fiber grade (~356 kg per candy). Dictates yarn spinning margins across the textile value chain.",
    "macroContext": "Cotton Corporation of India (CCI) minimum support price (MSP) procurement operations have set a hard floor for farm-gate raw cotton prices, anchoring domestic yarn pricing.",
    "history": [
      {
        "date": "Oct 23",
        "price": 62500
      },
      {
        "date": "Nov 23",
        "price": 60500
      },
      {
        "date": "Dec 23",
        "price": 57500
      },
      {
        "date": "Jan 24",
        "price": 56800
      },
      {
        "date": "Feb 24",
        "price": 59500
      },
      {
        "date": "Mar 24",
        "price": 61200
      },
      {
        "date": "Apr 24",
        "price": 59800
      },
      {
        "date": "May 24",
        "price": 58500
      },
      {
        "date": "Jun 24",
        "price": 57800
      },
      {
        "date": "Jul 24",
        "price": 58200
      },
      {
        "date": "Aug 24",
        "price": 57500
      },
      {
        "date": "Sep 24",
        "price": 57000
      },
      {
        "date": "Oct 24",
        "price": 56200
      },
      {
        "date": "Nov 24",
        "price": 55800
      },
      {
        "date": "Dec 24",
        "price": 55500
      },
      {
        "date": "Jan 25",
        "price": 56000
      },
      {
        "date": "Feb 25",
        "price": 56500
      }
    ],
    "impactedStocks": [
      {
        "symbol": "KPRMILL",
        "name": "K.P.R. Mill Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Vertically integrated from yarn to garment export; stable cotton prices preserve operating margins above 19%."
      },
      {
        "symbol": "WELSPUNLIV",
        "name": "Welspun Living Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Cotton forms ~50% of raw material costs for terry towels and bed linen exports to US retailers."
      }
    ]
  },
  {
    "id": "sugar-domestic",
    "name": "Domestic Sugar (M-30)",
    "category": "Agriculture",
    "unit": "\u20b9/quintal",
    "currentPrice": 3850,
    "change1mPct": 1.3,
    "change6mPct": 4.1,
    "change1yPct": 6.9,
    "cycleStage": "Expansion / Bull",
    "description": "Refined crystal cane sugar grade produced primarily in Uttar Pradesh and Maharashtra. Closely governed by monthly release quotas and ethanol diversion mandates.",
    "macroContext": "Government policies lifting ethanol production quotas from sugarcane juice and B-heavy molasses have tightened domestic free-market sugar supply, supporting ex-mill prices.",
    "history": [
      {
        "date": "Oct 23",
        "price": 3680
      },
      {
        "date": "Nov 23",
        "price": 3720
      },
      {
        "date": "Dec 23",
        "price": 3650
      },
      {
        "date": "Jan 24",
        "price": 3680
      },
      {
        "date": "Feb 24",
        "price": 3700
      },
      {
        "date": "Mar 24",
        "price": 3740
      },
      {
        "date": "Apr 24",
        "price": 3780
      },
      {
        "date": "May 24",
        "price": 3820
      },
      {
        "date": "Jun 24",
        "price": 3850
      },
      {
        "date": "Jul 24",
        "price": 3810
      },
      {
        "date": "Aug 24",
        "price": 3760
      },
      {
        "date": "Sep 24",
        "price": 3720
      },
      {
        "date": "Oct 24",
        "price": 3750
      },
      {
        "date": "Nov 24",
        "price": 3780
      },
      {
        "date": "Dec 24",
        "price": 3800
      },
      {
        "date": "Jan 25",
        "price": 3800
      },
      {
        "date": "Feb 25",
        "price": 3850
      }
    ],
    "impactedStocks": [
      {
        "symbol": "BALRAMCHIN",
        "name": "Balrampur Chini Mills Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Leading integrated sugar & distillery powerhouse; higher ex-mill sugar realizations and ethanol blending drive consolidated ROCE."
      }
    ]
  },
  {
    "id": "palm-oil",
    "name": "Crude Palm Oil (CPO)",
    "category": "Agriculture",
    "unit": "\u20b9/10kg",
    "currentPrice": 985.0,
    "change1mPct": 2.6,
    "change6mPct": 18.7,
    "change1yPct": 24.7,
    "cycleStage": "Expansion / Bull",
    "description": "World's most consumed edible vegetable oil. Primary feedstock for packaged foods, biscuits, snacks, frying oils, and soap noodles.",
    "macroContext": "Indonesia's implementation of the mandatory B40 biodiesel blending mandate has diverted massive export volumes into domestic energy, sharply lifting international FOB and domestic import parity prices.",
    "history": [
      {
        "date": "Oct 23",
        "price": 810.0
      },
      {
        "date": "Nov 23",
        "price": 825.0
      },
      {
        "date": "Dec 23",
        "price": 805.0
      },
      {
        "date": "Jan 24",
        "price": 820.0
      },
      {
        "date": "Feb 24",
        "price": 845.0
      },
      {
        "date": "Mar 24",
        "price": 890.0
      },
      {
        "date": "Apr 24",
        "price": 880.0
      },
      {
        "date": "May 24",
        "price": 840.0
      },
      {
        "date": "Jun 24",
        "price": 850.0
      },
      {
        "date": "Jul 24",
        "price": 865.0
      },
      {
        "date": "Aug 24",
        "price": 890.0
      },
      {
        "date": "Sep 24",
        "price": 940.0
      },
      {
        "date": "Oct 24",
        "price": 995.0
      },
      {
        "date": "Nov 24",
        "price": 1020.0
      },
      {
        "date": "Dec 24",
        "price": 980.0
      },
      {
        "date": "Jan 25",
        "price": 960.0
      },
      {
        "date": "Feb 25",
        "price": 985.0
      }
    ],
    "impactedStocks": [
      {
        "symbol": "GODREJAGRO",
        "name": "Godrej Agrovet Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Operates extensive oil palm plantation buy-back arrangements in Andhra Pradesh; higher CPO prices boost oil palm division profits."
      },
      {
        "symbol": "BRITANNIA",
        "name": "Britannia Industries Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "CPO/refined palm oil is a key baking fat input for biscuits (~10% of COGS); price hikes pressure gross margins."
      },
      {
        "symbol": "NESTLEIND",
        "name": "Nestle India Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Palm oil is heavily used in Maggi noodles, confectionery, and culinary sauces."
      }
    ]
  },
  {
    "id": "natural-rubber",
    "name": "Natural Rubber (RSS-4)",
    "category": "Agriculture",
    "unit": "\u20b9/kg",
    "currentPrice": 218.0,
    "change1mPct": 3.8,
    "change6mPct": 14.7,
    "change1yPct": 38.0,
    "cycleStage": "Expansion / Bull",
    "description": "Ribbed Smoked Sheet grade 4: the domestic automotive tyre industry's primary raw material, tapped from rubber plantations in Kerala and Tripura.",
    "macroContext": "Severe fungal leaf disease across Southeast Asian plantations (Thailand, Indonesia) combined with unseasonal heavy rains in Kerala has created acute physical shortages, pushing rubber to multi-year highs.",
    "history": [
      {
        "date": "Oct 23",
        "price": 158.0
      },
      {
        "date": "Nov 23",
        "price": 155.0
      },
      {
        "date": "Dec 23",
        "price": 160.0
      },
      {
        "date": "Jan 24",
        "price": 165.0
      },
      {
        "date": "Feb 24",
        "price": 172.0
      },
      {
        "date": "Mar 24",
        "price": 182.0
      },
      {
        "date": "Apr 24",
        "price": 188.0
      },
      {
        "date": "May 24",
        "price": 196.0
      },
      {
        "date": "Jun 24",
        "price": 210.0
      },
      {
        "date": "Jul 24",
        "price": 225.0
      },
      {
        "date": "Aug 24",
        "price": 242.0
      },
      {
        "date": "Sep 24",
        "price": 235.0
      },
      {
        "date": "Oct 24",
        "price": 215.0
      },
      {
        "date": "Nov 24",
        "price": 208.0
      },
      {
        "date": "Dec 24",
        "price": 205.0
      },
      {
        "date": "Jan 25",
        "price": 210.0
      },
      {
        "date": "Feb 25",
        "price": 218.0
      }
    ],
    "impactedStocks": [
      {
        "symbol": "MRF",
        "name": "MRF Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Natural rubber accounts for ~35% of tyre raw material costs; surging rubber prices compress operating margins by 150-250 bps."
      },
      {
        "symbol": "APOLLOTYRE",
        "name": "Apollo Tyres Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "High rubber costs necessitate price increases in truck-bus radial (TBR) and passenger car replacement markets."
      },
      {
        "symbol": "CEATLTD",
        "name": "CEAT Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Two-wheeler and commercial vehicle tyre manufacturer; margins contract when natural rubber trades above \u20b9190/kg."
      },
      {
        "symbol": "BALKRISIND",
        "name": "Balkrishna Industries Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Off-Highway Tyre (OHT) manufacturer consumes significant natural rubber for agricultural and mining tractor tyres."
      }
    ]
  },
  {
    "id": "wheat-ncdex",
    "name": "Milling Wheat (NCDEX)",
    "category": "Agriculture",
    "unit": "\u20b9/quintal",
    "currentPrice": 2720,
    "change1mPct": -1.8,
    "change6mPct": 6.7,
    "change1yPct": 11.0,
    "cycleStage": "Expansion / Bull",
    "description": "Primary staple foodgrain milled into flour (Atta and Maida) for bakery, confectionery, bread, and packaged foods.",
    "macroContext": "Government open market sales scheme (OMSS) releases and bumper rabi acreage have capped prices ahead of new crop arrivals, maintaining stable flour mill margins.",
    "history": [
      {
        "date": "Oct 23",
        "price": 2480
      },
      {
        "date": "Nov 23",
        "price": 2520
      },
      {
        "date": "Dec 23",
        "price": 2560
      },
      {
        "date": "Jan 24",
        "price": 2540
      },
      {
        "date": "Feb 24",
        "price": 2490
      },
      {
        "date": "Mar 24",
        "price": 2450
      },
      {
        "date": "Apr 24",
        "price": 2380
      },
      {
        "date": "May 24",
        "price": 2420
      },
      {
        "date": "Jun 24",
        "price": 2490
      },
      {
        "date": "Jul 24",
        "price": 2550
      },
      {
        "date": "Aug 24",
        "price": 2620
      },
      {
        "date": "Sep 24",
        "price": 2680
      },
      {
        "date": "Oct 24",
        "price": 2750
      },
      {
        "date": "Nov 24",
        "price": 2810
      },
      {
        "date": "Dec 24",
        "price": 2780
      },
      {
        "date": "Jan 25",
        "price": 2770
      },
      {
        "date": "Feb 25",
        "price": 2720
      }
    ],
    "impactedStocks": [
      {
        "symbol": "BRITANNIA",
        "name": "Britannia Industries Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Wheat flour is the single largest volumetric ingredient in biscuit manufacturing."
      },
      {
        "symbol": "ITC",
        "name": "ITC Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Aashirvaad Atta is the market leader; integrated e-Choupal procurement network allows ITC to optimize wheat procurement costs."
      }
    ]
  },
  {
    "id": "polymer-resins",
    "name": "Polyvinyl Chloride (PVC)",
    "category": "Polymers",
    "unit": "\u20b9/kg",
    "currentPrice": 74.5,
    "change1mPct": 1.4,
    "change6mPct": -3.2,
    "change1yPct": -12.4,
    "cycleStage": "Bottoming Out",
    "description": "Thermoplastic polymer synthesised from vinyl chloride monomer. Extensively used in agricultural irrigation pipes, plumbing, cable insulation, and window profiles.",
    "macroContext": "Implementation of Bureau of Indian Standards (BIS) certification requirements on imported PVC resin and potential anti-dumping duty (ADD) recommendations have limited cheap Chinese carbide-based imports.",
    "history": [
      {
        "date": "Oct 23",
        "price": 85.0
      },
      {
        "date": "Nov 23",
        "price": 82.5
      },
      {
        "date": "Dec 23",
        "price": 79.0
      },
      {
        "date": "Jan 24",
        "price": 80.5
      },
      {
        "date": "Feb 24",
        "price": 82.0
      },
      {
        "date": "Mar 24",
        "price": 81.0
      },
      {
        "date": "Apr 24",
        "price": 79.5
      },
      {
        "date": "May 24",
        "price": 83.0
      },
      {
        "date": "Jun 24",
        "price": 81.5
      },
      {
        "date": "Jul 24",
        "price": 78.0
      },
      {
        "date": "Aug 24",
        "price": 76.5
      },
      {
        "date": "Sep 24",
        "price": 75.0
      },
      {
        "date": "Oct 24",
        "price": 74.0
      },
      {
        "date": "Nov 24",
        "price": 73.5
      },
      {
        "date": "Dec 24",
        "price": 72.8
      },
      {
        "date": "Jan 25",
        "price": 73.5
      },
      {
        "date": "Feb 25",
        "price": 74.5
      }
    ],
    "impactedStocks": [
      {
        "symbol": "FINPIPE",
        "name": "Finolex Industries Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Backward-integrated suspension PVC resin manufacturer (~272 ktpa); captures resin manufacturing spreads."
      },
      {
        "symbol": "SUPREMEIND",
        "name": "Supreme Industries Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "India's largest plastic processor; lower PVC resin prices stimulate volume growth in agricultural and plumbing pipes."
      },
      {
        "symbol": "ASTRAL",
        "name": "Astral Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Plumbing and CPVC pipe manufacturer; stable resin prices eliminate inventory destocking headwinds."
      }
    ]
  },
  {
    "id": "polypropylene",
    "name": "Polypropylene (PP Raffia)",
    "category": "Polymers",
    "unit": "\u20b9/kg",
    "currentPrice": 88.0,
    "change1mPct": 1.1,
    "change6mPct": -2.8,
    "change1yPct": -6.4,
    "cycleStage": "Bottoming Out",
    "description": "Thermoplastic polymer derived from propylene monomer. Essential for woven sacks (cement/fertilizer packaging), automotive parts, consumer homeware, and non-woven fabrics.",
    "macroContext": "Regional naphtha crack spreads remain narrow due to abundant Chinese petrochemical supply, anchoring raw polymer pricing across South Asia.",
    "history": [
      {
        "date": "Oct 23",
        "price": 94.0
      },
      {
        "date": "Nov 23",
        "price": 92.5
      },
      {
        "date": "Dec 23",
        "price": 90.0
      },
      {
        "date": "Jan 24",
        "price": 91.5
      },
      {
        "date": "Feb 24",
        "price": 93.0
      },
      {
        "date": "Mar 24",
        "price": 92.0
      },
      {
        "date": "Apr 24",
        "price": 91.0
      },
      {
        "date": "May 24",
        "price": 93.5
      },
      {
        "date": "Jun 24",
        "price": 92.5
      },
      {
        "date": "Jul 24",
        "price": 90.0
      },
      {
        "date": "Aug 24",
        "price": 89.0
      },
      {
        "date": "Sep 24",
        "price": 88.5
      },
      {
        "date": "Oct 24",
        "price": 87.5
      },
      {
        "date": "Nov 24",
        "price": 86.8
      },
      {
        "date": "Dec 24",
        "price": 86.5
      },
      {
        "date": "Jan 25",
        "price": 87.0
      },
      {
        "date": "Feb 25",
        "price": 88.0
      }
    ],
    "impactedStocks": [
      {
        "symbol": "RELIANCE",
        "name": "Reliance Industries Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "World-scale polypropylene capacity at Jamnagar and Hazira; petchem margins dictate downstream earnings."
      },
      {
        "symbol": "SUPREMEIND",
        "name": "Supreme Industries Ltd.",
        "role": "consumer",
        "impactType": "Negative",
        "impactDescription": "Consumes massive volumes of PP for molded furniture, crates, and packaging films."
      }
    ]
  },
  {
    "id": "kraft-paper",
    "name": "Packaging Kraft Paper (18 BF)",
    "category": "Polymers",
    "unit": "\u20b9/kg",
    "currentPrice": 36.5,
    "change1mPct": 1.4,
    "change6mPct": 4.3,
    "change1yPct": -5.2,
    "cycleStage": "Bottoming Out",
    "description": "High tear-resistance industrial paper made from recycled cardboard waste and virgin wood pulp. Key material for corrugated packaging boxes in e-commerce and FMCG.",
    "macroContext": "Imported waste paper (OCC) costs have risen from Europe and North America, pushing domestic recyclers to pass on price hikes to corrugated box converters.",
    "history": [
      {
        "date": "Oct 23",
        "price": 38.5
      },
      {
        "date": "Nov 23",
        "price": 37.5
      },
      {
        "date": "Dec 23",
        "price": 36.0
      },
      {
        "date": "Jan 24",
        "price": 35.5
      },
      {
        "date": "Feb 24",
        "price": 36.0
      },
      {
        "date": "Mar 24",
        "price": 36.5
      },
      {
        "date": "Apr 24",
        "price": 35.8
      },
      {
        "date": "May 24",
        "price": 35.2
      },
      {
        "date": "Jun 24",
        "price": 35.0
      },
      {
        "date": "Jul 24",
        "price": 34.8
      },
      {
        "date": "Aug 24",
        "price": 34.5
      },
      {
        "date": "Sep 24",
        "price": 35.0
      },
      {
        "date": "Oct 24",
        "price": 35.5
      },
      {
        "date": "Nov 24",
        "price": 35.8
      },
      {
        "date": "Dec 24",
        "price": 36.0
      },
      {
        "date": "Jan 25",
        "price": 36.0
      },
      {
        "date": "Feb 25",
        "price": 36.5
      }
    ],
    "impactedStocks": [
      {
        "symbol": "WESTCOAST",
        "name": "West Coast Paper Mills Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Paper and paperboard maker; benefits from improved realization on packaging board."
      },
      {
        "symbol": "JKPAPER",
        "name": "JK Paper Ltd.",
        "role": "producer",
        "impactType": "Positive",
        "impactDescription": "Packaging board plant at Sirpur contributes to diversified paper volumes."
      }
    ]
  }
];
