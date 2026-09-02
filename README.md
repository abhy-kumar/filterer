# Filterer

Filterer is a high-performance, open-source equity research engine and quantitative stock screener for Indian Equities (National Stock Exchange & Bombay Stock Exchange). It provides syntax-compatible execution of Screener.in natural language queries, evaluates multi-variable fundamental formulas in real time, and renders full financial statements, peer comparisons, and quantitative indicators for the complete Nifty 500 universe.

---

## Architectural Principles

Filterer is engineered around four core design invariants:

1. **Zero-Latency In-Browser Evaluation**: Queries are tokenized, parsed into an Abstract Syntax Tree (AST), and evaluated entirely in the client's WebAssembly/JavaScript runtime. A 500-stock screen evaluates in sub-10 milliseconds without network round-trips.
2. **Hybrid Data Topology**: 
   - **Screening Tier**: Lean, vectorized metric arrays (~50 fundamental, valuation, and technical attributes per stock) are bundled client-side for immediate filter traversal.
   - **Deep Research Tier**: Detailed multi-year statements (10-year P&L, quarterly results, balance sheets, cash flows, and institutional shareholding matrices) are lazy-loaded on demand from Firebase Firestore with deterministic fallback to static JSON edge artifacts.
3. **Dual Execution Surfaces**: The identical query syntax executes natively in both modern web browsers (via Pratt AST parser) and terminal environments (via the Python SQLite compiler in `scanner.py`).
4. **100% Free & Open Pipeline**: Built exclusively on public, non-commercial financial data infrastructure (NSE India archives, Yahoo Finance via `yfinance`, SQLite chunk storage, and Firebase Spark free tier).

---

## Systems Architecture

```
                                 [ NSE India Archives / Yahoo Finance ]
                                                    │
                                                    ▼
                                    ┌───────────────────────────────┐
                                    │    Python Data Pipeline       │
                                    │  (data_pipeline/data_fetcher) │
                                    └───────┬───────────────┬───────┘
                                            │               │
                     ┌──────────────────────┘               └──────────────────────┐
                     ▼                                                             ▼
        ┌─────────────────────────┐                                   ┌─────────────────────────┐
        │   SQLite Vector Store   │                                   │   Firebase Firestore    │
        │    (data/screener.db)   │                                   │   (/stocks/{SYMBOL})    │
        │  [Chunked via 40MB Git] │                                   │  [10-Year Statements]   │
        └────────────┬────────────┘                                   └────────────┬────────────┘
                     │                                                             │
                     ▼                                                             ▼
        ┌─────────────────────────┐                                   ┌─────────────────────────┐
        │   Terminal CLI Scanner  │                                   │   React / Vite Web UI   │
        │       (scanner.py)      │                                   │ (Client-Side AST Engine)│
        └─────────────────────────┘                                   └─────────────────────────┘
```

---

## Query Language Specification

Filterer implements a deterministic recursive-descent/Pratt parser compatible with Screener.in's domain-specific formula syntax.

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

### Operator Precedence & Associativity

| Precedence | Operator | Description | Associativity |
|---|---|---|---|
| 1 (Highest) | `( ... )` | Parenthetical Grouping | None |
| 2 | `NOT` | Unary Logical Negation | Right-to-Left |
| 3 | `*`, `/`, `%` | Multiplication, Division, Modulo | Left-to-Right |
| 4 | `+`, `-` | Addition, Subtraction | Left-to-Right |
| 5 | `>`, `<`, `>=`, `<=`, `=`, `!=` | Relational Comparisons | Left-to-Right |
| 6 | `AND` | Logical Conjunction | Left-to-Right |
| 7 (Lowest) | `OR` | Logical Disjunction | Left-to-Right |

### Example Formulas

```sql
-- Quality Compounders with Zero Leverage
Market Capitalization > 1000 AND Return on capital employed > 22 AND Debt to equity < 0.1 AND Sales growth 5Years > 15

-- Ben Graham Defensive Investor Screen
Current price < Graham Number AND Price to book < 1.5 AND Debt to equity < 0.5

-- Institutional Accumulation with Margin Expansion
Change in FII Holding > 1.0 AND Operating profit margin > 20 AND Relative Strength Index > 50

-- Working Capital Efficiency
Cash conversion cycle < 45 AND Free cash flow yield > 4 AND Piotroski score >= 7
```

---

## Metric Catalog

Filterer tracks over 100 normalized balance sheet, cash flow, growth, and valuation metrics across the Nifty 500:

| Category | Canonical Identifiers | Supported Shorthand Aliases | Unit |
|---|---|---|---|
| **Market & Size** | `Market Capitalization`, `Current Price`, `Volume` | `mcap`, `market cap`, `cmp`, `price` | ₹ Cr / ₹ |
| **Valuation** | `Price to Earning`, `Price to Book`, `PEG Ratio`, `Graham Number`, `EV / EBITDA`, `Price to Sales` | `pe`, `p/e`, `pb`, `p/bv`, `peg`, `graham number`, `ev/ebitda` | Multiple |
| **Profitability** | `Return on Capital Employed`, `Return on Equity`, `Operating Profit Margin`, `Net Profit Margin` | `roce`, `roe`, `opm`, `npm`, `pat margin` | % |
| **Growth Rates** | `Sales Growth [3Y, 5Y, 10Y]`, `Profit Growth [3Y, 5Y, 10Y]`, `Stock Price CAGR [1Y, 3Y, 5Y]` | `sales 3y cagr`, `profit 5y`, `cagr 3y` | % |
| **Solvency** | `Debt to Equity`, `Total Debt`, `Interest Coverage Ratio`, `Current Ratio`, `Altman Z-Score` | `d/e`, `borrowings`, `interest coverage`, `z-score` | Ratio / ₹ Cr |
| **Quality & Health** | `Piotroski Score`, `Free Cash Flow Yield`, `Cash Conversion Cycle` | `piotroski`, `f-score`, `fcf yield`, `ccc` | Score / % / Days |
| **Ownership** | `Promoter Holding`, `Change in FII Holding`, `Change in DII Holding`, `Pledged Percentage` | `promoter stake`, `fii change`, `dii change`, `pledge %` | % |
| **Technicals** | `50 Day Moving Average`, `200 Day Moving Average`, `Relative Strength Index`, `Distance from 52W High` | `dma 50`, `dma 200`, `rsi`, `down from 52w high` | ₹ / % |

---

## Design System & Typography

Filterer adheres to the **Apple Human Interface Guidelines (HIG)** and Microsoft precision UI standards:

- **Typography Stack**: Configured with optical kerning and tabular figure alignment.
  - **Primary**: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Plus Jakarta Sans", "Inter"`
  - **Monospace & Numerical**: `"SF Mono", "JetBrains Mono", Menlo, Consolas`
  - **Tabular Figures**: `font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" on, "lnum" on;` enforces zero layout-jitter during financial data updates.
- **Micro-Interactions**: 8-point baseline grid, subtle 1px composite translucent borders (`rgba(255, 255, 255, 0.08)`), accessible focus indicators (`:focus-visible`), and hardware-accelerated fluid glass surfaces (`backdrop-filter: blur(24px)`).
- **Accessibility**: Full dark/light theme persistence, WCAG AA color contrast compliance, and full keyboard command navigation (`Ctrl+K`).

---

## Local Development & Environment Setup

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **PowerShell** (Windows) or **Bash** (macOS/Linux)

### 1. Web Application

```bash
# Clone the repository
git clone https://github.com/abhy-kumar/filterer.git
cd filterer

# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript AST parser test suite
npm test

# Build production bundle
npm run build
```

### 2. Python Data Pipeline & CLI Scanner

```bash
# Initialize virtual environment
python -m venv .venv

# Activate environment
# On Windows:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Assemble the SQLite database from chunked Git parts
python db_split_join.py join

# Run CLI scanner with a preset filter
python scanner.py --preset debt-free

# Execute an arbitrary Screener.in natural query
python scanner.py "Return on capital employed > 25 AND Debt to equity < 0.1 AND Market Capitalization > 500"

# Run Python regression test suite
pytest
```

---

## Repository Data Policy

Due to GitHub's 50MB file size limit for tracked assets:

1. The compiled SQLite database (`data/screener.db`) is ignored by Git.
2. It is version-controlled in 40MB chunks under `data/screener.db.part_*`.
3. Before local Python execution, assemble the database:
   ```bash
   python db_split_join.py join
   ```
4. After running data updates, split the database before committing:
   ```bash
   python db_split_join.py split
   ```
5. Never commit private credentials. Service account keys for Firebase Firestore must be stored in `data_pipeline/firebase-credentials.json` (explicitly gitignored).

---

## Automated CI/CD Pipelines

A GitHub Actions workflow (`.github/workflows/update_market_data.yml`) runs on a weekly schedule (Saturday 06:00 UTC) to refresh fundamentals, recalculate derived indicators across the Nifty 500, verify regression suites, and commit updated split database artifacts back to the repository.

---

## License

This software is released under the **MIT License**. See [LICENSE](LICENSE) for terms.

*Disclaimer: Filterer is an independent open-source research and educational utility. It is not affiliated with, endorsed by, or associated with Mittal Analytics Private Ltd or Screener.in.*
