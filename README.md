# Filterer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab?logo=python)](https://python.org/)
[![Test Suite](https://img.shields.io/badge/Tests-95%20Passed-emerald)](tests/)

Filterer is an open-source, institutional-grade equity research terminal and screener for Indian equities (NSE and BSE). It provides sub-millisecond client-side formula evaluation, complete financial statements, company operational KPIs, marquee investor holdings, global input commodity cycles, and interactive TradingView technical charting across the NSE Nifty 500 constituent universe.

Designed as a high-performance alternative to traditional equity portals, Filterer combines deterministic recursive-descent query parsing directly in the browser runtime with automated Python data ingestion pipelines and SQLite persistence.

---

## Architecture and Core Design

Filterer is architected around five operational invariants:

1. **Sub-Millisecond Client-Side Evaluation**: Screener queries are tokenized, transformed into an Abstract Syntax Tree (AST), and evaluated in the client runtime via a recursive-descent / Pratt parser. Screening across 500 equities completes in under 1.5 milliseconds with zero network roundtrips.
2. **Two-Tier Data Topology**:
   - **Screening Tier** (`src/data/stocksData.ts`, ~1.05 MB): Bundled scalar fundamental, valuation, financial, and technical metrics enabling instant offline filtering and sorting.
   - **Detail Tier** (`public/data/stocks/*.json`, ~22 MB across 500 files): Asynchronously hydrated comprehensive filings, multi-year balance sheets, quarterly statements, cash flow statements, historical shareholding patterns, and daily closing price histories.
3. **Filing Integrity and Disclosure Transparency**: Synthetic fillers and mathematical extrapolations are strictly prohibited. In periods where upstream regulatory feeds exhibit reporting gaps (e.g. statutory XBRL omissions), the interface surfaces official disclosure notices rather than fabricating interpolated figures.
4. **Interactive TradingView Canvas Engine**: Price action, moving averages (SMA 50, SMA 200, EMA 20), volume histograms, and historical median P/E valuation envelopes are rendered via TradingView Lightweight Charts with crosshair precision.
5. **Harmonized Terminal Design System**: Distraction-free, responsive layout grid adhering to institutional financial ergonomics, including real-time market trading session clocks, live index tickers (Nifty 50, Sensex, Bank Nifty, IT, Pharma, Auto), and uniform typography across all workspaces.

---

## System Topology

```
                         [ NSE / BSE Regulatory Filings / Yahoo Finance ]
                                               |
                                               v
                                ┌───────────────────────────────┐
                                │     Python Data Pipeline      │
                                │  (data_pipeline/data_fetcher) │
                                └───────┬───────────────┬───────┘
                                        |               |
                 ┌──────────────────────┘               └──────────────────────┐
                 v                                                             v
    ┌─────────────────────────┐                                   ┌─────────────────────────┐
    │   SQLite Master Store   │                                   │   Vercel / Static CDN   │
    │    (data/screener.db)   │                                   │  (public/data/stocks/)  │
    │  [Chunked via 40MB Git] │                                   │  [500 Detail Profiles]  │
    └────────────┬────────────┘                                   └────────────┬────────────┘
                 |                                                             |
                 v                                                             v
    ┌─────────────────────────┐                                   ┌─────────────────────────┐
    │   Terminal CLI Scanner  │                                   │   React / Vite Web UI   │
    │       (scanner.py)      │                                   │ (Client-Side AST Engine)│
    └────────────┬────────────┘                                   └────────────┬────────────┘

    Automated via GitHub Actions: bundled prices refreshed three times a trading day,
    filed results and shareholding every evening, Yahoo fundamentals weekly.
    Live quotes are served on request by /api/quotes, cached at the CDN.
```

---

## Data Sources

Everything is free to fetch and needs no API key.

| Data | Source | Refreshed |
|---|---|---|
| Live prices and index levels | Yahoo Finance spark API, with BSE's quote API as fallback (`api/quotes.ts`, `api/market_indices.ts`) | On request, cached 20 seconds while the market is open |
| Quarterly results | NSE XBRL filings, integrated and legacy listings, about 12 quarters (`data_pipeline/nse_filings.py`) | Every evening |
| Shareholding, including the FII / DII split, and every holder of 1% or more | NSE shareholding pattern XBRL | Every evening |
| Super-investor portfolios | The shareholding filings above, matched to the names in `data/super_investors/registry.json` (`data_pipeline/super_investors.py`) | Every evening |
| Closing prices for companies outside the Nifty 500 | NSE bhavcopy | Every evening |
| Annual statements, balance sheets, cash flow, price history | Yahoo Finance via yfinance | Weekly |

Filed data takes precedence: where NSE's XBRL is available, quarterly results come from it rather than from Yahoo, and the quarterly table says which source and which basis (consolidated or standalone) it is showing.

## Workspace Modules

### 1. Screens
- Access curated investment screens categorized by **Popular**, **Valuation**, **Growth**, **Technicals**, **Safety**, and **Dividends**.
- Real-time match counters indicating live universe hit counts for each strategy.
- Instant single-click execution displaying filter results with responsive pagination, multi-column sorting, and custom column configuration.

### 2. Query Builder
- Natural language query editor compatible with Screener.in syntax supporting arithmetic expressions, relational operators, nested boolean logic (`AND`, `OR`, `NOT`), and parentheses.
- **Formula Editor Terminal**: Built-in syntax highlighting, real-time error detection, and field coverage validation alerting users if a metric has low or zero disclosures.
- **Ratio Catalog**: Built-in searchable dictionary of 74 standardized fundamental, valuation, profitability, debt, and cash flow metrics with shorthand aliases.
- Pre-built quick condition chips and query formatting tools.

### 3. Watchlists & Portfolio Analytics
- Create, modify, and delete custom stock baskets (e.g. *Compounders*, *High Dividend*, *Turnaround Plays*).
- Aggregated real-time basket metrics: Aggregate Market Capitalization, Weighted Average P/E, Average ROCE, and Day Change.
- Instant stock addition via detail view modal or command palette.
- Local persistence across browser sessions with zero login friction.

### 4. Super-Investors
- Portfolios read from the shareholding patterns companies file with NSE, not typed in: stake, share count, filing quarter and the change since the previous filing all come from the filing.
- Curated investors are matched by the names they file under, listed in `data/super_investors/registry.json`; the registry says who an investor is, never what they hold. Individuals with 1% or more of several companies are also discovered from the filings.
- Covers the Nifty 500 plus the smaller companies tracked investors hold, valued at NSE's closing price.
- Stakes that disappear between filings are listed as no longer disclosed.
- Limits, stated on the page: filings only name holders of 1% or more, and stakes held through entities not in the registry are missed, so a portfolio is a floor.

### 5. Input Commodities Tracker
- Real-time tracking of **27 global and domestic benchmark commodities** across **Energy**, **Chemicals**, **Metals**, **Agriculture**, and **Polymers**.
- Metric benchmarks including Brent Crude, Natural Gas, Thermal Coal, HRC Steel, LME Copper, Gold, Silver, Iron Ore, Caustic Soda, Soda Ash, PTA, MEG, and HDPE.
- Interactive historical multi-year price cycle charts (1M, 6M, 1Y, 3Y, 5Y, Max).
- **Equities Impact Matrix**: Direct mapping showing Indian listed producers (beneficiaries) and listed consumer sectors (margin sensitivity) for every commodity.

### 6. Company Analysis & Operational KPIs
- **Financial Statements**: Multi-year Annual P&L, Balance Sheet (Schedule III compliant), and Cash Flow Statements (Operating, Investing, Financing, Free Cash Flow).
- **Quarterly Results**: About twelve quarters from NSE's XBRL filings, on one basis per company, with banks shown in their own layout (interest earned, financing profit).
- **Insights**: For every company, computed from its own filings: the latest quarter against the same quarter a year earlier, the trailing four quarters, sales record, margin trajectory, where return on equity comes from, cash conversion, debt, ownership changes and valuation against its own five-year history. Each insight names the periods and source it was drawn from.
- **Live prices**: Quotes update every 20 seconds while the market is open, with a label saying how current each price is.
- **Operating KPIs**: Hand-compiled operating metrics for about two dozen companies, labelled as compiled by hand and not traced to a filing:
  - *Reliance*: Retail Store Footprint, Jio Subscriber Base, Jio Data Consumption, KG D6 Gas Output, Refinery Throughput, Jio ARPU, Retail Footfall, Jio-bp Network.
  - *HDFC Bank*: CASA Ratio, Net Interest Margin (NIM), GNPA%, Branch Network, Credit-to-Deposit Ratio, Capital Adequacy (CRAR).
  - *Tata Motors*: JLR Wholesales, India Commercial Vehicle Volume, Passenger EV Share, JLR Order Book, EBITDA Margin.
  - *TCS*: Active Headcount, Trailing LTM Attrition, IT Services Utilization, Total Contract Value (TCV).
  - *IndiGo*: Fleet Count, Available Seat Kilometers (ASK), Passenger Load Factor (PLF), Revenue per ASK (RASK), Yield per RPK.
  - *Zomato*: GOV Food Delivery, Blinkit Dark Stores, Blinkit GOV, Average Order Value (AOV).
- **Algorithmic Pros & Cons**: Heuristic evaluation analyzing debt reduction, interest coverage, 5-year profit growth, working capital cycle, and dividend payout history.
- **Peer Comparison**: Direct benchmarking against sector rivals by P/E, Market Cap, ROCE, and Operating Margin.
- **Corporate Filings**: Verified links to exchange disclosures, annual reports, credit rating upgrades, and investor conference call transcripts.

---

## Query Language Specification

Filterer implements a deterministic Pratt / recursive-descent parser compatible with Screener.in syntax.

### EBNF Grammar

```ebnf
Expression     ::= LogicalOr ;
LogicalOr      ::= LogicalAnd ( "OR" LogicalAnd )* ;
LogicalAnd     ::= LogicalNot ( "AND" LogicalNot )* ;
LogicalNot     ::= "NOT" LogicalNot | Comparison ;
Comparison     ::= Additive ( ( ">" | "<" | ">=" | "<=" | "=" | "==" | "!=" ) Additive )? ;
Additive       ::= Multiplicative ( ( "+" | "-" ) Multiplicative )* ;
Multiplicative ::= Primary ( ( "*" | "/" | "%" ) Primary )* ;
Primary        ::= Identifier | Number | "(" Expression ")" ;
```

### Operator Precedence

| Level | Operator | Operation | Associativity |
|---|---|---|---|
| 1 (Highest) | `( ... )` | Parenthetical Grouping | None |
| 2 | `*`, `/`, `%` | Multiplication, Division, Modulo | Left-to-Right |
| 3 | `+`, `-` | Addition, Subtraction | Left-to-Right |
| 4 | `>`, `<`, `>=`, `<=`, `=`, `!=` | Relational Comparisons | None |
| 5 | `AND` | Logical Conjunction | Left-to-Right |
| 6 | `NOT` | Logical Negation | Right-to-Left |
| 7 (Lowest) | `OR` | Logical Disjunction | Left-to-Right |

### Sample Formulas

**Quality Compounders:**
```sql
Market Capitalization > 1000 AND Return on capital employed > 20 AND Debt to equity < 0.2 AND Sales growth 3Years > 12
```

**Graham Value Strategy:**
```sql
Current price < Graham Number AND Price to book < 1.5 AND Debt to equity < 0.5
```

**Cash Flow Solvency:**
```sql
Free cash flow yield > 4 AND Piotroski score >= 7 AND Interest Coverage Ratio > 4
```

**Relative Sector Valuation:**
```sql
Price to Earning < Industry PE AND Operating profit margin > 18 AND Relative Strength Index > 40
```

---

## Supported Metric Catalog

Filterer provides native screening and analysis support for the standardized financial metrics below:

| Category | Standard Identifier | Shorthand Aliases | Unit |
|---|---|---|---|
| **Valuation** | Market Capitalization, Current Price, Price to Earning, Price to Book, PEG Ratio, Graham Number, EV / EBITDA, Price to Sales | `mcap`, `cmp`, `price`, `pe`, `pb`, `peg`, `graham number`, `ev/ebitda` | INR Cr / Multiple |
| **Profitability** | Return on Capital Employed, Return on Equity, Operating Profit Margin, Net Profit Margin, Earnings Per Share | `roce`, `roe`, `opm`, `npm`, `eps` | % / INR |
| **Growth Rates** | Sales Growth [3Y, 5Y, 10Y], Profit Growth [3Y, 5Y, 10Y], Price CAGR [1Y, 3Y, 5Y] | `sales 3y`, `profit 5y`, `cagr 3y` | % |
| **Balance Sheet** | Debt to Equity, Total Debt, Interest Coverage Ratio, Current Ratio, Quick Ratio, Altman Z-Score | `d/e`, `debt`, `interest coverage`, `z-score` | Ratio / Multiple |
| **Cash Generation** | Free Cash Flow Yield, Piotroski Score, Cash Conversion Cycle, Operating Cash Flow 3Y | `fcf yield`, `f-score`, `ccc`, `ocf 3y` | % / Score / Days |
| **Shareholding** | Promoter Holding, FII Holding, DII Holding, Pledged Percentage | `promoter stake`, `fii`, `dii`, `pledge` | % |
| **Technicals** | 50 Day Moving Average, 200 Day Moving Average, 20 Day EMA, Relative Strength Index, Distance from 52W High | `dma 50`, `dma 200`, `ema 20`, `rsi`, `down from 52w high` | INR / % / Points |


### Metric coverage

Not every metric in the catalog is populated for this universe, and the ones that
are not report as "not reported" rather than as zero. Screening on them returns
nothing rather than everything, and the formula editor flags a metric with low
coverage as you type.

| Metric | Coverage | Why |
|---|---|---|
| Sales / profit growth 5Y and 10Y | none | The upstream feed carries four years of annual statements; a five-year CAGR needs six. |
| Current ratio, quick ratio | 7% | The balance sheet has no current asset / current liability split. |
| Debtor days, inventory days, days payable, working capital days, cash conversion cycle | none | Same missing split. |
| FII / DII holding, pledged percentage | under 1% | Only promoter and public holdings come through the shareholding feed. |
| Multi-year ROE (3Y, 5Y, 10Y) | 11% | Needs a per-year book value the statements do not carry. |

The Piotroski F-score is scored on eight of its nine signals for the same reason:
the liquidity test needs the current split. The Altman Z-score is not reported for
banks and NBFCs, whose balance sheets the manufacturing coefficients misread.

---

## Local Development and Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.10 or higher
- **Git**

### 1. Web Application

```bash
# Clone repository
git clone https://github.com/abhy-kumar/filterer.git
cd filterer

# Install dependencies
npm install

# Launch local development server (Vite HMR)
npm run dev

# Run unit tests and invariant verification suite
npm test

# Build production bundle
npm run build
```

### 2. Python Data Pipelines and CLI Scanner

```bash
# Initialize Python virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install pipeline dependencies
pip install -r requirements.txt

# Join chunked database parts (required before running local backend tools)
python db_split_join.py join

# Execute terminal CLI scanner with formula
python scanner.py "Return on capital employed > 22 AND Debt to equity < 0.2"

# Execute data healing and statement reconciliation pipeline
python data_pipeline/heal_and_enrich.py

# Run Python test suite
pytest tests/
```

---

## Database Partitioning Policy

To comply with GitHub's 50MB file size limit for tracked repositories:
- The master SQLite database (`data/screener.db`) is **not tracked directly** in Git and remains in `.gitignore`.
- The database is committed as 40MB chunk parts under `data/screener.db.part_*`.

**Instructions for Contributors:**
- **Before running backend Python tools**:
  ```bash
  python db_split_join.py join
  ```
- **After modifying database tables or generating new datasets**:
  ```bash
  python db_split_join.py split
  ```

---

## Project Information

Developed by Abhishek K (FT-25-202) for the Mergers & Acquisitions course at Faculty of Management Studies (FMS), University of Delhi.

---

## License and Disclaimer

Distributed under the MIT License. See LICENSE for more information.

Disclaimer: Filterer is an independent open-source research and educational utility. It is not affiliated with, endorsed by, or associated with Mittal Analytics Private Ltd or Screener.in.
