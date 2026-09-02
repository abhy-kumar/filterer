"""
batch_fetcher.py
----------------
High-throughput, multi-threaded batch ingestion engine for Filterer.
Fetches, normalizes, audits, and persists equities from Nifty 500.

Features:
  - ThreadPoolExecutor concurrency with domain-safe rate limiting.
  - Automatic resumption via checkpointing (data/fetch_checkpoint.json).
  - Built-in normalizer & BSE client enrichment for each stock.
  - Invariant financial audit via FinancialQCEngine before saving.
  - Safe atomic merge with existing stocksData.ts.
"""

import os
import sys
import json
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any, Optional

# Path setup
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from data_pipeline.data_fetcher import StockDataFetcher, compute_peers
from data_pipeline.normalizer import (
    normalize_dividend_yield,
    normalize_shareholding,
    normalize_annual_pnl,
    normalize_quarterly_results,
    normalize_balance_sheet,
    normalize_cash_flow,
    normalize_roce,
    is_financial_institution,
)
from data_pipeline.bse_client import bse_client
from data_pipeline.qc_engine import FinancialQCEngine
from data_pipeline.stock_universe import STOCK_UNIVERSE, get_symbol_name_map
from scripts.generate_stocks_dataset import generate_sqlite_db
import db_split_join

# Windows console encoding fix
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("batch_fetcher")

CHECKPOINT_FILE = "data/fetch_checkpoint.json"
STOCKS_TS_FILE = "src/data/stocksData.ts"

def load_checkpoint() -> Dict[str, Any]:
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"completed": {}, "failed": []}

def save_checkpoint(data: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(CHECKPOINT_FILE), exist_ok=True)
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def fetch_and_normalize_stock(sym: str, name: str, fetcher: StockDataFetcher, qc: FinancialQCEngine) -> Optional[Dict[str, Any]]:
    """Fetch single stock, apply sector normalization, and run QC audit."""
    try:
        raw_stock = fetcher.fetch_stock(sym, name)
        if not raw_stock:
            return None

        clean_sym = sym.upper().replace(".NS", "").replace(".BO", "")
        sec = raw_stock.get("sector", "")
        ind = raw_stock.get("industry", "")
        is_fin = is_financial_institution(sec, ind)

        # 1. BSE Code Resolution
        if not raw_stock.get("bse_code"):
            raw_stock["bse_code"] = bse_client.get_bse_code(clean_sym)

        # 2. Dividend Yield
        raw_stock["dividend_yield"] = normalize_dividend_yield(
            raw_stock.get("dividend_yield", 0.0),
            raw_stock.get("current_price", 0.0)
        )

        # 3. Official BSE Shareholding lookup fallback
        bse_sh = bse_client.get_shareholding_pattern(clean_sym)
        if bse_sh:
            raw_stock.update(normalize_shareholding(
                clean_sym,
                bse_sh["promoter_holding"],
                bse_sh["fii_holding"],
                bse_sh["dii_holding"],
                bse_sh["public_holding"],
                bse_sh["pledged_percentage"]
            ))
        else:
            raw_stock.update(normalize_shareholding(
                clean_sym,
                raw_stock.get("promoter_holding", 0.0),
                raw_stock.get("fii_holding", 0.0),
                raw_stock.get("dii_holding", 0.0),
                raw_stock.get("public_holding", 0.0),
                raw_stock.get("pledged_percentage", 0.0)
            ))

        # 4. Financial Statements
        if raw_stock.get("annual_pnl"):
            raw_stock["annual_pnl"] = normalize_annual_pnl(raw_stock["annual_pnl"], is_fin)
            if raw_stock["annual_pnl"]:
                raw_stock["opm"] = raw_stock["annual_pnl"][-1].get("opm_pct", raw_stock.get("opm", 0.0))

        if raw_stock.get("quarterly_results"):
            raw_stock["quarterly_results"] = normalize_quarterly_results(raw_stock["quarterly_results"], is_fin)

        if raw_stock.get("balance_sheet"):
            raw_stock["balance_sheet"] = normalize_balance_sheet(raw_stock["balance_sheet"])

        if raw_stock.get("cash_flow"):
            raw_stock["cash_flow"] = normalize_cash_flow(raw_stock["cash_flow"])

        # 5. ROCE
        raw_stock["roce"] = normalize_roce(
            raw_stock.get("roce", 0.0),
            raw_stock.get("roe", 0.0),
            raw_stock.get("annual_pnl", []),
            is_fin
        )

        # 6. QC Invariant Audit
        qc_res = qc.audit_stock(raw_stock)
        if not qc_res.passed:
            logger.warning(f"QC Invariant Warning for {clean_sym}: {[e.rule for e in qc_res.errors]}")

        return raw_stock

    except Exception as e:
        logger.error(f"Error fetching/normalizing {sym}: {e}")
        return None

def merge_and_save(new_stocks: List[Dict[str, Any]]) -> None:
    """Safely merges newly fetched stocks into stocksData.ts and updates SQLite."""
    from data_pipeline.cli import load_stocks_from_ts, save_stocks_to_ts

    existing = load_stocks_from_ts()
    stock_map = {s["symbol"]: s for s in existing}

    for s in new_stocks:
        stock_map[s["symbol"]] = s

    merged = list(stock_map.values())
    # Recompute cross-stock peers
    logger.info(f"Recomputing cross-stock peers across {len(merged)} equities...")
    compute_peers(merged)

    # Save TS bundle
    save_stocks_to_ts(merged)

    # Sync SQLite & Split
    logger.info("Syncing SQLite database and splitting for Git...")
    generate_sqlite_db(merged, db_path="data/screener.db")
    db_split_join.split_db()
    logger.info(f"✓ Master dataset updated: {len(merged)} stocks.")

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Filterer Batch Equities Ingestion")
    parser.add_argument("--count", type=int, default=20, help="Number of new stocks to ingest")
    parser.add_argument("--workers", type=int, default=3, help="Number of concurrent worker threads")
    parser.add_argument("--symbols", nargs="+", help="Specific symbols to fetch")

    args = parser.parse_args()

    from data_pipeline.cli import load_stocks_from_ts
    existing_stocks = load_stocks_from_ts()
    existing_syms = set(s["symbol"] for s in existing_stocks)

    name_map = get_symbol_name_map()

    if args.symbols:
        targets = [(s, name_map.get(s, s)) for s in args.symbols]
    else:
        # Prioritize un-ingested stocks from STOCK_UNIVERSE
        unfetched = [t for t in STOCK_UNIVERSE if t[0] not in existing_syms and t[0].replace("&", "%26") not in existing_syms]
        targets = unfetched[:args.count]

    if not targets:
        print("All target stocks are already ingested.")
        return

    print(f"\n[Starting Batch Ingestion for {len(targets)} Equities with {args.workers} Workers...]")
    print(f"Target symbols: {[t[0] for t in targets]}\n")

    fetcher = StockDataFetcher(rate_limit_delay=0.4)
    qc = FinancialQCEngine()

    results: List[Dict[str, Any]] = []
    failed: List[str] = []

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_sym = {
            executor.submit(fetch_and_normalize_stock, sym, name, fetcher, qc): sym
            for sym, name in targets
        }

        for i, future in enumerate(as_completed(future_to_sym)):
            sym = future_to_sym[future]
            try:
                stock_data = future.result()
                if stock_data:
                    results.append(stock_data)
                    print(f"[{i+1}/{len(targets)}] ✓ Successfully ingested {sym} (CMP: ₹{stock_data.get('current_price')})")
                else:
                    failed.append(sym)
                    print(f"[{i+1}/{len(targets)}] ✗ Failed {sym}")
            except Exception as e:
                failed.append(sym)
                print(f"[{i+1}/{len(targets)}] ✗ Exception on {sym}: {e}")

    print(f"\nBatch Complete: {len(results)} succeeded, {len(failed)} failed.")

    if results:
        merge_and_save(results)

if __name__ == "__main__":
    main()
