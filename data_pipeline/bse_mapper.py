"""
bse_mapper.py
-------------
Maps NSE trading symbols to BSE 6-digit scrip codes using Zerodha's
daily instrument master with exact symbol and fuzzy name matching.
"""

from __future__ import annotations

import csv
import io
import json
import logging
import os
from difflib import SequenceMatcher
from pathlib import Path
from typing import Dict, Optional
import requests

logger = logging.getLogger(__name__)

CACHE_FILE = Path("data/bse_code_map.json")

# Explicit overrides for exchanges/special entities
EXPLICIT_BSE_CODES = {
    "BSE": "543066",
    "CDSL": "540608",
}


class BSEMapper:
    def __init__(self, cache_path: Path = CACHE_FILE):
        self.cache_path = cache_path
        self._map: Dict[str, str] = self._load_cache()

    def _load_cache(self) -> Dict[str, str]:
        if self.cache_path.exists():
            try:
                with open(self.cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save_cache(self) -> None:
        try:
            self.cache_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.cache_path, "w", encoding="utf-8") as f:
                json.dump(self._map, f, indent=2)
        except Exception as exc:
            logger.debug("Failed saving BSE code map: %s", exc)

    def fetch_master_instruments(self) -> Dict[str, str]:
        """Download Zerodha instrument master and build mapping."""
        url = "https://api.kite.trade/instruments"
        try:
            resp = requests.get(url, timeout=12)
            if resp.status_code != 200:
                logger.warning("Failed fetching Zerodha instruments: HTTP %d", resp.status_code)
                return {}

            reader = csv.DictReader(io.StringIO(resp.text))
            bse_sym_to_code: Dict[str, str] = {}
            bse_name_to_code = []

            for row in reader:
                if row.get("exchange") == "BSE" and row.get("instrument_type") == "EQ":
                    sym = row.get("tradingsymbol", "").strip().upper()
                    code = row.get("exchange_token", "").strip()
                    name = row.get("name", "").strip().upper()
                    if sym and code:
                        bse_sym_to_code[sym] = code
                    if name and code:
                        bse_name_to_code.append((name, code, sym))

            return bse_sym_to_code, bse_name_to_code
        except Exception as exc:
            logger.warning("Error loading Zerodha instruments: %s", exc)
            return {}, []

    def map_universe(self, stocks: list[dict]) -> Dict[str, str]:
        """Map all stocks in the universe to their 6-digit BSE code."""
        if len(self._map) >= len(stocks) and all(s["symbol"] in self._map for s in stocks):
            return self._map

        logger.info("Fetching Zerodha instrument master to map BSE scrip codes...")
        sym_map, name_list = self.fetch_master_instruments()
        if not sym_map:
            return self._map

        for s in stocks:
            sym = s["symbol"].strip().upper()
            if sym in EXPLICIT_BSE_CODES:
                self._map[sym] = EXPLICIT_BSE_CODES[sym]
                continue

            # 1. Exact symbol match
            code = sym_map.get(sym) or sym_map.get(sym.replace("&", ""))
            if code:
                self._map[sym] = code
                continue

            # 2. Fuzzy name match
            name = (s.get("name") or "").strip().upper()
            if name and name_list:
                best_ratio = 0.0
                best_code = None
                for b_name, b_code, b_sym in name_list:
                    ratio = SequenceMatcher(None, name, b_name).ratio()
                    if ratio > best_ratio:
                        best_ratio = ratio
                        best_code = b_code
                if best_ratio >= 0.78 and best_code:
                    self._map[sym] = best_code
                    continue

            # Check if existing stock had a bse_code
            if s.get("bse_code"):
                self._map[sym] = str(s["bse_code"])

        self._save_cache()
        logger.info("Mapped %d/%d stocks to BSE scrip codes.", len([s for s in stocks if s["symbol"] in self._map]), len(stocks))
        return self._map

    def get_code(self, symbol: str) -> Optional[str]:
        return self._map.get(symbol.strip().upper()) or EXPLICIT_BSE_CODES.get(symbol.strip().upper())
