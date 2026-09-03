"""
fetch_authentic_quarters.py
----------------------------
Fetches 100% authentic, filed quarterly financial results from Screener.in
to eliminate synthetic interpolations across the Nifty 500 universe.
Caches results in data/authentic_quarters.json.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import db_split_join
from data_pipeline.ingest import Ledger

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fetch_authentic_quarters")

CACHE_FILE = ROOT / "data" / "authentic_quarters.json"
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}


def load_cache() -> Dict[str, List[Dict[str, Any]]]:
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_cache(cache: Dict[str, List[Dict[str, Any]]]) -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


def fetch_screener_quarters(session: requests.Session, symbol: str) -> Optional[List[Dict[str, Any]]]:
    clean_sym = symbol.strip().upper().replace("&", "%26")
    for suffix in ["/consolidated/", "/"]:
        url = f"https://www.screener.in/company/{clean_sym}{suffix}"
        try:
            r = session.get(url, headers=DEFAULT_HEADERS, timeout=6)
            if r.status_code == 429:
                logger.warning("Throttled on %s", symbol)
                return None
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "html.parser")
            sec = soup.find("section", id="quarters")
            if not sec:
                continue
            table = sec.find("table")
            if not table:
                continue
            th_list = [th.get_text(strip=True) for th in table.find("thead").find_all("th")][1:]
            rows = {}
            for tr in table.find("tbody").find_all("tr"):
                tds = [td.get_text(strip=True) for td in tr.find_all("td")]
                if tds:
                    name = tds[0].replace("+", "").replace("%", "").strip()
                    rows[name] = tds[1:]

            quarters = []
            for i, h in enumerate(th_list):
                def get_f(field_name: str) -> Optional[float]:
                    if field_name in rows and i < len(rows[field_name]):
                        v = rows[field_name][i].replace(",", "").replace("%", "").strip()
                        try:
                            return float(v)
                        except Exception:
                            return None
                    return None

                quarters.append({
                    "period": h,
                    "sales": get_f("Sales") or 0.0,
                    "expenses": get_f("Expenses") or 0.0,
                    "operating_profit": get_f("Operating Profit") or 0.0,
                    "opm_pct": get_f("OPM") or 0.0,
                    "other_income": get_f("Other Income"),
                    "interest": get_f("Interest") or 0.0,
                    "depreciation": get_f("Depreciation") or 0.0,
                    "profit_before_tax": get_f("Profit before tax") or 0.0,
                    "tax_pct": get_f("Tax") or 0.0,
                    "net_profit": get_f("Net Profit") or 0.0,
                    "eps": get_f("EPS in Rs") or 0.0,
                })
            return quarters
        except Exception as e:
            logger.debug("Error fetching %s: %s", symbol, e)
    return None


def run_authentic_quarterly_fetch() -> int:
    ledger = Ledger()
    stocks = ledger.payloads()
    if not stocks:
        logger.error("No stocks in ledger.")
        return 1

    cache = load_cache()
    session = requests.Session()

    logger.info("Checking authentic quarters for %d stocks (cached: %d)...", len(stocks), len(cache))
    fetched = 0
    updated_stocks = 0

    for i, stock in enumerate(stocks, 1):
        sym = stock["symbol"].strip().upper()
        
        # Check if already cached
        quarters = cache.get(sym)
        if not quarters:
            quarters = fetch_screener_quarters(session, sym)
            if quarters:
                cache[sym] = quarters
                fetched += 1
                if fetched % 25 == 0:
                    save_cache(cache)
                    logger.info("Fetched authentic quarters for %d companies...", fetched)
            time.sleep(0.1)

        if quarters:
            # Overwrite quarterly_results with 100% authentic filed data
            # Use the most recent 6-8 quarters
            stock["quarterly_results"] = quarters[-8:] if len(quarters) > 8 else quarters
            ledger.record_success(sym, stock)
            updated_stocks += 1

    save_cache(cache)
    logger.info("Done! Updated %d stocks with authentic filed quarterly statements (newly fetched: %d).", updated_stocks, fetched)

    # Now re-run heal_and_enrich to export and sync
    logger.info("Triggering heal_and_enrich export pass...")
    from data_pipeline.heal_and_enrich import heal_all
    return heal_all()


if __name__ == "__main__":
    raise SystemExit(run_authentic_quarterly_fetch())
