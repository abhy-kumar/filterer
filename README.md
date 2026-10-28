# Filterer

Filterer is a stock screener for the Nifty 500. You type a query in the same syntax Screener.in uses (`Return on capital employed > 20 AND Debt to equity < 0.5`) and it runs in your browser against data taken mostly from what companies file with NSE. Every company also gets a page with its statements, about twelve quarters of results, shareholding, peers and price history.

The data keeps itself up to date. Three scheduled GitHub Actions jobs fetch new prices, filings and fundamentals, check the result, and commit it back to `master`, so the site stays current without anyone running anything by hand.

## Running it locally

You need Node 24 (the version CI uses) and, for the data pipeline, Python 3.11 or newer.

```bash
git clone https://github.com/abhy-kumar/filterer.git
cd filterer
npm install
npm run dev
```

`npm test` runs the Vitest suite, which includes checks on the shipped dataset as well as the query engine. `npm run build` type-checks and produces the static build in `dist/`, which is what Vercel deploys.

For the pipeline:

```bash
python -m venv .venv
source .venv/bin/activate        # on Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest tests/ -q
```

## How the data stays current

| Job | When (IST) | What it does |
|---|---|---|
| `refresh-quotes.yml` | 09:00, 15:45 and 19:30 on weekdays | Updates the bundled prices and price-derived figures |
| `refresh-filings.yml` | 20:00, Monday to Saturday | Reads new results and shareholding filings from NSE, rebuilds super-investor portfolios |
| `refresh-fundamentals.yml` | 10:30 on Saturday | Refreshes the Nifty 500 list from NSE, then re-fetches every company's fundamentals from Yahoo |

Each job rebuilds the two data tiers (`npm run data:rebuild`) and runs both test suites against the result before it commits anything. A run that fails its checks commits nothing, so the site keeps the previous day's data rather than shipping broken figures. The commit step rebases onto `master` first, so a code push made during an hour-long refresh doesn't get in its way.

A lot of the pipeline exists so that one bad company or one flaky source doesn't sink a whole run:

- XBRL files never change once filed, so they sit in the Actions cache and each evening's run has to fetch just the new ones.
- If a filing can't be downloaded, that company's quarter is kept from the last run instead of disappearing.
- The weekly ingest keeps a ledger of which companies it has done. A run that times out picks up where it stopped the following week.
- Yahoo is slow to list some new NSE companies (REITs especially). When there's no NSE quote, the fetcher tries the BSE listing.
- When Yahoo gives a company no sector, the repair step assigns the sector most companies in the same NSE industry have. A blank sector was one of the two things that failed the October 24 run.
- The tests compare the export with the index list that run downloaded, not with a fixed count of 500, so index rebalances need no code change.

GitHub turns off scheduled workflows in a public repository after 60 days without activity. The quote job commits every trading day, which counts, so in practice this shouldn't happen. If the jobs ever stop, the Actions tab has a button to turn them back on.

The app reads two tiers. `src/data/stocksData.ts` (about 1.1 MB) is bundled and holds the figures you can screen on. `public/data/stocks/*.json` (about 23 MB over 500 files) holds the statements, quarterly results, shareholding history and prices, and a company's file is only fetched when you open its page.

## Where the figures come from

Nothing needs an API key.

| Data | Source | Refreshed |
|---|---|---|
| Live prices and index levels | Yahoo's spark API, with BSE's quote API as fallback (`api/quotes.ts`, `api/market_indices.ts`) | On request, cached for 20 seconds while the market is open |
| Quarterly results, about 12 quarters | NSE XBRL filings (`data_pipeline/nse_filings.py`) | Every evening |
| Annual P&L | NSE XBRL: the Annual listing back to FY2018, then the full-year column of each year-end filing | Every evening |
| Shareholding, the FII and DII split, and every holder of 1% or more | NSE shareholding pattern XBRL | Every evening |
| Super-investor portfolios | The same shareholding filings, matched against `data/super_investors/registry.json` | Every evening |
| Closing prices for companies outside the Nifty 500 | NSE bhavcopy | Every evening |
| Balance sheet, cash flow, dividend payout, price history | Yahoo Finance through yfinance | Weekly |

Where a filing exists, it wins over Yahoo. Each table on a company page says which source it shows and whether the figures are consolidated or standalone.

Reading NSE's filings takes more care than it should, and some of the details matter if you're checking a number:

- NSE moved companies to "integrated" filings from the Dec 2024 quarter, so results live in two listings. The newer one is paged 20 rows at a time and the pipeline reads every page. Until October 2026 it read only the first, and because each quarter adds two to four rows, Mar 2025 had quietly fallen off page one for more than 50 companies, HCL Tech among them.
- Corrected filings often reach the listing with no date. Revisions are ranked above originals anyway, and if the newest filing for a quarter can't be read, older ones for that quarter are tried.
- Filings before 2025 lay the data out like the printed results table, and the only thing saying which column is the quarter is the context id. Plenty of filings from 2018 to 2022 use those ids without defining them. Both cases are handled.
- If no filing for a quarter has a three-month column, the quarter is worked out from a longer period in the same filing minus the quarters before it, and the table marks it as derived.
- If a March quarter still can't be read, it's derived from the full year less the first three quarters. Yahoo's figure for the year can be used to fill it, but not unless Yahoo matched the filings to within 1% in all the years both cover, and even then just sales and net profit are filled in. Banks never pass that test, so their gaps stay blank.
- A year's own filing is kept as filed even when it doesn't equal the sum of its quarters. Restatements and changes in presentation make both legitimate.

Some companies have no Mar 2025 quarter and can't get one. Most listed after it (Groww, Lenskart, Meesho, Tata Capital, LG Electronics India and others). Abbott India has no results listing on NSE at all, the general insurers file in a format the parser doesn't read yet, and the REITs file elsewhere. These fall back to Yahoo's quarterly figures, but Yahoo goes back about five quarters, which no longer reaches Mar 2025.

## What's in the app

### Screens

Twelve starting screens, grouped as Quality, Value, Growth, Income and Technical. Each lists its criteria, read from the query itself, along with how many companies pass right now. Opening one runs it and gives a sortable table you can narrow by sector and industry.

### Query editor

Comparisons, arithmetic, `AND`, `OR`, `NOT` and brackets. It flags errors while you type, suggests the metric you probably meant, and warns you when a metric is only reported for some companies. There's a searchable list of all 74 metrics and their aliases.

### Watchlists

Lists kept in your browser, with combined market cap, average P/E, average ROCE and the average move today. Saved queries live here too.

### Super-investors

Portfolios built from the shareholding patterns companies file, not typed in by hand, so the stake, share count, quarter and change since the last filing all come from a filing. The registry says who an investor is and which names they file under, but never what they hold. Individuals holding 1% or more of several companies are picked up from the filings too. Filings name only holders of 1% or more, and stakes held through entities not in the registry are missed, so treat each portfolio as a lower bound.

### Company pages

Each has the annual P&L, balance sheet and cash flow, plus quarterly results on one basis per company (banks get their own layout, with interest earned and financing profit). Below those are readings worked out from the filings: the latest quarter against a year earlier, the trailing four quarters, margins, where return on equity comes from, cash conversion, debt, and valuation against the company's own five-year range. Each reading names the periods it used. Prices update every 20 seconds in market hours, and the page also has rule-based pros and cons, peers from the same industry and links to the company's BSE and NSE pages. Charts are drawn with TradingView's Lightweight Charts.

Earlier versions also had a commodities page, hand-entered operating KPIs, segment tables and earnings-call summaries. They were taken out because none of them could be traced to a source, and the commodity prices had stopped updating anyway.

## Query language

The parser is a recursive-descent parser written to accept Screener.in's syntax.

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

From tightest to loosest: brackets, then `*` `/` `%`, then `+` `-`, then comparisons, then `NOT`, then `AND`, then `OR`. `NOT` applies to a whole comparison, so `NOT Debt to equity > 1` means `NOT (Debt to equity > 1)`.

A few to try:

```
Market Capitalization > 1000 AND Return on capital employed > 20 AND Debt to equity < 0.2 AND Sales growth 3Years > 12
Current price < Graham Number AND Price to book < 1.5 AND Debt to equity < 0.5
Free cash flow yield > 4 AND Piotroski score >= 7 AND Interest Coverage Ratio > 4
Price to Earning < Industry PE AND Operating profit margin > 18 AND Relative Strength Index > 40
```

## Metrics

| Group | Metrics | Some aliases |
|---|---|---|
| Valuation | Market cap, current price, P/E, P/B, PEG, Graham number, EV/EBITDA, price to sales | `mcap`, `cmp`, `pe`, `pb`, `peg` |
| Profitability | ROCE, ROE, operating margin, net margin, EPS | `roce`, `roe`, `opm`, `npm`, `eps` |
| Growth | Sales and profit growth over 3, 5 and 10 years, price CAGR over 1, 3 and 5 years | `sales 3y`, `profit 5y`, `cagr 3y` |
| Balance sheet | Debt to equity, total debt, interest coverage, current ratio, quick ratio, Altman Z-score | `d/e`, `debt`, `z-score` |
| Cash | Free cash flow yield, Piotroski score, cash conversion cycle, operating cash flow over 3 years | `fcf yield`, `f-score`, `ocf 3y` |
| Shareholding | Promoter, FII and DII holding and their quarterly change, pledged shares | `promoter stake`, `fii`, `dii`, `pledge` |
| Technicals | 50 and 200 day moving averages, 20 day EMA, RSI, distance from the 52-week high | `dma 50`, `dma 200`, `rsi` |

Not every metric is available for every company. A missing figure is stored as null, not zero, so screening on it leaves the company out rather than letting it pass. As of October 2026:

| Metric | Companies with a figure | Why the rest are missing |
|---|---|---|
| Sales growth 5Y / profit growth 5Y | 73% / 63% | Needs six years of filed P&L, which recent listings and companies missing from NSE's older annual filings don't have |
| Sales and profit growth 10Y | none | The filings used here reach back to FY2018 |
| Current ratio | 11% | The balance sheet from Yahoo usually has no current assets and liabilities split |
| Quick ratio, debtor days, inventory days, cash conversion cycle | none | Same missing split |
| ROE over 3 and 5 years | 16% | Needs a book value for each year |
| Pledged shares | 1% | Neither NSE's shareholding endpoint nor the filings parser supplies a pledge figure yet |
| Altman Z-score | 80% | Left out for banks and NBFCs, whose balance sheets the formula misreads |

The Piotroski score uses eight of its nine tests, because the liquidity test needs the same current split.

## API

The Vercel deployment also serves a small read-only API from `api/`:

- `GET /api/screen?q=<query>&limit=<n>` runs a query
- `GET /api/stock?symbol=<symbol>` returns one company's screening figures
- `GET /api/stocks?search=<text>&sector=<sector>` lists companies
- `GET /api/suggest?q=<partial query>` checks a query and suggests metrics
- `GET /api/quotes?chunk=<n>` and `GET /api/market_indices` return live prices

## Command-line scanner

`scanner.py` runs the same kind of query from a terminal against a SQLite copy of the data:

```bash
python scanner.py "Return on capital employed > 22 AND Debt to equity < 0.2"
```

GitHub won't take a file over 50 MB, so the database is committed in 40 MB parts (`data/screener.db.part_*`). The scanner joins them the first time it runs, and you can use `python db_split_join.py join` (or `split`) to do it by hand. The scheduled jobs don't update this database, so its figures are older than the website's.

## Project

Built by Abhishek K (FT-25-202) for the Mergers and Acquisitions course at the Faculty of Management Studies, University of Delhi.

MIT licensed (see `LICENSE`). Filterer is an independent project and has no connection with Mittal Analytics Private Ltd or Screener.in.
