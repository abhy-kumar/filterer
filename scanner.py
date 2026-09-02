import sys
import argparse
import os
import pandas as pd
from tabulate import tabulate
from data_pipeline.screener_engine import run_query
import db_split_join

# Fix Windows console UTF-8 encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PRESETS = {
    "debt-free": "Debt to equity < 0.1 AND Return on capital employed > 20 AND Profit growth 5Years > 15 AND Market Capitalization > 500",
    "magic-formula": "Price to Earning < 25 AND Return on capital employed > 22 AND Return on equity > 18 AND Market Capitalization > 1000",
    "growth": "Sales growth 5Years > 15 AND Profit growth 5Years > 15 AND Sales growth 3Years > 15 AND Profit growth 3Years > 15",
    "bargains": "Current price < Graham Number AND Debt to equity < 0.5 AND Return on equity > 12 AND Market Capitalization > 300",
    "golden-crossover": "DMA 50 > DMA 200 AND Current price > DMA 50 AND RSI > 50 AND RSI < 70",
    "fii-buying": "Change in FII Holding > 0.5 AND Return on capital employed > 15 AND Market Capitalization > 1000",
    "piotroski": "Piotroski score >= 7 AND Altman Z-Score > 2.9 AND Return on equity > 14",
    "fcf-kings": "Free cash flow yield > 4 AND Operating cash flow 3years > 200 AND Debt to equity < 0.8",
    "dividends": "Dividend yield > 2.5 AND Debt to equity < 0.8 AND Return on capital employed > 15 AND Market Capitalization > 1000"
}

def ensure_db():
    if not os.path.exists("data/screener.db"):
        print("Database not found locally. Joining parts from data/screener.db.part_*...")
        db_split_join.join_db()

def main():
    parser = argparse.ArgumentParser(description="Filterer - Screener.in Free Alternative CLI Scanner")
    parser.add_argument("query", nargs="?", help="Screener query string (e.g. 'ROCE > 20 AND Debt to equity < 0.1')")
    parser.add_argument("--preset", choices=list(PRESETS.keys()), help="Run a predefined popular screen")
    parser.add_argument("--export", help="Path to export results as CSV")
    parser.add_argument("--limit", type=int, default=50, help="Maximum number of rows to display")

    args = parser.parse_args()

    query_str = args.query
    if args.preset:
        query_str = PRESETS[args.preset]
        print(f"\n[Running Preset Screen: '{args.preset}']")
        print(f"Query: {query_str}\n")
    elif not query_str:
        query_str = "Return on capital employed > 20 AND Debt to equity < 0.5"
        print(f"\n[No query specified, running default: '{query_str}']\n")

    ensure_db()

    try:
        df = run_query(query_str)
        if df.empty:
            print("No stocks matched the criteria.")
            return

        print(f"Found {len(df)} matching stocks:")
        display_df = df.head(args.limit)
        print(tabulate(display_df, headers="keys", tablefmt="psql", showindex=False))

        if args.export:
            df.to_csv(args.export, index=False)
            print(f"\nSaved {len(df)} results to {args.export}")

    except Exception as e:
        print(f"Error executing query: {e}")

if __name__ == "__main__":
    main()
