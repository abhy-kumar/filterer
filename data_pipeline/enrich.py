"""
enrich.py
---------
Multi-source enrichment pipeline that cross-validates shareholding,
efficiency ratios, and multi-year CAGRs across NSE filings, Screener.in,
and Tickertape.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sqlite3
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from data_pipeline.screener_scraper import ScreenerScraper
from data_pipeline.tickertape_client import TickertapeClient
from data_pipeline.consensus_engine import (
    reconcile_shareholding,
    reconcile_ratios_history,
    extract_snapshot_metrics,
)
from data_pipeline.ingest import Ledger, LEDGER_DB

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("enrich")


class EnrichmentLedger:
    """Tracks enrichment progress in SQLite."""

    def __init__(self, db_path: Path = LEDGER_DB):
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self._init_tables()

    def _init_tables(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS enrichments (
                symbol TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                error TEXT
            );
        """)
        self.conn.commit()

    def mark_done(self, symbol: str, error: Optional[str] = None):
        status = "ok" if not error else "failed"
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self.conn.execute("""
            INSERT OR REPLACE INTO enrichments (symbol, status, updated_at, error)
            VALUES (?, ?, ?, ?)
        """, (symbol, status, now, error))
        self.conn.commit()

    def is_done(self, symbol: str) -> bool:
        row = self.conn.execute(
            "SELECT status FROM enrichments WHERE symbol = ? AND status = 'ok'",
            (symbol,)
        ).fetchone()
        return bool(row)


def enrich_stock(
    symbol: str,
    payload: Dict[str, Any],
    scraper: ScreenerScraper,
    tt_client: TickertapeClient,
) -> bool:
    """Enrich a single stock payload with multi-source consensus data."""
    try:
        # Existing NSE shareholding
        nse_history = payload.get("shareholding_history") or []

        # Fetch from Screener.in
        scr_data = scraper.scrape(symbol) or {}
        scr_history = scr_data.get("shareholding") or []
        scr_ratios = scr_data.get("ratios") or []
        scr_growth = scr_data.get("growth") or {}

        # Fetch from Tickertape
        tt_history = tt_client.fetch_holdings(symbol) or []
        tt_ratios, tt_growth = [], {}
        if not scr_ratios or not scr_growth.get("sales_growth_5y"):
            tt_ratios, tt_growth = tt_client.fetch_financial_ratios_and_growth(symbol)

        # 1. Reconcile Shareholding
        reconciled_shp = reconcile_shareholding(nse_history, scr_history, tt_history)
        if reconciled_shp:
            payload["shareholding_history"] = reconciled_shp
            payload["shareholding_source"] = reconciled_shp[-1].get("source", "Consensus (Multi-Source)")

        # 2. Reconcile Ratio History
        chosen_ratios = scr_ratios or tt_ratios
        if chosen_ratios:
            reconciled_ratios = reconcile_ratios_history(
                chosen_ratios,
                current_roce=payload.get("roce"),
                current_roe=payload.get("roe"),
            )
            payload["ratios_history"] = reconciled_ratios
        else:
            reconciled_ratios = payload.get("ratios_history") or []

        # Merge growth data
        merged_growth = {}
        for k in (
            "sales_growth_3y", "sales_growth_5y", "sales_growth_10y",
            "profit_growth_3y", "profit_growth_5y", "profit_growth_10y",
            "roe_3y", "roe_5y", "roe_10y",
        ):
            v = scr_growth.get(k) if scr_growth.get(k) is not None else tt_growth.get(k)
            merged_growth[k] = v

        # 3. Extract Snapshot Metrics
        snapshot = extract_snapshot_metrics(
            reconciled_shareholding=reconciled_shp,
            reconciled_ratios=reconciled_ratios,
            growth_data=merged_growth,
            sector=payload.get("sector") or "",
        )

        for k, v in snapshot.items():
            payload[k] = v

        return True
    except Exception as exc:
        logger.error("Enrichment failed for %s: %s", symbol, exc)
        return False


def run_enrichment(
    symbols: Optional[List[str]] = None,
    limit: int = 0,
    force: bool = False,
    delay: float = 0.25,
) -> int:
    ledger = Ledger()
    enrich_ledger = EnrichmentLedger()
    scraper = ScreenerScraper(delay=delay)
    tt_client = TickertapeClient(delay=delay)

    rows = ledger.conn.execute("SELECT symbol, payload FROM payloads ORDER BY symbol").fetchall()
    if not rows:
        logger.error("No payloads found in %s. Run ingest first.", LEDGER_DB)
        return 1

    target_rows = []
    for r in rows:
        sym = r["symbol"]
        if symbols and sym not in symbols:
            continue
        if not force and enrich_ledger.is_done(sym):
            continue
        target_rows.append(r)

    if limit > 0:
        target_rows = target_rows[:limit]

    logger.info("Found %d companies to enrich (total in ledger: %d)", len(target_rows), len(rows))
    success_count = 0
    fail_count = 0

    for i, r in enumerate(target_rows, 1):
        sym = r["symbol"]
        try:
            payload = json.loads(r["payload"])
            ok = enrich_stock(sym, payload, scraper, tt_client)
            if ok:
                ledger.record_success(sym, payload)
                enrich_ledger.mark_done(sym)
                success_count += 1
            else:
                enrich_ledger.mark_done(sym, error="Enrichment failed")
                fail_count += 1
        except KeyboardInterrupt:
            logger.warning("Interrupted by user. Exiting cleanly.")
            break
        except Exception as exc:
            logger.error("Error processing %s: %s", sym, exc)
            enrich_ledger.mark_done(sym, error=str(exc))
            fail_count += 1

        if i % 20 == 0 or i == len(target_rows):
            logger.info("Enriched %d/%d (%d success, %d failed)", i, len(target_rows), success_count, fail_count)

    logger.info("Enrichment run finished: %d succeeded, %d failed", success_count, fail_count)
    return 0


def export_all() -> int:
    """Export all ledger payloads into stocksData.ts, detail JSONs, and SQLite DB."""
    import subprocess
    from data_pipeline.ingest import Ledger
    from data_pipeline.data_fetcher import compute_peers
    from scripts.generate_stocks_dataset import (
        generate_stocks_data_ts,
        generate_stock_detail_jsons,
        generate_sqlite_db,
    )
    import db_split_join

    ledger = Ledger()
    stocks = ledger.payloads()
    if not stocks:
        logger.error("No stocks to export.")
        return 1

    logger.info("Exporting %d stocks...", len(stocks))
    compute_peers(stocks)
    generate_stocks_data_ts(stocks)
    generate_stock_detail_jsons(stocks)
    generate_sqlite_db(stocks)

    # Split database into parts
    db_split_join.split_db()
    logger.info("Split SQLite database into tracked Git parts.")

    # Run data:rebuild (repair + split) via node
    logger.info("Running node scripts/repair_dataset.mjs and split_dataset.mjs...")
    subprocess.run(["node", "scripts/repair_dataset.mjs"], check=True)
    subprocess.run(["node", "scripts/split_dataset.mjs"], check=True)

    logger.info("Data export and split complete!")
    return 0


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Multi-source stock data enrichment")
    parser.add_argument("--symbols", nargs="+", help="Specific symbols to enrich")
    parser.add_argument("--limit", type=int, default=0, help="Max number of stocks to process")
    parser.add_argument("--force", action="store_true", help="Re-enrich even if already marked done")
    parser.add_argument("--export", action="store_true", help="Export enriched data to app files and exit")
    parser.add_argument("--rate-limit", type=float, default=0.25, help="Delay between requests")

    args = parser.parse_args(argv)

    if args.export:
        return export_all()

    ret = run_enrichment(
        symbols=args.symbols,
        limit=args.limit,
        force=args.force,
        delay=args.rate_limit,
    )
    if ret == 0:
        logger.info("Enrichment step completed. Running export...")
        return export_all()
    return ret


if __name__ == "__main__":
    raise SystemExit(main())
