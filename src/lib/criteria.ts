import { tokenize, type Token } from '../engine/screenerParser';
import { getMetric } from '../engine/metricsDictionary';

/**
 * Reads a query back as short criteria, for a screen card:
 *   "Price to Earning < 25 AND Market Capitalization > 1000"
 *   becomes ["P/E < 25", "Market cap > ₹1,000 Cr"]
 *
 * Only a plain chain of ANDed comparisons is summarised. Anything with OR,
 * NOT or brackets returns null, and the caller shows the query itself, since
 * flattening it would change what it says.
 */

const LABELS: Record<string, string> = {
  market_cap: 'Market cap',
  current_price: 'Price',
  pe_ratio: 'P/E',
  industry_pe: 'sector P/E',
  pb_ratio: 'P/B',
  peg_ratio: 'PEG',
  roce: 'ROCE',
  roe: 'ROE',
  debt_to_equity: 'Debt/equity',
  sales_growth_3y: 'Sales growth 3y',
  profit_growth_3y: 'Profit growth 3y',
  sales_growth_ttm: 'Sales growth TTM',
  profit_growth_ttm: 'Profit growth TTM',
  graham_number: 'Graham number',
  dma_50: '50-day average',
  dma_200: '200-day average',
  rsi_14: 'RSI',
  piotroski_score: 'Piotroski',
  altman_z_score: 'Altman Z',
  fcf_yield: 'FCF yield',
  cfo_3y: 'Operating cash flow 3y',
  dividend_yield: 'Dividend yield',
  distance_52w_high: 'From 52-week high',
};

const OPERATORS: Record<string, string> = { '>': '>', '<': '<', '>=': '≥', '<=': '≤', '==': '=', '!=': '≠' };

const label = (key: string) => LABELS[key] ?? getMetric(key)?.short_name ?? getMetric(key)?.name ?? key;

function figure(raw: string, unit: string | undefined): string {
  const n = Number(raw);
  const text = Number.isFinite(n) ? n.toLocaleString('en-IN') : raw;
  if (unit === '%') return `${text}%`;
  if (unit === 'Cr') return `₹${text} Cr`;
  if (unit === 'Rs') return `₹${text}`;
  return text;
}

interface Clause {
  metric?: string;
  op?: string;
  value?: string;
  text: string;
}

function readClause(tokens: Token[]): Clause | null {
  // metric op number
  if (tokens.length === 3 && tokens[0].type === 'IDENTIFIER' && tokens[1].type === 'COMPARISON' && tokens[2].type === 'NUMBER') {
    const key = tokens[0].metricKey!;
    const op = tokens[1].value;
    const value = tokens[2].value;
    return { metric: key, op, value, text: `${label(key)} ${OPERATORS[op] ?? op} ${figure(value, getMetric(key)?.unit)}` };
  }
  // metric op metric
  if (tokens.length === 3 && tokens[0].type === 'IDENTIFIER' && tokens[1].type === 'COMPARISON' && tokens[2].type === 'IDENTIFIER') {
    const op = tokens[1].value;
    return { text: `${label(tokens[0].metricKey!)} ${OPERATORS[op] ?? op} ${label(tokens[2].metricKey!)}` };
  }
  return null;
}

export function summariseQuery(query: string): string[] | null {
  let tokens: Token[];
  try {
    tokens = tokenize(query).filter((t) => t.type !== 'EOF');
  } catch {
    return null;
  }
  if (tokens.some((t) => ['LOGICAL_OR', 'LOGICAL_NOT', 'LPAREN', 'RPAREN', 'UNKNOWN', 'ARITHMETIC'].includes(t.type))) {
    return null;
  }

  const groups: Token[][] = [[]];
  for (const t of tokens) {
    if (t.type === 'LOGICAL_AND') groups.push([]);
    else groups[groups.length - 1].push(t);
  }

  const clauses: Clause[] = [];
  for (const group of groups) {
    const clause = readClause(group);
    if (!clause) return null;
    clauses.push(clause);
  }

  // A lower and an upper bound on the same metric read better as a range:
  // "RSI > 50, RSI < 70" becomes "RSI 50 to 70".
  const out: string[] = [];
  const used = new Set<number>();
  clauses.forEach((c, i) => {
    if (used.has(i)) return;
    if (c.metric && (c.op === '>' || c.op === '>=')) {
      const j = clauses.findIndex((d, k) => k > i && !used.has(k) && d.metric === c.metric && (d.op === '<' || d.op === '<='));
      if (j >= 0) {
        used.add(j);
        const unit = getMetric(c.metric)?.unit;
        out.push(`${label(c.metric)} ${figure(c.value!, unit === '%' ? undefined : unit)} to ${figure(clauses[j].value!, unit)}`);
        return;
      }
    }
    out.push(c.text);
  });
  return out;
}
