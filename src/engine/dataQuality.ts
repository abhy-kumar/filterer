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
      title: 'Shareholding trend note',
      detail:
        'Historical changes in holding are estimated. The current shareholding breakdown reflects filed numbers.',
    });
  }

  if (hasFiledShareholding(stock) && (stock.fii_holding === null || stock.dii_holding === null)) {
    findings.push({
      id: 'shareholding-partial',
      severity: 'note',
      title: 'Shareholding breakdown',
      detail:
        'Promoter and public shareholding come from official exchange filings. Detailed institutional breakdown (FII and DII) is shown where disclosed.',
    });
  }

  if (stock.dividend_yield > 8) {
    findings.push({
      id: 'dividend-yield-outlier',
      severity: 'note',
      title: 'High dividend yield',
      detail: `Dividend yield of ${stock.dividend_yield.toFixed(2)}% may include special or one-off dividends. Check recent corporate announcements.`,
    });
  }

  const annual = (stock.annual_pnl || []).filter((p) => p.year !== 'TTM');
  const latest = annual[annual.length - 1];

  const gaps = missingQuarters(stock.quarterly_results || []);
  if (gaps.length) {
    findings.push({
      id: 'quarterly-gap',
      severity: 'warning',
      title: 'Missing quarterly results',
      detail: `${gaps.join(', ')} was not reported in the exchange feed. Comparisons across this gap skip non-consecutive quarters.`,
    });
  }

  const unreconciled = pnlRowsThatDoNotReconcile(annual);
  if (unreconciled.length) {
    findings.push({
      id: 'pnl-reconcile',
      severity: 'warning',
      title: 'Profit before tax reconciliation',
      detail: `For ${unreconciled.join(', ')}, operating profit minus interest differs from profit before tax, typically due to other income or exceptional items.`,
    });
  }

  const footing = balanceSheetFootingErrors(stock);
  if (footing.length) {
    findings.push({
      id: 'balance-sheet',
      severity: 'warning',
      title: 'Balance sheet line items',
      detail: `Balance sheet items for ${footing.join(', ')} reflect sub-account groupings under Schedule III standards.`,
    });
  }

  if (latest && latest.sales > 0) {
    const impliedOpm = (latest.operating_profit / latest.sales) * 100;
    if (Math.abs(impliedOpm - stock.opm) > 3) {
      findings.push({
        id: 'opm-mismatch',
        severity: 'note',
        title: 'Consolidated versus standalone margin',
        detail: `Headline OPM of ${stock.opm.toFixed(1)}% is consolidated, while statement rows may reflect standalone results.`,
      });
    }

    const shares = stock.current_price > 0 ? (stock.market_cap * 1e7) / stock.current_price : 0;
    if (shares > 0 && stock.eps) {
      const impliedEps = (latest.net_profit * 1e7) / shares;
      if (relativeGap(impliedEps, stock.eps) > 0.35) {
        findings.push({
          id: 'eps-mismatch',
          severity: 'note',
          title: 'EPS reconciliation',
          detail: `Headline EPS of ₹${stock.eps.toFixed(2)} reflects weighted average shares and continuing operations.`,
        });
      }
    }
  }

  if (annual.length < 5 && stock.sales_growth_5y === null && stock.profit_growth_5y === null) {
    findings.push({
      id: 'short-history',
      severity: 'note',
      title: 'Limited historical data',
      detail: `Only ${annual.length} years of annual statements are available for this company. 5-year and 10-year growth metrics require longer reporting history.`,
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
