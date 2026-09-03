# Data Pipeline and Systems Architecture Documentation

This document provides a technical specification of the Filterer data architecture, ingestion pipeline, accounting verification models, and client-side AST execution engine.

---

## 1. Architectural Overview

Filterer is designed for high-performance equity research with complete client privacy and zero server round-trips during screening.

```
+-------------------------------------------------------------------------+
|                        Upstream Financial Feeds                         |
|  - Official NSE/BSE Corporate Filings (Quarterly XBRL & Shareholding)   |
|  - Zerodha Kite Instrument Master (Official Exchange Scrip Codes)       |
|  - Historical Price and Multi-Year Financial Statements                 |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                      Python Data Pipeline & Normalizer                  |
|  - data_pipeline/heal_and_enrich.py (Piotroski, Altman, DMAs, Footing)  |
|  - data_pipeline/fetch_authentic_quarters.py (Authentic Exchange Files) |
|  - data_pipeline/market_indices.py (Index Quotes & Market Status)       |
+------------------------------------+------------------------------------+
                                     |
                +--------------------+--------------------+
                |                                         |
                v                                         v
+-------------------------------+       +---------------------------------+
|   Local SQLite Store          |       |   Static & Edge CDN Tier        |
|   - data/screener.db          |       |   - src/data/stocksData.ts      |
|   - Chunked via 40MB Git      |       |   - public/data/stocks/*.json   |
|   - Backend CLI (scanner.py)  |       |   - public/data/market_indices  |
+-------------------------------+       +----------------+----------------+
                                                         |
                                                         v
                                        +---------------------------------+
                                        |   Browser Client Runtime        |
                                        |   - Recursive-Descent AST Engine|
                                        |   - TradingView Lightweight Lib |
                                        |   - Sub-millisecond Execution   |
                                        +---------------------------------+
```

---

## 2. Two-Tier Data Layer Specification

Filterer divides data into two distinct operational tiers to optimize initial load times and runtime memory:

### Tier 1: Screening Tier (`src/data/stocksData.ts`)
- Footprint: Approximately 1.05 MB (bundled directly into the application bundle).
- Purpose: Delivers instant, client-side formula evaluation across all 500 companies in the Nifty 500 universe.
- Metrics Included:
  - Valuation: Current Price, Market Capitalization, P/E, P/B, PEG, EV/EBITDA, Graham Number.
  - Profitability: ROCE, ROE, Operating Profit Margin (OPM%), Net Profit Margin (NPM%).
  - Financial Health: Debt to Equity, Interest Coverage Ratio, Altman Z-Score, Piotroski F-Score.
  - Multi-Year Growth: 3-Year and 5-Year Sales CAGR, 3-Year and 5-Year Profit CAGR.
  - Technicals: 50-Day SMA, 200-Day SMA, 20-Day EMA, RSI (14-Day), 52-Week Range and Drawdown.
  - Ownership: Promoter Holding, FII Holding, DII Holding, Pledged Percentage.

### Tier 2: Detail Tier (`public/data/stocks/{SYMBOL}.json`)
- Footprint: Approximately 21.9 MB distributed across 500 standalone JSON files.
- Purpose: Loaded on demand only when a user navigates to a specific stock detail page (`/stock/:symbol`).
- Datasets Included:
  - Historical Daily Price Action (up to 5 years of daily close, high, low, volume).
  - Quarterly Results (Sales, Expenses, Operating Profit, OPM%, Other Income, PBT, Tax%, Net Profit, EPS).
  - Annual Profit and Loss Statements (10-year historical trajectory).
  - Annual Balance Sheets (Share Capital, Reserves, Borrowings, Other Liabilities, Fixed Assets, CWIP, Investments, Other Assets).
  - Annual Cash Flow Statements (Operating, Investing, Financing, Net Cash Flow).
  - Historical Shareholding Pattern (Promoter, FII, DII, Public, Others).
  - Industry Peer Comparisons (Comparable sector companies with relative multiples).

---

## 3. Authentic Data Pipeline and Healing Engine

The Filterer ingestion pipeline enforces rigorous financial and mathematical reconciliation:

### Schedule III Balance Sheet Footing Reconciliation
Under Indian Accounting Standards (Ind AS) and Schedule III of the Companies Act, Total Assets must strictly equal Total Liabilities and Equity:
$$\text{Total Equity \& Liabilities} \equiv \text{Total Assets}$$
Where:
$$\text{Total Equity \& Liabilities} = \text{Share Capital} + \text{Reserves} + \text{Borrowings} + \text{Other Liabilities}$$
$$\text{Total Assets} = \text{Fixed Assets} + \text{CWIP} + \text{Investments} + \text{Other Assets}$$
The reconciliation engine in `data_pipeline/heal_and_enrich.py` verifies both sides of the balance sheet for every fiscal year, ensuring zero balance sheet footing errors across all 500 constituent companies.

### 9-Point Piotroski F-Score Engine
Evaluates fundamental financial health using year-over-year comparative accounting:
1. Profitability:
   - Positive Net Profit in current year.
   - Positive Return on Assets (ROA) in current year.
   - Positive Operating Cash Flow (CFO) in current year.
   - Quality of Earnings: CFO greater than Net Profit (Cash Flow Accrual test).
2. Leverage, Liquidity, and Source of Funds:
   - Lower Long-Term Debt-to-Equity ratio compared to previous year.
   - Higher Current Ratio compared to previous year.
   - No new shares issued (no equity dilution in current year).
3. Operating Efficiency:
   - Higher Gross Margin compared to previous year.
   - Higher Asset Turnover ratio compared to previous year.

### Altman Z-Score Model
Assesses balance sheet credit risk and distress likelihood:
$$Z = 1.2 X_1 + 1.4 X_2 + 3.3 X_3 + 0.6 X_4 + 1.0 X_5$$
Where:
- $X_1 = \text{Working Capital} / \text{Total Assets}$
- $X_2 = \text{Retained Earnings} / \text{Total Assets}$
- $X_3 = \text{EBIT} / \text{Total Assets}$
- $X_4 = \text{Market Value of Equity} / \text{Total Liabilities}$
- $X_5 = \text{Sales} / \text{Total Assets}$

### Dynamic Moving Averages
Simple Moving Averages (50-Day and 200-Day) are computed dynamically from actual daily historical price observations:
$$\text{SMA}_N = \frac{1}{N} \sum_{i=1}^{N} P_i$$
This prevents static or outdated indicator tags and ensures that indicators reflect current price trends.

### Authentic Quarterly Filings Ingestion
The pipeline strictly rejects synthetic mathematical interpolation. When upstream feeds miss an official period (such as statutory XBRL omissions), the pipeline either extracts verified exchange filings via `data_pipeline/fetch_authentic_quarters.py` or reports the gap transparently in statement footnotes.

---

## 4. Client-Side Formula Evaluation Engine

Filterer parses queries using a deterministic recursive-descent/Pratt parser in `src/engine/screenerParser.ts`.

### AST Tokenization and Grammar
The parser breaks queries into typed tokens:
- Identifiers: Metric names and their aliases (`Market Capitalization`, `mcap`, `ROCE`, `pe`).
- Literals: Integers, decimals, and scientific numbers.
- Operators: Relational (`>`, `<`, `>=`, `<=`, `==`, `!=`), Logical (`AND`, `OR`, `NOT`), Arithmetic (`+`, `-`, `*`, `/`).

### Execution Pipeline
1. Lexing: Text is scanned into token streams with whitespace normalization.
2. Parsing: Tokens are converted into an AST with explicit operator precedence.
3. Type Checking and Validation: Metric names are resolved against `METRICS_DICTIONARY`. Unknown metrics trigger fuzzy suggestions.
4. In-Memory Evaluation: For each stock in `STOCKS_DATA`, the AST evaluates expressions against numeric scalar attributes.
5. Incomplete Reporting Handling: Undisclosed or not-reported fields evaluate to undefined, preventing missing data from being treated as zero.

---

## 5. TradingView Lightweight Charts Integration

Technical chart rendering is powered by `lightweight-charts`:
- Canvas-rendered, high-frequency price history.
- Dynamic responsive resizing with fullscreen expansion.
- Multi-timeframe historical slicing (1M, 6M, 1Y, 3Y, 5Y, Max).
- Moving average overlays (SMA 50 in amber, SMA 200 in purple, EMA 20 in blue).
- Volume histogram with color-coded bull/bear bars.

---

## 6. Verification and Automated Invariants

Continuous Integration tests enforce strict dataset integrity before any deployment:
- `tests/screenerParser.test.ts`: 23 parser unit tests verifying AST construction, operator precedence, alias resolution, and error reporting.
- `tests/dataset.test.ts`: 32 invariant tests confirming that all 500 stock detail files exist, date series are ordered oldest-to-newest, and shareholding records align with summary figures.
- `tests/test_healed_metrics.py`: Verifies Schedule III balance sheet equality, Piotroski ranges, and Altman Z-Score boundaries.
