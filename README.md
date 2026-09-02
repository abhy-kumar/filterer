# Filterer

> Open-Source Stock Screening and Fundamental Analysis Platform for Indian Equities (NSE/BSE).

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Ready-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## Overview

Filterer is a free, open-source quantitative equity research and fundamental screening platform built for the Indian stock market (NSE and BSE). It implements full syntax and query language compatibility with Screener.in, enabling investors and quantitative analysts to construct custom financial filters, compound Boolean expressions, and fundamental valuation formulas with immediate execution.

The project is architected with a hybrid execution model:
1. **Client-Side AST Engine**: An in-browser Pratt/Recursive Descent parser that tokenizes and evaluates financial expressions directly on the client with zero latency.
2. **Vercel Serverless API**: Ready-to-deploy API routes (`/api/screen`, `/api/stocks`, `/api/stock`, `/api/suggest`) for programmatic consumption and integration.
3. **Python Pipeline & CLI Scanner**: Terminal-based scanner (`scanner.py`), financial data fetchers using `yfinance`, and automated SQLite chunking utilities (`db_split_join.py`) designed for GitHub repository file-size limits.

---

## Core Capabilities

### 1. Screener.in Natural Query Syntax
Filterer parses the exact query structure used by Screener.in:
```sql
Market Capitalization > 500 AND Return on capital employed > 20 AND Debt to equity < 0.1 AND Sales growth 3Years > 15
```
- **Logical Operators**: `AND`, `OR`, `NOT`, and parenthetical grouping `( ... )`.
- **Comparison Operators**: `>`, `<`, `>=`, `<=`, `=`, `==`, `!=`.
- **Arithmetic Expressions**: `+`, `-`, `*`, `/`, `%` (e.g., `Current price < Graham Number`, `Operating cash flow 3years > Net profit 3years`).
- **Validation and Formatting**: Real-time AST syntax validation with token-level error reporting and single-click query formatting.

### 2. Comprehensive Company Fundamental Analysis
- **Key Financial Metrics**: Current Market Price, 52-Week Range indicator, Market Capitalization, Stock P/E, Book Value, Dividend Yield, ROCE, ROE, Face Value, PEG Ratio, Graham Number, and Industry P/E.
- **Rule-Based Pros and Cons Engine**: Automated heuristic analysis evaluating balance sheet strength, 5-year profit growth CAGR, return on equity track record, and working capital cycles.
- **Interactive Financial Visualizations**:
  - Price trajectory with 50 DMA, 200 DMA, and Volume analysis.
  - Historical Price-to-Earnings (P/E) valuation bands against historical medians.
  - 10-year Revenue versus Operating Profit Margin (OPM %) progression.
- **Multi-Year Financial Statements**:
  - **Quarterly Results**: 8+ quarters covering Revenue, Operating Profit, OPM %, Other Income, Financing Costs, Profit Before Tax, Effective Tax Rate, Net Profit, and EPS.
  - **10-Year Annual Profit and Loss**: Historical revenue and profitability with Compounded Growth summaries (Sales CAGR, Profit CAGR, Stock Price CAGR, and ROE).
  - **10-Year Balance Sheet**: Equity Capital, Reserves, Borrowings, Total Liabilities, Net Fixed Assets, CWIP, Investments, and Total Assets.
  - **10-Year Cash Flow Statement**: Cash Flow from Operations (CFO), Cash Flow from Investing (CFI), Cash Flow from Financing (CFF), and Free Cash Flow (FCF).
  - **10-Year Financial Ratios**: ROCE, ROE, Debtor Days, Inventory Days, Days Payable, and Cash Conversion Cycle.
  - **Shareholding Pattern**: Quarterly institutional breakdown across Promoters, Foreign Institutional Investors (FII), Domestic Institutional Investors (DII), and Public holdings, with pledged share tracking.
  - **Industry Peer Benchmarking**: Comparative table evaluating sector competitors across market capitalization, valuation multiples, and quarterly operating variance.

### 3. Curated Quantitative Screens
Filterer includes pre-configured investment models based on established fundamental strategies:
- **Magic Formula**: Companies with high Return on Capital Employed (ROCE) and conservative P/E multiples.
- **Debt-Free Compounders**: Zero-leverage businesses with consistent 5-year profit growth.
- **Consistent Growth Champions**: Sustainable top-line and bottom-line expansion over 3-year and 5-year horizons.
- **Graham Bargains**: Companies trading below conservative intrinsic value and Graham Number metrics.
- **Golden Crossover Momentum**: Moving average technical alignment (50 DMA > 200 DMA) with RSI confirmation.
- **Institutional Accumulation**: Rising FII and DII stakes across consecutive quarters.
- **Piotroski High Quality**: Companies with high operational health scores (F-Score >= 7) and safe Altman Z-Scores.
- **Cash Flow Yield Leaders**: Robust free cash flow yields with strong cash conversion from operations.
- **Dividend Aristocrats**: High dividend yields backed by low leverage and sustainable payout coverage.

---

## Supported Metric Aliases

Filterer supports over 100 standardized metric names and common shorthand aliases:

| Standard Metric | Supported Aliases | Unit |
|---|---|---|
| Market Capitalization | `market cap`, `mcap`, `mar cap`, `market_cap` | INR Crores |
| Current Price | `cmp`, `price`, `stock price`, `current price` | INR |
| Price to Earning | `pe`, `p/e`, `stock p/e`, `pe ratio`, `price to earning` | Multiplier (x) |
| Industry PE | `industry pe`, `sector pe`, `industry p/e` | Multiplier (x) |
| Book Value | `bv`, `book value`, `bvps` | INR |
| Price to Book Value | `pb`, `p/bv`, `p/b`, `price to book` | Multiplier (x) |
| PEG Ratio | `peg`, `peg ratio`, `price to earning to growth` | Ratio |
| Return on Capital Employed | `roce`, `return on capital employed`, `roce %` | Percentage (%) |
| Return on Equity | `roe`, `return on equity`, `roe %` | Percentage (%) |
| Operating Profit Margin | `opm`, `opm %`, `operating margin` | Percentage (%) |
| Net Profit Margin | `npm`, `npm %`, `net profit margin`, `pat margin` | Percentage (%) |
| Sales Growth 3Years | `sales growth 3years`, `sales growth 3y`, `sales 3y cagr` | Percentage (%) |
| Sales Growth 5Years | `sales growth 5years`, `sales growth 5y`, `sales 5y cagr` | Percentage (%) |
| Profit Growth 3Years | `profit growth 3years`, `profit growth 3y`, `profit 3y cagr` | Percentage (%) |
| Profit Growth 5Years | `profit growth 5years`, `profit growth 5y`, `profit 5y cagr` | Percentage (%) |
| Debt to Equity | `debt to equity`, `d/e`, `debt / equity` | Ratio |
| Total Debt | `debt`, `total debt`, `borrowings` | INR Crores |
| Piotroski Score | `piotroski score`, `piotroski`, `f-score` | Score (0 to 9) |
| Altman Z-Score | `altman z-score`, `altman z score`, `z-score` | Score |
| Free Cash Flow Yield | `fcf yield`, `free cash flow yield` | Percentage (%) |
| Free Cash Flow | `fcf`, `free cash flow`, `free cash flow latest` | INR Crores |
| Operating Cash Flow 3Years | `operating cash flow 3years`, `cfo 3y` | INR Crores |
| Promoter Holding | `promoter holding`, `promoter stake` | Percentage (%) |
| Pledged Percentage | `pledged percentage`, `pledge %`, `promoter pledge` | Percentage (%) |
| Change in FII Holding | `change in fii holding`, `fii change` | Percentage (%) |
| Change in DII Holding | `change in dii holding`, `dii change` | Percentage (%) |
| 50 Day Moving Average | `dma 50`, `50 dma`, `50 day moving average` | INR |
| 200 Day Moving Average | `dma 200`, `200 dma`, `200 day moving average` | INR |
| Relative Strength Index | `rsi`, `rsi 14`, `relative strength index` | Score (0 to 100) |
| 52-Week High | `high price`, `52w high`, `52 week high` | INR |
| 52-Week Low | `low price`, `52w low`, `52 week low` | INR |
| Distance from 52W High | `distance from 52w high`, `down from 52w high` | Percentage (%) |

---

## Directory Architecture

```
filterer/
├── .agents/
│   └── AGENTS.md                  # Development rules and database split/join workflow
├── api/                           # Vercel Serverless Function Handlers
│   ├── screen.ts                  # /api/screen endpoint for query evaluation
│   ├── stocks.ts                  # /api/stocks endpoint for stock universe queries
│   ├── stock.ts                   # /api/stock endpoint for single stock data
│   └── suggest.ts                 # /api/suggest endpoint for syntax & metric validation
├── data/
│   ├── screener.db                # Local SQLite database (gitignored)
│   └── screener.db.part_*         # 40MB database split chunks tracked in Git
├── data_pipeline/                 # Python backend pipeline
│   ├── data_fetcher.py            # Financial and fundamental data fetcher
│   └── screener_engine.py         # Python query translator & SQL generator
├── scripts/
│   └── generate_stocks_dataset.py # Comprehensive financial dataset generator
├── src/
│   ├── components/
│   │   ├── Header.tsx             # Main navigation bar and market indices ticker
│   │   ├── ScreenQueryBuilder.tsx # Interactive query editor with ratio chips
│   │   ├── ScreenResultsTable.tsx # Sortable results grid with custom column picker
│   │   ├── PresetScreens.tsx      # Curated strategy catalog
│   │   ├── CommandPalette.tsx     # Global search modal (Ctrl+K)
│   │   ├── SaveScreenModal.tsx    # Modal for persisting user-defined screens
│   │   ├── Footer.tsx             # Footer and compliance notices
│   │   └── StockDetail/           # Detailed financial statement views
│   │       ├── StockHeader.tsx
│   │       ├── StockProsCons.tsx
│   │       ├── StockCharts.tsx
│   │       ├── QuarterlyResultsTable.tsx
│   │       ├── ProfitLossTable.tsx
│   │       ├── BalanceSheetTable.tsx
│   │       ├── CashFlowTable.tsx
│   │       ├── RatiosTable.tsx
│   │       ├── ShareholdingPatternTable.tsx
│   │       ├── PeersTable.tsx
│   │       └── StockDocuments.tsx
│   ├── engine/
│   │   ├── metricsDictionary.ts   # Catalog of 100+ ratios and aliases
│   │   ├── screenerParser.ts      # Lexer, AST Parser, and Query Evaluator
│   │   └── prosAndConsGenerator.ts# Algorithmic pros and cons rule engine
│   ├── types/
│   │   └── stock.ts               # TypeScript interfaces and domain models
│   ├── data/
│   │   ├── screens.ts             # Curated screening strategies
│   │   └── stocksData.ts          # Pre-compiled stock dataset
│   ├── App.tsx                    # Application shell and state management
│   └── main.tsx                   # React root entrypoint
├── tests/
│   ├── screenerParser.test.ts     # Vitest unit test suite for query parser
│   └── test_screener.py           # Pytest test suite for Python engine
├── db_split_join.py               # SQLite file split and join utility
├── scanner.py                     # Command-line stock screening utility
├── package.json                   # Node.js project manifest and build scripts
├── requirements.txt               # Python package dependencies
├── vite.config.ts                 # Vite build and manual chunk configuration
├── tailwind.config.js             # Tailwind CSS design system configuration
└── vercel.json                    # Vercel routing and serverless configuration
```

---

## Installation and Local Development

### System Requirements
- **Node.js**: Version 18.0 or higher
- **Python**: Version 3.10 or higher

### 1. Frontend Setup
```bash
# Clone the repository
git clone https://github.com/abhy-kumar/filterer.git
cd filterer

# Install dependencies
npm install

# Start the local development server
npm run dev

# Run TypeScript unit tests
npm test

# Build for production
npm run build
```

### 2. Python Virtual Environment Setup
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run the CLI scanner with a preset screen
python scanner.py --preset debt-free

# Run a custom screener query via CLI
python scanner.py "Return on capital employed > 25 AND Debt to equity < 0.1"

# Run Python unit tests
pytest
```

---

## Vercel Deployment

Filterer is configured for instant deployment to Vercel without requiring custom build parameters:

1. Push your repository to GitHub.
2. Link the repository inside the [Vercel Dashboard](https://vercel.com).
3. Vercel automatically detects the Vite framework and applies the routing defined in `vercel.json`.
4. Deploy the project.

The application serves static frontend assets via Edge CDN while routing API requests to serverless execution handlers.

---

## Database Split and Join Handling

To comply with GitHub's 50MB file size limit, the SQLite database (`data/screener.db`) is divided into 40MB chunks (`data/screener.db.part_*`).

- **To assemble the local SQLite database from parts:**
  ```bash
  python db_split_join.py join
  ```
- **To chunk the SQLite database after schema or data updates:**
  ```bash
  python db_split_join.py split
  ```

---

## Testing

The codebase includes automated test suites for both TypeScript and Python components:

- **TypeScript AST Parser Tests**:
  ```bash
  npx vitest run
  ```
- **Python Query Translation and Database Tests**:
  ```bash
  pytest
  ```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for complete details.

---

## Disclaimer

All financial data, calculations, and screening tools provided within this project are intended solely for educational, informational, and quantitative research purposes. They do not constitute investment or financial advice.
