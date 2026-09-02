"""
The screening universe, taken from the index rather than a hardcoded list.

`stock_universe.py` holds 502 names typed out by hand. That list drifts from
the real index at every rebalance, carries no ISIN, and classifies companies
with Yahoo's sector taxonomy ("Consumer Cyclical") rather than the Indian
industry classification a domestic screener is expected to use.

NSE publishes the constituents of each index as a CSV, which is the
authoritative answer and includes ISIN and industry:

    Company Name,Industry,Symbol,Series,ISIN Code
    360 ONE WAM Ltd.,Financial Services,360ONE,EQ,INE466L01038

The hardcoded list stays as an offline fallback.
"""

from __future__ import annotations

import csv
import io
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

from data_pipeline.http_client import shared_client

logger = logging.getLogger(__name__)

INDEX_URLS = {
    "nifty500": "https://nsearchives.nseindia.com/content/indices/ind_nifty500list.csv",
    "nifty50": "https://nsearchives.nseindia.com/content/indices/ind_nifty50list.csv",
    "nifty100": "https://nsearchives.nseindia.com/content/indices/ind_nifty100list.csv",
    "niftymidcap150": "https://nsearchives.nseindia.com/content/indices/ind_niftymidcap150list.csv",
    "niftysmallcap250": "https://nsearchives.nseindia.com/content/indices/ind_niftysmallcap250list.csv",
    "niftytotalmarket": "https://nsearchives.nseindia.com/content/indices/ind_niftytotalmarket_list.csv",
}

SNAPSHOT_DIR = Path(__file__).resolve().parent.parent / "data" / "universe"


@dataclass(frozen=True)
class Constituent:
    symbol: str
    name: str
    industry: str
    isin: str
    series: str = "EQ"

    @property
    def yahoo_symbol(self) -> str:
        return f"{self.symbol}.NS"


def _parse_csv(body: bytes) -> list[Constituent]:
    rows = csv.DictReader(io.StringIO(body.decode("utf-8-sig")))
    out: list[Constituent] = []
    for row in rows:
        # NSE has shipped this file with stray spaces in the headers before.
        clean = { (k or "").strip(): (v or "").strip() for k, v in row.items() }
        symbol = clean.get("Symbol")
        if not symbol:
            continue
        out.append(
            Constituent(
                symbol=symbol,
                name=clean.get("Company Name", symbol),
                industry=clean.get("Industry", ""),
                isin=clean.get("ISIN Code", ""),
                series=clean.get("Series", "EQ"),
            )
        )
    return out


def _snapshot_path(index: str) -> Path:
    return SNAPSHOT_DIR / f"{index}.csv"


def fetch_index_constituents(index: str = "nifty500", use_cache: bool = True) -> list[Constituent]:
    """
    Live constituents for an NSE index.

    The response is snapshotted to data/universe/<index>.csv so an ingest can
    run without network access, and so a rebalance is visible in the diff.
    """
    url = INDEX_URLS.get(index)
    if not url:
        raise ValueError(f"Unknown index {index!r}. Known: {', '.join(sorted(INDEX_URLS))}")

    snapshot = _snapshot_path(index)

    try:
        body = shared_client().get(url, allow_cache=use_cache)
        constituents = _parse_csv(body)
        if not constituents:
            raise ValueError("index CSV parsed to zero rows")

        snapshot.parent.mkdir(parents=True, exist_ok=True)
        snapshot.write_bytes(body)
        logger.info("Fetched %d constituents for %s", len(constituents), index)
        return constituents

    except Exception as exc:
        logger.warning("Live fetch of %s failed (%s); falling back", index, exc)

    if snapshot.exists():
        constituents = _parse_csv(snapshot.read_bytes())
        logger.info("Using snapshot for %s: %d constituents", index, len(constituents))
        return constituents

    return _fallback_from_hardcoded_list()


def _fallback_from_hardcoded_list() -> list[Constituent]:
    """Last resort: the checked-in list, which has no ISIN or industry."""
    from data_pipeline.stock_universe import STOCK_UNIVERSE

    logger.warning("Falling back to the hardcoded universe (no ISIN or industry)")
    return [
        Constituent(symbol=sym, name=name, industry="", isin="")
        for sym, name in STOCK_UNIVERSE
    ]


def diff_against_hardcoded(constituents: Iterable[Constituent]) -> tuple[set[str], set[str]]:
    """(added, removed) relative to stock_universe.py, to show index drift."""
    from data_pipeline.stock_universe import STOCK_UNIVERSE

    live = {c.symbol for c in constituents}
    hardcoded = {sym for sym, _ in STOCK_UNIVERSE}
    return live - hardcoded, hardcoded - live


def main(argv: Optional[list[str]] = None) -> int:
    import argparse

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description="Refresh the index constituent snapshot")
    parser.add_argument("--index", default="nifty500", choices=sorted(INDEX_URLS))
    parser.add_argument("--no-cache", action="store_true")
    args = parser.parse_args(argv)

    constituents = fetch_index_constituents(args.index, use_cache=not args.no_cache)
    added, removed = diff_against_hardcoded(constituents)

    print(f"{args.index}: {len(constituents)} constituents")
    print(f"  in the index but not in stock_universe.py: {len(added)}")
    if added:
        print("   ", ", ".join(sorted(added)[:25]), "..." if len(added) > 25 else "")
    print(f"  in stock_universe.py but not in the index: {len(removed)}")
    if removed:
        print("   ", ", ".join(sorted(removed)[:25]), "..." if len(removed) > 25 else "")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
