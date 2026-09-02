import re
import sqlite3
import pandas as pd
from typing import List, Dict, Any, Optional

METRIC_MAP = {
    "market capitalization": "market_cap",
    "market cap": "market_cap",
    "mcap": "market_cap",
    "mar cap": "market_cap",
    "current price": "current_price",
    "cmp": "current_price",
    "price": "current_price",
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
    "return on capital employed": "roce",
    "roce": "roce",
    "return on equity": "roe",
    "roe": "roe",
    "operating profit margin": "opm",
    "opm": "opm",
    "net profit margin": "npm",
    "npm": "npm",
    "sales growth 3years": "sales_growth_3y",
    "sales growth 3y": "sales_growth_3y",
    "sales growth 5years": "sales_growth_5y",
    "sales growth 5y": "sales_growth_5y",
    "sales growth 10years": "sales_growth_10y",
    "profit growth 3years": "profit_growth_3y",
    "profit growth 3y": "profit_growth_3y",
    "profit growth 5years": "profit_growth_5y",
    "profit growth 5y": "profit_growth_5y",
    "profit growth 10years": "profit_growth_10y",
    "stock price cagr 1year": "price_cagr_1y",
    "1y return": "price_cagr_1y",
    "stock price cagr 3years": "price_cagr_3y",
    "stock price cagr 5years": "price_cagr_5y",
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
    "free cash flow": "fcf_latest",
    "fcf": "fcf_latest",
    "free cash flow 3years": "fcf_3y",
    "operating cash flow 3years": "cfo_3y",
    "free cash flow yield": "fcf_yield",
    "fcf yield": "fcf_yield",
    "working capital days": "working_capital_days",
    "debtor days": "debtor_days",
    "inventory days": "inventory_days",
    "cash conversion cycle": "cash_conversion_cycle",
    "promoter holding": "promoter_holding",
    "pledged percentage": "pledged_percentage",
    "fii holding": "fii_holding",
    "change in fii holding": "change_in_fii_holding_quarter",
    "dii holding": "dii_holding",
    "change in dii holding": "change_in_dii_holding_quarter",
    "public holding": "public_holding",
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
    "volume": "volume",
}

def translate_screener_query_to_sql(query: str) -> str:
    """
    Translates a Screener.in query into a valid SQL WHERE clause.
    """
    q = query.strip()
    if not q:
        return "1=1"

    # Sort keys by length descending to match longest phrases first (e.g. 'sales growth 3years' before 'sales')
    sorted_aliases = sorted(METRIC_MAP.keys(), key=lambda k: len(k), reverse=True)

    # Replace aliases case-insensitively
    for alias in sorted_aliases:
        col = METRIC_MAP[alias]
        pattern = re.compile(rf"\b{re.escape(alias)}\b", re.IGNORECASE)
        q = pattern.sub(col, q)

    # Normalize double equals == to single = in SQL
    q = re.sub(r"==\s*", "= ", q)

    # Strip % signs if after numbers e.g. 15% -> 15
    q = re.sub(r"(\d+(?:\.\d+)?)%", r"\1", q)

    return q

def run_query(query: str, db_path: str = "data/screener.db") -> pd.DataFrame:
    """
    Executes a screener query against SQLite database and returns results DataFrame.
    """
    sql_where = translate_screener_query_to_sql(query)
    conn = sqlite3.connect(db_path)
    sql = f"""
    SELECT symbol, name, sector, current_price, market_cap, pe_ratio, roce, roe, debt_to_equity, sales_growth_3y, profit_growth_3y, dividend_yield, dma_50, dma_200, rsi_14
    FROM stocks
    WHERE {sql_where}
    ORDER BY market_cap DESC
    """
    try:
        df = pd.read_sql_query(sql, conn)
        return df
    finally:
        conn.close()
