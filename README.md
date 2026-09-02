# Filterer ⚡

> **A High-Performance, Free & Open-Source Alternative to Screener.in for Indian Equities (NSE/BSE)**

[![Vercel Ready](https://img.shields.io/badge/Vercel-Ready-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview

**Filterer** is a free, modern, open-source stock screening and fundamental analysis workspace designed for Indian equity markets. It implements full query compatibility with **Screener.in**, allowing value investors, quantitative analysts, and traders to run natural financial queries, compound boolean formulas, and technical filters with **zero cold-start latency**.

Filterer operates as a **hybrid client-serverless engine**:
1. **Client-Side AST Evaluator**: Fast in-browser expression parser and evaluator for instant real-time filtering without round-trip lag.
2. **Vercel Serverless API**: Ready-to-deploy endpoints (`/api/screen`, `/api/stocks`, `/api/stock`, `/api/suggest`) for programmatic screening and integration.
3. **Python Quant Pipeline**: CLI scanner (`scanner.py`), yfinance data fetchers, and SQLite database chunking (`db_split_join.py`) for repository compliance.

---

## 🚀 Key Features

### 1. 🔍 Screener.in Natural Query Language Engine
Write queries using the exact same syntax and formulas as Screener.in:
```sql
Market Capitalization > 500 AND Return on capital employed > 20 AND Debt to equity < 0.1 AND Sales growth 3Years > 15
```
- **Boolean Operators**: `AND`, `OR`, `NOT`, and parenthetical grouping `( ... )`.
- **Comparison Operators**: `>`, `<`, `>=`, `<=`, `=`, `==`, `!=`.
- **Mathematical Expressions**: `+`, `-`, `*`, `/`, `%` (e.g. `Current price < 0.85 * High price`, `Operating cash flow 3years > Net profit 3years`).
- **Real-Time Syntax Validator**: Instant error detection with line/token pointers.
- **Auto-Formatter**: Beautifies queries with standard indentation and uppercase keywords with 1-click.

### 2. 📊 Comprehensive Company Analysis Page
Clicking any stock opens an in-depth financial analysis workspace:
- **Header & 12 Key Ratio Cards**: CMP, Market Cap, 52W Range gauge, P/E, Book Value, Div Yield, ROCE, ROE, Face Value, PEG Ratio, Graham Number, Industry P/E.
- **Algorithmic Pros & Cons**: Heuristic engine highlighting debt reduction, ROE track record, margin expansion, or high debtor days.
- **Interactive Technical & Valuation Charts**:
  - Price & 50 DMA / 200 DMA + Volume bars
  - Historical P/E ratio valuation band
  - Annual Revenue vs. Operating Profit Margin (OPM %) trend
- **Quarterly Results Table**: 8+ quarters with Sales, Expenses, Operating Profit, OPM %, Interest, PBT, Tax, Net Profit, EPS.
- **10-Year Annual Profit & Loss Statement**: Multi-year view with Compounded Growth cards (Sales CAGR, Profit CAGR, Stock Price CAGR, ROE).
- **10-Year Balance Sheet**: Detailed assets, liabilities, borrowings, and reserves tracking.
- **10-Year Cash Flow Statement**: Operating Cash Flow (CFO), Investing CF, Financing CF, Free Cash Flow (FCF).
- **10-Year Ratios History**: ROCE, ROE, Debtor Days, Inventory Days, Days Payable, Cash Conversion Cycle.
- **Shareholding Breakdown**: Quarterly trend for Promoter, FII, DII, Public, and Pledged %.
- **Peer Comparison**: Compare with sector and industry peers.

### 3. 🎯 12 Pre-Configured Curated Screens
- 🚀 **Magic Formula**: Joel Greenblatt's high ROCE + low P/E compounders.
- 🛡️ **Debt-Free Compounders**: Zero debt companies delivering >15% 5Y profit CAGR.
- 📈 **Consistent Growth Champions**: >15% 3Y and 5Y Sales & Profit growth.
- 💎 **Graham Undervalued Bargains**: Safe balance sheets trading below Graham Number.
- ⚡ **Golden Crossover Momentum**: 50 DMA above 200 DMA with RSI confirmation.
- 🏛️ **Institutional Buying**: Increasing FII & DII holdings in recent quarters.
- 👑 **High Piotroski F-Score**: Financially sound companies (Score >= 7) with safe Altman Z-Score.
- 💰 **Cash Flow Kings**: High Free Cash Flow Yield (>4%) and strong CFO.
- 💸 **High Dividend Aristocrats**: High dividend yield backed by strong ROCE and low debt.
- 🔍 **Near 52-Week High with Value**: Breakout candidates trading at reasonable valuations.

---

## 📖 Screener Query Syntax Reference

### Supported Ratio Aliases (100+ Variations)
| Screener Metric | Aliases Supported | Unit |
|---|---|---|
| **Market Capitalization** | `market cap`, `mcap`, `mar cap`, `market_cap` | ₹ Cr |
| **Current Price** | `cmp`, `price`, `stock price`, `current price` | ₹ |
| **Price to Earning** | `pe`, `p/e`, `stock p/e`, `pe ratio`, `price to earning` | x |
| **Industry PE** | `industry pe`, `sector pe`, `industry p/e` | x |
| **Book Value** | `bv`, `book value`, `bvps` | ₹ |
| **Price to Book Value** | `pb`, `p/bv`, `p/b`, `price to book` | x |
| **PEG Ratio** | `peg`, `peg ratio`, `price to earning to growth` | x |
| **Return on Capital Employed** | `roce`, `return on capital employed`, `roce %` | % |
| **Return on Equity** | `roe`, `return on equity`, `roe %` | % |
| **Operating Profit Margin** | `opm`, `opm %`, `operating margin` | % |
| **Net Profit Margin** | `npm`, `npm %`, `net profit margin`, `pat margin` | % |
| **Sales Growth 3Years** | `sales growth 3years`, `sales growth 3y`, `sales 3y cagr` | % |
| **Sales Growth 5Years** | `sales growth 5years`, `sales growth 5y`, `sales 5y cagr` | % |
| **Profit Growth 3Years** | `profit growth 3years`, `profit growth 3y`, `profit 3y cagr` | % |
| **Profit Growth 5Years** | `profit growth 5years`, `profit growth 5y`, `profit 5y cagr` | % |
| **Debt to Equity** | `debt to equity`, `d/e`, `debt / equity` | x |
| **Total Debt** | `debt`, `total debt`, `borrowings` | ₹ Cr |
| **Piotroski Score** | `piotroski score`, `piotroski`, `f-score` | Score (0-9) |
| **Altman Z-Score** | `altman z-score`, `altman z score`, `z-score` | Score |
| **Free Cash Flow Yield** | `fcf yield`, `free cash flow yield` | % |
| **Free Cash Flow** | `fcf`, `free cash flow`, `free cash flow latest` | ₹ Cr |
| **Operating Cash Flow 3Years** | `operating cash flow 3years`, `cfo 3y` | ₹ Cr |
| **Promoter Holding** | `promoter holding`, `promoter stake` | % |
| **Pledged Percentage** | `pledged percentage`, `pledge %`, `promoter pledge` | % |
| **Change in FII Holding** | `change in fii holding`, `fii change` | % |
| **Change in DII Holding** | `change in dii holding`, `dii change` | % |
| **DMA 50** | `dma 50`, `50 dma`, `50 day moving average` | ₹ |
| **DMA 200** | `dma 200`, `200 dma`, `200 day moving average` | ₹ |
| **RSI** | `rsi`, `rsi 14`, `relative strength index` | Score (0-100) |
| **High Price** | `high price`, `52w high`, `52 week high` | ₹ |
| **Distance from 52w High** | `distance from 52w high`, `down from 52w high` | % |

---

## 🛠️ Project Structure

```
filterer/
├── .agents/
│   └── AGENTS.md                  # Workspace rules & DB split/join documentation
├── api/                           # Vercel Serverless Functions
│   ├── screen.ts                  # /api/screen endpoint
│   ├── stocks.ts                  # /api/stocks endpoint
│   ├── stock.ts                   # /api/stock endpoint
│   └── suggest.ts                 # /api/suggest endpoint
├── data/
│   ├── screener.db                # SQLite database (local, gitignored)
│   └── screener.db.part_*         # 40MB database chunks tracked in Git
├── data_pipeline/                 # Python data engine
│   ├── data_fetcher.py            # NSE/BSE yfinance live & historical fetcher
│   └── screener_engine.py         # Python query parser & SQL translator
├── scripts/
│   └── generate_stocks_dataset.py # Comprehensive dataset & SQLite generator
├── src/
│   ├── components/
│   │   ├── Header.tsx             # Top navigation & market ticker
│   │   ├── ScreenQueryBuilder.tsx # Interactive query editor & ratio chips
│   │   ├── ScreenResultsTable.tsx # Sortable table with custom column picker
│   │   ├── PresetScreens.tsx      # Curated strategy cards
│   │   ├── CommandPalette.tsx     # Global search modal (Ctrl+K)
│   │   ├── SaveScreenModal.tsx    # Save custom screens
│   │   ├── Footer.tsx             # Footer & disclaimer
│   │   └── StockDetail/           # Full company financial workspace
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
│   │   ├── metricsDictionary.ts   # 100+ metric definitions & aliases
│   │   ├── screenerParser.ts      # AST Lexer, Parser & Evaluator
│   │   └── prosAndConsGenerator.ts# Heuristic pros & cons engine
│   ├── types/
│   │   └── stock.ts               # Complete TypeScript interfaces
│   ├── data/
│   │   ├── screens.ts             # Curated preset screens
│   │   └── stocksData.ts          # Pre-compiled high-performance stock dataset
│   ├── App.tsx                    # Main root component
│   └── main.tsx                   # React DOM entry
├── tests/
│   ├── screenerParser.test.ts     # Vitest unit tests
│   └── test_screener.py           # Pytest python engine tests
├── db_split_join.py               # SQLite split/join tool for 50MB GitHub limits
├── scanner.py                     # CLI terminal stock scanner
├── package.json
├── requirements.txt               # Python virtual environment dependencies
├── vite.config.ts
├── tailwind.config.js
└── vercel.json                    # Vercel deployment configuration
```

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **Python**: v3.10+ (tested on v3.14)

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm test

# Build for production
npm run build
```

### 3. Python Virtual Environment Setup
```bash
# Create and activate virtual environment
python -m venv .venv

# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On macOS / Linux:
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run CLI scanner
python scanner.py --preset debt-free

# Run custom query in terminal
python scanner.py "Return on capital employed > 25 AND Debt to equity < 0.1"

# Run Python tests
pytest
```

---

## 🌐 Deploy to Vercel

Filterer is built to deploy effortlessly to Vercel with **zero extra configuration**:

1. Push this repository to GitHub: `https://github.com/abhy-kumar/filterer`
2. Import the project in your [Vercel Dashboard](https://vercel.com).
3. Vercel automatically detects the Vite framework and `vercel.json` configuration.
4. Click **Deploy**.

The app is fully serverless and works with 0ms cold starts out of the box!

---

## ⚖️ Database Split/Join Handling
Due to GitHub's 50MB file size limit for repositories, the main SQLite database (`data/screener.db`) is split into 40MB chunks (`data/screener.db.part_*`).

- **Join parts to create database locally**:
  ```bash
  python db_split_join.py join
  ```
- **Split database after updating data**:
  ```bash
  python db_split_join.py split
  ```

---

## 📜 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
