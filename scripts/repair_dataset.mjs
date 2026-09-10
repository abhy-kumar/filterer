/**
 * Repair pass over src/data/stocksData.ts.
 *
 * The upstream pipeline leaves whole columns at 0 when it cannot source them
 * (return on equity, working-capital days, other income, dividend payout, the
 * 5- and 10-year CAGRs). A screener that reads those zeros as real figures
 * answers "Cash conversion cycle < 45" with every company in the universe, so
 * this pass does two things:
 *
 *   1. derives what is genuinely derivable from the statements that are present
 *   2. writes null for everything else, so downstream code can say "not
 *      reported" instead of quietly inventing a zero
 *
 * Run with:  node scripts/repair_dataset.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(ROOT, 'src', 'data', 'stocksData.ts');
const DETAIL_DIR = path.join(ROOT, 'public', 'data', 'stocks');

/** Matches scripts/split_dataset.mjs and src/lib/firebase.ts. */
function detailSlug(symbol) {
  return symbol.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

/**
 * Statements live in the detail tier once the dataset has been split, so pull
 * them back in before repairing. This keeps the pass idempotent: repair then
 * split can be re-run in that order any number of times.
 */
function hydrate(stock) {
  const file = path.join(DETAIL_DIR, `${detailSlug(stock.symbol)}.json`);
  if (!fs.existsSync(file)) return stock;
  const detail = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { ...detail, ...stock, ...Object.fromEntries(Object.entries(detail).filter(([k]) => k !== 'symbol' && stock[k] === undefined)) };
}

const QUARTERS = ['Mar', 'Jun', 'Sep', 'Dec'];

function periodKey(period) {
  const [month, year] = String(period).split(' ');
  return Number(year) * 4 + QUARTERS.indexOf(month);
}

function yearKey(year) {
  if (year === 'TTM') return Number.POSITIVE_INFINITY;
  return Number(String(year).split(' ').pop());
}

/** null unless the value is a usable, finite, non-zero number. */
function orNull(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) return null;
  return value;
}

function round(value, places = 2) {
  if (value === null || !Number.isFinite(value)) return null;
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

function cagr(from, to, years) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to <= 0 || years <= 0) return null;
  return round((Math.pow(to / from, 1 / years) - 1) * 100);
}

/** A finite number, or null. Unlike orNull, zero is a legitimate value here. */
function num(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Authentic BSE scrip codes, built by data_pipeline/bse_mapper.py into
 * data/bse_code_map.json. The heal pass that used to apply them is not
 * reachable from either workflow, so 490 of the 500 companies shipped without
 * a code and the exchange links on their pages had nothing to point at. This
 * pass is the one the workflows do run, so the codes are applied here.
 *
 * BSE Ltd is dropped: an exchange cannot list on itself, so BSE Ltd trades on
 * the NSE alone. The mapper matched it to 543066 by name, which is SBI Cards.
 */
const BSE_CODES = (() => {
  try {
    const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'bse_code_map.json'), 'utf8'));
    delete map.BSE;
    return map;
  } catch {
    return {};
  }
})();

/** Statement rows by fiscal year label. The TTM column is not a fiscal year. */
function indexByYear(rows) {
  const out = new Map();
  for (const row of rows || []) {
    if (row.year && row.year !== 'TTM') out.set(row.year, row);
  }
  return out;
}

/**
 * Piotroski F-score, computed from the filed statements.
 *
 * The pipeline invented the prior-year side of this score: previous operating
 * cash flow as 90% of the current year, previous long-term debt as 110%,
 * previous current ratio as 95%, previous gross margin as 95%, the share count
 * as a constant 1 on both sides, and total assets as the market
 * capitalisation. Five of the nine tests passed by construction. That is why
 * no company in the universe scored below 3, why 37% of them landed on exactly
 * 8, and why a "seven or more of nine" screen matched 363 of 500 companies.
 *
 * Eight signals are recoverable from the statements this dataset carries. The
 * liquidity signal is not: the balance sheet has no current asset / current
 * liability split, so it is left unassessed rather than awarded. The count of
 * signals actually used is returned alongside the score.
 */
function piotroski(stock, pnl, balance, cash) {
  const annual = pnl.filter((r) => r.year !== 'TTM');
  if (annual.length < 2) return { score: null, assessed: 0 };

  const bs = indexByYear(balance);
  const cf = indexByYear(cash);
  const now = annual[annual.length - 1];
  const prev = annual[annual.length - 2];
  const bsNow = bs.get(now.year);
  const bsPrev = bs.get(prev.year);
  const cfNow = cf.get(now.year);

  let score = 0;
  let assessed = 0;
  const test = (passed) => {
    assessed += 1;
    if (passed) score += 1;
  };

  const niNow = num(now.net_profit);
  const niPrev = num(prev.net_profit);
  const cfoNow = num(cfNow?.operating_cf);
  const taNow = num(bsNow?.total_assets);
  const taPrev = num(bsPrev?.total_assets);
  const scaled = taNow > 0 && taPrev > 0;

  // Profitability
  if (niNow !== null) test(niNow > 0);
  if (cfoNow !== null) test(cfoNow > 0);
  if (niNow !== null && niPrev !== null && scaled) test(niNow / taNow > niPrev / taPrev);
  if (cfoNow !== null && niNow !== null) test(cfoNow > niNow);

  // Leverage and liquidity. The current-ratio signal is not assessable here.
  const brNow = num(bsNow?.borrowings);
  const brPrev = num(bsPrev?.borrowings);
  if (brNow !== null && brPrev !== null && scaled) test(brNow / taNow < brPrev / taPrev);

  // Share capital standing in for the share count: at a constant face value a
  // rising figure is an issue of new shares.
  const scNow = num(bsNow?.equity_capital);
  const scPrev = num(bsPrev?.equity_capital);
  if (scNow !== null && scPrev !== null) test(scNow <= scPrev * 1.001);

  // Operating efficiency
  const omNow = num(now.opm_pct);
  const omPrev = num(prev.opm_pct);
  if (omNow !== null && omPrev !== null) test(omNow > omPrev);

  const sNow = num(now.sales);
  const sPrev = num(prev.sales);
  if (sNow !== null && sPrev !== null && scaled) test(sNow / taNow > sPrev / taPrev);

  // A score drawn from a handful of signals is not a score.
  return assessed >= 6 ? { score, assessed } : { score: null, assessed };
}

/**
 * Altman Z-score from the filed balance sheet.
 *
 * The pipeline passed the market capitalisation in as total assets, putting
 * four of the five ratios on the wrong denominator. It also applied the
 * manufacturing coefficients to banks and NBFCs, whose balance sheets are
 * deposits and advances: the leverage terms read as distress for institutions
 * that are not distressed. Financial companies are left unscored, the same
 * treatment debt-to-equity already gets.
 */
function altman(stock, pnl, balance) {
  if (stock.sector === 'Financial Services') return null;

  const annual = pnl.filter((r) => r.year !== 'TTM');
  const bsNow = balance[balance.length - 1];
  const pnlNow = annual[annual.length - 1];
  if (!bsNow || !pnlNow) return null;

  const ta = num(bsNow.total_assets);
  const tl = num(bsNow.total_liabilities);
  const ebit = num(pnlNow.operating_profit);
  const sales = num(pnlNow.sales);
  const mcap = num(stock.market_cap);
  if (!(ta > 0) || !(tl > 0) || ebit === null || sales === null || !(mcap > 0)) return null;

  // Working capital needs a current/non-current split the dataset does not
  // carry. Other assets net of other liabilities is the closest stand-in: both
  // are the residual buckets, and both are dominated by current items.
  const workingCapital = (num(bsNow.other_assets) ?? 0) - (num(bsNow.other_liabilities) ?? 0);
  const reserves = num(bsNow.reserves) ?? 0;

  const z =
    1.2 * (workingCapital / ta) +
    1.4 * (reserves / ta) +
    3.3 * (ebit / ta) +
    0.6 * (mcap / tl) +
    1.0 * (sales / ta);

  return Number.isFinite(z) ? round(z) : null;
}

/**
 * Moving-average overlay for the price chart.
 *
 * The pipeline stamped one scalar onto the last 52 points, so all 500 charts
 * drew their 50- and 200-day averages as flat horizontal lines. The series is
 * weekly — a strict 7-day step across ten years — so a 50-day average spans
 * about seven points and a 200-day average about twenty-nine. Averaging 50
 * consecutive points, as the unreachable heal pass did, would have drawn a
 * 50-week line under a 50-day label.
 */
function movingAverageOverlay(prices) {
  const TRADING_DAYS_PER_POINT = 7;
  const windows = [
    ['dma_50', Math.round(50 / TRADING_DAYS_PER_POINT)],
    ['dma_200', Math.round(200 / TRADING_DAYS_PER_POINT)],
  ];
  const closes = prices.map((p) => num(p.price));

  for (const [field, window] of windows) {
    for (let i = 0; i < prices.length; i += 1) {
      const slice = closes.slice(i + 1 - window, i + 1);
      if (i + 1 < window || slice.some((v) => v === null)) {
        delete prices[i][field];
        continue;
      }
      prices[i][field] = round(slice.reduce((a, b) => a + b, 0) / window);
    }
  }
}

const stats = {};
function count(key, n = 1) {
  stats[key] = (stats[key] || 0) + n;
}

function repair(stock) {
  // ── Identifiers ────────────────────────────────────────────
  // The pipeline writes percent-encoded symbols: Mahindra arrives as "M%26M"
  // rather than "M&M". React Router decodes the route parameter, so the
  // lookup never matched and that company's page was unreachable.
  const decodedSymbol = decodeURIComponent(stock.symbol);
  if (decodedSymbol !== stock.symbol) count('percent-encoded symbol decoded');

  // ── Ordering ───────────────────────────────────────────────
  const pnl = [...(stock.annual_pnl || [])].sort((a, b) => yearKey(a.year) - yearKey(b.year));
  const quarters = [...(stock.quarterly_results || [])].sort((a, b) => periodKey(a.period) - periodKey(b.period));
  const balance = [...(stock.balance_sheet || [])].sort((a, b) => yearKey(a.year) - yearKey(b.year));
  const cash = [...(stock.cash_flow || [])].sort((a, b) => yearKey(a.year) - yearKey(b.year));
  const ratios = [...(stock.ratios_history || [])].sort((a, b) => yearKey(a.year) - yearKey(b.year));
  const holding = [...(stock.shareholding_history || [])].sort((a, b) => periodKey(a.period) - periodKey(b.period));
  const prices = [...(stock.historical_prices || [])].sort((a, b) => a.date.localeCompare(b.date));

  if (JSON.stringify(quarters) !== JSON.stringify(stock.quarterly_results || [])) count('quarterly results reordered');
  if (JSON.stringify(pnl) !== JSON.stringify(stock.annual_pnl || [])) count('annual P&L reordered');

  const annual = pnl.filter((p) => p.year !== 'TTM');

  // ── Columns the pipeline never populates ───────────────────
  for (const row of pnl) {
    if (row.other_income === 0) { row.other_income = null; count('P&L other income marked unreported'); }
    if (row.dividend_payout_pct === 0) { row.dividend_payout_pct = null; count('P&L dividend payout marked unreported'); }
    if (row.opm_pct !== null && Math.abs(row.opm_pct) > 100) {
      row.opm_pct = null;
      count('abnormal P&L OPM% (>100%) dropped');
    }
  }
  for (const row of quarters) {
    if (row.other_income === 0) { row.other_income = null; count('quarterly other income marked unreported'); }
    if (row.opm_pct !== null && Math.abs(row.opm_pct) > 100) {
      row.opm_pct = null;
      count('abnormal quarterly OPM% (>100%) dropped');
    }
  }

  const next = { ...stock };
  next.symbol = decodedSymbol;
  next.nse_symbol = decodeURIComponent(stock.nse_symbol || decodedSymbol);
  next.annual_pnl = pnl;
  next.quarterly_results = quarters;
  next.balance_sheet = balance;
  next.cash_flow = cash;
  next.ratios_history = ratios;
  next.shareholding_history = holding;
  next.historical_prices = prices;

  // ── Identifiers ────────────────────────────────────────────
  const bseCode = BSE_CODES[decodedSymbol];
  if (bseCode && next.bse_code !== bseCode) {
    next.bse_code = bseCode;
    count('BSE scrip code applied from the mapped universe');
  }

  // ── Statements reported in a foreign currency ──────────────
  // Yahoo quotes some Indian companies in rupees but reports their statements
  // in dollars — Infosys comes back with financialCurrency 'USD'. The ingest
  // then divides those figures by a crore as though they were rupees, so
  // Infosys shipped total assets of 1,742 crore against a real 1.6 lakh crore.
  //
  // The tell is internal: net worth from the screening tier (book value per
  // share times the share count) should be within a small factor of the
  // balance sheet's own equity. At 88x it is the exchange rate. The statements
  // are withheld rather than rescaled, because a multi-year statement needs
  // each year's own rate and an assumed one would put a derived figure where a
  // filed one belongs.
  const latestSheet = balance[balance.length - 1];
  if (latestSheet && next.current_price > 0 && next.market_cap > 0 && next.book_value > 0) {
    const sheetEquity = (num(latestSheet.total_assets) ?? 0) - (num(latestSheet.total_liabilities) ?? 0);
    const shares = (next.market_cap * 1e7) / next.current_price;
    const netWorth = (next.book_value * shares) / 1e7;
    if (sheetEquity > 0 && netWorth / sheetEquity > 20) {
      const factor = Math.round(netWorth / sheetEquity);
      next.statements_unavailable_reason =
        `Upstream reports this company's statements in a foreign currency; at roughly ${factor}x ` +
        'the rupee figures they are withheld rather than converted at an assumed rate.';
      next.annual_pnl = [];
      next.quarterly_results = [];
      next.balance_sheet = [];
      next.cash_flow = [];
      next.ratios_history = [];
      balance.length = 0;
      pnl.length = 0;
      cash.length = 0;

      // Scalars carried over from those statements are in the same wrong
      // currency. Growth rates and margins survive: a CAGR is a ratio, so the
      // currency cancels. Absolute figures do not.
      for (const key of ['debt', 'cfo_latest', 'cfo_3y', 'cfo_5y', 'fcf_latest', 'fcf_3y', 'fcf_5y']) {
        next[key] = null;
      }
      count('statements withheld: reported in a foreign currency');
    }
  }

  // ── Balance sheet: make the two sides foot ─────────────────
  // total_liabilities as fetched is Yahoo's liabilities *excluding* equity: it
  // equals borrowings + other liabilities on all 1,979 sheets here. Reserves,
  // though, was read from Retained Earnings, which leaves out share premium
  // and the other reserve accounts. So equity capital + reserves + borrowings
  // + other liabilities fell short of total assets on 1,672 sheets, by a
  // median of 17%, and the company page carried a footnote blaming
  // "sub-account classifications" for the gap.
  //
  // The identity settles it: shareholders' funds are total assets less total
  // liabilities, and reserves are that less the share capital. This is the
  // same residual derivation the pipeline already uses for other assets and
  // other liabilities, not an estimate.
  for (const sheet of balance) {
    const ta = num(sheet.total_assets);
    if (!(ta > 0)) continue;

    // A few sheets arrive with no total-liabilities figure at all while still
    // reporting borrowings — Tata Capital is one. Falling back to the sum of
    // the named liability rows keeps the identity from being fed a zero.
    let liabilities = num(sheet.total_liabilities);
    if (!(liabilities > 0)) {
      liabilities = (num(sheet.borrowings) ?? 0) + (num(sheet.other_liabilities) ?? 0);
      if (liabilities > 0) {
        sheet.total_liabilities = round(liabilities);
        count('total liabilities summed from the named rows');
      }
    }
    if (!(liabilities > 0)) continue;

    const reserves = round(ta - liabilities - (num(sheet.equity_capital) ?? 0));
    if (reserves !== sheet.reserves) count('reserves restated so the balance sheet foots');
    sheet.reserves = reserves;
  }

  // ── Chart overlays ─────────────────────────────────────────
  movingAverageOverlay(prices);

  // ── Return on equity ───────────────────────────────────────
  // Derived as EPS / book value per share. The balance sheets in this dataset
  // are not reliable enough to divide by (several report near-zero reserves),
  // but EPS and book value per share are, and they validate to within ~2pp of
  // the companies that do carry a reported ROE.
  if (!orNull(next.roe)) {
    if (next.eps > 0 && next.book_value > 0) {
      next.roe = round((next.eps / next.book_value) * 100);
      count('ROE derived from EPS / book value');
    } else {
      next.roe = null;
      count('ROE left unreported');
    }
  }

  // Historical ROE needs a per-year book value, which is not available.
  for (const key of ['roe_3y', 'roe_5y', 'roe_10y']) {
    if (!orNull(next[key])) { next[key] = null; count('multi-year ROE left unreported'); }
  }

  // ── Growth rates ───────────────────────────────────────────
  const salesAt = (backYears) => annual[annual.length - 1 - backYears]?.sales;
  const profitAt = (backYears) => annual[annual.length - 1 - backYears]?.net_profit;
  const latestSales = annual[annual.length - 1]?.sales;
  const latestProfit = annual[annual.length - 1]?.net_profit;

  const growthSpecs = [
    ['sales_growth_3y', 3, salesAt, latestSales],
    ['sales_growth_5y', 5, salesAt, latestSales],
    ['sales_growth_10y', 10, salesAt, latestSales],
    ['profit_growth_3y', 3, profitAt, latestProfit],
    ['profit_growth_5y', 5, profitAt, latestProfit],
    ['profit_growth_10y', 10, profitAt, latestProfit],
  ];

  for (const [key, years, at, latest] of growthSpecs) {
    if (orNull(next[key]) !== null) continue;
    const base = at(years);
    const derived = base !== undefined ? cagr(base, latest, years) : null;
    if (derived !== null) {
      next[key] = derived;
      count(`${years}-year growth derived from the P&L`);
    } else {
      next[key] = null;
      count(`${years}-year growth left unreported (needs ${years + 1} years of P&L)`);
    }
  }

  // ── Working capital: nothing in this dataset can produce them ──
  for (const key of ['debtor_days', 'inventory_days', 'days_payable', 'working_capital_days', 'cash_conversion_cycle', 'current_ratio']) {
    if (!orNull(next[key])) { next[key] = null; count('working-capital figure left unreported'); }
  }

  // ── Interest coverage ──────────────────────────────────────
  if (!orNull(next.interest_coverage)) {
    const latest = annual[annual.length - 1];
    if (latest && latest.interest > 0 && Number.isFinite(latest.operating_profit)) {
      next.interest_coverage = round(latest.operating_profit / latest.interest);
      count('interest coverage derived from the P&L');
    } else {
      next.interest_coverage = null;
      count('interest coverage left unreported');
    }
  }

  // ── Leverage (Debt to Equity) ──────────────────────────────
  // Corporate D/E does not apply to banks/NBFCs, and is mathematically
  // undefined/misleading when net worth is negative.
  if (stock.sector === 'Financial Services') {
    next.debt_to_equity = null;
    count('BFSI D/E marked not applicable');
  } else if (next.book_value !== null && next.book_value <= 0) {
    next.debt_to_equity = null;
    count('negative net worth D/E marked not applicable');
  } else if (next.debt === 0) {
    next.debt_to_equity = 0;
  } else if (next.debt > 0 && next.book_value > 0 && next.market_cap > 0 && next.current_price > 0) {
    if (next.debt_to_equity === 0 || next.debt_to_equity === null) {
      const shares = (next.market_cap * 10000000) / next.current_price;
      const equity = (next.book_value * shares) / 10000000;
      if (equity > 0) {
        next.debt_to_equity = round(next.debt / equity);
        count('D/E derived from debt and book equity');
      }
    }
  }

  // ── Margins sanity check ───────────────────────────────────
  if (next.opm !== null && Math.abs(next.opm) > 100) {
    next.opm = null;
    count('abnormal OPM (>100%) dropped');
  }
  if (next.npm !== null && Math.abs(next.npm) > 100) {
    next.npm = null;
    count('abnormal NPM (>100%) dropped');
  }

  // ── Valuation multiples that are meaningless at zero or negative ──
  if (next.book_value !== null && next.book_value <= 0) {
    next.pb_ratio = null;
    next.roe = null;
    count('negative net worth P/B and ROE marked not applicable');
  }
  if (next.pb_ratio !== null && next.pb_ratio <= 0) {
    next.pb_ratio = null;
    count('negative P/B marked not applicable');
  }

  // Corrupted ROE (>100%) when balance sheet equity is intact
  if (next.roe !== null && next.roe > 120 && balance.length && annual.length) {
    const latestBs = balance[balance.length - 1];
    const latestAnnual = annual[annual.length - 1];
    const totalEq = (latestBs.equity_capital ?? 0) + (latestBs.reserves ?? 0);
    if (totalEq > 0 && latestAnnual.net_profit) {
      next.roe = round((latestAnnual.net_profit / totalEq) * 100);
      count('distorted ROE recomputed from net profit and book equity');
    }
  }

  // Corrupted P/E (<5 on non-cyclical with healthy annual EPS)
  if (next.pe_ratio !== null && next.pe_ratio > 0 && next.pe_ratio < 5 && annual.length) {
    const latestAnnual = annual[annual.length - 1];
    if (latestAnnual.eps > 0 && next.current_price > 0) {
      const derivedPE = round(next.current_price / latestAnnual.eps);
      if (derivedPE > 20) {
        next.pe_ratio = derivedPE;
        count('corrupted P/E recomputed from annual EPS');
      }
    }
  }

  for (const key of ['peg_ratio', 'ev_ebitda', 'graham_number', 'altman_z_score', 'price_to_fcf']) {
    if (!orNull(next[key])) { next[key] = null; count('valuation multiple left unreported'); }
  }
  if (!(next.pe_ratio > 0)) { next.pe_ratio = null; count('P/E left unreported (loss-making or missing EPS)'); }

  // 99 is the pipeline's clamp for "growth too small to divide by", not a PEG.
  if (next.peg_ratio !== null && next.peg_ratio >= 99) { next.peg_ratio = null; count('clamped PEG sentinel (99) dropped'); }

  // ── Shareholding ───────────────────────────────────────────
  // Filed data (NSE quarterly shareholding pattern / multi-source consensus) is trusted as-is.
  const filed = Boolean(stock.shareholding_source);

  if (holding.length) {
    const latest = holding[holding.length - 1];
    const prev = holding[holding.length - 2];

    const assign = (key, value) => {
      const rounded = typeof value === 'number' ? round(value) : null;
      if (rounded !== null && Math.abs((next[key] ?? 0) - rounded) > 0.01) {
        count('shareholding snapshot re-sourced from history');
      }
      next[key] = rounded;
    };

    assign('promoter_holding', latest.promoter);
    assign('fii_holding', latest.fii);
    assign('dii_holding', latest.dii);
    
    // Only add others (Government / Trusts) if public does not already include it
    const subtotal = (latest.promoter ?? 0) + (latest.fii ?? 0) + (latest.dii ?? 0) + (latest.public ?? 0);
    let publicVal = latest.public;
    if (subtotal < 95 && latest.others && (subtotal + latest.others) <= 102) {
      publicVal = round((latest.public ?? 0) + latest.others);
    }
    assign('public_holding', publicVal);
    next.pledged_percentage = typeof latest.pledged === 'number' ? round(latest.pledged) : null;

    if (filed && prev) {
      // Real quarter-on-quarter movement, so it is worth screening on.
      const delta = (a, b) =>
        typeof a === 'number' && typeof b === 'number' ? round(a - b) : null;
      next.change_in_promoter_holding_quarter = delta(latest.promoter, prev.promoter);
      next.change_in_fii_holding_quarter = delta(latest.fii, prev.fii);
      next.change_in_dii_holding_quarter = delta(latest.dii, prev.dii);
      count('ownership delta computed from filed data');
    }
  }

  if (!filed) {
    next.change_in_promoter_holding_quarter = null;
    next.change_in_fii_holding_quarter = null;
    next.change_in_dii_holding_quarter = null;
    count('synthetic ownership delta dropped', 3);
  }

  // ── Cash flow snapshot must agree with the statement ───────
  if (cash.length) {
    const latest = cash[cash.length - 1];
    if (Number.isFinite(latest.operating_cf)) {
      if (Math.abs((next.cfo_latest ?? 0) - latest.operating_cf) > 1) count('operating cash flow re-sourced from the statement');
      next.cfo_latest = latest.operating_cf;
    }
    if (Number.isFinite(latest.free_cf)) {
      if (Math.abs((next.fcf_latest ?? 0) - latest.free_cf) > 1) count('free cash flow re-sourced from the statement');
      next.fcf_latest = latest.free_cf;
    }
  }

  // ── Price-derived figures ──────────────────────────────────
  if (next.high_52w > 0) {
    const d = round(((next.current_price - next.high_52w) / next.high_52w) * 100);
    if (Math.abs(d - next.distance_52w_high) > 0.05) count('distance from 52w high recomputed');
    next.distance_52w_high = d;
  }
  if (next.low_52w > 0) {
    const d = round(((next.current_price - next.low_52w) / next.low_52w) * 100);
    if (Math.abs(d - next.distance_52w_low) > 0.05) count('distance from 52w low recomputed');
    next.distance_52w_low = d;
  }
  // A price cannot sit outside its own 52-week band.
  if (next.current_price > next.high_52w) { next.high_52w = next.current_price; count('52w high widened to include the current price'); }
  if (next.current_price < next.low_52w) { next.low_52w = next.current_price; count('52w low widened to include the current price'); }

  if (Number.isFinite(next.change) && next.current_price - next.change !== 0) {
    const pct = round((next.change / (next.current_price - next.change)) * 100);
    if (Math.abs(pct - next.change_pct) > 0.02) count('day change percentage recomputed');
    next.change_pct = pct;
  }

  // ── Ratio history ──────────────────────────────────────────
  for (const row of ratios) {
    for (const key of ['roe', 'debtor_days', 'inventory_days', 'days_payable', 'working_capital_days', 'cash_conversion_cycle']) {
      if (!orNull(row[key])) { row[key] = null; count('ratio history cell marked unreported'); }
    }
    if (!orNull(row.roce)) row.roce = null;
  }

  // ── Financial-health scores ────────────────────────────────
  // Recomputed from the statements above, after the balance sheet has been
  // made to foot, because both scores divide by total assets.
  const fScore = piotroski(next, pnl, balance, cash);
  if (fScore.score !== next.piotroski_score) count('Piotroski score recomputed from the filed statements');
  next.piotroski_score = fScore.score;
  next.piotroski_assessed = fScore.assessed;

  const zScore = altman(next, pnl, balance);
  if (zScore !== next.altman_z_score) count('Altman Z-score recomputed from the balance sheet');
  next.altman_z_score = zScore;

  // ── Peers should quote the same price this app shows ───────
  if (stock.shareholding_source) next.shareholding_source = stock.shareholding_source;

  next.peers = (stock.peers || []).map((peer) => ({ ...peer, symbol: decodeURIComponent(peer.symbol) }));

  return next;
}

// ── Run ──────────────────────────────────────────────────────
const source = fs.readFileSync(DATA_FILE, 'utf8');
const header = source.slice(0, source.indexOf('export const STOCKS_DATA'));
const json = source.replace(/^[\s\S]*?export const STOCKS_DATA: Stock\[\] = /, '').replace(/;\s*$/, '');
const universe = JSON.parse(json);

const repaired = universe.map((stock) => repair(hydrate(stock)));

// ── Industry P/E ─────────────────────────────────────────────
// The pipeline stores industry_pe as exactly pe_ratio * 0.9 for every single
// company, which makes "cheaper than its industry" unsatisfiable by
// construction and puts a fabricated figure on every detail page. Replace it
// with the median P/E of the sector, computed over this universe. That is a
// narrower peer set than a true industry aggregate, and the metric
// description says so.
const peBySector = new Map();
for (const stock of repaired) {
  if (typeof stock.pe_ratio === 'number' && stock.pe_ratio > 0) {
    if (!peBySector.has(stock.sector)) peBySector.set(stock.sector, []);
    peBySector.get(stock.sector).push(stock.pe_ratio);
  }
}
for (const list of peBySector.values()) list.sort((a, b) => a - b);

function median(list) {
  if (!list || !list.length) return null;
  const mid = Math.floor(list.length / 2);
  return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
}

for (const stock of repaired) {
  const peers = peBySector.get(stock.sector);
  // A sector of one is just the company itself; that is not a comparison.
  if (!peers || peers.length < 3) {
    if (stock.industry_pe !== null) count('sector P/E dropped (fewer than 3 peers in the universe)');
    stock.industry_pe = null;
    continue;
  }
  const value = round(median(peers));
  if (value !== stock.industry_pe) count('industry P/E replaced with the sector median');
  stock.industry_pe = value;
}


// Peer rows quote figures for other companies; keep them in step with the
// company's own row so the peer table and the detail page cannot disagree.
const bySymbol = new Map(repaired.map((s) => [s.symbol, s]));
let peerFixes = 0;
for (const stock of repaired) {
  for (const peer of stock.peers || []) {
    const canonical = bySymbol.get(peer.symbol);
    if (!canonical) continue;
    if (Math.abs(canonical.current_price - peer.current_price) > 0.01) peerFixes++;
    peer.current_price = canonical.current_price;
    peer.market_cap = canonical.market_cap;
    peer.pe_ratio = canonical.pe_ratio;
    peer.dividend_yield = canonical.dividend_yield;
    peer.roce = canonical.roce;
  }
}
if (peerFixes) count('peer rows re-synced with the company row', peerFixes);

for (let attempt = 0; attempt < 5; attempt++) {
  try {
    fs.writeFileSync(DATA_FILE, `${header}export const STOCKS_DATA: Stock[] = ${JSON.stringify(repaired, null, 2)};\n`, 'utf8');
    break;
  } catch (err) {
    if (attempt === 4) throw err;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  }
}

console.log(`Repaired ${repaired.length} companies.\n`);
for (const [key, value] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
  console.log(String(value).padStart(6), key);
}
