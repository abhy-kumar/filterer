"""
screener_scraper.py
-------------------
Extracts quarterly shareholding patterns, multi-year efficiency ratios,
and compounded growth rates from Screener.in public pages.
"""

from __future__ import annotations

import logging
import re
import time
from typing import Any, Dict, List, Optional
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def _clean_float(val: Any) -> Optional[float]:
    if val is None:
        return None
    s = str(val).strip().replace(",", "").replace("%", "")
    if not s or s == "--" or s == "-":
        return None
    try:
        return round(float(s), 2)
    except (ValueError, TypeError):
        return None


def _clean_int(val: Any) -> Optional[int]:
    f = _clean_float(val)
    return int(round(f)) if f is not None else None


class ScreenerScraper:
    def __init__(self, session: Optional[requests.Session] = None, delay: float = 0.2):
        self.session = session or requests.Session()
        self.session.headers.update(DEFAULT_HEADERS)
        self.delay = delay
        self.is_throttled = False
        self.fail_streak = 0

    def fetch_company_page(self, symbol: str) -> Optional[str]:
        """Fetch HTML for a symbol, with fast-fail circuit breaker."""
        if self.is_throttled:
            return None

        clean_sym = symbol.strip().upper().replace("&", "%26")
        urls = [
            f"https://www.screener.in/company/{clean_sym}/consolidated/",
            f"https://www.screener.in/company/{clean_sym}/",
        ]
        for url in urls:
            try:
                if self.delay > 0:
                    time.sleep(self.delay)
                resp = self.session.get(url, timeout=(2.0, 3.5))
                if resp.status_code == 200 and "Shareholding Pattern" in resp.text:
                    self.fail_streak = 0
                    return resp.text
                elif resp.status_code in (429, 403):
                    self.is_throttled = True
                    logger.warning("Screener.in rate limit encountered (HTTP %d). Engaging circuit breaker.", resp.status_code)
                    return None
            except (requests.exceptions.ConnectTimeout, requests.exceptions.ReadTimeout, requests.exceptions.ConnectionError):
                self.fail_streak += 1
                if self.fail_streak >= 3:
                    self.is_throttled = True
                    logger.warning("Screener.in connection timeout streak reached. Engaging circuit breaker.")
                return None
            except Exception as exc:
                logger.debug("Screener fetch error for %s on %s: %s", symbol, url, exc)
        return None

    def parse_shareholding_table(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Parse the shareholding quarterly table."""
        shp_section = soup.find("section", id="shareholding")
        if not shp_section:
            return []

        table = shp_section.find("table")
        if not table:
            return []

        rows = table.find_all("tr")
        if not rows:
            return []

        # First row contains headers: ['', 'Sep 2023', 'Dec 2023', ...]
        header_cells = [th.get_text(strip=True) for th in rows[0].find_all(["th", "td"])]
        periods = [h for h in header_cells if h]
        if not periods:
            return []

        # Map metric label to values list across periods
        data_by_metric: Dict[str, List[Optional[float]]] = {}
        for tr in rows[1:]:
            cells = [td.get_text(strip=True) for td in tr.find_all(["th", "td"])]
            if not cells:
                continue
            raw_label = cells[0].replace("+", "").strip().lower()
            vals = [_clean_float(c) for c in cells[1 : len(periods) + 1]]
            while len(vals) < len(periods):
                vals.append(None)

            if "promoter" in raw_label:
                data_by_metric["promoter"] = vals
            elif "fii" in raw_label:
                data_by_metric["fii"] = vals
            elif "dii" in raw_label:
                data_by_metric["dii"] = vals
            elif "government" in raw_label:
                data_by_metric["government"] = vals
            elif "public" in raw_label:
                data_by_metric["public"] = vals
            elif "other" in raw_label:
                data_by_metric["others"] = vals

        records: List[Dict[str, Any]] = []
        for idx, period in enumerate(periods):
            prom = (data_by_metric.get("promoter") or [None] * len(periods))[idx]
            fii = (data_by_metric.get("fii") or [None] * len(periods))[idx]
            dii = (data_by_metric.get("dii") or [None] * len(periods))[idx]
            govt = (data_by_metric.get("government") or [None] * len(periods))[idx]
            pub = (data_by_metric.get("public") or [None] * len(periods))[idx]
            oth = (data_by_metric.get("others") or [None] * len(periods))[idx]

            # Combine govt and others if present
            others_total = round(((govt or 0.0) + (oth or 0.0)), 2) if (govt is not None or oth is not None) else None

            if all(v is None for v in (prom, fii, dii, pub)):
                continue

            total_val = round(sum(v for v in (prom, fii, dii, pub, others_total) if v is not None), 2)
            records.append({
                "period": period,
                "promoter": prom,
                "fii": fii,
                "dii": dii,
                "public": pub,
                "others": others_total,
                "total": total_val,
                "pledged": None,
                "source": "Screener.in",
            })

        return records

    def parse_ratios_table(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Parse the historical ratios table (Debtor Days, Inventory Days, etc.)."""
        ratios_section = soup.find("section", id="ratios")
        if not ratios_section:
            return []

        table = ratios_section.find("table")
        if not table:
            return []

        rows = table.find_all("tr")
        if not rows:
            return []

        header_cells = [th.get_text(strip=True) for th in rows[0].find_all(["th", "td"])]
        years = [h for h in header_cells if h]
        if not years:
            return []

        data_by_metric: Dict[str, List[Optional[float]]] = {}
        for tr in rows[1:]:
            cells = [td.get_text(strip=True) for td in tr.find_all(["th", "td"])]
            if not cells:
                continue
            raw_label = cells[0].lower().strip()
            vals = [_clean_float(c) for c in cells[1 : len(years) + 1]]
            while len(vals) < len(years):
                vals.append(None)

            if "debtor" in raw_label:
                data_by_metric["debtor_days"] = vals
            elif "inventory" in raw_label:
                data_by_metric["inventory_days"] = vals
            elif "payable" in raw_label:
                data_by_metric["days_payable"] = vals
            elif "cash conversion" in raw_label:
                data_by_metric["cash_conversion_cycle"] = vals
            elif "working capital" in raw_label:
                data_by_metric["working_capital_days"] = vals
            elif "roce" in raw_label:
                data_by_metric["roce"] = vals
            elif "roe" in raw_label:
                data_by_metric["roe"] = vals

        records: List[Dict[str, Any]] = []
        for idx, yr in enumerate(years):
            rec = {
                "year": yr,
                "roce": (data_by_metric.get("roce") or [None] * len(years))[idx],
                "roe": (data_by_metric.get("roe") or [None] * len(years))[idx],
                "debtor_days": _clean_int((data_by_metric.get("debtor_days") or [None] * len(years))[idx]),
                "inventory_days": _clean_int((data_by_metric.get("inventory_days") or [None] * len(years))[idx]),
                "days_payable": _clean_int((data_by_metric.get("days_payable") or [None] * len(years))[idx]),
                "working_capital_days": _clean_int((data_by_metric.get("working_capital_days") or [None] * len(years))[idx]),
                "cash_conversion_cycle": _clean_int((data_by_metric.get("cash_conversion_cycle") or [None] * len(years))[idx]),
            }
            records.append(rec)

        return records

    def parse_growth_ranges(self, soup: BeautifulSoup) -> Dict[str, Optional[float]]:
        """Parse compounded growth tables (Sales, Profit, Price CAGR, ROE)."""
        metrics: Dict[str, Optional[float]] = {
            "sales_growth_3y": None,
            "sales_growth_5y": None,
            "sales_growth_10y": None,
            "profit_growth_3y": None,
            "profit_growth_5y": None,
            "profit_growth_10y": None,
            "roe_3y": None,
            "roe_5y": None,
            "roe_10y": None,
            "price_cagr_1y": None,
            "price_cagr_3y": None,
            "price_cagr_5y": None,
            "price_cagr_10y": None,
        }

        for table in soup.find_all("table", class_="ranges-table"):
            th = table.find("th")
            title = (th.get_text(strip=True) if th else "").lower()

            for tr in table.find_all("tr"):
                cells = [td.get_text(strip=True) for td in tr.find_all("td")]
                if len(cells) < 2:
                    continue
                period_label, val_str = cells[0].lower(), cells[1]
                num = _clean_float(val_str)

                if "sales" in title:
                    if "3 year" in period_label: metrics["sales_growth_3y"] = num
                    elif "5 year" in period_label: metrics["sales_growth_5y"] = num
                    elif "10 year" in period_label: metrics["sales_growth_10y"] = num
                elif "profit" in title:
                    if "3 year" in period_label: metrics["profit_growth_3y"] = num
                    elif "5 year" in period_label: metrics["profit_growth_5y"] = num
                    elif "10 year" in period_label: metrics["profit_growth_10y"] = num
                elif "return on equity" in title or "roe" in title:
                    if "3 year" in period_label: metrics["roe_3y"] = num
                    elif "5 year" in period_label: metrics["roe_5y"] = num
                    elif "10 year" in period_label: metrics["roe_10y"] = num
                elif "price cagr" in title:
                    if "1 year" in period_label: metrics["price_cagr_1y"] = num
                    elif "3 year" in period_label: metrics["price_cagr_3y"] = num
                    elif "5 year" in period_label: metrics["price_cagr_5y"] = num
                    elif "10 year" in period_label: metrics["price_cagr_10y"] = num

        return metrics

    def scrape(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Fetch and parse all sections for a company."""
        html = self.fetch_company_page(symbol)
        if not html:
            return None

        soup = BeautifulSoup(html, "html.parser")
        shareholding = self.parse_shareholding_table(soup)
        ratios = self.parse_ratios_table(soup)
        growth = self.parse_growth_ranges(soup)

        return {
            "symbol": symbol.upper(),
            "shareholding": shareholding,
            "ratios": ratios,
            "growth": growth,
        }
