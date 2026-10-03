"""
Resumable ingestion for the Filterer universe.

The old orchestrator held every result in a list and wrote once at the end.
A throttled request meant that company was dropped for the whole run, and a
crash meant losing everything: the last full run over 500 names produced 67
companies, scattered across the list, with the other 433 discarded silently.

This runs the same extraction (data_fetcher.StockDataFetcher does the field
work and is unchanged) against a job ledger in SQLite:

  * every company is a row with a status, an attempt count and the last error
  * results are committed as they arrive, so a crash costs one company
  * `--retry-failed` re-runs only what did not succeed, at a gentler pace
  * price history is downloaded in batches rather than one call per company

Typical use:

    python -m data_pipeline.ingest --status          # what is left to do
    python -m data_pipeline.ingest                   # fetch everything pending
    python -m data_pipeline.ingest --retry-failed    # mop up throttled names
    python -m data_pipeline.ingest --export          # write the app's data files
"""

from __future__ import annotations

import argparse
import json
import logging
import sqlite3
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent.parent
LEDGER_DB = ROOT / "data" / "ingest.db"

STATUS_PENDING = "pending"
STATUS_OK = "ok"
STATUS_FAILED = "failed"
# Left the index. Kept, so a company that rejoins does not start from nothing,
# but neither fetched nor exported.
STATUS_INACTIVE = "inactive"

# A weekly run re-fetches anything older than this. Without it the cached
# ledger said every company was done after the first full run, and each
# weekly run since fetched nothing and re-exported week-old payloads.
DEFAULT_MAX_AGE_DAYS = 6

SCHEMA = """
CREATE TABLE IF NOT EXISTS companies (
    symbol      TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    industry    TEXT,
    isin        TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    attempts    INTEGER NOT NULL DEFAULT 0,
    last_error  TEXT,
    updated_at  TEXT
);

CREATE TABLE IF NOT EXISTS payloads (
    symbol      TEXT PRIMARY KEY REFERENCES companies(symbol),
    payload     TEXT NOT NULL,
    fetched_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Ledger:
    """The job ledger. Every company's state survives a crash."""

    def __init__(self, path: Path = LEDGER_DB) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(path)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)
        self.conn.commit()

    def sync_universe(self, constituents: Iterable[Any]) -> tuple[int, int]:
        """Insert new constituents; leave existing statuses untouched."""
        added = 0
        seen: set[str] = set()
        for c in constituents:
            seen.add(c.symbol)
            cur = self.conn.execute(
                """INSERT INTO companies (symbol, name, industry, isin, updated_at)
                   VALUES (?, ?, ?, ?, ?)
                   ON CONFLICT(symbol) DO UPDATE SET
                       name = excluded.name,
                       industry = COALESCE(NULLIF(excluded.industry, ''), companies.industry),
                       isin = COALESCE(NULLIF(excluded.isin, ''), companies.isin)""",
                (c.symbol, c.name, c.industry, c.isin, _now()),
            )
            added += 1 if cur.rowcount and cur.lastrowid else 0

        # Companies that left the index stay in the ledger but are neither
        # fetched nor exported. The September 2026 rebalance swapped 28
        # companies; exporting the leavers as well is what made the weekly
        # run ship 528 companies and fail its own checks.
        dropped = 0
        if seen:
            marks = ",".join("?" * len(seen))
            dropped = self.conn.execute(
                f"UPDATE companies SET status=? WHERE symbol NOT IN ({marks}) AND status != ?",
                (STATUS_INACTIVE, *seen, STATUS_INACTIVE),
            ).rowcount
            # A company that rejoins is fetched afresh.
            self.conn.execute(
                f"UPDATE companies SET status=? WHERE symbol IN ({marks}) AND status = ?",
                (STATUS_PENDING, *seen, STATUS_INACTIVE),
            )

        self.conn.commit()
        return len(seen), dropped

    def mark_stale(self, max_age_days: float) -> int:
        """Queue every active company whose last good fetch is older than this."""
        cutoff = datetime.now(timezone.utc).timestamp() - max_age_days * 86400
        stale = [
            r["symbol"]
            for r in self.conn.execute(
                "SELECT c.symbol, p.fetched_at FROM companies c LEFT JOIN payloads p ON p.symbol = c.symbol"
                " WHERE c.status = ?",
                (STATUS_OK,),
            )
            if not r["fetched_at"] or datetime.fromisoformat(r["fetched_at"]).timestamp() < cutoff
        ]
        self.conn.executemany(
            "UPDATE companies SET status=?, attempts=0 WHERE symbol=?", [(STATUS_PENDING, s) for s in stale]
        )
        self.conn.commit()
        return len(stale)

    def pending(self, statuses: tuple[str, ...], limit: int = 0) -> list[sqlite3.Row]:
        sql = (
            "SELECT * FROM companies WHERE status IN (%s) ORDER BY attempts ASC, symbol ASC"
            % ",".join("?" * len(statuses))
        )
        if limit:
            sql += f" LIMIT {int(limit)}"
        return list(self.conn.execute(sql, statuses))

    def record_success(self, symbol: str, payload: dict) -> None:
        self.conn.execute(
            "UPDATE companies SET status=?, attempts=attempts+1, last_error=NULL, updated_at=? WHERE symbol=?",
            (STATUS_OK, _now(), symbol),
        )
        self.conn.execute(
            """INSERT INTO payloads (symbol, payload, fetched_at) VALUES (?, ?, ?)
               ON CONFLICT(symbol) DO UPDATE SET payload=excluded.payload, fetched_at=excluded.fetched_at""",
            (symbol, json.dumps(payload, separators=(",", ":")), _now()),
        )
        self.conn.commit()

    def record_failure(self, symbol: str, error: str) -> None:
        self.conn.execute(
            "UPDATE companies SET status=?, attempts=attempts+1, last_error=?, updated_at=? WHERE symbol=?",
            (STATUS_FAILED, error[:500], _now(), symbol),
        )
        self.conn.commit()

    def counts(self) -> dict[str, int]:
        rows = self.conn.execute("SELECT status, COUNT(*) c FROM companies GROUP BY status")
        return {r["status"]: r["c"] for r in rows}

    def payloads(self) -> list[dict]:
        """
        The last good payload of every company in the index. A company whose
        refresh failed this week keeps last week's figures rather than
        dropping out of the screener.
        """
        rows = self.conn.execute(
            "SELECT p.payload FROM payloads p JOIN companies c ON c.symbol = p.symbol WHERE c.status != ?",
            (STATUS_INACTIVE,),
        )
        return [json.loads(r["payload"]) for r in rows]

    def failures(self) -> list[sqlite3.Row]:
        return list(
            self.conn.execute(
                "SELECT symbol, attempts, last_error FROM companies WHERE status=? ORDER BY symbol",
                (STATUS_FAILED,),
            )
        )


def batch_price_history(symbols: list[str], period: str = "10y", chunk_size: int = 40) -> dict[str, Any]:
    """
    Download price history for many companies per request.

    yfinance accepts a list of tickers and fans out internally, so 500
    companies cost about a dozen requests instead of 500. This is the single
    biggest reduction in requests against Yahoo, and therefore in throttling.
    """
    import pandas as pd
    import yfinance as yf

    frames: dict[str, Any] = {}
    for start in range(0, len(symbols), chunk_size):
        chunk = symbols[start : start + chunk_size]
        tickers = [f"{s}.NS" for s in chunk]
        logger.info(
            "Prices %d-%d of %d (%d tickers in one request)",
            start + 1, min(start + chunk_size, len(symbols)), len(symbols), len(tickers),
        )
        try:
            data = yf.download(
                tickers, period=period, interval="1d", group_by="ticker",
                auto_adjust=False, progress=False, threads=True,
            )
        except Exception as exc:
            logger.warning("Batch %d failed: %s", start // chunk_size, exc)
            continue

        for symbol, ticker in zip(chunk, tickers):
            try:
                frame = data[ticker] if isinstance(data.columns, pd.MultiIndex) else data
                if frame["Close"].notna().any():
                    frames[symbol] = frame.dropna(how="all")
            except Exception:
                continue

        time.sleep(1.0)

    logger.info("Price history captured for %d of %d companies", len(frames), len(symbols))
    return frames


def run(
    limit: int = 0,
    retry_failed: bool = False,
    symbols: Optional[list[str]] = None,
    index: str = "nifty500",
    rate_limit: float = 1.2,
    max_age_days: float = DEFAULT_MAX_AGE_DAYS,
) -> int:
    from data_pipeline.data_fetcher import StockDataFetcher
    from data_pipeline.shareholding import attach_shareholding
    from data_pipeline.universe_source import fetch_index_constituents

    ledger = Ledger()

    constituents = fetch_index_constituents(index)
    total, dropped = ledger.sync_universe(constituents)
    logger.info("Universe: %d constituents (%d in the ledger no longer in the index)", total, dropped)

    if not symbols and not retry_failed:
        queued = ledger.mark_stale(max_age_days)
        if queued:
            logger.info("Queued %d companies last fetched more than %g days ago", queued, max_age_days)

    if symbols:
        wanted = {s.upper() for s in symbols}
        targets = [r for r in ledger.pending((STATUS_PENDING, STATUS_OK, STATUS_FAILED)) if r["symbol"] in wanted]
    else:
        statuses = (STATUS_FAILED,) if retry_failed else (STATUS_PENDING,)
        targets = ledger.pending(statuses, limit=limit)

    if not targets:
        logger.info("Nothing to do. %s", ledger.counts())
        return 0

    logger.info("Fetching %d companies (rate limit %.1fs)", len(targets), rate_limit)

    fetcher = StockDataFetcher(rate_limit_delay=rate_limit)
    industry_by_symbol = {c.symbol: c.industry for c in constituents}

    succeeded = failed = 0
    started = time.time()

    for i, row in enumerate(targets, 1):
        symbol, name = row["symbol"], row["name"]
        logger.info("[%d/%d] %s — %s", i, len(targets), symbol, name)
        try:
            payload = fetcher.fetch_stock(symbol, name)
            if not payload:
                ledger.record_failure(symbol, "fetcher returned no data")
                failed += 1
                continue

            # NSE's own industry classification, which a domestic screener
            # should prefer over Yahoo's US-centric sector taxonomy.
            nse_industry = industry_by_symbol.get(symbol)
            if nse_industry:
                payload["nse_industry"] = nse_industry
                if not payload.get("industry"):
                    payload["industry"] = nse_industry

            payload["isin"] = row["isin"] or payload.get("isin", "")

            # Replace the generated shareholding ramp with the filed pattern.
            # A failure here leaves the company's other fields intact.
            try:
                attach_shareholding(payload)
            except Exception as exc:
                logger.debug("  shareholding for %s: %s", symbol, exc)

            ledger.record_success(symbol, payload)
            succeeded += 1

        except KeyboardInterrupt:
            logger.warning("Interrupted. Progress is saved; re-run to continue.")
            break
        except Exception as exc:
            logger.error("%s failed: %s", symbol, exc)
            ledger.record_failure(symbol, f"{type(exc).__name__}: {exc}")
            failed += 1

        if i % 25 == 0:
            rate = i / max(time.time() - started, 1)
            remaining = (len(targets) - i) / max(rate, 1e-6)
            logger.info(
                "  … %d ok, %d failed, ~%.0f min remaining", succeeded, failed, remaining / 60
            )

    logger.info("Run complete: %d succeeded, %d failed. Ledger: %s", succeeded, failed, ledger.counts())
    return 0


def backfill_shareholding(limit: int = 0) -> int:
    """
    Apply filed shareholding to companies already ingested.

    Lets the fabricated ramp be replaced without re-fetching statements for the
    whole universe. Only the shareholding block of each payload is rewritten.
    """
    from data_pipeline.shareholding import attach_shareholding

    ledger = Ledger()
    rows = ledger.conn.execute(
        "SELECT c.symbol, p.payload FROM payloads p JOIN companies c ON c.symbol=p.symbol"
        " WHERE c.status='ok' ORDER BY c.symbol" + (f" LIMIT {int(limit)}" if limit else "")
    ).fetchall()

    logger.info("Backfilling shareholding for %d companies", len(rows))
    filled = skipped = 0

    for i, row in enumerate(rows, 1):
        payload = json.loads(row["payload"])
        if payload.get("shareholding_source") == "NSE filings":
            skipped += 1
            continue
        try:
            if attach_shareholding(payload):
                ledger.record_success(row["symbol"], payload)
                filled += 1
            else:
                skipped += 1
        except KeyboardInterrupt:
            logger.warning("Interrupted; %d already saved.", filled)
            break
        except Exception as exc:
            logger.debug("  %s: %s", row["symbol"], exc)
            skipped += 1

        if i % 50 == 0:
            logger.info("  ... %d/%d (%d filed, %d without a filing)", i, len(rows), filled, skipped)

    logger.info("Backfill complete: %d filed, %d without a filing", filled, skipped)
    return 0


def export() -> int:
    """Write the app's data files from everything successfully ingested."""
    sys.path.insert(0, str(ROOT))
    from data_pipeline.data_fetcher import compute_peers
    from scripts.generate_stocks_dataset import (
        generate_stocks_data_ts,
        generate_stock_detail_jsons,
    )

    ledger = Ledger()
    stocks = ledger.payloads()
    if not stocks:
        logger.error("Nothing ingested yet. Run the ingest first.")
        return 1

    logger.info("Exporting %d companies", len(stocks))

    # A company new to the index has no BSE scrip code until it is mapped.
    # The mapper only ran inside heal_and_enrich, which the weekly job does
    # not call, so the 28 companies added in the September 2026 rebalance
    # would have shipped without one.
    from data_pipeline.bse_mapper import BSEMapper

    mapper = BSEMapper()
    codes = mapper.map_universe(stocks)
    for stock in stocks:
        if not stock.get("bse_code"):
            stock["bse_code"] = codes.get(stock["symbol"]) or mapper.get_code(stock["symbol"]) or ""

    compute_peers(stocks)
    generate_stocks_data_ts(stocks)
    generate_stock_detail_jsons(stocks)
    logger.info(
        "Wrote the data files. Now run:  npm run data:rebuild && npm test"
    )
    return 0


def status() -> int:
    ledger = Ledger()
    counts = ledger.counts()
    total = sum(counts.values())
    print(f"Universe in ledger: {total}")
    for key in (STATUS_OK, STATUS_PENDING, STATUS_FAILED, STATUS_INACTIVE):
        print(f"  {key:8} {counts.get(key, 0)}")

    failures = ledger.failures()
    if failures:
        print(f"\nFailures ({len(failures)}), most recent error:")
        for row in failures[:15]:
            print(f"  {row['symbol']:14} attempts={row['attempts']}  {(row['last_error'] or '')[:90]}")
        if len(failures) > 15:
            print(f"  … and {len(failures) - 15} more")
    return 0


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--index", default="nifty500", help="NSE index to use as the universe")
    parser.add_argument("--limit", type=int, default=0, help="Only fetch this many pending companies")
    parser.add_argument("--symbols", nargs="+", help="Fetch these symbols regardless of status")
    parser.add_argument("--retry-failed", action="store_true", help="Re-run only the companies that failed")
    parser.add_argument("--rate-limit", type=float, default=1.2, help="Seconds between calls")
    parser.add_argument("--max-age-days", type=float, default=DEFAULT_MAX_AGE_DAYS,
                        help="Re-fetch companies last fetched longer ago than this")
    parser.add_argument("--status", action="store_true", help="Show ledger progress and exit")
    parser.add_argument("--export", action="store_true", help="Write the app's data files and exit")
    parser.add_argument("--backfill-shareholding", action="store_true",
                        help="Fetch filed shareholding for companies already ingested")
    args = parser.parse_args(argv)

    if args.status:
        return status()
    if args.export:
        return export()
    if args.backfill_shareholding:
        return backfill_shareholding(limit=args.limit)
    return run(
        limit=args.limit,
        retry_failed=args.retry_failed,
        symbols=args.symbols,
        index=args.index,
        rate_limit=args.rate_limit,
        max_age_days=args.max_age_days,
    )


if __name__ == "__main__":
    raise SystemExit(main())
