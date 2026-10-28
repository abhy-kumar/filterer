"""
A second, independent copy of each company's annual statements, from Tickertape.

Why this exists. Yahoo is the only source of balance sheets here, and it has
gaps: HCL Tech and Infosys came through with no balance sheet at all, so their
return on capital was stored as 0, and no company had a current assets and
liabilities split, so current ratio, debtor days and the cash conversion cycle
were blank for the whole universe. Tickertape's public statements API carries
both. It is used two ways by scripts/repair_dataset.mjs:

    to fill a ratio nothing else supplies, marked with where it came from
    to check figures we already have, and flag the ones that disagree

It never overwrites a figure from a filing or from Yahoo. When two sources
disagree the page says so, rather than this code picking a winner.

    python -m data_pipeline.second_source [--symbols A B] [--limit N]

Output lands in data/filings/second_source.json. A company that cannot be
fetched keeps its entry from the previous run.

The plain standard-library HTTP client is used on purpose: it is all this API
needs, and it works wherever Python's own certificate store does.
"""

from __future__ import annotations

import argparse
import json
import logging
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from urllib.parse import quote

from data_pipeline.nse_filings import OUT_DIR, load_json, universe_symbols, write_json

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent.parent
OUT_FILE = OUT_DIR / "second_source.json"
SID_CACHE = ROOT / "data" / "tickertape_sid_cache.json"

API = "https://api.tickertape.in"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
}
# Seconds between requests. About 500 companies at three requests each is
# under ten minutes at this pace.
PACE = 0.35
YEARS_KEPT = 4

# Tickertape field -> our name. Figures are in rupees crore, as ours are.
# incEbi reads like EBIT but is EBITDA: for HCL Tech's FY2026 it is the filed
# profit before tax plus interest plus depreciation. incPbi is the EBIT.
INCOME_FIELDS = {
    "incTrev": "revenue",
    "incToi": "other_income",
    "incPbi": "ebit",
    "incEbi": "ebitda",
    "incIoi": "interest",
    "incPbt": "profit_before_tax",
    "incNinc": "net_income",
    "incRaw": "raw_materials",
}
BALANCE_FIELDS = {
    "balTota": "total_assets",
    "balTca": "current_assets",
    "balTcl": "current_liabilities",
    "balTeq": "equity",
    "balTrec": "receivables",
    "balTinv": "inventory",
    "balAccp": "payables",
}

_last_request = 0.0


def _get(path: str, retries: int = 3) -> Any:
    global _last_request
    for attempt in range(retries):
        wait = PACE - (time.time() - _last_request)
        if wait > 0:
            time.sleep(wait)
        _last_request = time.time()
        try:
            request = urllib.request.Request(API + path, headers=HEADERS)
            with urllib.request.urlopen(request, timeout=20) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return None
            if exc.code not in (429, 500, 502, 503, 504):
                raise
        except (urllib.error.URLError, TimeoutError, ValueError):
            pass
        time.sleep(2 ** attempt * 2)
    raise RuntimeError(f"gave up on {path} after {retries} attempts")


def resolve_sid(symbol: str, cache: dict[str, str]) -> Optional[str]:
    """Tickertape's own id for a company. Its statement endpoints ignore the NSE symbol."""
    if symbol in cache:
        return cache[symbol]
    payload = _get(f"/search?text={quote(symbol)}")
    stocks = ((payload or {}).get("data") or {}).get("stocks") or []
    # Only an exact ticker match: a fuzzy search hit would attach another
    # company's statements.
    match = next((s for s in stocks if str(s.get("ticker", "")).upper() == symbol.upper()), None)
    if not match or not match.get("sid"):
        return None
    cache[symbol] = match["sid"]
    return match["sid"]


def year_label(display: str) -> Optional[str]:
    """'FY 2026' -> 'Mar 2026', the label the filed annual P&L uses. TTM is not a year."""
    parts = str(display or "").split()
    if len(parts) == 2 and parts[0] == "FY" and parts[1].isdigit():
        return f"Mar {parts[1]}"
    return None


def _number(value: Any) -> Optional[float]:
    return round(float(value), 2) if isinstance(value, (int, float)) else None


def merge_statements(income: list[dict], balance: list[dict], keep: int = YEARS_KEPT) -> list[dict]:
    """One row per financial year, carrying both statements' figures."""
    years: dict[str, dict] = {}
    for rows, fields in ((income, INCOME_FIELDS), (balance, BALANCE_FIELDS)):
        for row in rows or []:
            year = year_label(row.get("displayPeriod"))
            if not year:
                continue
            target = years.setdefault(year, {"year": year})
            for theirs, ours in fields.items():
                target[ours] = _number(row.get(theirs))
    ordered = sorted(years.values(), key=lambda r: int(r["year"].split()[1]))
    return ordered[-keep:]


def fetch_company(symbol: str, cache: dict[str, str]) -> Optional[dict]:
    sid = resolve_sid(symbol, cache)
    if not sid:
        return None
    income = (_get(f"/stocks/financials/income/{sid}/annual/normal") or {}).get("data") or []
    balance = (_get(f"/stocks/financials/balancesheet/{sid}/annual/normal") or {}).get("data") or []
    years = merge_statements(income, balance)
    if not years:
        return None
    return {
        "source": "Tickertape",
        "sid": sid,
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "years": years,
    }


def run(symbols: list[str]) -> int:
    old = load_json(OUT_FILE)
    cache = load_json(SID_CACHE)
    out: dict[str, dict] = {}
    fetched = kept = 0
    for i, symbol in enumerate(symbols, 1):
        try:
            entry = fetch_company(symbol, cache)
        except Exception as exc:
            logger.warning("[%d/%d] %s: %s", i, len(symbols), symbol, str(exc)[:100])
            entry = None
        if entry:
            out[symbol] = entry
            fetched += 1
        elif symbol in old:
            # Yesterday's copy beats none: statements change once a year.
            out[symbol] = old[symbol]
            kept += 1
        if i % 50 == 0:
            logger.info("[%d/%d] %d fetched, %d kept from the last run", i, len(symbols), fetched, kept)

    write_json(OUT_FILE, out)
    SID_CACHE.write_text(json.dumps(cache, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    logger.info("Second source: %d fetched, %d kept, %d missing", fetched, kept, len(symbols) - fetched - kept)
    # A run that reached nobody is an outage, not data; say so to the workflow.
    return 0 if fetched else 1


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--symbols", nargs="*")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    symbols = args.symbols or universe_symbols()
    if args.limit:
        symbols = symbols[: args.limit]
    return run(symbols)


if __name__ == "__main__":
    raise SystemExit(main())
