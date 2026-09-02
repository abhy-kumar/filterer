"""
Market Indices Fetcher for Filterer.

Fetches real index data (Nifty 50, Sensex, Bank Nifty, etc.) using yfinance
and outputs a cached JSON file for the serverless API endpoint.
"""

import json
import logging
import time
from datetime import datetime
from typing import Any

import yfinance as yf

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Indian market indices with their yfinance symbols
INDICES = [
    {"yf_symbol": "^NSEI", "id": "NIFTY50", "name": "NIFTY 50", "exchange": "NSE"},
    {"yf_symbol": "^BSESN", "id": "SENSEX", "name": "SENSEX", "exchange": "BSE"},
    {"yf_symbol": "^NSEBANK", "id": "BANKNIFTY", "name": "NIFTY BANK", "exchange": "NSE"},
    {"yf_symbol": "^CNXIT", "id": "NIFTYIT", "name": "NIFTY IT", "exchange": "NSE"},
    {"yf_symbol": "^CNXPHARMA", "id": "NIFTYPHARMA", "name": "NIFTY PHARMA", "exchange": "NSE"},
    {"yf_symbol": "^CNXAUTO", "id": "NIFTYAUTO", "name": "NIFTY AUTO", "exchange": "NSE"},
]


def _safe_float(val: Any, default: float = 0.0) -> float:
    """Safely convert to float."""
    if val is None:
        return default
    try:
        f = float(val)
        return default if (f != f) else f  # NaN check
    except (ValueError, TypeError):
        return default


def fetch_indices() -> list[dict[str, Any]]:
    """
    Fetch latest index data from Yahoo Finance.
    Returns list of index objects with price, change, 52-week data.
    """
    results = []
    
    for idx in INDICES:
        try:
            logger.info(f"Fetching index: {idx['name']} ({idx['yf_symbol']})")
            ticker = yf.Ticker(idx["yf_symbol"])
            info = ticker.info or {}
            
            price = _safe_float(
                info.get("regularMarketPrice")
                or info.get("currentPrice")
                or info.get("previousClose")
            )
            prev_close = _safe_float(info.get("regularMarketPreviousClose") or info.get("previousClose"))
            change = round(price - prev_close, 2) if price and prev_close else 0.0
            change_pct = round((change / prev_close) * 100, 2) if prev_close else 0.0

            results.append({
                "id": idx["id"],
                "symbol": idx["yf_symbol"],
                "name": idx["name"],
                "exchange": idx["exchange"],
                "price": round(price, 2),
                "change": change,
                "changePct": change_pct,
                "previousClose": round(prev_close, 2),
                "dayHigh": round(_safe_float(info.get("dayHigh", price)), 2),
                "dayLow": round(_safe_float(info.get("dayLow", price)), 2),
                "high52w": round(_safe_float(info.get("fiftyTwoWeekHigh", 0)), 2),
                "low52w": round(_safe_float(info.get("fiftyTwoWeekLow", 0)), 2),
            })
            
            logger.info(f"  {idx['name']}: {price:,.2f} ({change:+.2f}, {change_pct:+.2f}%)")
            time.sleep(0.5)  # Rate limiting
            
        except Exception as e:
            logger.error(f"  Failed to fetch {idx['name']}: {e}")
            results.append({
                "id": idx["id"],
                "symbol": idx["yf_symbol"],
                "name": idx["name"],
                "exchange": idx["exchange"],
                "price": 0,
                "change": 0,
                "changePct": 0,
                "previousClose": 0,
                "dayHigh": 0,
                "dayLow": 0,
                "high52w": 0,
                "low52w": 0,
            })
    
    return results


def save_indices_cache(output_path: str = "data/market_indices.json") -> None:
    """Fetch indices and save to JSON cache file."""
    indices = fetch_indices()
    
    cache = {
        "indices": indices,
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "source": "Yahoo Finance (yfinance)",
    }
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)
    
    logger.info(f"Saved {len(indices)} indices to {output_path}")


if __name__ == "__main__":
    save_indices_cache()
