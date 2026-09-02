"""
Generate Stocks Dataset — Orchestrator for Filterer Data Pipeline.

This script is the main entry point for building the complete Filterer dataset.
It fetches real financial data from Yahoo Finance for all stocks in the universe,
generates the TypeScript data bundle for client-side screening, populates the
SQLite database for Python CLI queries, and optionally uploads to Firebase Firestore.

Usage:
    python scripts/generate_stocks_dataset.py                    # Full run (all stocks)
    python scripts/generate_stocks_dataset.py --limit 10         # Test run (first 10 stocks)
    python scripts/generate_stocks_dataset.py --symbols RELIANCE TCS INFY  # Specific stocks
    python scripts/generate_stocks_dataset.py --skip-db          # Skip SQLite generation
    python scripts/generate_stocks_dataset.py --firebase         # Also upload to Firestore
"""

import os
import sys
import json
import time
import sqlite3
import argparse
import logging
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from data_pipeline.data_fetcher import StockDataFetcher, compute_peers
from data_pipeline.stock_universe import STOCK_UNIVERSE, get_symbol_name_map
from data_pipeline.market_indices import save_indices_cache
import db_split_join

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


# ────────────────────────────────────────────────────────
#  SQLITE SCHEMA — All columns needed by screener_engine.py
# ────────────────────────────────────────────────────────
SQLITE_SCHEMA = """
CREATE TABLE IF NOT EXISTS stocks (
    symbol TEXT PRIMARY KEY,
    name TEXT,
    sector TEXT,
    industry TEXT,
    current_price REAL,
    market_cap REAL,
    high_52w REAL,
    low_52w REAL,
    face_value REAL,
    volume INTEGER,
    pe_ratio REAL,
    industry_pe REAL,
    pb_ratio REAL,
    peg_ratio REAL,
    graham_number REAL,
    ev_ebitda REAL,
    price_to_sales REAL,
    price_to_fcf REAL,
    dividend_yield REAL,
    book_value REAL,
    roce REAL,
    roe REAL,
    opm REAL,
    npm REAL,
    sales_growth_3y REAL,
    sales_growth_5y REAL,
    sales_growth_10y REAL,
    profit_growth_3y REAL,
    profit_growth_5y REAL,
    profit_growth_10y REAL,
    price_cagr_1y REAL,
    price_cagr_3y REAL,
    price_cagr_5y REAL,
    price_cagr_10y REAL,
    roe_3y REAL,
    roe_5y REAL,
    roe_10y REAL,
    debt REAL,
    debt_to_equity REAL,
    interest_coverage REAL,
    current_ratio REAL,
    piotroski_score INTEGER,
    altman_z_score REAL,
    debtor_days INTEGER,
    inventory_days INTEGER,
    days_payable INTEGER,
    working_capital_days INTEGER,
    cash_conversion_cycle INTEGER,
    cfo_latest REAL,
    cfo_3y REAL,
    cfo_5y REAL,
    fcf_latest REAL,
    fcf_3y REAL,
    fcf_5y REAL,
    fcf_yield REAL,
    promoter_holding REAL,
    change_in_promoter_holding_quarter REAL,
    pledged_percentage REAL,
    fii_holding REAL,
    change_in_fii_holding_quarter REAL,
    dii_holding REAL,
    change_in_dii_holding_quarter REAL,
    public_holding REAL,
    dma_50 REAL,
    dma_200 REAL,
    rsi_14 REAL,
    distance_52w_high REAL,
    distance_52w_low REAL
)
"""

SQLITE_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_market_cap ON stocks(market_cap DESC)",
    "CREATE INDEX IF NOT EXISTS idx_sector ON stocks(sector)",
    "CREATE INDEX IF NOT EXISTS idx_pe_ratio ON stocks(pe_ratio)",
    "CREATE INDEX IF NOT EXISTS idx_roce ON stocks(roce DESC)",
    "CREATE INDEX IF NOT EXISTS idx_roe ON stocks(roe DESC)",
    "CREATE INDEX IF NOT EXISTS idx_debt_to_equity ON stocks(debt_to_equity)",
    "CREATE INDEX IF NOT EXISTS idx_piotroski ON stocks(piotroski_score DESC)",
]

# Columns in the SQLite table (order matters for INSERT)
SQLITE_COLUMNS = [
    "symbol", "name", "sector", "industry", "current_price", "market_cap",
    "high_52w", "low_52w", "face_value", "volume",
    "pe_ratio", "industry_pe", "pb_ratio", "peg_ratio", "graham_number",
    "ev_ebitda", "price_to_sales", "price_to_fcf", "dividend_yield", "book_value",
    "roce", "roe", "opm", "npm",
    "sales_growth_3y", "sales_growth_5y", "sales_growth_10y",
    "profit_growth_3y", "profit_growth_5y", "profit_growth_10y",
    "price_cagr_1y", "price_cagr_3y", "price_cagr_5y", "price_cagr_10y",
    "roe_3y", "roe_5y", "roe_10y",
    "debt", "debt_to_equity", "interest_coverage", "current_ratio",
    "piotroski_score", "altman_z_score",
    "debtor_days", "inventory_days", "days_payable", "working_capital_days",
    "cash_conversion_cycle",
    "cfo_latest", "cfo_3y", "cfo_5y", "fcf_latest", "fcf_3y", "fcf_5y", "fcf_yield",
    "promoter_holding", "change_in_promoter_holding_quarter", "pledged_percentage",
    "fii_holding", "change_in_fii_holding_quarter",
    "dii_holding", "change_in_dii_holding_quarter", "public_holding",
    "dma_50", "dma_200", "rsi_14", "distance_52w_high", "distance_52w_low",
]


def generate_stocks_data_ts(stocks: list[dict], output_path: str = "src/data/stocksData.ts") -> None:
    """
    Generate the TypeScript data bundle for client-side screening.
    Contains the full Stock objects including financial statements.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("import { Stock } from '../types/stock';\n\n")
        f.write(f"// Auto-generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"// Source: Yahoo Finance via yfinance\n")
        f.write(f"// Total stocks: {len(stocks)}\n\n")
        f.write(f"export const STOCKS_DATA: Stock[] = {json.dumps(stocks, indent=2)};\n")

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    logger.info(f"Generated {output_path} ({len(stocks)} stocks, {size_mb:.1f} MB)")


def generate_sqlite_db(stocks: list[dict], db_path: str = "data/screener.db") -> None:
    """
    Generate the SQLite database with all columns needed by screener_engine.py.
    Includes proper indexes for fast querying.
    """
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Create table with complete schema
    cur.execute(SQLITE_SCHEMA)

    # Create indexes
    for idx_sql in SQLITE_INDEXES:
        cur.execute(idx_sql)

    # Insert stock data
    placeholders = ", ".join(["?"] * len(SQLITE_COLUMNS))
    insert_sql = f"INSERT OR REPLACE INTO stocks ({', '.join(SQLITE_COLUMNS)}) VALUES ({placeholders})"

    for s in stocks:
        values = tuple(s.get(col, 0) for col in SQLITE_COLUMNS)
        cur.execute(insert_sql, values)

    conn.commit()
    conn.close()

    size_kb = os.path.getsize(db_path) / 1024
    logger.info(f"Generated {db_path} ({len(stocks)} stocks, {size_kb:.1f} KB)")


def generate_stock_detail_jsons(stocks: list[dict], output_dir: str = "public/data/stocks") -> None:
    """
    Generate individual JSON files per stock for lazy-loading stock detail pages.
    This avoids bundling all financial statements into the main JS bundle.
    """
    os.makedirs(output_dir, exist_ok=True)

    for s in stocks:
        detail = {
            "symbol": s["symbol"],
            "name": s["name"],
            "annual_pnl": s.get("annual_pnl", []),
            "quarterly_results": s.get("quarterly_results", []),
            "balance_sheet": s.get("balance_sheet", []),
            "cash_flow": s.get("cash_flow", []),
            "ratios_history": s.get("ratios_history", []),
            "shareholding_history": s.get("shareholding_history", []),
            "historical_prices": s.get("historical_prices", []),
            "peers": s.get("peers", []),
        }

        filepath = os.path.join(output_dir, f"{s['symbol']}.json")
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(detail, f)

    logger.info(f"Generated {len(stocks)} stock detail JSONs in {output_dir}/")


def main():
    parser = argparse.ArgumentParser(description="Generate Filterer stock dataset from real market data")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of stocks to fetch (0 = all)")
    parser.add_argument("--symbols", nargs="+", help="Fetch specific symbols only")
    parser.add_argument("--skip-db", action="store_true", help="Skip SQLite database generation")
    parser.add_argument("--skip-indices", action="store_true", help="Skip market indices fetch")
    parser.add_argument("--firebase", action="store_true", help="Upload to Firebase Firestore")
    parser.add_argument("--rate-limit", type=float, default=0.8, help="Seconds between API calls")
    args = parser.parse_args()

    start_time = time.time()
    logger.info("=" * 60)
    logger.info("Filterer Data Pipeline — Starting")
    logger.info("=" * 60)

    # ── Step 1: Determine which stocks to fetch ──
    symbol_name_map = get_symbol_name_map()
    if args.symbols:
        universe = [(sym, symbol_name_map.get(sym, sym)) for sym in args.symbols]
    elif args.limit > 0:
        universe = STOCK_UNIVERSE[:args.limit]
    else:
        universe = STOCK_UNIVERSE

    logger.info(f"Fetching {len(universe)} stocks...")

    # ── Step 2: Fetch all stock data ──
    fetcher = StockDataFetcher(rate_limit_delay=args.rate_limit)
    stocks: list[dict] = []
    failed: list[str] = []

    for i, (sym, name) in enumerate(universe):
        logger.info(f"\n[{i + 1}/{len(universe)}] {sym} — {name}")
        stock_data = fetcher.fetch_stock(sym, name)
        if stock_data:
            stocks.append(stock_data)
        else:
            failed.append(sym)

    logger.info(f"\n{'=' * 60}")
    logger.info(f"Fetch complete: {len(stocks)} succeeded, {len(failed)} failed")
    if failed:
        logger.warning(f"Failed stocks: {', '.join(failed)}")

    if not stocks:
        logger.error("No stocks fetched successfully. Aborting.")
        sys.exit(1)

    # ── Step 3: Compute peer comparisons ──
    logger.info("Computing peer comparisons...")
    compute_peers(stocks)

    # ── Step 4: Generate TypeScript data bundle ──
    logger.info("Generating TypeScript data bundle...")
    generate_stocks_data_ts(stocks)

    # ── Step 5: Generate individual stock detail JSONs ──
    logger.info("Generating stock detail JSON files...")
    generate_stock_detail_jsons(stocks)

    # ── Step 6: Generate SQLite database ──
    if not args.skip_db:
        logger.info("Generating SQLite database...")
        generate_sqlite_db(stocks)
        logger.info("Splitting database for Git...")
        db_split_join.split_db()

    # ── Step 7: Fetch market indices ──
    if not args.skip_indices:
        logger.info("Fetching market indices...")
        try:
            save_indices_cache("data/market_indices.json")
        except Exception as e:
            logger.warning(f"Market indices fetch failed: {e}")

    # ── Step 8: Firebase upload (optional) ──
    if args.firebase:
        try:
            from data_pipeline.firebase_uploader import upload_to_firestore
            logger.info("Uploading to Firebase Firestore...")
            upload_to_firestore(stocks)
        except ImportError:
            logger.warning("Firebase uploader not configured. Skipping.")
        except Exception as e:
            logger.error(f"Firebase upload failed: {e}")

    # ── Summary ──
    elapsed = time.time() - start_time
    logger.info(f"\n{'=' * 60}")
    logger.info(f"Pipeline Complete!")
    logger.info(f"  Stocks fetched: {len(stocks)}")
    logger.info(f"  Failed: {len(failed)}")
    logger.info(f"  Time elapsed: {elapsed:.1f}s ({elapsed / 60:.1f} min)")
    logger.info(f"  Output files:")
    logger.info(f"    src/data/stocksData.ts")
    logger.info(f"    public/data/stocks/*.json ({len(stocks)} files)")
    if not args.skip_db:
        logger.info(f"    data/screener.db + data/screener.db.part_*")
    if not args.skip_indices:
        logger.info(f"    data/market_indices.json")
    logger.info(f"{'=' * 60}")


if __name__ == "__main__":
    main()
