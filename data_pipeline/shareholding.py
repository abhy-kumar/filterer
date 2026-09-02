"""
Shareholding from exchange filings.

What this replaces: the pipeline could not source a shareholding pattern, so it
generated one. Every company in the universe drifted by exactly the same amount
every quarter, from a hardcoded list of period labels:

    drift = (i - 3) * 0.1
    "promoter": _round(base_prom - drift * 0.2),
    "fii":      _round(base_fii  + drift * 0.3),

That is not data. NSE publishes the filed pattern per company, and this reads
it: real periods, real promoter and public percentages, quarter by quarter.

A caveat worth stating plainly. NSE's endpoint reports the top-level split only
(promoter group, public, employee trusts). It does not break the public holding
into foreign and domestic institutions, and it carries no pledge figure. Those
fields are therefore left as None rather than estimated, and the UI reports them
as not disclosed. BSE publishes the fuller breakdown, but its shareholding
endpoints are not reachable at the paths its own site appears to use; the rest
of the BSE API answers normally, so this is a discovery problem rather than a
block. See `fetch_bse_shareholding` below.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Optional
from urllib.parse import quote

from data_pipeline.http_client import HttpClient, shared_client

logger = logging.getLogger(__name__)

NSE_QUOTE_PAGE = "https://www.nseindia.com/get-quotes/equity?symbol={symbol}"
NSE_CORP_INFO = "https://www.nseindia.com/api/top-corp-info?symbol={symbol}&market=equities"

MONTHS = {
    "01": "Mar", "02": "Mar", "03": "Mar",
    "04": "Jun", "05": "Jun", "06": "Jun",
    "07": "Sep", "08": "Sep", "09": "Sep",
    "10": "Dec", "11": "Dec", "12": "Dec",
}

# The labels NSE uses, mapped onto our fields.
PROMOTER_KEYS = ("promoter & promoter group", "promoter and promoter group", "promoter")
PUBLIC_KEYS = ("public",)
TRUST_KEYS = ("shares held by employee trusts", "employee trusts")


def _to_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return round(float(str(value).strip().replace(",", "").replace("%", "")), 2)
    except (TypeError, ValueError):
        return None


def _period_label(raw: str) -> Optional[str]:
    """'30-Jun-2026' or '2026-06-30' into the 'Jun 2026' the app uses."""
    raw = raw.strip()
    m = re.match(r"^(\d{1,2})-([A-Za-z]{3})-(\d{4})$", raw)
    if m:
        return f"{m.group(2).title()} {m.group(3)}"
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", raw)
    if m:
        return f"{MONTHS.get(m.group(2), 'Mar')} {m.group(1)}"
    return None


def _period_sort_key(label: str) -> tuple[int, int]:
    order = {"Mar": 0, "Jun": 1, "Sep": 2, "Dec": 3}
    try:
        month, year = label.split(" ")
        return int(year), order.get(month, 0)
    except Exception:
        return 0, 0


def parse_nse_patterns(payload: dict) -> list[dict]:
    """
    Turn NSE's shareholdings_patterns block into our period records.

    The payload is a date-keyed map of label/value pairs:

        {"30-Jun-2026": [{"Promoter & Promoter Group": "  50.48"},
                         {"Public": "  49.52"}, ...]}
    """
    data = (payload.get("shareholdings_patterns") or {}).get("data") or {}
    records: list[dict] = []

    for raw_period, entries in data.items():
        label = _period_label(raw_period)
        if not label or not isinstance(entries, list):
            continue

        promoter = public = trusts = None
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            for key, value in entry.items():
                low = key.strip().lower()
                if low in PROMOTER_KEYS:
                    promoter = _to_float(value)
                elif low in PUBLIC_KEYS:
                    public = _to_float(value)
                elif low in TRUST_KEYS:
                    trusts = _to_float(value)

        if promoter is None and public is None:
            continue

        records.append(
            {
                "period": label,
                "promoter": promoter,
                # NSE reports the public holding as a single figure. Splitting
                # it into FII and DII would be guesswork, which is exactly what
                # this module exists to remove.
                "fii": None,
                "dii": None,
                "public": public,
                "others": trusts,
                "total": round(sum(v for v in (promoter, public, trusts) if v is not None), 2),
                "pledged": None,
                "source": "NSE filings",
            }
        )

    records.sort(key=lambda r: _period_sort_key(r["period"]))
    return records


def fetch_nse_shareholding(symbol: str, client: Optional[HttpClient] = None) -> list[dict]:
    """Filed quarterly shareholding for one company. Empty list if unavailable."""
    client = client or shared_client()
    # Percent-encode the symbol: M&M, ARE&M and J&KBANK would otherwise split
    # the query string at the ampersand and return the wrong company's data,
    # or none. This silently skipped 5 companies on the first backfill.
    quoted = quote(symbol.upper(), safe="")

    try:
        client.prime(NSE_QUOTE_PAGE.format(symbol=quoted))
        payload = client.get_json(
            NSE_CORP_INFO.format(symbol=quoted),
            headers={"Referer": NSE_QUOTE_PAGE.format(symbol=quoted)},
        )
    except Exception as exc:
        logger.debug("NSE shareholding unavailable for %s: %s", symbol, exc)
        return []

    if not isinstance(payload, dict):
        return []

    records = parse_nse_patterns(payload)
    if records:
        logger.info("  %s: %d filed shareholding periods", symbol, len(records))
    return records


def fetch_bse_shareholding(scrip_code: str, client: Optional[HttpClient] = None) -> list[dict]:
    """
    Not implemented.

    BSE publishes the fuller pattern, including the foreign/domestic
    institutional split and promoter pledge, which NSE's endpoint omits. Its
    API answers normally for other resources (ComHeadernew, StockReachGraph),
    so access is not the problem, but the shareholding paths its own site
    appears to call return "The Page you are looking for has been moved".

    Finding the current path is the remaining work. Until then FII, DII and
    pledge stay None rather than being estimated from the public total.
    """
    return []


def attach_shareholding(stock: dict, client: Optional[HttpClient] = None) -> bool:
    """
    Replace a company's shareholding with filed data. True if anything landed.

    Leaves the record untouched when the filing is unavailable, so a network
    problem degrades to "not disclosed" rather than to invented figures.
    """
    records = fetch_nse_shareholding(stock.get("nse_symbol") or stock["symbol"], client)
    if not records:
        return False

    stock["shareholding_history"] = records
    stock["shareholding_source"] = "NSE filings"

    latest = records[-1]
    stock["promoter_holding"] = latest["promoter"]
    stock["public_holding"] = latest["public"]
    stock["fii_holding"] = None
    stock["dii_holding"] = None
    stock["pledged_percentage"] = None

    if len(records) >= 2:
        previous = records[-2]
        if latest["promoter"] is not None and previous["promoter"] is not None:
            stock["change_in_promoter_holding_quarter"] = round(
                latest["promoter"] - previous["promoter"], 2
            )
    stock["change_in_fii_holding_quarter"] = None
    stock["change_in_dii_holding_quarter"] = None
    return True


def main(argv: Optional[list[str]] = None) -> int:
    import argparse
    import json

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description="Fetch filed shareholding for one company")
    parser.add_argument("symbol")
    args = parser.parse_args(argv)

    records = fetch_nse_shareholding(args.symbol)
    print(json.dumps(records, indent=2) if records else "No filed shareholding returned.")
    return 0 if records else 1


if __name__ == "__main__":
    raise SystemExit(main())
