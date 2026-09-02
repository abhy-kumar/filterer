import { Stock } from '../types/stock';
import { METRIC_ALIAS_MAP, resolveMetricKey, METRICS_DICTIONARY } from './metricsDictionary';

export type TokenType =
  | 'IDENTIFIER'
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
  value: string;
  pos: number;
}

export interface ASTNode {
  type: 'BinaryExpr' | 'LogicalExpr' | 'UnaryExpr' | 'Identifier' | 'Literal';
  operator?: string;
  left?: ASTNode;
  right?: ASTNode;
  argument?: ASTNode;
  value?: any;
  metricKey?: string;
}

// Tokenize input string
export function tokenize(query: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = query.length;

  while (i < len) {
    const ch = query[i];

    // Whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Parentheses
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(', pos: i });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')', pos: i });
      i++;
      continue;
    }

    // Arithmetic operators (+, -, *, /, %)
    if (['+', '*', '/', '%'].includes(ch)) {
      tokens.push({ type: 'ARITHMETIC', value: ch, pos: i });
      i++;
      continue;
    }

    // Negative numbers or Minus
    if (ch === '-') {
      const nextChar = query[i + 1];
      const prevToken = tokens[tokens.length - 1];
      const isUnary = !prevToken || ['COMPARISON', 'ARITHMETIC', 'LPAREN', 'LOGICAL_AND', 'LOGICAL_OR', 'LOGICAL_NOT'].includes(prevToken.type);

      if (isUnary && nextChar && /[0-9]/.test(nextChar)) {
        let numStr = '-';
        i++;
        while (i < len && /[0-9.]/.test(query[i])) {
          numStr += query[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: numStr, pos: i - numStr.length });
        continue;
      } else {
        tokens.push({ type: 'ARITHMETIC', value: '-', pos: i });
        i++;
        continue;
      }
    }

    // Comparison operators (>=, <=, ==, !=, =, >, <)
    if (['>', '<', '=', '!'].includes(ch)) {
      const next = query[i + 1];
      if (ch === '>' && next === '=') {
        tokens.push({ type: 'COMPARISON', value: '>=', pos: i });
        i += 2;
        continue;
      }
      if (ch === '<' && next === '=') {
        tokens.push({ type: 'COMPARISON', value: '<=', pos: i });
        i += 2;
        continue;
      }
      if (ch === '=' && next === '=') {
        tokens.push({ type: 'COMPARISON', value: '==', pos: i });
        i += 2;
        continue;
      }
      if (ch === '!' && next === '=') {
        tokens.push({ type: 'COMPARISON', value: '!=', pos: i });
        i += 2;
        continue;
      }
      if (ch === '=') {
        tokens.push({ type: 'COMPARISON', value: '==', pos: i });
        i++;
        continue;
      }
      if (ch === '>') {
        tokens.push({ type: 'COMPARISON', value: '>', pos: i });
        i++;
        continue;
      }
      if (ch === '<') {
        tokens.push({ type: 'COMPARISON', value: '<', pos: i });
        i++;
        continue;
      }
    }

    // Numbers (e.g. 500, 15.5, 20%)
    if (/[0-9]/.test(ch)) {
      let numStr = '';
      const startPos = i;
      while (i < len && /[0-9.]/.test(query[i])) {
        numStr += query[i];
        i++;
      }
      if (i < len && query[i] === '%') {
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr, pos: startPos });
      continue;
    }

    // String literals
    if (ch === '\'' || ch === '"') {
      const quote = ch;
      let str = '';
      const startPos = i;
      i++;
      while (i < len && query[i] !== quote) {
        str += query[i];
        i++;
      }
      if (i < len && query[i] === quote) {
        i++;
      }
      tokens.push({ type: 'STRING', value: str, pos: startPos });
      continue;
    }

    // Identifiers & Keywords
    if (/[a-zA-Z_]/.test(ch)) {
      let wordStr = '';
      const startPos = i;
      while (i < len && /[a-zA-Z0-9_\s\/\-]/.test(query[i])) {
        const curr = query[i];
        if (['(', ')', '>', '<', '=', '!', '+', '*'].includes(curr)) {
          break;
        }
        wordStr += curr;
        i++;
      }
      wordStr = wordStr.trim();

      const upper = wordStr.toUpperCase();
      if (upper === 'AND') {
        tokens.push({ type: 'LOGICAL_AND', value: 'AND', pos: startPos });
      } else if (upper === 'OR') {
        tokens.push({ type: 'LOGICAL_OR', value: 'OR', pos: startPos });
      } else if (upper === 'NOT') {
        tokens.push({ type: 'LOGICAL_NOT', value: 'NOT', pos: startPos });
      } else {
        const parts = wordStr.split(/\s+(AND|OR|NOT)\s+/i);
        if (parts.length > 1) {
          let currPos = startPos;
          for (let p = 0; p < parts.length; p++) {
            const part = parts[p].trim();
            if (!part) continue;
            const pUpper = part.toUpperCase();
            if (pUpper === 'AND') {
              tokens.push({ type: 'LOGICAL_AND', value: 'AND', pos: currPos });
            } else if (pUpper === 'OR') {
              tokens.push({ type: 'LOGICAL_OR', value: 'OR', pos: currPos });
            } else if (pUpper === 'NOT') {
              tokens.push({ type: 'LOGICAL_NOT', value: 'NOT', pos: currPos });
            } else {
              tokens.push({ type: 'IDENTIFIER', value: part, pos: currPos });
            }
            currPos += parts[p].length + 1;
          }
        } else {
          tokens.push({ type: 'IDENTIFIER', value: wordStr, pos: startPos });
        }
      }
      continue;
    }

    i++;
  }

  tokens.push({ type: 'EOF', value: '', pos: len });
  return tokens;
}

export class ScreenerParser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: 'EOF', value: '', pos: 0 };
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
    if (this.isAtEnd()) return false;
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
    if (this.tokens.length === 0 || (this.tokens.length === 1 && this.tokens[0].type === 'EOF')) {
      return null;
    }
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): ASTNode {
    let expr = this.parseLogicalAnd();

    while (this.match('LOGICAL_OR')) {
      const operator = 'OR';
      const right = this.parseLogicalAnd();
      expr = {
        type: 'LogicalExpr',
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private parseLogicalAnd(): ASTNode {
    let expr = this.parseComparison();

    while (this.match('LOGICAL_AND')) {
      const operator = 'AND';
      const right = this.parseComparison();
      expr = {
        type: 'LogicalExpr',
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private parseComparison(): ASTNode {
    let expr = this.parseAdditive();

    while (this.match('COMPARISON')) {
      const operator = this.previous().value;
      const right = this.parseAdditive();
      expr = {
        type: 'BinaryExpr',
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private parseAdditive(): ASTNode {
    let expr = this.parseMultiplicative();

    while (this.check('ARITHMETIC') && (this.peek().value === '+' || this.peek().value === '-')) {
      const operator = this.advance().value;
      const right = this.parseMultiplicative();
      expr = {
        type: 'BinaryExpr',
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private parseMultiplicative(): ASTNode {
    let expr = this.parseUnary();

    while (this.check('ARITHMETIC') && (this.peek().value === '*' || this.peek().value === '/' || this.peek().value === '%')) {
      const operator = this.advance().value;
      const right = this.parseUnary();
      expr = {
        type: 'BinaryExpr',
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private parseUnary(): ASTNode {
    if (this.match('LOGICAL_NOT')) {
      const argument = this.parseUnary();
      return {
        type: 'UnaryExpr',
        operator: 'NOT',
        argument,
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    if (this.match('NUMBER')) {
      return {
        type: 'Literal',
        value: parseFloat(this.previous().value),
      };
    }

    if (this.match('STRING')) {
      return {
        type: 'Literal',
        value: this.previous().value,
      };
    }

    if (this.match('IDENTIFIER')) {
      const raw = this.previous().value;
      const metricKey = resolveMetricKey(raw) || raw.toLowerCase().replace(/\s+/g, '_');
      return {
        type: 'Identifier',
        value: raw,
        metricKey,
      };
    }

    if (this.match('LPAREN')) {
      const expr = this.parseLogicalOr();
      if (!this.match('RPAREN')) {
        throw new Error("Expected ')' after expression");
      }
      return expr;
    }

    const currentTok = this.peek();
    throw new Error(`Unexpected token at position ${currentTok.pos}: '${currentTok.value || 'EOF'}'`);
  }
}

export function evaluateAST(node: ASTNode | null, stock: Stock): any {
  if (!node) return true;

  switch (node.type) {
    case 'Literal':
      return node.value;

    case 'Identifier': {
      const key = node.metricKey || '';
      const stockVal = (stock as any)[key];
      if (stockVal !== undefined && stockVal !== null) {
        return stockVal;
      }

      if (key === 'cmp' || key === 'price') return stock.current_price;
      if (key === 'marketcap' || key === 'mcap') return stock.market_cap;
      if (key === 'pe') return stock.pe_ratio;
      if (key === 'pb') return stock.pb_ratio;
      if (key === 'roce_pct') return stock.roce;
      if (key === 'roe_pct') return stock.roe;

      return 0;
    }

    case 'UnaryExpr': {
      if (node.operator === 'NOT') {
        return !evaluateAST(node.argument || null, stock);
      }
      return false;
    }

    case 'BinaryExpr': {
      const leftVal = evaluateAST(node.left || null, stock);
      const rightVal = evaluateAST(node.right || null, stock);

      switch (node.operator) {
        case '>':
          return Number(leftVal) > Number(rightVal);
        case '<':
          return Number(leftVal) < Number(rightVal);
        case '>=':
          return Number(leftVal) >= Number(rightVal);
        case '<=':
          return Number(leftVal) <= Number(rightVal);
        case '==':
        case '=':
          return leftVal == rightVal;
        case '!=':
          return leftVal != rightVal;
        case '+':
          return (typeof leftVal === 'number' && typeof rightVal === 'number') ? leftVal + rightVal : `${leftVal}${rightVal}`;
        case '-':
          return Number(leftVal) - Number(rightVal);
        case '*':
          return Number(leftVal) * Number(rightVal);
        case '/':
          return Number(rightVal) !== 0 ? Number(leftVal) / Number(rightVal) : 0;
        case '%':
          return Number(rightVal) !== 0 ? Number(leftVal) % Number(rightVal) : 0;
        default:
          return false;
      }
    }

    case 'LogicalExpr': {
      const leftVal = evaluateAST(node.left || null, stock);

      if (node.operator === 'AND') {
        if (!leftVal) return false;
        return !!evaluateAST(node.right || null, stock);
      } else if (node.operator === 'OR') {
        if (leftVal) return true;
        return !!evaluateAST(node.right || null, stock);
      }
      return false;
    }

    default:
      return true;
  }
}

export function executeScreenerQuery(query: string, stocks: Stock[]): { matches: Stock[]; error?: string; executionTimeMs: number } {
  const startTime = performance.now();
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      matches: stocks,
      executionTimeMs: performance.now() - startTime,
    };
  }

  try {
    const tokens = tokenize(trimmed);
    const parser = new ScreenerParser(tokens);
    const ast = parser.parse();

    const matches = stocks.filter((stock) => {
      try {
        return !!evaluateAST(ast, stock);
      } catch (err) {
        return false;
      }
    });

    const endTime = performance.now();
    return {
      matches,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
    };
  } catch (err: any) {
    return {
      matches: [],
      error: err.message || 'Syntax error in query',
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
    };
  }
}

export function formatScreenerQuery(query: string): string {
  try {
    const tokens = tokenize(query);
    const parts: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.type === 'EOF') break;

      if (tok.type === 'LOGICAL_AND') {
        parts.push('\nAND ');
      } else if (tok.type === 'LOGICAL_OR') {
        parts.push('\nOR ');
      } else if (tok.type === 'LOGICAL_NOT') {
        parts.push('NOT ');
      } else if (tok.type === 'COMPARISON') {
        parts.push(` ${tok.value} `);
      } else if (tok.type === 'ARITHMETIC') {
        parts.push(` ${tok.value} `);
      } else if (tok.type === 'IDENTIFIER') {
        const found = METRICS_DICTIONARY.find(m => m.aliases.includes(tok.value.toLowerCase()) || m.id === tok.value.toLowerCase() || m.name.toLowerCase() === tok.value.toLowerCase());
        parts.push(found ? found.name : tok.value);
      } else {
        parts.push(tok.value);
      }
    }

    return parts.join('').replace(/\s+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
  } catch {
    return query;
  }
}
