"""
tickertape_client.py
--------------------
Client for Tickertape API to fetch institutional ownership,
promoter holding, and pledged share percentages.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from typing import Any, Dict, List, Optional
import requests

logger = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
}

CACHE_FILE = "data/tickertape_sid_cache.json"

MONTHS_MAP = {
    "01": "Mar", "02": "Mar", "03": "Mar",
    "04": "Jun", "05": "Jun", "06": "Jun",
    "07": "Sep", "08": "Sep", "09": "Sep",
    "10": "Dec", "11": "Dec", "12": "Dec",
}


def _date_to_period(iso_date: str) -> Optional[str]:
    """Convert '2026-06-30T00:00:00.000Z' into 'Jun 2026'."""
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", iso_date.strip())
    if m:
        year, month = m.group(1), m.group(2)
        month_label = MONTHS_MAP.get(month, "Mar")
        return f"{month_label} {year}"
    return None


class TickertapeClient:
    def __init__(self, session: Optional[requests.Session] = None, delay: float = 0.2):
        self.session = session or requests.Session()
        self.session.headers.update(DEFAULT_HEADERS)
        self.delay = delay
        self._sid_cache: Dict[str, str] = self._load_cache()

    def _load_cache(self) -> Dict[str, str]:
        cache = {}
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    cache = json.load(f)
            except Exception:
                cache = {}

        if len(cache) < 400:
            try:
                resp = self.session.get("https://api.tickertape.in/indices/constituents/.NIFTY500", timeout=8)
                if resp.status_code == 200:
                    constituents = resp.json().get("data", {}).get("constituents", [])
                    for c in constituents:
                        ticker = c.get("ticker", "").strip().upper()
                        sid = c.get("sid", "").strip()
                        if ticker and sid:
                            cache[ticker] = sid
                    self._sid_cache = cache
                    self._save_cache()
            except Exception as exc:
                logger.debug("Failed seeding NIFTY500 constituents cache: %s", exc)

        return cache

    def _save_cache(self) -> None:
        try:
            os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._sid_cache, f, indent=2)
        except Exception as exc:
            logger.debug("Failed saving tickertape sid cache: %s", exc)

    def resolve_sid(self, symbol: str) -> Optional[str]:
        """Resolve an NSE symbol to a Tickertape SID."""
        clean = symbol.strip().upper()
        if clean in self._sid_cache:
            return self._sid_cache[clean]

        # 1. Try direct info lookup
        try:
            if self.delay > 0:
                time.sleep(self.delay)
            resp = self.session.get(f"https://api.tickertape.in/stocks/info/{clean}", timeout=8)
            if resp.status_code == 200:
                sid = resp.json().get("data", {}).get("sid")
                if sid:
                    self._sid_cache[clean] = sid
                    self._save_cache()
                    return sid
        except Exception:
            pass

        # 2. Try search endpoint
        try:
            search_term = clean.replace("_", " ").replace("&", " ")
            resp = self.session.get(f"https://api.tickertape.in/search?text={search_term}", timeout=8)
            if resp.status_code == 200:
                stocks = resp.json().get("data", {}).get("stocks", [])
                if stocks:
                    # Match ticker exactly, or fallback to first result
                    match = next(
                        (s for s in stocks if s.get("ticker", "").upper() == clean.replace("&", "")),
                        stocks[0],
                    )
                    sid = match.get("sid")
                    if sid:
                        self._sid_cache[clean] = sid
                        self._save_cache()
                        return sid
        except Exception as exc:
            logger.debug("Tickertape search failed for %s: %s", symbol, exc)

        return None

    def fetch_holdings(self, symbol: str) -> List[Dict[str, Any]]:
        """Fetch quarterly shareholding from Tickertape."""
        sid = self.resolve_sid(symbol)
        if not sid:
            return []

        try:
            if self.delay > 0:
                time.sleep(self.delay)
            resp = self.session.get(f"https://api.tickertape.in/stocks/holdings/{sid}", timeout=10)
            if resp.status_code != 200:
                return []

            raw_items = resp.json().get("data", [])
            records: List[Dict[str, Any]] = []

            for item in raw_items:
                date_str = item.get("date", "")
                period = _date_to_period(date_str)
                if not period:
                    continue

                d = item.get("data", {})
                promoter = round(float(d.get("pmPctT") or 0.0), 2)
                pledged = round(float(d.get("plPctT") or 0.0), 2)
                fii = round(float(d.get("fiPctT") or 0.0), 2)
                dii = round(float(d.get("diPctT") or 0.0), 2)
                public = round(float(d.get("rOthPctT") or d.get("rhPctT") or 0.0), 2)
                others = round(float(d.get("othPctT") or 0.0), 2)

                total = round(promoter + fii + dii + public + others, 2)

                records.append({
                    "period": period,
                    "promoter": promoter,
                    "pledged": pledged,
                    "fii": fii,
                    "dii": dii,
                    "public": public,
                    "others": others,
                    "total": total,
                    "source": "Tickertape",
                })

            return records
        except Exception as exc:
            logger.debug("Tickertape holdings error for %s: %s", symbol, exc)
            return []

    def fetch_financial_ratios_and_growth(
        self, symbol: str
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Optional[float]]]:
        """Fetch income and balance sheet, then calculate efficiency ratios and growth."""
        clean = symbol.strip().upper().replace("&", "")
        sid = self.resolve_sid(symbol) or clean

        ratios_history: List[Dict[str, Any]] = []
        growth: Dict[str, Optional[float]] = {
            "sales_growth_3y": None,
            "sales_growth_5y": None,
            "profit_growth_3y": None,
            "profit_growth_5y": None,
            "roe_3y": None,
            "roe_5y": None,
        }

        try:
            if self.delay > 0:
                time.sleep(self.delay)

            r_inc = self.session.get(
                f"https://api.tickertape.in/stocks/financials/income/{clean}/annual/normal",
                timeout=5,
            )
            if r_inc.status_code != 200 and sid != clean:
                r_inc = self.session.get(
                    f"https://api.tickertape.in/stocks/financials/income/{sid}/annual/normal",
                    timeout=5,
                )

            r_bal = self.session.get(
                f"https://api.tickertape.in/stocks/financials/balancesheet/{clean}/annual/normal",
                timeout=5,
            )
            if r_bal.status_code != 200 and sid != clean:
                r_bal = self.session.get(
                    f"https://api.tickertape.in/stocks/financials/balancesheet/{sid}/annual/normal",
                    timeout=5,
                )

            inc_items = r_inc.json().get("data", []) if r_inc.status_code == 200 else []
            bal_items = r_bal.json().get("data", []) if r_bal.status_code == 200 else []

            inc_by_yr = {
                x.get("displayPeriod", "").replace("FY ", "Mar "): x
                for x in inc_items if x.get("displayPeriod") and x.get("displayPeriod") != "TTM"
            }
            bal_by_yr = {
                x.get("displayPeriod", "").replace("FY ", "Mar "): x
                for x in bal_items if x.get("displayPeriod") and x.get("displayPeriod") != "TTM"
            }

            all_years = sorted(set(inc_by_yr.keys()) | set(bal_by_yr.keys()))
            for yr in all_years:
                inc = inc_by_yr.get(yr, {})
                bal = bal_by_yr.get(yr, {})

                rev = inc.get("incTrev")
                rec = bal.get("balTrec")
                inv = bal.get("balTinv")
                pay = bal.get("balAccp")
                cogs = inc.get("incRaw")
                ca = bal.get("balTca")
                cl = bal.get("balTcl")
                ebit = inc.get("incEbi")
                eq = bal.get("balTeq")
                tota = bal.get("balTota")
                net_inc = inc.get("incNinc")

                capital = (tota - cl) if (tota is not None and cl is not None) else None

                dd = round((rec / rev) * 365) if (rev and rec and rev > 0) else None
                id_ = round((inv / cogs) * 365) if (cogs and inv and cogs > 0) else None
                dp = round((pay / cogs) * 365) if (cogs and pay and cogs > 0) else None
                wc = round(((ca - cl) / rev) * 365) if (rev and ca is not None and cl is not None and rev > 0) else None
                ccc = (dd + (id_ or 0) - (dp or 0)) if (dd is not None and dp is not None) else None
                roce = round((ebit / capital) * 100, 2) if (ebit and capital and capital > 0) else None
                roe = round((net_inc / eq) * 100, 2) if (net_inc and eq and eq > 0) else None

                ratios_history.append({
                    "year": yr,
                    "roce": roce,
                    "roe": roe,
                    "debtor_days": dd,
                    "inventory_days": id_,
                    "days_payable": dp,
                    "working_capital_days": wc,
                    "cash_conversion_cycle": ccc,
                })

            rev_series = [
                inc_by_yr[y]["incTrev"]
                for y in all_years
                if y in inc_by_yr and inc_by_yr[y].get("incTrev") and inc_by_yr[y]["incTrev"] > 0
            ]
            if len(rev_series) >= 4:
                growth["sales_growth_3y"] = round(((rev_series[-1] / rev_series[-4]) ** (1 / 3) - 1) * 100, 1)
            if len(rev_series) >= 6:
                growth["sales_growth_5y"] = round(((rev_series[-1] / rev_series[-6]) ** (1 / 5) - 1) * 100, 1)

            pat_series = [
                inc_by_yr[y]["incNinc"]
                for y in all_years
                if y in inc_by_yr and inc_by_yr[y].get("incNinc") and inc_by_yr[y]["incNinc"] > 0
            ]
            if len(pat_series) >= 4:
                growth["profit_growth_3y"] = round(((pat_series[-1] / pat_series[-4]) ** (1 / 3) - 1) * 100, 1)
            if len(pat_series) >= 6:
                growth["profit_growth_5y"] = round(((pat_series[-1] / pat_series[-6]) ** (1 / 5) - 1) * 100, 1)

            roe_series = [r["roe"] for r in ratios_history if r.get("roe") is not None]
            if len(roe_series) >= 3:
                growth["roe_3y"] = round(sum(roe_series[-3:]) / 3.0, 1)
            if len(roe_series) >= 5:
                growth["roe_5y"] = round(sum(roe_series[-5:]) / 5.0, 1)

        except Exception as exc:
            logger.debug("Tickertape financials failed for %s: %s", symbol, exc)

        return ratios_history, growth

