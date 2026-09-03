import { Stock } from '../types/stock';
import { METRIC_PHRASES, resolveMetricKey, suggestMetrics, getMetric, METRICS_DICTIONARY } from './metricsDictionary';

export type TokenType =
  | 'IDENTIFIER'
  | 'UNKNOWN'
  | 'NUMBER'
  | 'STRING'
  | 'COMPARISON'
  | 'ARITHMETIC'
  | 'LOGICAL_AND'
  | 'LOGICAL_OR'
  | 'LOGICAL_NOT'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF';

export interface Token {
  type: TokenType;
  /** Source text of the token. */
  value: string;
  /** Start offset in the original query. */
  pos: number;
  /** End offset (exclusive) in the original query. */
  end: number;
  /** For IDENTIFIER: the resolved Stock field key. */
  metricKey?: string;
}

export interface ASTNode {
  type: 'BinaryExpr' | 'LogicalExpr' | 'UnaryExpr' | 'Identifier' | 'Literal';
  operator?: string;
  left?: ASTNode;
  right?: ASTNode;
  argument?: ASTNode;
  value?: number | string;
  metricKey?: string;
}

/** A metric value, or `null` when the figure is not available for that company. */
export type MetricValue = number | string | boolean | null;

export class QueryError extends Error {
  constructor(message: string, public pos?: number) {
    super(message);
    this.name = 'QueryError';
  }
}

/**
 * Whitespace-insensitive projection of the query, so that a metric phrase can
 * be matched regardless of how the user spaced it ("p / e" === "P/E").
 */
interface Canon {
  text: string;
  /** canon index -> original index */
  toOriginal: number[];
  /** original index -> index of the first canon char at or after it */
  toCanon: number[];
}

function buildCanon(query: string): Canon {
  const text: string[] = [];
  const toOriginal: number[] = [];
  const canonAt = new Array<number>(query.length).fill(-1);

  for (let i = 0; i < query.length; i++) {
    if (/\s/.test(query[i])) continue;
    canonAt[i] = text.length;
    toOriginal.push(i);
    text.push(query[i].toLowerCase());
  }

  const toCanon = new Array<number>(query.length + 1);
  toCanon[query.length] = text.length;
  for (let i = query.length - 1; i >= 0; i--) {
    toCanon[i] = canonAt[i] >= 0 ? canonAt[i] : toCanon[i + 1];
  }

  return { text: text.join(''), toOriginal, toCanon };
}

/**
 * Longest-match a known metric phrase starting at `pos`.
 *
 * This replaces the old approach of greedily eating every word character
 * (including spaces) until an operator appeared, which swallowed the AND / OR
 * that followed a condition and silently dropped every clause after the first.
 */
function matchMetric(query: string, canon: Canon, pos: number): { key: string; end: number } | null {
  const start = canon.toCanon[pos];
  if (start >= canon.text.length) return null;

  for (const phrase of METRIC_PHRASES) {
    if (!canon.text.startsWith(phrase.canon, start)) continue;

    const endCanon = start + phrase.canon.length;
    // Where the last matched character sits in the original string, +1.
    const end = canon.toOriginal[endCanon - 1] + 1;

    // The boundary has to be judged on the original text, not the canonical
    // one: "DMA 200 AND ..." collapses to "dma200and...", and testing the
    // canonical neighbour would reject the match because of the A in AND.
    const nextChar = query[end];
    if (nextChar !== undefined && /[a-zA-Z0-9_]/.test(nextChar)) continue;

    return { key: phrase.key, end };
  }

  return null;
}

/** Consume an unrecognised word run so the parser can report it precisely. */
function readUnknownWord(query: string, start: number): number {
  let i = start;
  let lastWordEnd = start;
  while (i < query.length) {
    const ch = query[i];
    if (/[a-zA-Z0-9_]/.test(ch)) {
      i++;
      lastWordEnd = i;
      continue;
    }
    if (/\s/.test(ch)) {
      // Only keep going if the next word is not a boolean keyword.
      let j = i;
      while (j < query.length && /\s/.test(query[j])) j++;
      if (j >= query.length) break;
      if (!/[a-zA-Z_]/.test(query[j])) break;
      if (KEYWORD_RE.test(query.slice(j))) break;
      i = j;
      continue;
    }
    break;
  }
  return Math.max(lastWordEnd, start + 1);
}

const KEYWORD_RE = /^(and|or|not)(?![a-zA-Z0-9_])/i;

export function tokenize(query: string): Token[] {
  const tokens: Token[] = [];
  const canon = buildCanon(query);
  const len = query.length;
  let i = 0;

  while (i < len) {
    const ch = query[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(', pos: i, end: i + 1 });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')', pos: i, end: i + 1 });
      i++;
      continue;
    }

    // Two-character comparisons first, then single-character ones.
    const two = query.slice(i, i + 2);
    if (two === '>=' || two === '<=' || two === '==' || two === '!=') {
      tokens.push({ type: 'COMPARISON', value: two, pos: i, end: i + 2 });
      i += 2;
      continue;
    }
    if (ch === '>' || ch === '<') {
      tokens.push({ type: 'COMPARISON', value: ch, pos: i, end: i + 1 });
      i++;
      continue;
    }
    if (ch === '=') {
      tokens.push({ type: 'COMPARISON', value: '==', pos: i, end: i + 1 });
      i++;
      continue;
    }

    // Numbers, with an optional trailing unit suffix the user may have typed.
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(query[i + 1] || ''))) {
      const start = i;
      let numStr = '';
      while (i < len && /[0-9.]/.test(query[i])) {
        numStr += query[i];
        i++;
      }
      if (i < len && query[i] === '%') i++;
      tokens.push({ type: 'NUMBER', value: numStr, pos: start, end: i });
      continue;
    }

    // A leading minus is unary only where a value cannot already have appeared.
    if (ch === '-') {
      const prev = tokens[tokens.length - 1];
      const isUnary =
        !prev ||
        prev.type === 'COMPARISON' ||
        prev.type === 'ARITHMETIC' ||
        prev.type === 'LPAREN' ||
        prev.type === 'LOGICAL_AND' ||
        prev.type === 'LOGICAL_OR' ||
        prev.type === 'LOGICAL_NOT';

      if (isUnary) {
        let j = i + 1;
        while (j < len && /\s/.test(query[j])) j++;
        if (j < len && /[0-9.]/.test(query[j])) {
          const start = i;
          let numStr = '-';
          i = j;
          while (i < len && /[0-9.]/.test(query[i])) {
            numStr += query[i];
            i++;
          }
          if (i < len && query[i] === '%') i++;
          tokens.push({ type: 'NUMBER', value: numStr, pos: start, end: i });
          continue;
        }
      }
      tokens.push({ type: 'ARITHMETIC', value: '-', pos: i, end: i + 1 });
      i++;
      continue;
    }

    if (ch === '+' || ch === '*') {
      tokens.push({ type: 'ARITHMETIC', value: ch, pos: i, end: i + 1 });
      i++;
      continue;
    }

    // '/' and '%' are ambiguous: they appear inside metric names (P/E, ROCE %)
    // as well as being operators, so a metric match is attempted first.
    if (ch === '/' || ch === '%') {
      tokens.push({ type: 'ARITHMETIC', value: ch, pos: i, end: i + 1 });
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      const start = i;
      let str = '';
      i++;
      while (i < len && query[i] !== quote) {
        str += query[i];
        i++;
      }
      if (i < len) i++;
      tokens.push({ type: 'STRING', value: str, pos: start, end: i });
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      const keyword = KEYWORD_RE.exec(query.slice(i));
      if (keyword) {
        const word = keyword[1].toUpperCase();
        const type = word === 'AND' ? 'LOGICAL_AND' : word === 'OR' ? 'LOGICAL_OR' : 'LOGICAL_NOT';
        tokens.push({ type, value: word, pos: i, end: i + keyword[1].length });
        i += keyword[1].length;
        continue;
      }

      const metric = matchMetric(query, canon, i);
      if (metric) {
        tokens.push({
          type: 'IDENTIFIER',
          value: query.slice(i, metric.end).trim(),
          pos: i,
          end: metric.end,
          metricKey: metric.key,
        });
        i = metric.end;
        continue;
      }

      const end = readUnknownWord(query, i);
      tokens.push({ type: 'UNKNOWN', value: query.slice(i, end).trim(), pos: i, end });
      i = end;
      continue;
    }

    // Anything else is not part of the language.
    tokens.push({ type: 'UNKNOWN', value: ch, pos: i, end: i + 1 });
    i++;
  }

  tokens.push({ type: 'EOF', value: '', pos: len, end: len });
  return tokens;
}

export class ScreenerParser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  public parse(): ASTNode | null {
    if (this.tokens.length <= 1) return null;

    const expr = this.parseLogicalOr();

    if (!this.isAtEnd()) {
      const tok = this.peek();
      if (tok.type === 'UNKNOWN') throw this.unknownMetric(tok);
      throw new QueryError(
        `Unexpected "${tok.value}" after a complete condition. Join conditions with AND / OR.`,
        tok.pos
      );
    }

    return expr;
  }

  private unknownMetric(tok: Token): QueryError {
    const suggestions = suggestMetrics(tok.value);
    const hint = suggestions.length ? ` Did you mean ${suggestions.map((s) => `"${s}"`).join(' or ')}?` : '';
    return new QueryError(`Unknown metric "${tok.value}".${hint}`, tok.pos);
  }

  private parseLogicalOr(): ASTNode {
    let expr = this.parseLogicalAnd();
    while (this.match('LOGICAL_OR')) {
      const right = this.parseLogicalAnd();
      expr = { type: 'LogicalExpr', operator: 'OR', left: expr, right };
    }
    return expr;
  }

  private parseLogicalAnd(): ASTNode {
    let expr = this.parseLogicalNot();
    while (this.match('LOGICAL_AND')) {
      const right = this.parseLogicalNot();
      expr = { type: 'LogicalExpr', operator: 'AND', left: expr, right };
    }
    return expr;
  }

  /**
   * NOT binds a whole comparison, so `NOT Debt to equity > 1` reads as
   * `NOT (Debt to equity > 1)`. The old grammar put NOT below arithmetic,
   * which turned that into `(NOT Debt to equity) > 1`.
   */
  private parseLogicalNot(): ASTNode {
    if (this.match('LOGICAL_NOT')) {
      const argument = this.parseLogicalNot();
      return { type: 'UnaryExpr', operator: 'NOT', argument };
    }
    return this.parseComparison();
  }

  private parseComparison(): ASTNode {
    const left = this.parseAdditive();

    if (this.match('COMPARISON')) {
      const operator = this.previous().value;
      const right = this.parseAdditive();

      if (this.check('COMPARISON')) {
        const tok = this.peek();
        throw new QueryError(
          `Chained comparison at "${tok.value}". Write it as two conditions joined by AND.`,
          tok.pos
        );
      }

      return { type: 'BinaryExpr', operator, left, right };
    }

    return left;
  }

  private parseAdditive(): ASTNode {
    let expr = this.parseMultiplicative();
    while (this.check('ARITHMETIC') && (this.peek().value === '+' || this.peek().value === '-')) {
      const operator = this.advance().value;
      const right = this.parseMultiplicative();
      expr = { type: 'BinaryExpr', operator, left: expr, right };
    }
    return expr;
  }

  private parseMultiplicative(): ASTNode {
    let expr = this.parseUnary();
    while (
      this.check('ARITHMETIC') &&
      (this.peek().value === '*' || this.peek().value === '/' || this.peek().value === '%')
    ) {
      const operator = this.advance().value;
      const right = this.parseUnary();
      expr = { type: 'BinaryExpr', operator, left: expr, right };
    }
    return expr;
  }

  private parseUnary(): ASTNode {
    if (this.check('ARITHMETIC') && this.peek().value === '-') {
      this.advance();
      const argument = this.parseUnary();
      return { type: 'BinaryExpr', operator: '-', left: { type: 'Literal', value: 0 }, right: argument };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    if (this.match('NUMBER')) {
      return { type: 'Literal', value: parseFloat(this.previous().value) };
    }

    if (this.match('STRING')) {
      return { type: 'Literal', value: this.previous().value };
    }

    if (this.match('IDENTIFIER')) {
      const tok = this.previous();
      return { type: 'Identifier', value: tok.value, metricKey: tok.metricKey };
    }

    if (this.match('LPAREN')) {
      const expr = this.parseLogicalOr();
      if (!this.match('RPAREN')) {
        const tok = this.peek();
        if (tok.type === 'UNKNOWN') throw this.unknownMetric(tok);
        throw new QueryError(`Missing ")" to close the group opened earlier.`, tok.pos);
      }
      return expr;
    }

    const tok = this.peek();
    if (tok.type === 'UNKNOWN') throw this.unknownMetric(tok);
    if (tok.type === 'EOF') {
      throw new QueryError('The query ends early: a value or metric is missing.', tok.pos);
    }
    throw new QueryError(`Unexpected "${tok.value}": expected a metric, number, or "(".`, tok.pos);
  }
}

function toNumber(value: MetricValue): number | null {
  if (value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Evaluate against one company.
 *
 * Missing figures are `null`, never 0: a company whose cash conversion cycle
 * was never reported must not pass `Cash conversion cycle < 45`.
 */
export function evaluateAST(node: ASTNode | null, stock: Stock): MetricValue {
  if (!node) return true;

  switch (node.type) {
    case 'Literal':
      return node.value ?? null;

    case 'Identifier': {
      const key = node.metricKey;
      if (!key) return null;
      const raw = (stock as unknown as Record<string, unknown>)[key];
      if (raw === undefined || raw === null) return null;
      if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
      if (typeof raw === 'string') return raw;
      return null;
    }

    case 'UnaryExpr':
      return !evaluateAST(node.argument || null, stock);

    case 'BinaryExpr': {
      const left = evaluateAST(node.left || null, stock);
      const right = evaluateAST(node.right || null, stock);
      const op = node.operator;

      if (op === '==' || op === '!=') {
        // An unknown figure is never equal, and never provably unequal either.
        if (left === null || right === null) return false;
        const equal =
          typeof left === 'string' || typeof right === 'string'
            ? String(left).trim().toLowerCase() === String(right).trim().toLowerCase()
            : Number(left) === Number(right);
        return op === '==' ? equal : !equal;
      }

      const l = toNumber(left);
      const r = toNumber(right);
      if (l === null || r === null) return op === '>' || op === '<' || op === '>=' || op === '<=' ? false : null;

      switch (op) {
        case '>': return l > r;
        case '<': return l < r;
        case '>=': return l >= r;
        case '<=': return l <= r;
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return r === 0 ? null : l / r;
        case '%': return r === 0 ? null : l % r;
        default: return null;
      }
    }

    case 'LogicalExpr': {
      const left = evaluateAST(node.left || null, stock);
      if (node.operator === 'AND') {
        if (!left) return false;
        return !!evaluateAST(node.right || null, stock);
      }
      if (left) return true;
      return !!evaluateAST(node.right || null, stock);
    }

    default:
      return true;
  }
}

export interface ParsedQuery {
  ast: ASTNode | null;
  /** Stock field keys the query reads, in order of first appearance. */
  metrics: string[];
}

export function parseQuery(query: string): ParsedQuery {
  const tokens = tokenize(query);
  const ast = new ScreenerParser(tokens).parse();
  const metrics: string[] = [];
  for (const tok of tokens) {
    if (tok.type === 'IDENTIFIER' && tok.metricKey && !metrics.includes(tok.metricKey)) {
      metrics.push(tok.metricKey);
    }
  }
  return { ast, metrics };
}

export interface QueryValidation {
  ok: boolean;
  error?: string;
  errorPos?: number;
  metrics: string[];
}

/** Used by the editor to report problems as the user types. */
export function validateQuery(query: string): QueryValidation {
  if (!query.trim()) return { ok: true, metrics: [] };
  try {
    const { metrics } = parseQuery(query);
    return { ok: true, metrics };
  } catch (err) {
    const qe = err as QueryError;
    return { ok: false, error: qe.message || 'Invalid query', errorPos: qe.pos, metrics: [] };
  }
}

export interface ScreenExecution {
  matches: Stock[];
  error?: string;
  errorPos?: number;
  executionTimeMs: number;
  /** Companies excluded because a metric the query needs was not reported. */
  skippedForMissingData: number;
  metrics: string[];
}

export function executeScreenerQuery(query: string, stocks: Stock[]): ScreenExecution {
  const startTime = performance.now();
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      matches: stocks,
      executionTimeMs: 0,
      skippedForMissingData: 0,
      metrics: [],
    };
  }

  try {
    const { ast, metrics } = parseQuery(trimmed);

    let skipped = 0;
    const matches = stocks.filter((stock) => {
      const record = stock as unknown as Record<string, unknown>;
      const missing = metrics.some((key) => record[key] === null || record[key] === undefined);
      const passed = !!evaluateAST(ast, stock);
      if (!passed && missing) skipped++;
      return passed;
    });

    return {
      matches,
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      skippedForMissingData: skipped,
      metrics,
    };
  } catch (err) {
    const qe = err as QueryError;
    return {
      matches: [],
      error: qe.message || 'Syntax error in query',
      errorPos: qe.pos,
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      skippedForMissingData: 0,
      metrics: [],
    };
  }
}

/** Rewrite a query with canonical metric names and one condition per line. */
export function formatScreenerQuery(query: string): string {
  try {
    // Parse first: tidying a broken query into something that reads as
    // canonical would disguise the fact that it still does not run.
    parseQuery(query);

    const tokens = tokenize(query);
    const parts: string[] = [];
    let depth = 0;

    for (const tok of tokens) {
      if (tok.type === 'EOF') break;

      switch (tok.type) {
        case 'LOGICAL_AND':
        case 'LOGICAL_OR':
          parts.push(depth > 0 ? ` ${tok.value} ` : `\n${tok.value} `);
          break;
        case 'LOGICAL_NOT':
          parts.push('NOT ');
          break;
        case 'LPAREN':
          depth++;
          parts.push('(');
          break;
        case 'RPAREN':
          depth = Math.max(0, depth - 1);
          parts.push(')');
          break;
        case 'COMPARISON':
        case 'ARITHMETIC':
          parts.push(` ${tok.value} `);
          break;
        case 'IDENTIFIER': {
          const metric = tok.metricKey ? getMetric(tok.metricKey) : undefined;
          parts.push(metric ? metric.name : tok.value);
          break;
        }
        case 'STRING':
          parts.push(`"${tok.value}"`);
          break;
        default:
          parts.push(tok.value);
      }
    }

    return parts
      .join('')
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\( /g, '(')
      .replace(/ \)/g, ')')
      .trim();
  } catch {
    return query;
  }
}

export { resolveMetricKey, METRICS_DICTIONARY };
