import time
import json
import logging
from typing import Dict, Any, Optional
import yfinance as yf
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class StockDataFetcher:
    """
    Fetches real-time and fundamental financial data for Indian equities (.NS / .BO) via Yahoo Finance and public endpoints.
    """
    def __init__(self):
        pass

    def fetch_stock_details(self, symbol: str) -> Optional[Dict[str, Any]]:
        clean_sym = symbol.upper().replace(".NS", "").replace(".BO", "")
        yf_sym = f"{clean_sym}.NS"
        try:
            logging.info(f"Fetching data for {yf_sym}...")
            ticker = yf.Ticker(yf_sym)
            info = ticker.info

            if not info or "regularMarketPrice" not in info and "currentPrice" not in info:
                logging.warning(f"Could not retrieve quote for {yf_sym}")
                return None

            cmp = info.get("currentPrice") or info.get("regularMarketPrice", 0)
            mcap_cr = round((info.get("marketCap", 0) or 0) / 10000000, 2)
            pe = round(info.get("trailingPE", 0) or 0, 2)
            pb = round(info.get("priceToBook", 0) or 0, 2)
            div_yield = round((info.get("dividendYield", 0) or 0) * 100, 2)
            high_52 = round(info.get("fiftyTwoWeekHigh", 0) or 0, 2)
            low_52 = round(info.get("fiftyTwoWeekLow", 0) or 0, 2)

            return {
                "symbol": clean_sym,
                "name": info.get("longName") or info.get("shortName") or clean_sym,
                "current_price": cmp,
                "market_cap": mcap_cr,
                "pe_ratio": pe,
                "pb_ratio": pb,
                "dividend_yield": div_yield,
                "high_52w": high_52,
                "low_52w": low_52,
                "sector": info.get("sector", "Diversified"),
                "industry": info.get("industry", "General"),
                "about": info.get("longBusinessSummary", "")
            }
        except Exception as e:
            logging.error(f"Error fetching {symbol}: {e}")
            return None

    def fetch_price_history(self, symbol: str, period: str = "1y") -> pd.DataFrame:
        clean_sym = symbol.upper().replace(".NS", "").replace(".BO", "")
        yf_sym = f"{clean_sym}.NS"
        try:
            ticker = yf.Ticker(yf_sym)
            hist = ticker.history(period=period)
            return hist
        except Exception as e:
            logging.error(f"Error fetching history for {symbol}: {e}")
            return pd.DataFrame()
