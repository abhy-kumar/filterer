"""
Super-investor portfolios, built from filed shareholding patterns.

What this replaces: portfolios typed in by hand, every holding stamped
"Q3 FY25" (seven quarters stale by the time they were read), with 26 of 61
holdings pointing at companies outside the universe and therefore valued at
zero. Here every holding, percentage, share count and quarter-on-quarter change
comes from an exchange filing, via data/filings/shareholding.json.

data/super_investors/registry.json says who an investor is and which names they
file under. It never says what they hold. An investor whose names match nothing
in the filings is left out, so adding a name to the registry cannot invent a
holding.

Two limits, both stated on the page:
  * Filings name holders of 1% or more. A smaller stake is invisible.
  * Only the names in the registry are matched, so a stake held through an
    entity the registry does not list is missed. A portfolio is a floor.

Individuals not in the registry are discovered too: a person named in the
public part of at least two filings, with stakes worth ₹250 crore together.
Corporate holders are not discovered. The first run surfaced Jaya Hind
Industries, Indian Oil and two JSW-group companies, which are group
cross-holdings, not investors.

    python -m data_pipeline.super_investors
"""

from __future__ import annotations

import csv
import html
import io
import json
import logging
import re
import zipfile
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

from data_pipeline.nse_filings import (
    GENERATED_INVESTORS,
    REGISTRY_FILE,
    SHAREHOLDING_FILE,
    STOCKS_TS,
    client,
    load_json,
    write_json,
)

logger = logging.getLogger(__name__)

EQUITY_LIST_URL = "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv"
BHAVCOPY_URL = "https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_{d}_F_0000.csv.zip"

DISCOVER_MIN_COMPANIES = 2
DISCOVER_MIN_VALUE_CR = 250.0
DISCOVER_MAX = 40

# Holders that are pools of other people's money or arms of the state, not
# investors in the sense this page means.
INSTITUTION_WORDS = re.compile(
    r"\b(FUNDS?|MUTUAL|INSURANCE|ASSURANCE|BANK|BANKING|TRUST|TRUSTEES?|PENSION|PROVIDENT|ETF|NPS|SCHEME|"
    r"GOVERNMENT|PRESIDENT OF INDIA|INVESTOR EDUCATION|EMPLOYEES?|ESOP|WELFARE|CORPORATION OF INDIA|CUSTODIAN)\b"
)

KEEP_UPPER = {"LLP", "HUF", "LTD", "PVT", "AIF", "SPC", "LLC", "II", "III", "IV"}


def normalize_name(name: str) -> str:
    s = html.unescape(name or "").upper()
    s = s.replace("&", " AND ")
    s = re.sub(r"[.,'’`\"]", " ", s)
    s = re.sub(r"\bPVT\b", "PRIVATE", s)
    s = re.sub(r"\bLTD\b", "LIMITED", s)
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"^(MR|MRS|MS|MISS|SHRI|SMT|DR|PROF) ", "", s)
    return s


def display_name(name: str) -> str:
    words = re.sub(r"\s+", " ", html.unescape(name)).strip().split(" ")
    return " ".join(w if w.upper() in KEEP_UPPER else w.capitalize() for w in words)


def initials(name: str) -> str:
    words = [w for w in re.split(r"\s+", name) if w and w.upper() not in ("THE", "OF", "AND")]
    return "".join(w[0] for w in words[:2]).upper()


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def compile_registry(registry: dict) -> list[tuple[dict, list[re.Pattern]]]:
    return [(inv, [re.compile(p) for p in inv.get("patterns", [])]) for inv in registry.get("investors", [])]


def _match(normalized: str, compiled: list[tuple[dict, list[re.Pattern]]]) -> Optional[dict]:
    for investor, patterns in compiled:
        if any(p.search(normalized) for p in patterns):
            return investor
    return None


def match_investor(normalized: str, compiled: list[tuple[dict, list[re.Pattern]]]) -> Optional[str]:
    investor = _match(normalized, compiled)
    return investor["id"] if investor else None


# ── Prices for companies outside the universe ─────────────────


def load_universe() -> dict[str, dict]:
    text = STOCKS_TS.read_text(encoding="utf-8")
    data = json.loads(text[text.index("= [") + 2 : text.rindex("]") + 1])
    return {
        s["symbol"]: {
            "name": s.get("name"),
            "sector": s.get("sector") or "Unclassified",
            "price": s.get("current_price"),
            "market_cap": s.get("market_cap"),
        }
        for s in data
    }


def fetch_equity_list() -> dict[str, str]:
    try:
        text = client().get(EQUITY_LIST_URL, allow_cache=False).decode("utf-8", errors="replace")
    except Exception as exc:
        logger.warning("NSE equity list unavailable: %s", exc)
        return {}
    return {
        row["SYMBOL"].strip(): row["NAME OF COMPANY"].strip()
        for row in csv.DictReader(io.StringIO(text))
        if row.get("SYMBOL")
    }


def fetch_closing_prices(today: Optional[date] = None) -> tuple[dict[str, float], Optional[str]]:
    """Every listed equity's close from NSE's bhavcopy, one file for the market."""
    today = today or date.today()
    for back in range(0, 8):
        d = today - timedelta(days=back)
        if d.weekday() >= 5:
            continue
        try:
            body = client().get(BHAVCOPY_URL.format(d=d.strftime("%Y%m%d")), allow_cache=False, timeout=60)
        except Exception:
            continue
        with zipfile.ZipFile(io.BytesIO(body)) as z:
            rows = csv.DictReader(io.TextIOWrapper(z.open(z.namelist()[0]), encoding="utf-8"))
            prices = {}
            for row in rows:
                if row.get("SctySrs") in ("EQ", "BE", "BZ", "SM", "ST"):
                    try:
                        prices[row["TckrSymb"]] = float(row["ClsPric"])
                    except (KeyError, ValueError):
                        continue
        if prices:
            return prices, d.isoformat()
    logger.warning("No bhavcopy found in the last week; holdings outside the universe will not be valued")
    return {}, None


# ── Building ───────────────────────────────────────────────────


def _aggregate(shareholding: dict, compiled: list[tuple[dict, list[re.Pattern]]]) -> dict:
    """investor id -> slot ("latest"/"previous") -> symbol -> summed holding."""
    out: dict[str, dict[str, dict[str, dict]]] = defaultdict(lambda: {"latest": {}, "previous": {}})
    for symbol, record in shareholding.items():
        for slot, filing in zip(("latest", "previous"), (record.get("filings") or [])[:2]):
            for holder in filing.get("holders", []):
                investor = _match(normalize_name(holder["name"]), compiled)
                if not investor:
                    continue
                # A discovered investor is known only as a public shareholder.
                # Under the same name in a promoter table it is not the same
                # evidence, and counting it made a Bajaj group company look
                # like an investor holding 57% of Force Motors.
                if investor.get("public_only") and holder.get("role") != "public":
                    continue
                agg = out[investor["id"]][slot].setdefault(
                    symbol, {"pct": 0.0, "shares": 0, "names": [], "roles": set(), "period": filing.get("period")}
                )
                # One person often files under several rows in one company:
                # Rekha Jhunjhunwala holds Titan in two capacities, and the
                # Damanis' DMart stake is split across five beneficiary trusts.
                agg["pct"] += holder["pct"]
                agg["shares"] += holder.get("shares") or 0
                agg["names"].append(holder["name"])
                agg["roles"].add(holder.get("role"))
    return out


def discover(shareholding: dict, compiled, universe: dict, prices: dict) -> list[dict]:
    """Public, non-institutional holders of 1%+ in several companies, not already in the registry."""
    candidates: dict[str, dict] = defaultdict(lambda: {"names": Counter(), "kind": Counter(), "symbols": {}})
    for symbol, record in shareholding.items():
        filings = record.get("filings") or []
        if not filings:
            continue
        for holder in filings[0].get("holders", []):
            if holder.get("role") != "public" or holder.get("kind") != "individual":
                continue
            norm = normalize_name(holder["name"])
            if INSTITUTION_WORDS.search(norm) or match_investor(norm, compiled):
                continue
            c = candidates[norm]
            c["names"][holder["name"]] += 1
            c["kind"][holder["kind"]] += 1
            value = _value_cr(symbol, holder["pct"], holder.get("shares"), universe, prices)
            prior = c["symbols"].get(symbol, 0.0)
            c["symbols"][symbol] = prior + (value or 0.0)

    chosen = []
    for norm, c in candidates.items():
        total = sum(c["symbols"].values())
        if len(c["symbols"]) >= DISCOVER_MIN_COMPANIES and total >= DISCOVER_MIN_VALUE_CR:
            chosen.append((total, norm, c))
    chosen.sort(key=lambda t: -t[0])

    entries = []
    for total, norm, c in chosen[:DISCOVER_MAX]:
        name = display_name(c["names"].most_common(1)[0][0])
        entries.append(
            {
                "id": "discovered-" + slug(name),
                "name": name,
                "type": "Individual HNI",
                "description": (
                    f"Found in exchange filings: named as a public shareholder with 1% or more of "
                    f"{len(c['symbols'])} tracked companies. Not in the curated registry, so nothing is known "
                    "beyond what the filings show."
                ),
                "patterns": ["^" + re.escape(norm) + "$"],
                "origin": "discovered",
                "public_only": True,
            }
        )
    return entries


def _value_cr(symbol: str, pct: float, shares: Optional[int], universe: dict, prices: dict) -> Optional[float]:
    company = universe.get(symbol) or {}
    price = company.get("price") or prices.get(symbol)
    if shares and price:
        return round(shares * price / 1e7, 2)
    if company.get("market_cap"):
        return round(company["market_cap"] * pct / 100, 2)
    return None


def build(
    shareholding: dict,
    registry: dict,
    universe: dict,
    names: Optional[dict[str, str]] = None,
    prices: Optional[dict[str, float]] = None,
    price_date: Optional[str] = None,
    with_discovery: bool = True,
) -> dict:
    names = names or {}
    prices = prices or {}
    curated = [dict(inv, origin="curated") for inv in registry.get("investors", [])]
    compiled = compile_registry({"investors": curated})
    discovered = discover(shareholding, compiled, universe, prices) if with_discovery else []
    all_investors = curated + discovered
    compiled = compile_registry({"investors": all_investors})
    aggregated = _aggregate(shareholding, compiled)

    companies: dict[str, dict] = {}
    investors_out = []
    periods = Counter()

    for investor in all_investors:
        slots = aggregated.get(investor["id"])
        if not slots or not slots["latest"]:
            continue

        holdings = []
        for symbol, now in slots["latest"].items():
            prev = slots["previous"].get(symbol)
            has_previous_filing = len(shareholding.get(symbol, {}).get("filings") or []) > 1
            pct = round(now["pct"], 2)
            if prev is None:
                delta = {"change": "new" if has_previous_filing else "unchanged"}
            else:
                diff = round(pct - prev["pct"], 2)
                change = "increased" if diff >= 0.01 else "decreased" if diff <= -0.01 else "unchanged"
                delta = {"change": change, "delta_pct": diff, "previous_quarter_holding": round(prev["pct"], 2)}

            company = universe.get(symbol)
            price = (company or {}).get("price") or prices.get(symbol)
            companies[symbol] = {
                "name": (company or {}).get("name") or names.get(symbol) or symbol,
                "sector": (company or {}).get("sector") or "Unclassified",
                "in_universe": company is not None,
                "price": price,
                "price_date": None if company else price_date,
            }
            periods[now["period"]] += 1
            holdings.append(
                {
                    "symbol": symbol,
                    "companyName": companies[symbol]["name"],
                    "sector": companies[symbol]["sector"],
                    "holding_pct": pct,
                    "shares_count": now["shares"] or None,
                    "holding_value_cr": _value_cr(symbol, pct, now["shares"], universe, prices),
                    "quarter": now["period"],
                    "role": "promoter" if "promoter" in now["roles"] else "public",
                    "in_universe": company is not None,
                    "filed_names": sorted(set(now["names"])),
                    "delta": delta,
                }
            )

        exits = []
        for symbol, prev in slots["previous"].items():
            if symbol in slots["latest"]:
                continue
            exits.append(
                {
                    "symbol": symbol,
                    "companyName": (universe.get(symbol) or {}).get("name") or names.get(symbol) or symbol,
                    "previous_quarter_holding": round(prev["pct"], 2),
                    "quarter": prev["period"],
                }
            )

        holdings.sort(key=lambda h: -(h["holding_value_cr"] or 0))
        value = round(sum(h["holding_value_cr"] or 0 for h in holdings), 2)
        sector_value = Counter()
        for h in holdings:
            sector_value[h["sector"]] += h["holding_value_cr"] or 0
        sectors = [s for s, _ in sector_value.most_common() if s != "Unclassified"][:3] or ["Unclassified"]

        investors_out.append(
            {
                "id": investor["id"],
                "name": investor["name"],
                "alias": investor.get("alias"),
                "type": investor["type"],
                "description": investor["description"],
                "avatar_initials": initials(investor["name"]),
                "top_sectors": sectors,
                "origin": investor["origin"],
                "value_cr": value,
                "holdings": holdings,
                "exits": sorted(exits, key=lambda e: -e["previous_quarter_holding"]),
            }
        )

    investors_out.sort(key=lambda i: (i["origin"] != "curated", -i["value_cr"]))
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "NSE shareholding pattern filings (XBRL)",
        "latest_period": periods.most_common(1)[0][0] if periods else None,
        "price_date": price_date,
        "investors": investors_out,
        "companies": dict(sorted(companies.items())),
    }


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    shareholding = load_json(SHAREHOLDING_FILE)
    if not shareholding:
        logger.error("No filed shareholding. Run: python -m data_pipeline.nse_filings shareholding")
        return 1
    registry = load_json(REGISTRY_FILE)
    universe = load_universe()

    outside = [s for s in shareholding if s not in universe]
    names, prices, price_date = {}, {}, None
    if outside:
        names = fetch_equity_list()
        prices, price_date = fetch_closing_prices()

    result = build(shareholding, registry, universe, names, prices, price_date)
    write_json(GENERATED_INVESTORS, result)

    curated = sum(1 for i in result["investors"] if i["origin"] == "curated")
    found = len(result["investors"]) - curated
    holdings = sum(len(i["holdings"]) for i in result["investors"])
    missing = [i["name"] for i in registry.get("investors", []) if i["id"] not in {x["id"] for x in result["investors"]}]
    logger.info(
        "%d curated investors matched, %d discovered, %d holdings, latest %s",
        curated, found, holdings, result["latest_period"],
    )
    if missing:
        logger.info("Registry names with no filing match: %s", ", ".join(missing))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
