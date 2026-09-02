"""
cli.py
------
Unified command-line interface for Filterer's Python Data Platform.

Usage:
  python -m data_pipeline.cli --audit      # Run 15-rule Financial QC audit & generate reports
  python -m data_pipeline.cli --clean      # Normalize and sanitize dataset using normalizer.py
  python -m data_pipeline.cli --bse-sync   # Enrich missing BSE codes using bse_client
  python -m data_pipeline.cli --split-db   # Split SQLite database into 40MB Git parts
"""

import os
import sys
import json
import re
import argparse
import logging
from typing import List, Dict, Any

from data_pipeline.qc_engine import FinancialQCEngine
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

# Windows console encoding fix
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("filterer_cli")

STOCKS_TS_PATH = "src/data/stocksData.ts"
QC_REPORT_JSON = "data/qc_report.json"
QC_REPORT_MD = "data/qc_report.md"

def load_stocks_from_ts() -> List[Dict[str, Any]]:
    if not os.path.exists(STOCKS_TS_PATH):
        logger.error(f"Cannot find {STOCKS_TS_PATH}")
        return []
    with open(STOCKS_TS_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    match = re.search(r"export const STOCKS_DATA: Stock\[\] = (\[.*\]);", content, re.DOTALL)
    if not match:
        logger.error("Could not parse STOCKS_DATA from TS file")
        return []
    return json.loads(match.group(1))

def save_stocks_to_ts(stocks: List[Dict[str, Any]]) -> None:
    json_str = json.dumps(stocks, indent=2)
    content = f"import {{ Stock }} from '../types/stock';\n\nexport const STOCKS_DATA: Stock[] = {json_str};\n"
    with open(STOCKS_TS_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    logger.info(f"Saved {len(stocks)} stocks to {STOCKS_TS_PATH}")

def run_audit(stocks: List[Dict[str, Any]]) -> int:
    """Run full Financial QC audit."""
    print(f"\n[Running Financial Quality Control (QC) Audit on {len(stocks)} Equities...]")
    qc = FinancialQCEngine()
    summary = qc.audit_universe(stocks)

    # Save outputs
    os.makedirs("data", exist_ok=True)
    with open(QC_REPORT_JSON, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": summary.timestamp,
            "overall_health_score": summary.overall_health_score,
            "total_stocks": summary.total_stocks,
            "passed_stocks": summary.passed_stocks,
            "failed_stocks": summary.failed_stocks,
            "total_errors": summary.total_errors,
            "total_warnings": summary.total_warnings,
            "sector_scores": summary.sector_scores,
        }, f, indent=2)

    md_report = qc.generate_markdown_report(summary)
    with open(QC_REPORT_MD, "w", encoding="utf-8") as f:
        f.write(md_report)

    print(f"Health Score: {summary.overall_health_score}% | Passed: {summary.passed_stocks}/{summary.total_stocks}")
    print(f"Critical Invariant Errors: {summary.total_errors} | Warnings: {summary.total_warnings}")
    print(f"Full markdown report saved to: {QC_REPORT_MD}")
    print(f"Machine-readable JSON saved to: {QC_REPORT_JSON}\n")

    return 0 if summary.total_errors == 0 else 1

def run_clean(stocks: List[Dict[str, Any]]) -> None:
    """Normalize and clean data across all stocks."""
    print(f"\n[Sanitizing and Normalizing {len(stocks)} Equities...]")
    cleaned_stocks = []
    for s in stocks:
        sym = s.get("symbol", "")
        sec = s.get("sector", "")
        ind = s.get("industry", "")
        is_fin = is_financial_institution(sec, ind)

        # 1. Dividend Yield
        s["dividend_yield"] = normalize_dividend_yield(
            s.get("dividend_yield", 0.0),
            s.get("current_price", 0.0),
            s.get("dividend_rate", 0.0)
        )

        # 2. Shareholding Pattern
        sh = normalize_shareholding(
            sym,
            s.get("promoter_holding", 0.0),
            s.get("fii_holding", 0.0),
            s.get("dii_holding", 0.0),
            s.get("public_holding", 0.0),
            s.get("pledged_percentage", 0.0)
        )
        s.update(sh)

        # 3. Statements
        if "annual_pnl" in s and s["annual_pnl"]:
            s["annual_pnl"] = normalize_annual_pnl(s["annual_pnl"], is_fin)
            if s["annual_pnl"]:
                latest = s["annual_pnl"][-1]
                s["opm"] = latest.get("opm_pct", s.get("opm", 0.0))

        if "quarterly_results" in s and s["quarterly_results"]:
            s["quarterly_results"] = normalize_quarterly_results(s["quarterly_results"], is_fin)

        if "balance_sheet" in s and s["balance_sheet"]:
            s["balance_sheet"] = normalize_balance_sheet(s["balance_sheet"])

        if "cash_flow" in s and s["cash_flow"]:
            s["cash_flow"] = normalize_cash_flow(s["cash_flow"])

        # 4. ROCE
        s["roce"] = normalize_roce(
            s.get("roce", 0.0),
            s.get("roe", 0.0),
            s.get("annual_pnl", []),
            is_fin
        )

        # 5. BSE Code
        if not s.get("bse_code"):
            code = bse_client.get_bse_code(sym)
            if code:
                s["bse_code"] = code

        cleaned_stocks.append(s)

    save_stocks_to_ts(cleaned_stocks)
    print("✓ Normalization complete.\n")

def run_sync_db(stocks: List[Dict[str, Any]]):
    from scripts.generate_stocks_dataset import generate_sqlite_db
    import db_split_join
    print(f"[Synchronizing {len(stocks)} stocks into SQLite database data/screener.db...]")
    generate_sqlite_db(stocks, db_path="data/screener.db")
    print("[Splitting database into Git-compliant parts...]")
    db_split_join.split_db()
    print("✓ SQLite sync and split complete.")

def run_split_db():
    import db_split_join
    print("[Splitting database into Git-compliant 40MB chunks...]")
    db_split_join.split_db()

def main():
    parser = argparse.ArgumentParser(description="Filterer Data Platform CLI")
    parser.add_argument("--audit", action="store_true", help="Run 15-rule Financial QC audit")
    parser.add_argument("--clean", action="store_true", help="Sanitize and normalize all financial metrics")
    parser.add_argument("--sync-db", action="store_true", help="Populate SQLite database from stocksData.ts and split")
    parser.add_argument("--split-db", action="store_true", help="Split data/screener.db into 40MB parts")

    args = parser.parse_args()

    if args.split_db:
        run_split_db()
        return

    stocks = load_stocks_from_ts()
    if not stocks:
        print("No stocks loaded.")
        sys.exit(1)

    if args.clean:
        run_clean(stocks)
        stocks = load_stocks_from_ts()

    if args.sync_db:
        run_sync_db(stocks)

    if args.audit or not any([args.clean, args.sync_db, args.split_db]):
        code = run_audit(stocks)
        sys.exit(code)

if __name__ == "__main__":
    main()
