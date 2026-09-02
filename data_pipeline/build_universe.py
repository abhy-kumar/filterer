"""
Generator script to build the canonical Nifty 500 stock universe from official NSE India data.
"""
import urllib.request
import csv
import io
import os

url = 'https://archives.nseindia.com/content/indices/ind_nifty500list.csv'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, timeout=15) as resp:
    content = resp.read().decode('utf-8')

reader = csv.DictReader(io.StringIO(content))
rows = list(reader)

by_industry = {}
for r in rows:
    sym = r['Symbol'].strip()
    name = r['Company Name'].strip()
    ind = r.get('Industry', 'Diversified').strip() or 'Diversified'
    by_industry.setdefault(ind, []).append((sym, name))

header = '''"""
Filterer Stock Universe (Nifty 500).

Canonical listing of the 500 constituents of the Nifty 500 index on the
National Stock Exchange of India (NSE). Sourced directly from official NSE
index records, structured by sector and industry for quantitative screening.

All entries map to valid NSE tickers. For Yahoo Finance integration, the
symbol is automatically appended with ".NS" (or resolved via TICKER_ALIASES).
"""

from typing import Dict, List, Tuple

# Official NSE Nifty 500 Master Universe (500 Constituents)
# Format: (NSE_SYMBOL, COMPANY_NAME)
STOCK_UNIVERSE: List[Tuple[str, str]] = [
'''

body = ""
count = 0
for ind in sorted(by_industry.keys()):
    items = sorted(by_industry[ind], key=lambda x: x[0])
    body += f"    # ──────────────────── {ind.upper()} ({len(items)}) ────────────────────\n"
    for sym, name in items:
        clean_name = name.replace('"', '\\"')
        body += f'    ("{sym}", "{clean_name}"),\n'
        count += 1

footer = f''']

assert len(STOCK_UNIVERSE) == {count}, f"Expected {count} stocks, found {{len(STOCK_UNIVERSE)}}"

_SYMBOL_MAP: Dict[str, str] = {{sym.upper(): name for sym, name in STOCK_UNIVERSE}}


def get_universe() -> List[Tuple[str, str]]:
    """Return the full tuple list of (symbol, company_name) for all 500 constituents."""
    return list(STOCK_UNIVERSE)


def get_symbols() -> List[str]:
    """Return list of all 500 uppercase NSE ticker symbols."""
    return [sym for sym, _ in STOCK_UNIVERSE]


def get_symbol_name_map() -> Dict[str, str]:
    """Return dictionary mapping uppercase NSE ticker to official registered company name."""
    return dict(_SYMBOL_MAP)


def get_company_name(symbol: str) -> str:
    """Resolve official company name from symbol, with fallback to uppercase symbol."""
    clean = symbol.upper().replace(".NS", "").replace(".BO", "")
    return _SYMBOL_MAP.get(clean, clean)


if __name__ == "__main__":
    print(f"[Stock Universe] Loaded {{len(STOCK_UNIVERSE)}} official Nifty 500 constituents across {len(by_industry)} industries.")
    print(f"  First: {{STOCK_UNIVERSE[0]}}")
    print(f"  Last:  {{STOCK_UNIVERSE[-1]}}")
'''

output_path = os.path.join(os.path.dirname(__file__), "stock_universe.py")
with open(output_path, "w", encoding="utf-8") as f:
    f.write(header + body + footer)

print(f"Successfully wrote {output_path} with {count} stocks across {len(by_industry)} industries.")
