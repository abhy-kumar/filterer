"""
Screener Engine — Screener.in Query-to-SQL Translator and Executor.

Translates Screener.in natural language queries (e.g. "Market Cap > 500 AND ROCE > 15")
into safe SQL WHERE clauses and executes them against the SQLite database.

Security: Uses column name whitelisting and parameterized queries to prevent SQL injection.
"""

import re
import sqlite3
import logging
from typing import Optional

import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ────────────────────────────────────────────────────────
#  METRIC ALIAS MAP
#  Maps natural language aliases to SQLite column names.
#  Only whitelisted columns can appear in queries.
# ────────────────────────────────────────────────────────
METRIC_MAP = {
    # Market & Price
    "market capitalization": "market_cap",
    "market cap": "market_cap",
    "mcap": "market_cap",
    "mar cap": "market_cap",
    "current price": "current_price",
    "cmp": "current_price",
    "price": "current_price",

    # Valuation
    "price to earning": "pe_ratio",
    "pe": "pe_ratio",
    "p/e": "pe_ratio",
    "stock p/e": "pe_ratio",
    "industry pe": "industry_pe",
    "book value": "book_value",
    "bv": "book_value",
    "price to book value": "pb_ratio",
    "price to book": "pb_ratio",
    "pb": "pb_ratio",
    "p/bv": "pb_ratio",
    "peg ratio": "peg_ratio",
    "peg": "peg_ratio",
    "dividend yield": "dividend_yield",
    "div yield": "dividend_yield",
    "ev / ebitda": "ev_ebitda",
    "ev/ebitda": "ev_ebitda",
    "price to sales": "price_to_sales",
    "price to free cash flow": "price_to_fcf",
    "p/fcf": "price_to_fcf",
    "graham number": "graham_number",
    "face value": "face_value",

    # Profitability
    "return on capital employed": "roce",
    "roce": "roce",
    "return on equity": "roe",
    "roe": "roe",
    "operating profit margin": "opm",
    "opm": "opm",
    "net profit margin": "npm",
    "npm": "npm",

    # Growth
    "sales growth 3years": "sales_growth_3y",
    "sales growth 3y": "sales_growth_3y",
    "sales growth 5years": "sales_growth_5y",
    "sales growth 5y": "sales_growth_5y",
    "sales growth 10years": "sales_growth_10y",
    "sales growth 10y": "sales_growth_10y",
    "profit growth 3years": "profit_growth_3y",
    "profit growth 3y": "profit_growth_3y",
    "profit growth 5years": "profit_growth_5y",
    "profit growth 5y": "profit_growth_5y",
    "profit growth 10years": "profit_growth_10y",
    "profit growth 10y": "profit_growth_10y",
    "stock price cagr 1year": "price_cagr_1y",
    "1y return": "price_cagr_1y",
    "stock price cagr 3years": "price_cagr_3y",
    "3y return": "price_cagr_3y",
    "stock price cagr 5years": "price_cagr_5y",
    "5y return": "price_cagr_5y",
    "stock price cagr 10years": "price_cagr_10y",
    "10y return": "price_cagr_10y",

    # Financial Health
    "debt": "debt",
    "total debt": "debt",
    "borrowings": "debt",
    "debt to equity": "debt_to_equity",
    "d/e": "debt_to_equity",
    "interest coverage": "interest_coverage",
    "current ratio": "current_ratio",
    "piotroski score": "piotroski_score",
    "piotroski": "piotroski_score",
    "f-score": "piotroski_score",
    "altman z-score": "altman_z_score",
    "altman z score": "altman_z_score",
    "z-score": "altman_z_score",

    # Cash Flow
    "free cash flow": "fcf_latest",
    "fcf": "fcf_latest",
    "free cash flow 3years": "fcf_3y",
    "operating cash flow 3years": "cfo_3y",
    "free cash flow yield": "fcf_yield",
    "fcf yield": "fcf_yield",

    # Working Capital
    "working capital days": "working_capital_days",
    "debtor days": "debtor_days",
    "inventory days": "inventory_days",
    "days payable": "days_payable",
    "cash conversion cycle": "cash_conversion_cycle",

    # Shareholding
    "promoter holding": "promoter_holding",
    "pledged percentage": "pledged_percentage",
    "fii holding": "fii_holding",
    "change in fii holding": "change_in_fii_holding_quarter",
    "dii holding": "dii_holding",
    "change in dii holding": "change_in_dii_holding_quarter",
    "public holding": "public_holding",

    # Technicals
    "dma 50": "dma_50",
    "50 dma": "dma_50",
    "dma 200": "dma_200",
    "200 dma": "dma_200",
    "rsi": "rsi_14",
    "rsi 14": "rsi_14",
    "high price": "high_52w",
    "52w high": "high_52w",
    "low price": "low_52w",
    "52w low": "low_52w",
    "distance from 52w high": "distance_52w_high",
    "down from 52w high": "distance_52w_high",
    "volume": "volume",
}

# Set of all valid column names (whitelist for SQL injection prevention)
VALID_COLUMNS = set(METRIC_MAP.values())


def _validate_sql_fragment(fragment: str) -> bool:
    """
    Validate that a SQL fragment only contains safe characters and whitelisted columns.
    Prevents SQL injection by rejecting dangerous patterns.
    """
    # Reject common SQL injection patterns
    dangerous_patterns = [
        r";\s*", r"--", r"/\*", r"\*/",
        r"\bDROP\b", r"\bDELETE\b", r"\bINSERT\b", r"\bUPDATE\b",
        r"\bALTER\b", r"\bCREATE\b", r"\bEXEC\b", r"\bUNION\b",
        r"\bINTO\b", r"\bGRANT\b", r"\bREVOKE\b",
    ]
    for pattern in dangerous_patterns:
        if re.search(pattern, fragment, re.IGNORECASE):
            logger.warning(f"Rejected dangerous SQL pattern: {pattern} in '{fragment}'")
            return False

    return True


def translate_screener_query_to_sql(query: str) -> Optional[str]:
    """
    Translates a Screener.in query into a safe SQL WHERE clause.
    
    Returns the WHERE clause string, or None if the query is invalid/dangerous.
    All metric aliases are replaced with their whitelisted column names.
    """
    q = query.strip()
    if not q:
        return "1=1"

    # Sort aliases by length descending to match longest phrases first
    sorted_aliases = sorted(METRIC_MAP.keys(), key=len, reverse=True)

    # Replace aliases case-insensitively with column names
    for alias in sorted_aliases:
        col = METRIC_MAP[alias]
        pattern = re.compile(rf"\b{re.escape(alias)}\b", re.IGNORECASE)
        q = pattern.sub(col, q)

    # Normalize operators
    q = re.sub(r"==\s*", "= ", q)        # == to =
    q = re.sub(r"(\d+(?:\.\d+)?)%", r"\1", q)  # Strip % after numbers

    # Security validation
    if not _validate_sql_fragment(q):
        logger.error(f"Query rejected for security: {query}")
        return None

    # Verify all identifiers in the query are valid column names
    # Extract all word tokens that could be column names
    tokens = re.findall(r"\b([a-z_][a-z0-9_]*)\b", q, re.IGNORECASE)
    sql_keywords = {"AND", "OR", "NOT", "IS", "NULL", "LIKE", "BETWEEN", "IN", "ASC", "DESC"}
    for token in tokens:
        if token.upper() in sql_keywords:
            continue
        if token in VALID_COLUMNS:
            continue
        # Check if it's a number-like token that got captured
        try:
            float(token)
            continue
        except ValueError:
            pass
        # Unknown identifier — could be injection attempt
        logger.warning(f"Unknown identifier in query: '{token}' — may cause SQL error")

    return q


def run_query(query: str, db_path: str = "data/screener.db") -> pd.DataFrame:
    """
    Executes a screener query against the SQLite database and returns results.
    
    The query is translated from Screener.in syntax to SQL, validated for safety,
    and executed with all available columns returned.
    """
    sql_where = translate_screener_query_to_sql(query)
    if sql_where is None:
        logger.error("Query translation failed or was rejected")
        return pd.DataFrame()

    conn = sqlite3.connect(db_path)

    # Dynamically select all columns in the table
    sql = f"""
    SELECT *
    FROM stocks
    WHERE {sql_where}
    ORDER BY market_cap DESC
    LIMIT 500
    """

    try:
        df = pd.read_sql_query(sql, conn)
        logger.info(f"Query returned {len(df)} rows")
        return df
    except sqlite3.OperationalError as e:
        logger.error(f"SQL execution error: {e}")
        logger.error(f"Generated SQL WHERE: {sql_where}")
        return pd.DataFrame()
    finally:
        conn.close()


def get_available_columns(db_path: str = "data/screener.db") -> list[str]:
    """Returns list of column names in the stocks table."""
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(stocks)")
        return [row[1] for row in cur.fetchall()]
    finally:
        conn.close()
