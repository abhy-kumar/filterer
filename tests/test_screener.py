import os
import sys
import pytest
import pandas as pd

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from data_pipeline.screener_engine import translate_screener_query_to_sql, run_query
from data_pipeline.stock_universe import get_symbols, get_universe
import db_split_join

def test_sql_translation():
    q = "Market Capitalization > 500 AND Return on capital employed > 20 AND Debt to equity < 0.1"
    sql = translate_screener_query_to_sql(q)
    assert "market_cap > 500" in sql
    assert "roce > 20" in sql
    assert "debt_to_equity < 0.1" in sql

def test_run_query_against_db():
    if not os.path.exists("data/screener.db"):
        db_split_join.join_db()

    df = run_query("Market Capitalization > 1000")
    assert not df.empty
    assert "symbol" in df.columns
    assert "roce" in df.columns
    assert "current_price" in df.columns


def test_stock_universe_nifty500():
    universe = get_universe()
    assert len(universe) == 500
    symbols = get_symbols()
    assert len(symbols) == 500
    assert "RELIANCE" in symbols
    assert "TCS" in symbols
    assert "INFY" in symbols
    assert "HDFCBANK" in symbols
