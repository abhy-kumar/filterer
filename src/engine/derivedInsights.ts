import type { AnnualPnL, BalanceSheet, QuarterlyResult, Stock } from '../types/stock';

/**
 * Insights for every company, computed from its filed figures.
 *
 * The curated insights cover 23 companies, and their figures were typed in by
 * hand. These cover the whole universe and every number in them can be traced
 * to a row on the same page: the sentences are assembled from the statements,
 * never written freehand, and each one says which periods and which source it
 * was drawn from. Where the data does not support an insight, it is left out
 * rather than approximated.
 */

export type InsightTone = 'positive' | 'negative' | 'neutral';
export type InsightCategory =
  | 'Results'
  | 'Growth'
  | 'Profitability'
  | 'Cash flow'
  | 'Balance sheet'
  | 'Ownership'
  | 'Valuation';

export interface InsightFigure {
  label: string;
  value: string;
  tone?: InsightTone;
}

export interface DerivedInsight {
  id: string;
  category: InsightCategory;
  title: string;
  headline: string;
  tone: InsightTone;
  figures: InsightFigure[];
  basis: string;
}

export interface InsightContext {
  /** Super investors holding 1% or more, from filings. */
  investors?: Array<{ name: string; pct: number; quarter: string }>;
}

const QUARTER_MONTHS = ['Mar', 'Jun', 'Sep', 'Dec'];
const quarterKey = (period: string) => {
  const [month, year] = period.split(' ');
  return Number(year) * 4 + QUARTER_MONTHS.indexOf(month);
};
const fiscalYear = (year: string) => Number(year.split(' ').pop());

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function growth(now: unknown, then: unknown): number | null {
  if (!finite(now) || !finite(then) || then <= 0) return null;
  return ((now - then) / then) * 100;
}

const fixed = (v: number, places = 1) => v.toFixed(places);
const signedPct = (v: number, places = 1) => `${v >= 0 ? '+' : ''}${v.toFixed(places)}%`;
const crore = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')} Cr`;
const bps = (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v)} bps`;
const toneOf = (v: number | null, flat = 0): InsightTone =>
  v === null ? 'neutral' : v > flat ? 'positive' : v < -flat ? 'negative' : 'neutral';

function moved(v: number, up: string, down: string, places = 1): string {
  return v >= 0 ? `${up} ${fixed(v, places)}%` : `${down} ${fixed(Math.abs(v), places)}%`;
}

function isFinancial(stock: Stock): boolean {
  return stock.sector === 'Financial Services';
}

function quarterlySource(stock: Stock): string {
  return stock.quarterly_source === 'NSE XBRL' ? 'NSE filings (XBRL)' : 'Yahoo Finance';
}

function sortedQuarters(stock: Stock): QuarterlyResult[] {
  return [...(stock.quarterly_results || [])]
    .filter((q) => finite(q.sales))
    .sort((a, b) => quarterKey(a.period) - quarterKey(b.period));
}

function sortedAnnual(stock: Stock): AnnualPnL[] {
  return [...(stock.annual_pnl || [])]
    .filter((y) => y.year !== 'TTM')
    .sort((a, b) => fiscalYear(a.year) - fiscalYear(b.year));
}

function sortedBalance(stock: Stock): BalanceSheet[] {
  return [...(stock.balance_sheet || [])].sort((a, b) => fiscalYear(a.year) - fiscalYear(b.year));
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

// ── Results ──────────────────────────────────────────────────

function latestQuarter(stock: Stock): DerivedInsight | null {
  const quarters = sortedQuarters(stock);
  const last = quarters[quarters.length - 1];
  if (!last) return null;
  const yearAgo = quarters.find((q) => quarterKey(q.period) === quarterKey(last.period) - 4);
  if (!yearAgo) return null;
  const previous = quarters.find((q) => quarterKey(q.period) === quarterKey(last.period) - 1);

  const salesYoY = growth(last.sales, yearAgo.sales);
  const profitYoY = growth(last.net_profit, yearAgo.net_profit);

  const clauses: string[] = [];
  if (salesYoY !== null) clauses.push(`sales ${moved(salesYoY, 'grew', 'fell')}`);

  let profitTone: InsightTone = toneOf(profitYoY);
  if (profitYoY !== null) {
    clauses.push(`net profit ${moved(profitYoY, 'rose', 'fell')}`);
  } else if (finite(last.net_profit) && finite(yearAgo.net_profit)) {
    if (last.net_profit > 0 && yearAgo.net_profit <= 0) {
      clauses.push(`the company returned to a profit of ${crore(last.net_profit)} from a loss`);
      profitTone = 'positive';
    } else if (last.net_profit <= 0) {
      clauses.push(`the company reported a net loss of ${crore(Math.abs(last.net_profit))}`);
      profitTone = 'negative';
    }
  }
  if (!clauses.length) return null;

  const figures: InsightFigure[] = [];
  if (salesYoY !== null) figures.push({ label: 'Sales, year on year', value: signedPct(salesYoY), tone: toneOf(salesYoY) });
  if (profitYoY !== null) figures.push({ label: 'Net profit, year on year', value: signedPct(profitYoY), tone: toneOf(profitYoY) });
  if (!isFinancial(stock) && finite(last.opm_pct) && finite(yearAgo.opm_pct)) {
    const change = (last.opm_pct - yearAgo.opm_pct) * 100;
    figures.push({ label: 'Operating margin', value: `${fixed(last.opm_pct)}% (${bps(change)})`, tone: toneOf(change, 25) });
  }
  if (previous) {
    const qoq = growth(last.sales, previous.sales);
    if (qoq !== null) figures.push({ label: 'Sales, quarter on quarter', value: signedPct(qoq), tone: toneOf(qoq) });
  }

  const salesTone = toneOf(salesYoY);
  const tone: InsightTone =
    salesTone === profitTone ? salesTone : salesTone === 'neutral' ? profitTone : profitTone === 'neutral' ? salesTone : 'neutral';

  return {
    id: 'latest-quarter',
    category: 'Results',
    title: `${last.period} quarter`,
    headline: `In the ${last.period} quarter, ${clauses.join(' and ')} from a year earlier.`,
    tone,
    figures,
    basis: `${quarterlySource(stock)}, ${last.period} against ${yearAgo.period}`,
  };
}

function trailingYear(stock: Stock): DerivedInsight | null {
  const quarters = sortedQuarters(stock);
  const last = quarters[quarters.length - 1];
  if (!last) return null;
  const byKey = new Map(quarters.map((q) => [quarterKey(q.period), q]));
  const end = quarterKey(last.period);
  const window = (from: number) => {
    const rows = [0, 1, 2, 3].map((i) => byKey.get(from - i));
    return rows.every(Boolean) ? (rows as QuarterlyResult[]) : null;
  };
  const current = window(end);
  const prior = window(end - 4);
  if (!current || !prior) return null;

  const sum = (rows: QuarterlyResult[], key: 'sales' | 'net_profit') =>
    rows.reduce((total, r) => total + (finite(r[key]) ? r[key] : NaN), 0);
  const salesNow = sum(current, 'sales');
  const salesThen = sum(prior, 'sales');
  const profitNow = sum(current, 'net_profit');
  const profitThen = sum(prior, 'net_profit');
  const salesGrowth = growth(salesNow, salesThen);
  const profitGrowth = growth(profitNow, profitThen);
  if (salesGrowth === null) return null;

  const profitClause =
    profitGrowth !== null
      ? `net profit ${moved(profitGrowth, 'rose', 'fell')} to ${crore(profitNow)}`
      : Number.isFinite(profitNow)
        ? `net profit was ${crore(profitNow)}`
        : null;

  return {
    id: 'trailing-year',
    category: 'Results',
    title: 'Last four quarters',
    headline:
      `Over the four quarters to ${last.period}, sales ${moved(salesGrowth, 'grew', 'fell')} to ${crore(salesNow)}` +
      (profitClause ? ` and ${profitClause}` : '') +
      ', against the four quarters before.',
    tone: toneOf(profitGrowth ?? salesGrowth),
    figures: [
      { label: 'Trailing sales', value: crore(salesNow) },
      { label: 'Change', value: signedPct(salesGrowth), tone: toneOf(salesGrowth) },
      ...(profitGrowth !== null
        ? [{ label: 'Trailing net profit', value: `${crore(profitNow)} (${signedPct(profitGrowth)})`, tone: toneOf(profitGrowth) }]
        : []),
    ],
    basis: `${quarterlySource(stock)}, ${current[3].period} to ${last.period} against ${prior[3].period} to ${prior[0].period}`,
  };
}

// ── Growth and profitability ─────────────────────────────────

function growthRecord(stock: Stock): DerivedInsight | null {
  const years = sortedAnnual(stock).filter((y) => finite(y.sales) && y.sales > 0).slice(-6);
  if (years.length < 3) return null;
  let up = 0;
  for (let i = 1; i < years.length; i++) if (years[i].sales > years[i - 1].sales) up++;
  const first = years[0];
  const last = years[years.length - 1];
  const spans = fiscalYear(last.year) - fiscalYear(first.year);
  if (spans <= 0) return null;
  const cagr = (Math.pow(last.sales / first.sales, 1 / spans) - 1) * 100;
  const comparisons = years.length - 1;

  return {
    id: 'growth-record',
    category: 'Growth',
    title: 'Sales record',
    headline: `Sales grew in ${up} of the last ${comparisons} years, compounding ${fixed(cagr)}% a year from ${first.year} to ${last.year}.`,
    tone: up === comparisons && cagr > 0 ? 'positive' : up <= comparisons / 2 || cagr < 0 ? 'negative' : 'neutral',
    figures: [
      { label: 'Years of growth', value: `${up} of ${comparisons}` },
      { label: 'Sales CAGR', value: signedPct(cagr), tone: toneOf(cagr) },
      { label: `Sales, ${last.year}`, value: crore(last.sales) },
    ],
    basis: `Annual results, ${first.year} to ${last.year}`,
  };
}

function marginTrajectory(stock: Stock): DerivedInsight | null {
  if (isFinancial(stock)) return null;
  const years = sortedAnnual(stock).filter((y) => finite(y.opm_pct)).slice(-5);
  if (years.length < 3) return null;
  const first = years[0];
  const last = years[years.length - 1];
  const change = (last.opm_pct - first.opm_pct) * 100;
  const peak = years.reduce((best, y) => (y.opm_pct > best.opm_pct ? y : best), years[0]);

  const direction = Math.abs(change) < 50 ? 'held steady' : change > 0 ? `expanded ${Math.round(change)} bps` : `contracted ${Math.round(-change)} bps`;

  return {
    id: 'margin-trajectory',
    category: 'Profitability',
    title: 'Operating margin',
    headline:
      `Operating margin ${direction} between ${first.year} and ${last.year}, to ${fixed(last.opm_pct)}%` +
      (peak.year !== last.year ? `; it peaked at ${fixed(peak.opm_pct)}% in ${peak.year}.` : ', the highest in that span.'),
    tone: Math.abs(change) < 50 ? 'neutral' : change > 0 ? 'positive' : 'negative',
    figures: [
      { label: first.year, value: `${fixed(first.opm_pct)}%` },
      { label: last.year, value: `${fixed(last.opm_pct)}%` },
      { label: 'Change', value: bps(change), tone: toneOf(change, 50) },
    ],
    basis: `Annual results, ${first.year} to ${last.year}`,
  };
}

function returnDecomposition(stock: Stock): DerivedInsight | null {
  const annual = sortedAnnual(stock);
  const sheets = sortedBalance(stock);
  const sheetByYear = new Map(sheets.map((s) => [s.year, s]));

  const components = (year: AnnualPnL) => {
    const current = sheetByYear.get(year.year);
    const priorYear = sheets.find((s) => fiscalYear(s.year) === fiscalYear(year.year) - 1);
    if (!current || !priorYear || !finite(year.net_profit) || !finite(year.sales) || year.sales <= 0) return null;
    const equity = (s: BalanceSheet) => (s.equity_capital ?? 0) + (s.reserves ?? 0);
    const avgAssets = (current.total_assets + priorYear.total_assets) / 2;
    const avgEquity = (equity(current) + equity(priorYear)) / 2;
    if (!(avgAssets > 0) || !(avgEquity > 0)) return null;
    const margin = year.net_profit / year.sales;
    const turnover = year.sales / avgAssets;
    const leverage = avgAssets / avgEquity;
    return { year: year.year, margin, turnover, leverage, roe: margin * turnover * leverage };
  };

  const decomposed = annual.map(components).filter((c): c is NonNullable<typeof c> => c !== null);
  const last = decomposed[decomposed.length - 1];
  if (!last) return null;
  const prior = decomposed[decomposed.length - 2];

  let driver = '';
  if (prior) {
    const changes = [
      { name: 'net margin', ratio: last.margin / prior.margin },
      { name: 'asset turnover', ratio: last.turnover / prior.turnover },
      { name: 'leverage', ratio: last.leverage / prior.leverage },
    ].filter((c) => Number.isFinite(c.ratio) && c.ratio > 0);
    const biggest = changes.sort((a, b) => Math.abs(Math.log(b.ratio)) - Math.abs(Math.log(a.ratio)))[0];
    if (biggest && Math.abs(biggest.ratio - 1) >= 0.05) {
      driver = ` Against ${prior.year}, return on equity moved from ${fixed(prior.roe * 100)}%, mostly on ${biggest.name}, which ${biggest.ratio > 1 ? 'rose' : 'fell'} ${fixed(Math.abs(biggest.ratio - 1) * 100, 0)}%.`;
    }
  }

  return {
    id: 'return-decomposition',
    category: 'Profitability',
    title: 'Where the return on equity comes from',
    headline: `Return on equity of ${fixed(last.roe * 100)}% in ${last.year} came from a ${fixed(last.margin * 100)}% net margin, ${fixed(last.turnover, 2)}x asset turnover and ${fixed(last.leverage, 2)}x leverage.${driver}`,
    tone: last.roe >= 0.18 ? 'positive' : last.roe < 0.08 ? 'negative' : 'neutral',
    figures: [
      { label: 'Net margin', value: `${fixed(last.margin * 100)}%` },
      { label: 'Asset turnover', value: `${fixed(last.turnover, 2)}x` },
      { label: 'Leverage (assets / equity)', value: `${fixed(last.leverage, 2)}x` },
      { label: 'Return on equity', value: `${fixed(last.roe * 100)}%`, tone: last.roe >= 0.18 ? 'positive' : last.roe < 0.08 ? 'negative' : 'neutral' },
    ],
    basis: `Annual results and balance sheets, ${prior ? prior.year : last.year} to ${last.year}; averages of opening and closing balances`,
  };
}

// ── Cash flow and balance sheet ──────────────────────────────

function cashConversion(stock: Stock): DerivedInsight | null {
  if (isFinancial(stock)) return null;
  const profitByYear = new Map(sortedAnnual(stock).map((y) => [y.year, y.net_profit]));
  const pairs = [...(stock.cash_flow || [])]
    .sort((a, b) => fiscalYear(a.year) - fiscalYear(b.year))
    .filter((c) => finite(c.operating_cf) && finite(profitByYear.get(c.year)))
    .slice(-3);
  if (pairs.length < 2) return null;

  const cfo = pairs.reduce((t, c) => t + c.operating_cf, 0);
  const profit = pairs.reduce((t, c) => t + (profitByYear.get(c.year) as number), 0);
  if (!(profit > 0)) return null;
  const ratio = cfo / profit;
  const fcfPositive = pairs.filter((c) => finite(c.free_cf) && c.free_cf > 0).length;
  const span = `${pairs[0].year} to ${pairs[pairs.length - 1].year}`;

  return {
    id: 'cash-conversion',
    category: 'Cash flow',
    title: 'Profit into cash',
    headline:
      `Operating cash flow came to ${fixed(ratio, 2)}x reported net profit from ${span}` +
      (ratio >= 0.9 ? ', so earnings are backed by cash.' : ratio < 0.6 ? ', so a large share of reported profit did not arrive as cash.' : '.') +
      ` Free cash flow was positive in ${fcfPositive} of those ${pairs.length} years.`,
    tone: ratio >= 0.9 ? 'positive' : ratio < 0.6 ? 'negative' : 'neutral',
    figures: [
      { label: 'Operating cash flow', value: crore(cfo) },
      { label: 'Net profit', value: crore(profit) },
      { label: 'Cash conversion', value: `${fixed(ratio, 2)}x`, tone: ratio >= 0.9 ? 'positive' : ratio < 0.6 ? 'negative' : 'neutral' },
    ],
    basis: `Cash flow statements and annual results, ${span}`,
  };
}

function leverage(stock: Stock): DerivedInsight | null {
  if (isFinancial(stock)) return null;
  const sheets = sortedBalance(stock).filter((s) => finite(s.borrowings)).slice(-4);
  const last = sheets[sheets.length - 1];
  if (!last) return null;
  const equity = (s: BalanceSheet) => (s.equity_capital ?? 0) + (s.reserves ?? 0);
  if (!(equity(last) > 0)) return null;

  const annual = sortedAnnual(stock);
  const latestPnl = annual[annual.length - 1];
  const coverage =
    latestPnl && finite(latestPnl.interest) && latestPnl.interest > 0 && finite(latestPnl.profit_before_tax)
      ? (latestPnl.profit_before_tax + latestPnl.interest) / latestPnl.interest
      : null;

  const ratioNow = last.borrowings / equity(last);
  const first = sheets[0];
  const ratioThen = first !== last && equity(first) > 0 ? first.borrowings / equity(first) : null;

  let headline: string;
  if (ratioNow < 0.05) {
    headline = `Borrowings are negligible: ${crore(last.borrowings)} against shareholders' funds of ${crore(equity(last))} in ${last.year}.`;
  } else if (ratioThen !== null) {
    const verb = ratioNow < ratioThen - 0.05 ? 'fell' : ratioNow > ratioThen + 0.05 ? 'rose' : 'held';
    headline = `Borrowings ${verb === 'held' ? `held near ${fixed(ratioNow, 2)}x` : `${verb} from ${fixed(ratioThen, 2)}x to ${fixed(ratioNow, 2)}x`} of shareholders' funds between ${first.year} and ${last.year}.`;
  } else {
    headline = `Borrowings were ${fixed(ratioNow, 2)}x shareholders' funds in ${last.year}.`;
  }
  if (coverage !== null) {
    headline += ` Operating profit covered interest ${fixed(coverage)} times in ${latestPnl.year}.`;
  }

  const tone: InsightTone =
    ratioNow < 0.3 && (coverage === null || coverage >= 5) ? 'positive' : ratioNow > 1.5 || (coverage !== null && coverage < 2) ? 'negative' : 'neutral';

  return {
    id: 'leverage',
    category: 'Balance sheet',
    title: 'Debt',
    headline,
    tone,
    figures: [
      { label: 'Borrowings', value: crore(last.borrowings) },
      { label: 'Debt / equity', value: `${fixed(ratioNow, 2)}x` },
      ...(coverage !== null ? [{ label: 'Interest coverage', value: `${fixed(coverage)}x`, tone: (coverage >= 5 ? 'positive' : coverage < 2 ? 'negative' : 'neutral') as InsightTone }] : []),
    ],
    basis: `Balance sheets, ${first.year} to ${last.year}${coverage !== null ? `; ${latestPnl.year} results` : ''}`,
  };
}

// ── Ownership ────────────────────────────────────────────────

function ownership(stock: Stock, context: InsightContext): DerivedInsight | null {
  const history = [...(stock.shareholding_history || [])].sort((a, b) => quarterKey(a.period) - quarterKey(b.period));
  const last = history[history.length - 1];
  if (!last) return null;
  const first = history[0];

  const sentences: string[] = [];
  let tone: InsightTone = 'neutral';

  if (!finite(last.promoter) || last.promoter === 0) {
    sentences.push('The company has no promoter group; it is widely held.');
  } else if (first !== last && finite(first.promoter)) {
    const change = last.promoter - first.promoter;
    if (Math.abs(change) < 0.05) {
      sentences.push(`Promoters held ${fixed(last.promoter, 2)}%, unchanged since ${first.period}.`);
    } else {
      sentences.push(`Promoters ${change > 0 ? 'raised' : 'cut'} their stake by ${fixed(Math.abs(change), 2)} points between ${first.period} and ${last.period}, to ${fixed(last.promoter, 2)}%.`);
      tone = change > 0 ? 'positive' : change < -1 ? 'negative' : 'neutral';
    }
  } else {
    sentences.push(`Promoters held ${fixed(last.promoter, 2)}% in ${last.period}.`);
  }

  const fiiChange = stock.change_in_fii_holding_quarter;
  const diiChange = stock.change_in_dii_holding_quarter;
  if (finite(stock.fii_holding) && finite(stock.dii_holding)) {
    const moves = [
      finite(fiiChange) && Math.abs(fiiChange) >= 0.1 ? `foreign institutions ${fiiChange > 0 ? 'added' : 'sold'} ${fixed(Math.abs(fiiChange), 2)} points` : null,
      finite(diiChange) && Math.abs(diiChange) >= 0.1 ? `domestic institutions ${diiChange > 0 ? 'added' : 'sold'} ${fixed(Math.abs(diiChange), 2)} points` : null,
    ].filter(Boolean);
    sentences.push(
      `Foreign institutions own ${fixed(stock.fii_holding, 2)}% and domestic institutions ${fixed(stock.dii_holding, 2)}%` +
        (moves.length ? `; over the last quarter ${moves.join(' and ')}.` : '.')
    );
  }

  const investors = context.investors ?? [];
  if (investors.length) {
    const named = investors
      .slice()
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3)
      .map((i) => `${i.name} (${fixed(i.pct, 2)}%)`);
    sentences.push(`Tracked investors with 1% or more: ${named.join(', ')}${investors.length > 3 ? ` and ${investors.length - 3} more` : ''}.`);
  }

  const figures: InsightFigure[] = [];
  if (finite(last.promoter)) figures.push({ label: 'Promoters', value: `${fixed(last.promoter, 2)}%` });
  if (finite(stock.fii_holding)) figures.push({ label: 'Foreign institutions', value: `${fixed(stock.fii_holding, 2)}%`, tone: toneOf(fiiChange ?? null, 0.1) });
  if (finite(stock.dii_holding)) figures.push({ label: 'Domestic institutions', value: `${fixed(stock.dii_holding, 2)}%`, tone: toneOf(diiChange ?? null, 0.1) });

  return {
    id: 'ownership',
    category: 'Ownership',
    title: 'Who owns it',
    headline: sentences.join(' '),
    tone,
    figures,
    basis: `Shareholding pattern filings, ${first.period} to ${last.period}`,
  };
}

// ── Valuation ────────────────────────────────────────────────

function valuationHistory(stock: Stock): DerivedInsight | null {
  const annual = sortedAnnual(stock).filter((y) => finite(y.eps));
  const latest = annual[annual.length - 1];
  if (!latest || !(latest.eps > 0) || !(stock.current_price > 0)) return null;

  // A year's EPS is only known once the results are out, roughly two months
  // after the year ends. Using it earlier would value past prices on earnings
  // nobody had seen yet.
  const MONTH = { Mar: 2, Jun: 5, Sep: 8, Dec: 11 } as Record<string, number>;
  const availableFrom = annual.map((y) => {
    const [month, year] = y.year.split(' ');
    return { eps: y.eps, from: new Date(Number(year), (MONTH[month] ?? 2) + 3, 1).getTime() };
  });

  const prices = [...(stock.historical_prices || [])].sort((a, b) => a.date.localeCompare(b.date));
  const lastDate = prices.length ? Date.parse(prices[prices.length - 1].date) : NaN;
  if (!Number.isFinite(lastDate)) return null;
  const since = lastDate - 5 * 365.25 * 24 * 3600 * 1000;

  const multiples: number[] = [];
  for (const point of prices) {
    const t = Date.parse(point.date);
    if (t < since || !finite(point.price)) continue;
    const known = availableFrom.filter((y) => y.from <= t).pop();
    if (known && known.eps > 0) multiples.push(point.price / known.eps);
  }
  if (multiples.length < 100) return null;
  multiples.sort((a, b) => a - b);

  const current = stock.current_price / latest.eps;
  const median = quantile(multiples, 0.5);
  const low = quantile(multiples, 0.2);
  const high = quantile(multiples, 0.8);
  const position =
    current > high ? 'above the range it usually traded in' : current < low ? 'below the range it usually traded in' : current > median ? 'above its median' : 'below its median';

  return {
    id: 'valuation-history',
    category: 'Valuation',
    title: 'Price against its own history',
    headline: `At ${fixed(current)}x its ${latest.year} earnings, the stock trades ${position}: the five-year median was ${fixed(median)}x, and it spent most of that time between ${fixed(low)}x and ${fixed(high)}x.`,
    tone: 'neutral',
    figures: [
      { label: `Price / ${latest.year} EPS`, value: `${fixed(current)}x` },
      { label: 'Five-year median', value: `${fixed(median)}x` },
      { label: 'Usual range', value: `${fixed(low)}x to ${fixed(high)}x` },
    ],
    basis: `Weekly closing prices against the latest full-year EPS known at each date; five years to ${prices[prices.length - 1].date}`,
  };
}

export function deriveInsights(stock: Stock, context: InsightContext = {}): DerivedInsight[] {
  const builders: Array<() => DerivedInsight | null> = [
    () => latestQuarter(stock),
    () => trailingYear(stock),
    () => growthRecord(stock),
    () => marginTrajectory(stock),
    () => returnDecomposition(stock),
    () => cashConversion(stock),
    () => leverage(stock),
    () => ownership(stock, context),
    () => valuationHistory(stock),
  ];
  const out: DerivedInsight[] = [];
  for (const build of builders) {
    try {
      const insight = build();
      if (insight) out.push(insight);
    } catch {
      // One malformed statement should cost that insight, not the page.
    }
  }
  return out;
}
