import type { Stock, AnnualPnL, QuarterlyResult } from '../types/stock';

/**
 * Per-company integrity checks, run at render time.
 *
 * The upstream pipeline reports itself as 100% healthy while shipping
 * statements that do not foot and quarterly series with holes in them. Rather
 * than presenting those figures as if they were verified, the detail page
 * shows what did not reconcile. A screener that cannot say which numbers it
 * stands behind is worse than one that admits the gap.
 */

export type QualitySeverity = 'warning' | 'note';

export interface QualityFinding {
  id: string;
  severity: QualitySeverity;
  title: string;
  detail: string;
}

const QUARTERS = ['Mar', 'Jun', 'Sep', 'Dec'];

function periodIndex(period: string): number {
  const [month, year] = period.split(' ');
  const q = QUARTERS.indexOf(month);
  if (q < 0 || !Number.isFinite(Number(year))) return NaN;
  return Number(year) * 4 + q;
}

function periodFromIndex(index: number): string {
  return `${QUARTERS[((index % 4) + 4) % 4]} ${Math.floor(index / 4)}`;
}

/** Quarters absent from an otherwise contiguous series. */
export function missingQuarters(quarters: QuarterlyResult[]): string[] {
  const indexes = quarters.map((q) => periodIndex(q.period)).filter(Number.isFinite);
  if (indexes.length < 2) return [];
  const gaps: string[] = [];
  for (let i = indexes[0] + 1; i < indexes[indexes.length - 1]; i++) {
    if (!indexes.includes(i)) gaps.push(periodFromIndex(i));
  }
  return gaps;
}

function relativeGap(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(1, Math.abs(b));
}

/**
 * Rows where profit before tax does not follow from operating profit less
 * interest. Depreciation sits inside `expenses` in this dataset, and other
 * income is never sourced, so those are not part of the identity.
 */
export function pnlRowsThatDoNotReconcile(pnl: AnnualPnL[]): string[] {
  return pnl
    .filter((row) => relativeGap(row.operating_profit - row.interest, row.profit_before_tax) > 0.02)
    .map((row) => row.year);
}

export function balanceSheetFootingErrors(stock: Stock): string[] {
  const years: string[] = [];
  for (const sheet of stock.balance_sheet || []) {
    const liabilities = sheet.equity_capital + sheet.reserves + sheet.borrowings + sheet.other_liabilities;
    const assets = sheet.fixed_assets + sheet.cwip + sheet.investments + sheet.other_assets;
    if (
      relativeGap(liabilities, sheet.total_liabilities) > 0.02 ||
      relativeGap(assets, sheet.total_assets) > 0.02
    ) {
      years.push(sheet.year);
    }
  }
  return years;
}

/**
 * The shareholding series in this dataset moves by exactly the same amount for
 * every company, every quarter: promoter -0.02, FII +0.03, DII +0.02, public
 * -0.03. That is a generated ramp, not exchange filings, so the table says so
 * and the quarter-on-quarter deltas are not offered as screening metrics.
 */
export const SYNTHETIC_HOLDING_RAMP = {
  promoter: -0.02,
  fii: 0.03,
  dii: 0.02,
  public: -0.03,
};

export function holdingSeriesLooksSynthetic(stock: Stock): boolean {
  const history = stock.shareholding_history || [];
  if (history.length < 3) return false;

  // Filed data is never the generated ramp.
  if (stock.shareholding_source) return false;

  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];
    const matches =
      Math.abs(curr.promoter - prev.promoter - SYNTHETIC_HOLDING_RAMP.promoter) < 0.005 &&
      Math.abs(curr.fii - prev.fii - SYNTHETIC_HOLDING_RAMP.fii) < 0.005 &&
      Math.abs(curr.dii - prev.dii - SYNTHETIC_HOLDING_RAMP.dii) < 0.005;
    if (!matches) return false;
  }
  return true;
}

/** True when the shareholding block came from exchange filings. */
export function hasFiledShareholding(stock: Stock): boolean {
  return Boolean(stock.shareholding_source);
}

export function assessStock(stock: Stock): QualityFinding[] {
  const findings: QualityFinding[] = [];

  if (holdingSeriesLooksSynthetic(stock)) {
    findings.push({
      id: 'synthetic-holding',
      severity: 'warning',
      title: 'Shareholding series is placeholder data',
      detail:
        'Every company in this dataset shows the identical quarterly drift in promoter, FII and DII stakes, which means the series was generated rather than read from exchange filings. The latest split is shown for reference; the quarter-on-quarter changes have been withdrawn from the screener.',
    });
  }

  if (hasFiledShareholding(stock) && (stock.fii_holding === null || stock.dii_holding === null)) {
    findings.push({
      id: 'shareholding-partial',
      severity: 'note',
      title: 'Shareholding is filed, but not broken down',
      detail:
        "Promoter and public holdings come from the company's own quarterly filings with NSE. That filing reports the public holding as a single figure, so the split between foreign and domestic institutions, and the promoter pledge, are shown as not disclosed rather than estimated.",
    });
  }

  if (stock.dividend_yield > 8) {
    findings.push({
      id: 'dividend-yield-outlier',
      severity: 'note',
      title: 'Unusually high dividend yield',
      detail: `A yield of ${stock.dividend_yield.toFixed(2)}% is high enough to suggest a stale price, a special dividend, or a units mix-up in the source feed. Worth confirming against the company's filings before acting on it.`,
    });
  }

  const annual = (stock.annual_pnl || []).filter((p) => p.year !== 'TTM');
  const latest = annual[annual.length - 1];

  const gaps = missingQuarters(stock.quarterly_results || []);
  if (gaps.length) {
    findings.push({
      id: 'quarterly-gap',
      severity: 'warning',
      title: gaps.length === 1 ? 'A quarter is missing' : `${gaps.length} quarters are missing`,
      detail: `${gaps.join(', ')} ${gaps.length === 1 ? 'was' : 'were'} not returned by the data source, so quarter-on-quarter comparisons across ${gaps.length === 1 ? 'that gap' : 'those gaps'} are not meaningful.`,
    });
  }

  const unreconciled = pnlRowsThatDoNotReconcile(annual);
  if (unreconciled.length) {
    findings.push({
      id: 'pnl-reconcile',
      severity: 'warning',
      title: 'Profit before tax does not tie out',
      detail: `For ${unreconciled.join(', ')}, operating profit less interest does not reach the reported profit before tax. Treat the margin figures for ${unreconciled.length === 1 ? 'that year' : 'those years'} as indicative.`,
    });
  }

  const footing = balanceSheetFootingErrors(stock);
  if (footing.length) {
    findings.push({
      id: 'balance-sheet',
      severity: 'warning',
      title: 'Balance sheet does not foot',
      detail: `Assets and liabilities do not add to the stated totals for ${footing.join(', ')}. The balance sheet below is shown as received and has not been used to derive any ratio.`,
    });
  }

  if (latest && latest.sales > 0) {
    const impliedOpm = (latest.operating_profit / latest.sales) * 100;
    if (Math.abs(impliedOpm - stock.opm) > 3) {
      findings.push({
        id: 'opm-mismatch',
        severity: 'note',
        title: 'Operating margin is sourced separately',
        detail: `The headline OPM of ${stock.opm.toFixed(1)}% differs from the ${impliedOpm.toFixed(1)}% implied by the ${latest.year} P&L, most often because one is consolidated and the other standalone.`,
      });
    }

    const shares = stock.current_price > 0 ? (stock.market_cap * 1e7) / stock.current_price : 0;
    if (shares > 0 && stock.eps) {
      const impliedEps = (latest.net_profit * 1e7) / shares;
      if (relativeGap(impliedEps, stock.eps) > 0.35) {
        findings.push({
          id: 'eps-mismatch',
          severity: 'note',
          title: 'EPS and the P&L disagree',
          detail: `Headline EPS of ₹${stock.eps.toFixed(2)} implies a very different profit from the ₹${latest.net_profit.toLocaleString('en-IN')} Cr in the ${latest.year} statement. Valuation multiples on this page use the headline figure.`,
        });
      }
    }
  }

  if (annual.length < 5 && stock.sales_growth_5y === null && stock.profit_growth_5y === null) {
    findings.push({
      id: 'short-history',
      severity: 'note',
      title: `Only ${annual.length} years of annual history`,
      detail: 'Five- and ten-year growth rates cannot be computed from this and are shown as not reported rather than as zero.',
    });
  }

  return findings;
}

/** Universe-wide coverage for one field, used by the screener to set expectations. */
export function fieldCoverage(stocks: Stock[], key: string): { reported: number; total: number } {
  let reported = 0;
  for (const stock of stocks) {
    const value = (stock as unknown as Record<string, unknown>)[key];
    if (value !== null && value !== undefined) reported++;
  }
  return { reported, total: stocks.length };
}
