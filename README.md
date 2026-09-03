# Filterer

Filterer is an open-source, institutional-grade equity research terminal and screener for Indian equities (NSE and BSE). It parses and evaluates Screener.in-style natural language queries directly within the browser, executes multi-variable fundamental formulas in sub-millisecond timeframes, and renders interactive financial statements, corporate filing disclosures, peer comparisons, and TradingView technical charts.

Coverage encompasses the live constituent universe of the NSE Nifty 500, with multi-year financial statements, balance sheets, cash flows, and institutional ownership records.

---

## Architectural Principles

Filterer is built around five core design invariants:

1. Client-Side Evaluation: Queries are tokenized, parsed into an Abstract Syntax Tree (AST), and evaluated in the client runtime. A full screen across 500 companies executes in sub-millisecond intervals without network latency.
2. Two-Tier Data Layer:
   - Screening Tier (`src/data/stocksData.ts`, ~1.05 MB): Scalar fundamental and technical metrics required for screening, bundled directly for instant filtering.
   - Detail Tier (`public/data/stocks/*.json`, ~21.9 MB across 500 files): Comprehensive financial statements, quarterly results, balance sheets, cash flow statements, historical shareholding, and daily price series loaded on demand when a company profile is visited.
3. Authentic Filing Integrity: Filterer strictly rejects synthetic filler and mathematical interpolation. When upstream exchange feeds omit a filing period, the interface reports the gap transparently via regulatory disclosure notices rather than fabricating numbers.
4. TradingView Canvas Engine: Interactive technical price charts powered by TradingView Lightweight Charts, providing historical price action, volume histograms, 50-day SMA, 200-day SMA, and 20-day EMA overlays.
5. Dual Execution Surfaces: Queries execute interchangeably in the web client via recursive-descent parsing and in the terminal through `scanner.py`.

---

## Systems Architecture

```
                             [ NSE / BSE Filings / Yahoo Finance ]
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
   │   SQLite Vector Store   │                                   │   Vercel / Static CDN   │
   │    (data/screener.db)   │                                   │  (public/data/stocks/)  │
   │  [Chunked via 40MB Git] │                                   │  [500 Detail Profiles]  │
   └────────────┬────────────┘                                   └────────────┬────────────┘
                |                                                             |
                v                                                             v
   ┌─────────────────────────┐                                   ┌─────────────────────────┐
   │   Terminal CLI Scanner  │                                   │   React / Vite Web UI   │
   │       (scanner.py)      │                                   │ (Client-Side AST Engine)│
   └─────────────────────────┘                                   └─────────────────────────┘

   Automated via GitHub Actions: market quotes updated across trading days into the
   screening tier; comprehensive statement reconciliation executed weekly.
```

---

## Key Platform Features

### Interactive TradingView Charts
- Canvas-rendered price action with crosshair inspection and high-frequency hover response.
- Technical overlays: 50-Day Simple Moving Average (SMA 50), 200-Day Simple Moving Average (SMA 200), and 20-Day Exponential Moving Average (EMA 20).
- Toggleable volume histogram bars.
- Dynamic timeframe filters: 1 Month, 6 Months, 1 Year, 3 Years, 5 Years, and Maximum History.
- Valuation multiple analysis: Trailing P/E tracking against 10-year historical median valuation bands.
- Financial trajectory charts: Annual revenue, net profit, and Operating Profit Margin (OPM%) trends.

### Financial Terminal Top Bar
- Live market status pill with animated beacon reflecting real-time NSE and BSE trading session status.
- Real-time IST clock synchronized with market hours.
- Interactive index capsules displaying current price and percentage change for Nifty 50, Sensex, Nifty Bank, Nifty IT, Nifty Pharma, and Nifty Auto.
- On-demand quote refresh button with live spinning feedback.
- Session indicator distinguishing active live stream quotes from official exchange closing prices.

### Institutional Financial Modeling
- 9-Criteria Piotroski F-Score: Derived from year-over-year profitability, leverage, liquidity, and operating efficiency metrics.
- Altman Z-Score: Evaluates balance sheet credit risk and distress probabilities using working capital, retained earnings, EBIT, market value of equity, and total liabilities.
- Schedule III Balance Sheet Footing: Ensures total assets balance total liabilities and equity.
- 100% Verified BSE Codes: Cross-referenced against Zerodha Kite official instrument masters.

---

## Query Language Specification

Filterer implements a deterministic recursive-descent/Pratt parser compatible with Screener.in formula syntax.

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

### Operator Precedence and Associativity

| Precedence | Operator | Description | Associativity |
|---|---|---|---|
| 1 (Highest) | `( ... )` | Parenthetical Grouping | None |
| 2 | `*`, `/`, `%` | Multiplication, division, modulo | Left-to-Right |
| 3 | `+`, `-` | Addition, subtraction | Left-to-Right |
| 4 | `>`, `<`, `>=`, `<=`, `=`, `!=` | Relational comparison | None |
| 5 | `AND` | Logical conjunction | Left-to-Right |
| 6 | `NOT` | Logical negation | Right-to-Left |
| 7 (Lowest) | `OR` | Logical disjunction | Left-to-Right |

### Example Queries

Quality Compounders:
```sql
Market Capitalization > 1000 AND Return on capital employed > 22 AND Debt to equity < 0.2 AND Profit growth 3Years > 15
```

Graham Value Strategy:
```sql
Current price < Graham Number AND Price to book < 1.5 AND Debt to equity < 0.5
```

Sector Relative Valuation:
```sql
Price to Earning < Industry PE AND Operating profit margin > 18 AND Relative Strength Index > 45
```

Solvency and Cash Generation:
```sql
Free cash flow yield > 4 AND Piotroski score >= 7 AND Debt to equity < 0.3
```

---

## Metric Catalog

Filterer supports over 70 standardized financial, fundamental, and technical metrics:

| Category | Canonical Names | Shorthand Aliases | Unit |
|---|---|---|---|
| Market and Valuation | Market Capitalization, Current Price, Price to Earning, Price to Book, PEG Ratio, Graham Number, EV / EBITDA, Price to Sales | mcap, cmp, price, pe, pb, peg, graham number, ev/ebitda | INR Cr / Multiple |
| Profitability | Return on Capital Employed, Return on Equity, Operating Profit Margin, Net Profit Margin, Earnings Per Share | roce, roe, opm, npm, eps | % / INR |
| Growth Rates | Sales Growth [3Y, 5Y, 10Y], Profit Growth [3Y, 5Y, 10Y], Price CAGR [1Y, 3Y, 5Y] | sales 3y, profit 5y, cagr 3y | % |
| Balance Sheet Health | Debt to Equity, Total Debt, Interest Coverage Ratio, Current Ratio, Quick Ratio, Altman Z-Score | d/e, debt, interest coverage, z-score | Ratio / Multiple |
| Cash Flow and Quality | Free Cash Flow Yield, Piotroski Score, Cash Conversion Cycle, Operating Cash Flow 3Y | fcf yield, f-score, ccc, ocf 3y | % / Score / Days |
| Shareholding | Promoter Holding, FII Holding, DII Holding, Pledged Percentage | promoter stake, fii, dii, pledge | % |
| Technical Indicators | 50 Day Moving Average, 200 Day Moving Average, 20 Day EMA, Relative Strength Index, Distance from 52W High | dma 50, dma 200, ema 20, rsi, down from 52w high | INR / % / Points |

---

## Data Integrity and Regulatory Disclosures

Filterer adheres to institutional financial reporting principles:

1. Zero Synthetic Data: If an upstream exchange filing has an unreported or missing quarter (such as statutory XBRL omissions), the application notes the omission explicitly in statement footnotes rather than inventing synthetic averages.
2. Verified Ingestion: Balance sheet equality, dynamic price averages, and BSE security mappings are verified against official exchange datasets and regulatory registries.
3. Accounting Disclosures: Consolidated versus standalone differences, unusual corporate distribution yields, and reclassifications are highlighted through structured disclosure panels.

---

## Local Development and Setup

### Prerequisites
- Node.js: v18.0.0 or higher
- Python: v3.10 or higher
- PowerShell (Windows) or Bash (macOS/Linux)

### 1. Web Application Setup

```bash
# Clone the repository
git clone https://github.com/abhy-kumar/filterer.git
cd filterer

# Install dependencies
npm install

# Start local Vite development server
npm run dev

# Execute unit and invariant test suite
npm test

# Build production bundle
npm run build
```

### 2. Python Pipeline and CLI Scanner

```bash
# Create and activate virtual environment
python -m venv .venv

# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# On macOS/Linux:
source .venv/bin/activate

# Install pipeline dependencies
pip install -r requirements.txt

# Join SQLite database parts (required for local backend execution)
python db_split_join.py join

# Run comprehensive data healing and validation pipeline
python data_pipeline/heal_and_enrich.py

# Run CLI scanner with custom queries
python scanner.py "Return on capital employed > 20 AND Debt to equity < 0.2"

# Run Python test suite
pytest tests/
```

---

## Database Version Control Policy

GitHub enforces a 50MB file size limit for tracked files. Consequently:
- The compiled database `data/screener.db` is not tracked directly in Git.
- It is tracked in 40MB chunks under `data/screener.db.part_*`.
- Assemble before running Python scripts:
  ```bash
  python db_split_join.py join
  ```
- Split before committing changes:
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
