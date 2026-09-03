/**
 * Number formatting for figures that may not have been reported.
 *
 * Every helper takes `number | null | undefined` and renders an em dash when
 * the figure is absent, so a missing line item can never be mistaken for zero.
 */

export const NOT_REPORTED = '-';

type Maybe = number | null | undefined;

function isNum(value: Maybe): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function num(value: Maybe, places = 2): string {
  return isNum(value) ? value.toFixed(places) : NOT_REPORTED;
}

export function pct(value: Maybe, places = 1): string {
  return isNum(value) ? `${value.toFixed(places)}%` : NOT_REPORTED;
}

/** Signed percentage, for anything that can move either way. */
export function signedPct(value: Maybe, places = 2): string {
  if (!isNum(value)) return NOT_REPORTED;
  return `${value >= 0 ? '+' : ''}${value.toFixed(places)}%`;
}

export function multiple(value: Maybe, places = 1): string {
  return isNum(value) ? value.toFixed(places) : NOT_REPORTED;
}

export function days(value: Maybe): string {
  return isNum(value) ? `${Math.round(value)} days` : NOT_REPORTED;
}

export function rupees(value: Maybe, places = 2): string {
  if (!isNum(value)) return NOT_REPORTED;
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: places, maximumFractionDigits: places })}`;
}

/** Whole rupees, for prices and per-share figures. */
export function price(value: Maybe): string {
  if (!isNum(value)) return NOT_REPORTED;
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** ₹ Crore, abbreviated once the figure stops being readable in full. */
export function crore(value: Maybe): string {
  if (!isNum(value)) return NOT_REPORTED;
  const abs = Math.abs(value);
  if (abs >= 1e5) return `₹${(value / 1e5).toFixed(2)} L Cr`;
  if (abs >= 1e3) return `₹${Math.round(value).toLocaleString('en-IN')} Cr`;
  return `₹${value.toFixed(abs < 10 ? 2 : 0)} Cr`;
}

/** Statement cells: plain crore figures, negatives in brackets as in a report. */
export function statement(value: Maybe): string {
  if (!isNum(value)) return NOT_REPORTED;
  const rounded = Math.round(value);
  return rounded < 0
    ? `(${Math.abs(rounded).toLocaleString('en-IN')})`
    : rounded.toLocaleString('en-IN');
}

export function compactNumber(value: Maybe): string {
  if (!isNum(value)) return NOT_REPORTED;
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${(value / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(2)} L`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString('en-IN');
}

/** Tailwind class for a figure whose sign carries meaning. */
export function signClass(value: Maybe): string {
  if (!isNum(value)) return 'num-nil';
  if (value > 0) return 'num-pos';
  if (value < 0) return 'num-neg';
  return '';
}

export function isReported(value: Maybe): boolean {
  return isNum(value);
}
