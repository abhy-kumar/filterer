# Filterer

Filterer is an open-source stock screener for Indian equities (NSE / BSE). It executes Screener.in-style natural language queries against a bundled universe of large-cap listings, evaluates multi-variable fundamental formulas in the browser, and renders financial statements, peer comparisons and technical indicators.

**Current coverage: 67 companies, four years of annual statements.** The screening tier is bundled with the app; statements and price history are fetched per company. Figures the data pipeline cannot source are shown as *not reported* rather than as zero — see [Data honesty](#data-honesty) below, which is load-bearing rather than a footnote.

---

## Architectural Principles

Filterer is engineered around four core design invariants:

1. **In-browser evaluation**: Queries are tokenized, parsed into an AST, and evaluated in the client. A screen over the bundled universe runs in well under a millisecond, with no network round-trip.
2. **Two data tiers**:
   - **Screening tier** (`src/data/stocksData.ts`, ~0.17 MB): the scalar metrics a screen reads, bundled for instant filtering.
   - **Detail tier** (`public/data/stocks/*.json`, ~2.4 MB across 67 files): P&L, quarterly results, balance sheets, cash flows, shareholding and daily price history, fetched when a company page is opened, from Firestore where configured and static JSON otherwise.
3. **Dual execution surfaces**: The query syntax runs in the browser (recursive-descent parser) and, separately, in the terminal via `scanner.py`. The two implementations are not currently verified against each other; treat the browser as canonical.
4. **Free and open pipeline**: Built on public data sources (NSE India archives, Yahoo Finance via `yfinance`, SQLite chunk storage, Firebase Spark tier).

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
LogicalNot     ::= "NOT" LogicalNot | Comparison ;   (* NOT wraps a whole comparison *)
Comparison     ::= Additive ( ( ">" | "<" | ">=" | "<=" | "=" | "==" | "!=" ) Additive )? ;
Additive       ::= Multiplicative ( ( "+" | "-" ) Multiplicative )* ;
Multiplicative ::= Primary ( ( "*" | "/" | "%" ) Primary )* ;
Primary        ::= Identifier | Number | "(" Expression ")" ;
```

### Operator Precedence & Associativity

| Precedence | Operator | Description | Associativity |
|---|---|---|---|
| 1 (Highest) | `( ... )` | Parenthetical Grouping | None |
| 6 | `NOT` | Logical negation of a whole comparison | Right-to-Left |
| 2 | `*`, `/`, `%` | Multiplication, division, modulo | Left-to-Right |
| 3 | `+`, `-` | Addition, subtraction | Left-to-Right |
| 4 | `>`, `<`, `>=`, `<=`, `=`, `!=` | Relational comparison (not chainable) | None |
| 5 | `AND` | Logical conjunction | Left-to-Right |
| 7 (Lowest) | `OR` | Logical disjunction | Left-to-Right |

### Example Formulas

```sql
-- Quality compounders with almost no leverage
Market Capitalization > 1000 AND Return on capital employed > 22 AND Debt to equity < 0.1 AND Profit growth 3Years > 15

-- Graham defensive
Current price < Graham Number AND Price to book < 1.5 AND Debt to equity < 0.5

-- Cheaper than its own sector, and earning its capital back
Price to Earning < Industry PE AND Operating profit margin > 20 AND Relative Strength Index > 50

-- Cash generative and financially sound
Free cash flow yield > 4 AND Piotroski score >= 7 AND Operating cash flow 3Years > 200
```

An unrecognised metric is an error, not a silently-zero value:

```
> Retrun on equity > 15
Unknown metric "Retrun on equity". Did you mean "Return on Equity"?
```

---

## Metric Catalog

Filterer defines 72 metrics. Coverage varies by metric and is shown per metric in the in-app ratio catalog — a metric no company reports is flagged before you run the screen rather than silently returning nothing.

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
- **Accessibility**: Dark and light themes with persistence, and keyboard navigation throughout — `⌘K` / `Ctrl+K` opens the command palette, arrows and `Enter` drive it, and `⌘↵` runs the query from the editor.

---

## Data Honesty

The upstream pipeline reports itself as 100% healthy while leaving whole columns unpopulated. Reading those zeros as real figures is what made the screener useless: `Cash conversion cycle < 45` matched every company in the universe, because none of them reported one.

`scripts/repair_dataset.mjs` runs before the split and does two things — derives what the statements genuinely support, and writes `null` for everything else so the UI can say *not reported*:

| Situation | What happens |
|---|---|
| Return on equity absent | Derived as EPS / book value per share (validates within ~2pp against the companies that do report it) |
| 5- and 10-year CAGRs | `null` — four years of annual statements cannot produce them |
| Working-capital days, current ratio | `null` — the feed does not split current from non-current items |
| Other income, dividend payout | `null` — never sourced, in any row, for any company |
| `industry_pe` stored as `pe_ratio * 0.9` | Replaced with the real median P/E of the sector across this universe |
| PEG clamped to the sentinel `99` | `null` |
| Ownership deltas identical for all 67 companies | Withdrawn from the screener; the shareholding table is labelled as placeholder data |
| Symbols stored percent-encoded (`M%26M`) | Decoded, so those pages are reachable |

Anything that could not be repaired is surfaced on the company page instead of hidden: quarters missing from the series, a balance sheet that does not foot, profit before tax that does not tie to operating profit less interest, and EPS that disagrees with the P&L. See `src/engine/dataQuality.ts`.

`tests/dataset.test.ts` asserts these invariants, so a pipeline run cannot quietly reintroduce the zero sentinels.

### Known gaps

- **Shareholding history is generated, not filed.** Every company moves by the same amount every quarter. It needs a real source.
- **Quarterly series have holes.** Roughly three quarters of the universe is missing at least one quarter.
- **Four years of annual history**, so anything needing five or ten years is unavailable.
- **`scanner.py` is not verified against the browser engine.** The two parsers can disagree.

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

A GitHub Actions workflow (`.github/workflows/update_market_data.yml`) runs weekly (Saturday 06:00 UTC) to refresh fundamentals, recalculate derived indicators, run the regression suites and commit updated database artifacts.

After any pipeline run, rebuild the two data tiers:

```bash
npm run data:rebuild   # repair, then split
npm test               # the dataset invariants below must hold
```

---

## License

This software is released under the **MIT License**. See [LICENSE](LICENSE) for terms.

*Disclaimer: Filterer is an independent open-source research and educational utility. It is not affiliated with, endorsed by, or associated with Mittal Analytics Private Ltd or Screener.in.*
