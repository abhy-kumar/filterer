"""
Fast price-only refresh of the screening tier.

A full ingest rewrites ~18 MB of statements. Running that three times a day
would add roughly 1.6 GB to the repository every month, for data that only
changes once a quarter.

Almost everything that moves intraday is derived from the price series, and
that series can be downloaded for the whole universe in about a dozen batched
requests. This updates only those fields, in the small bundled tier
(src/data/stocksData.ts, ~0.2 MB), and leaves the detail tier alone.

    python -m data_pipeline.refresh_quotes
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import re
import sys
from pathlib import Path
from typing import Any, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "src" / "data" / "stocksData.ts"

INR_CRORE = 1e7


def _round(value: Any, places: int = 2) -> Optional[float]:
    if value is None:
        return None
    try:
        num = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(num):
        return None
    return round(num, places)


def load_dataset() -> tuple[str, list[dict]]:
    source = DATA_FILE.read_text(encoding="utf-8")
    marker = "export const STOCKS_DATA: Stock[] = "
    head, _, tail = source.partition(marker)
    if not tail:
        raise SystemExit(f"Could not find STOCKS_DATA in {DATA_FILE}")
    return head + marker, json.loads(tail.rstrip().rstrip(";"))


def write_dataset(header: str, stocks: list[dict]) -> None:
    DATA_FILE.write_text(header + json.dumps(stocks, indent=2) + ";\n", encoding="utf-8")


def rsi(closes: list[float], period: int = 14) -> Optional[float]:
    """Wilder's RSI over the trailing window."""
    if len(closes) <= period:
        return None
    gains = losses = 0.0
    for i in range(1, period + 1):
        change = closes[i] - closes[i - 1]
        gains += max(change, 0.0)
        losses += max(-change, 0.0)
    avg_gain, avg_loss = gains / period, losses / period

    for i in range(period + 1, len(closes)):
        change = closes[i] - closes[i - 1]
        avg_gain = (avg_gain * (period - 1) + max(change, 0.0)) / period
        avg_loss = (avg_loss * (period - 1) + max(-change, 0.0)) / period

    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def refresh(chunk_size: int = 40, period: str = "1y") -> int:
    import pandas as pd
    import yfinance as yf

    from data_pipeline.data_fetcher import YAHOO_TICKER_ALIASES

    header, stocks = load_dataset()
    symbols = [s["symbol"] for s in stocks]
    by_symbol = {s["symbol"]: s for s in stocks}
    logger.info("Refreshing quotes for %d companies", len(symbols))

    updated = 0
    for start in range(0, len(symbols), chunk_size):
        chunk = symbols[start : start + chunk_size]
        # Honour the alias table: some NSE symbols do not map to <SYMBOL>.NS
        # on Yahoo, and TATAMOTORS in particular is delisted post-demerger.
        tickers = [YAHOO_TICKER_ALIASES.get(s, f"{s}.NS") for s in chunk]
        logger.info("  batch %d-%d", start + 1, min(start + chunk_size, len(symbols)))
        try:
            data = yf.download(
                tickers, period=period, interval="1d", group_by="ticker",
                auto_adjust=False, progress=False, threads=True,
            )
        except Exception as exc:
            logger.warning("  batch failed: %s", exc)
            continue

        for symbol, ticker in zip(chunk, tickers):
            try:
                frame = data[ticker] if isinstance(data.columns, pd.MultiIndex) else data
                closes = [float(v) for v in frame["Close"].dropna().tolist()]
                if len(closes) < 2:
                    continue
            except Exception:
                continue

            stock = by_symbol[symbol]
            last, previous = closes[-1], closes[-2]

            # Market cap moves with price. Shares outstanding are implied by
            # the figure already stored, so rescale rather than re-fetch.
            old_price = stock.get("current_price") or 0
            if old_price > 0 and stock.get("market_cap"):
                shares = (stock["market_cap"] * INR_CRORE) / old_price
                stock["market_cap"] = _round((last * shares) / INR_CRORE, 0)

            stock["current_price"] = _round(last)
            stock["change"] = _round(last - previous)
            stock["change_pct"] = _round(((last - previous) / previous) * 100) if previous else 0.0

            window = closes[-252:]
            high52, low52 = max(window), min(window)
            stock["high_52w"] = _round(high52)
            stock["low_52w"] = _round(low52)
            stock["distance_52w_high"] = _round(((last - high52) / high52) * 100) if high52 else None
            stock["distance_52w_low"] = _round(((last - low52) / low52) * 100) if low52 else None

            if len(closes) >= 50:
                stock["dma_50"] = _round(sum(closes[-50:]) / 50)
            if len(closes) >= 200:
                stock["dma_200"] = _round(sum(closes[-200:]) / 200)
            stock["rsi_14"] = _round(rsi(closes))

            try:
                volume = frame["Volume"].dropna()
                if len(volume):
                    stock["volume"] = int(volume.iloc[-1])
                    stock["avg_volume_30d"] = int(volume.tail(30).mean())
            except Exception:
                pass

            # Valuation multiples follow the price.
            if stock.get("eps") and stock["eps"] > 0:
                stock["pe_ratio"] = _round(last / stock["eps"])
            if stock.get("book_value") and stock["book_value"] > 0:
                stock["pb_ratio"] = _round(last / stock["book_value"])

            updated += 1

    if not updated:
        logger.error("No companies updated; leaving the dataset untouched.")
        return 1

    write_dataset(header, stocks)
    logger.info("Updated %d of %d companies. Now run: npm run data:rebuild", updated, len(symbols))
    return 0


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chunk-size", type=int, default=40)
    parser.add_argument("--period", default="1y", help="History window needed for the 200-day average")
    args = parser.parse_args(argv)
    return refresh(chunk_size=args.chunk_size, period=args.period)


if __name__ == "__main__":
    raise SystemExit(main())
