"""
Filed quarterly results and shareholding, read from NSE's own XBRL.

Why this exists. The weekly ingest took quarterly results from Yahoo, whose
`quarterly_financials` exposes about five quarters and silently drops some:
the Sep 2025 quarter was missing for 325 of the 500 companies, and 490 carried
five quarters at most. NSE publishes every results filing and every
shareholding pattern as XBRL, free and without a login, and a filed XBRL file
never changes, so each one is downloaded once and cached.

Results live in two listings, because SEBI moved companies to integrated
filings from the Dec 2024 quarter:

    integrated-filing-results      Dec 2024 onward
    corporates-financial-results   everything up to Dec 2024

Shareholding patterns come from corporate-share-holdings-master. Each filing
names every holder of 1% or more and carries the category totals, which is
where the foreign / domestic institutional split comes from; NSE's summary
endpoint only ever gave promoter and public.

    python -m data_pipeline.nse_filings quarters     [--symbols A B] [--limit N]
    python -m data_pipeline.nse_filings shareholding [--symbols A B] [--limit N]

Output lands in data/filings/, which scripts/repair_dataset.mjs merges into the
app's data on every rebuild.
"""

from __future__ import annotations

import argparse
import html
import json
import logging
import os
import re
import time
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Optional
from urllib.parse import quote

from data_pipeline import http_client as _http
from data_pipeline.http_client import HttpClient

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "data" / "filings"
QUARTERS_FILE = OUT_DIR / "quarterly_results.json"
SHAREHOLDING_FILE = OUT_DIR / "shareholding.json"
REGISTRY_FILE = ROOT / "data" / "super_investors" / "registry.json"
GENERATED_INVESTORS = ROOT / "src" / "data" / "superInvestors.generated.json"
STOCKS_TS = ROOT / "src" / "data" / "stocksData.ts"

NSE = "https://www.nseindia.com"
RESULTS_INTEGRATED = NSE + "/api/integrated-filing-results?index=equities&symbol={symbol}"
RESULTS_LEGACY = NSE + "/api/corporates-financial-results?index=equities&symbol={symbol}&period=Quarterly"
SHP_MASTER = NSE + "/api/corporate-share-holdings-master?index=equities&symbol={symbol}"
REFERER = NSE + "/get-quotes/equity?symbol={symbol}"

# nsearchives is a static file host; the API host is the one to be gentle with.
_http.HOST_RATE_LIMITS.setdefault("nsearchives.nseindia.com", 4.0)
_http.HOST_RATE_LIMITS.setdefault("www.nseindia.com", 2.0)

CRORE = 1e7
DEFAULT_QUARTERS = 12

_client: Optional[HttpClient] = None


def client() -> HttpClient:
    """A filed XBRL file is immutable, so it can be cached for a year."""
    global _client
    if _client is None:
        _client = HttpClient(cache_ttl_seconds=365 * 24 * 3600)
    return _client


def _listing(url: str, symbol: str) -> Any:
    # Listings change as companies file, so they are never served from cache.
    # M&M and J&KBANK would split the query string without quoting.
    quoted = quote(symbol.upper(), safe="")
    return client().get_json(
        url.format(symbol=quoted),
        headers={"Referer": REFERER.format(symbol=quoted)},
        allow_cache=False,
    )


# ── Dates ──────────────────────────────────────────────────────


def parse_date(raw: Any) -> Optional[date]:
    """'30-JUN-2026', '30-Jun-2026' or '2026-06-30'."""
    if not isinstance(raw, str) or not raw.strip():
        return None
    token = raw.strip().split(" ")[0]
    for fmt in ("%d-%b-%Y", "%Y-%m-%d", "%d-%B-%Y"):
        try:
            return datetime.strptime(token.title() if "%b" in fmt or "%B" in fmt else token, fmt).date()
        except ValueError:
            continue
    return None


def parse_timestamp(raw: Any) -> datetime:
    if isinstance(raw, str):
        for fmt in ("%d-%b-%Y %H:%M:%S", "%d-%b-%Y %H:%M", "%d-%b-%Y"):
            try:
                return datetime.strptime(raw.strip().title(), fmt)
            except ValueError:
                continue
    return datetime.min


def period_label(d: date) -> str:
    return f"{d.strftime('%b')} {d.year}"


def is_quarter_end(d: date) -> bool:
    return (d.month, d.day) in {(3, 31), (6, 30), (9, 30), (12, 31)}


# ── XBRL ───────────────────────────────────────────────────────

_CONTEXT_RE = re.compile(r'<xbrli:context\b[^>]*\bid="([^"]+)"[^>]*>(.*?)</xbrli:context>', re.S)
_FACT_RE = re.compile(r'<([a-z][a-z0-9-]*):([A-Za-z0-9]+)\b([^>]*?)>([^<]*)</\1:\2>', re.S)
_CONTEXT_REF_RE = re.compile(r'\bcontextRef="([^"]+)"')
_SKIP_PREFIXES = {"xbrli", "link", "xlink", "xbrldi", "iso4217"}


@dataclass(frozen=True)
class Context:
    start: Optional[date]
    end: Optional[date]
    dimensional: bool


def xbrl_contexts(text: str) -> dict[str, Context]:
    out: dict[str, Context] = {}
    for cid, body in _CONTEXT_RE.findall(text):
        start = re.search(r"<xbrli:startDate>\s*([^<\s]+)", body)
        end = re.search(r"<xbrli:endDate>\s*([^<\s]+)", body) or re.search(r"<xbrli:instant>\s*([^<\s]+)", body)
        out[cid] = Context(
            start=parse_date(start.group(1)) if start else None,
            end=parse_date(end.group(1)) if end else None,
            dimensional="<xbrli:scenario" in body or "<xbrli:segment" in body,
        )
    return out


def xbrl_facts(text: str) -> dict[str, dict[str, str]]:
    """tag -> {contextRef: raw value}. Namespace prefixes are dropped."""
    facts: dict[str, dict[str, str]] = {}
    for prefix, tag, attrs, value in _FACT_RE.findall(text):
        if prefix in _SKIP_PREFIXES:
            continue
        ref = _CONTEXT_REF_RE.search(attrs)
        if not ref:
            continue
        facts.setdefault(tag, {})[ref.group(1)] = html.unescape(value.strip())
    return facts


def _crore(value: Optional[float]) -> Optional[float]:
    return None if value is None else round(value / CRORE, 2)


def _round(value: Optional[float], places: int = 2) -> Optional[float]:
    return None if value is None else round(value, places)


def parse_results_xbrl(text: str, period_end: date) -> Optional[dict]:
    """
    One quarter's results, in the shape the app's quarterly table uses.

    Values in the filing are whole rupees; the app works in crore. The layout
    follows the convention a Screener.in reader expects:

        expenses          total expenses less finance costs and depreciation
        operating profit  sales less those expenses
        PBT               operating profit + other income - interest - depreciation

    Banks file a different schema (interest earned, interest expended,
    provisions), mapped onto the same rows: interest earned as revenue,
    operating expenses plus provisions as expenses, and no separate
    depreciation line.
    """
    contexts = xbrl_contexts(text)
    quarter = [
        cid
        for cid, c in contexts.items()
        if not c.dimensional and c.start and c.end == period_end and 80 <= (c.end - c.start).days <= 100
    ]
    if not quarter:
        return None
    facts = xbrl_facts(text)

    def val(*tags: str) -> Optional[float]:
        for tag in tags:
            by_context = facts.get(tag) or {}
            for cid in quarter:
                raw = by_context.get(cid)
                if raw in (None, ""):
                    continue
                try:
                    return float(raw)
                except ValueError:
                    continue
        return None

    is_bank = val("InterestEarned") is not None

    if is_bank:
        sales = val("InterestEarned")
        interest = val("InterestExpended")
        provisions = val("ProvisionsOtherThanTaxAndContingencies") or 0.0
        opex = val("OperatingExpenses")
        expenses = None if opex is None else opex + provisions
        operating_profit = None if None in (sales, interest, expenses) else sales - interest - expenses
        depreciation = None
        other_income = val("OtherIncome")
        pbt = val("ProfitLossFromOrdinaryActivitiesBeforeTax", "ProfitBeforeTax")
        net_profit = val(
            "ProfitLossAfterTaxesMinorityInterestAndShareOfProfitLossOfAssociates",
            "ProfitOrLossAttributableToOwnersOfParent",
            "ProfitLossForThePeriod",
            "ProfitLossForPeriod",
        )
        eps = val("BasicEarningsPerShareBeforeExtraordinaryItems", "BasicEarningsPerShareAfterExtraordinaryItems")
    else:
        sales = val("RevenueFromOperations")
        other_income = val("OtherIncome")
        total_expenses = val("Expenses")
        interest = val("FinanceCosts")
        depreciation = val("DepreciationDepletionAndAmortisationExpense", "DepreciationAndAmortisationExpense")
        expenses = (
            None
            if total_expenses is None
            else total_expenses - (interest or 0.0) - (depreciation or 0.0)
        )
        operating_profit = None if None in (sales, expenses) else sales - expenses
        pbt = val("ProfitBeforeTax", "ProfitLossBeforeTax")
        net_profit = val(
            "ProfitOrLossAttributableToOwnersOfParent",
            "ProfitLossAttributableToOwnersOfParent",
            "ProfitLossForPeriod",
            "ProfitLossForThePeriod",
        )
        eps = val(
            "BasicEarningsLossPerShareFromContinuingAndDiscontinuedOperations",
            "BasicEarningsLossPerShareFromContinuingOperations",
            "BasicEarningsPerShare",
        )

    if sales is None and net_profit is None:
        return None

    tax = val("TaxExpense", "CurrentTax")
    opm = operating_profit / sales * 100 if operating_profit is not None and sales else None
    tax_pct = tax / pbt * 100 if tax is not None and pbt and pbt > 0 else None

    return {
        "period": period_label(period_end),
        "sales": _crore(sales),
        "expenses": _crore(expenses),
        "operating_profit": _crore(operating_profit),
        "opm_pct": _round(opm),
        "other_income": _crore(other_income),
        "interest": _crore(interest),
        "depreciation": _crore(depreciation),
        "profit_before_tax": _crore(pbt),
        "tax_pct": _round(tax_pct),
        "net_profit": _crore(net_profit),
        "eps": _round(eps),
    }


# ── Results listings ───────────────────────────────────────────


@dataclass(frozen=True)
class ResultFiling:
    period_end: date
    basis: str  # "consolidated" | "standalone"
    xbrl: str
    broadcast: datetime


def is_xbrl_url(url: str) -> bool:
    """
    A link to an actual XBRL file. Some listing rows carry a placeholder such as
    https://nsearchives.nseindia.com/corporate/xbrl/- instead, which starts with
    http like a real one and answers 404.
    """
    return url.startswith("http") and url.lower().endswith(".xml")


def parse_integrated_listing(payload: Any) -> list[ResultFiling]:
    rows = payload.get("data") if isinstance(payload, dict) else None
    out: list[ResultFiling] = []
    for row in rows or []:
        xbrl = row.get("xbrl") or ""
        basis = (row.get("consolidated") or "").strip().lower()
        end = parse_date(row.get("qe_Date"))
        # Governance filings share the listing and carry no financials.
        if not is_xbrl_url(xbrl) or "GOVERNANCE" in xbrl.upper():
            continue
        if basis not in ("consolidated", "standalone") or not end or not is_quarter_end(end):
            continue
        out.append(ResultFiling(end, basis, xbrl, parse_timestamp(row.get("broadcast_Date"))))
    return out


def parse_legacy_listing(payload: Any) -> list[ResultFiling]:
    out: list[ResultFiling] = []
    for row in payload if isinstance(payload, list) else []:
        xbrl = row.get("xbrl") or ""
        end, start = parse_date(row.get("toDate")), parse_date(row.get("fromDate"))
        if not is_xbrl_url(xbrl) or not end or not start or not is_quarter_end(end):
            continue
        # A cumulative (year-to-date) filing is not a quarter.
        if (end - start).days > 100:
            continue
        basis = "consolidated" if (row.get("consolidated") or "").strip().lower() == "consolidated" else "standalone"
        out.append(ResultFiling(end, basis, xbrl, parse_timestamp(row.get("broadCastDate"))))
    return out


def choose_basis(filings: Iterable[ResultFiling], window: int = DEFAULT_QUARTERS) -> str:
    """
    Consolidated where the company reports it, standalone otherwise. One basis
    per company, never mixed: switching mid-series would show a subsidiary's
    revenue appearing and vanishing between adjacent quarters.

    Coverage is compared only over the quarters that will be kept. The legacy
    listing runs back to 2005, but quarterly consolidated results were only
    required from 2019, so counting every period ever filed made standalone win
    for Reliance, HDFC Bank and M&M, and the table showed half their revenue.
    """
    periods: dict[str, set[date]] = {"consolidated": set(), "standalone": set()}
    for f in filings:
        periods[f.basis].add(f.period_end)
    recent = sorted(periods["consolidated"] | periods["standalone"])[-window:]
    consolidated = sum(1 for p in recent if p in periods["consolidated"])
    standalone = sum(1 for p in recent if p in periods["standalone"])
    if consolidated and consolidated >= 0.75 * standalone:
        return "consolidated"
    return "standalone" if standalone else "consolidated"


def fetch_quarters(symbol: str, max_quarters: int = DEFAULT_QUARTERS) -> Optional[dict]:
    filings: list[ResultFiling] = []
    for url, parse in ((RESULTS_INTEGRATED, parse_integrated_listing), (RESULTS_LEGACY, parse_legacy_listing)):
        try:
            filings.extend(parse(_listing(url, symbol)))
        except Exception as exc:
            logger.debug("%s: listing %s failed: %s", symbol, url.split("/api/")[1][:30], exc)
    if not filings:
        return None

    basis = choose_basis(filings)
    latest_by_period: dict[date, ResultFiling] = {}
    for f in filings:
        if f.basis != basis:
            continue
        current = latest_by_period.get(f.period_end)
        # A revised filing supersedes the original for the same quarter.
        if current is None or f.broadcast > current.broadcast:
            latest_by_period[f.period_end] = f

    rows = []
    for end in sorted(latest_by_period)[-max_quarters:]:
        filing = latest_by_period[end]
        try:
            text = client().get(filing.xbrl, timeout=60).decode("utf-8", errors="replace")
        except Exception as exc:
            logger.warning("  %s %s: XBRL unavailable (%s)", symbol, period_label(end), str(exc)[:80])
            continue
        row = parse_results_xbrl(text, end)
        if row:
            rows.append(row)

    if not rows:
        return None
    return {
        "basis": basis,
        "source": "NSE XBRL",
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "quarters": rows,
    }


# ── Shareholding ───────────────────────────────────────────────

# Families under the promoter table (SEBI Table II). Everything under
# "DetailsOfSharesHeldBy…" and the public institutional families is the public
# table (Table III); Titan's filing puts Rekha Jhunjhunwala under the former and
# Tata Sons under OthersIndianShareholders, which is the split this relies on.
PROMOTER_FAMILIES = {
    "IndividualsOrHUF",
    "OthersIndianShareholders",
    "OtherForeignShareholders",
    "CentralGovernmentOrStateGovernments",
    "FinancialInstitutionsOrBanks",
    "IndividualsNonResidentIndividualsOrForeignIndividuals",
    "Government",
    "Institutions",
    "ForeignPortfolioInvestor",
}
PUBLIC_INSTITUTION_FAMILIES = {
    "MutualFundsOrUTI",
    "InsuranceCompanies",
    "ProvidentFundsOrPensionFunds",
    "AlternativeInvestmentFunds",
    "NBFCsRegisteredWithRBI",
    "OtherInstitutionsDomestic",
    "OtherNonInstitutions",
    "VentureCapitalFunds",
    "SovereignWealthFunds",
    "BanksPublic",
}


def holder_role(family: str) -> str:
    if family.startswith("DetailsOfSharesHeldBy"):
        if "KeyManagerialPersonnel" in family or "DirectorsAndDirectorsRelatives" in family:
            return "insider"
        return "public"
    if family in PUBLIC_INSTITUTION_FAMILIES:
        return "public"
    if family in PROMOTER_FAMILIES:
        return "promoter"
    return "other"


def holder_kind(family: str) -> str:
    if "ResidentIndividual" in family or "NonResidentIndians" in family or family == "IndividualsOrHUF":
        return "individual"
    if "BodiesCorporate" in family or family in ("OthersIndianShareholders", "OtherForeignShareholders"):
        return "corporate"
    return "institution"


def _pct(raw: Optional[str]) -> Optional[float]:
    # Percentages are filed as fractions: 0.2403 is 24.03%.
    try:
        return round(float(raw) * 100, 2) if raw not in (None, "") else None
    except ValueError:
        return None


def parse_shareholding_xbrl(text: str) -> dict:
    """Category totals and every named holder of 1% or more."""
    by_member: dict[str, dict[str, str]] = {}
    for tag, refs in xbrl_facts(text).items():
        for ctx, value in refs.items():
            # Names sit on a duration context (D_X_Context15) and the figures on
            # its instant twin (X_Context15); both describe the same holder.
            by_member.setdefault(re.sub(r"^[A-Z]_", "", ctx), {})[tag] = value

    def total(member: str) -> Optional[float]:
        return _pct((by_member.get(member) or {}).get("ShareholdingAsAPercentageOfTotalNumberOfShares"))

    holders = []
    for member, facts in by_member.items():
        name = facts.get("NameOfTheShareholder")
        pct = _pct(facts.get("ShareholdingAsAPercentageOfTotalNumberOfShares"))
        if not name or pct is None or pct < 1:
            continue
        family = re.sub(r"_Context\w*$", "", member)
        shares_raw = facts.get("NumberOfShares") or facts.get("NumberOfFullyPaidUpEquityShares")
        try:
            shares = int(float(shares_raw)) if shares_raw else None
        except ValueError:
            shares = None
        holders.append(
            {
                "name": re.sub(r"\s+", " ", name).strip(),
                "pct": pct,
                "shares": shares,
                "role": holder_role(family),
                "kind": holder_kind(family),
                "category": family,
            }
        )
    holders.sort(key=lambda h: -h["pct"])

    total_shares = (by_member.get("ShareholdingPattern_ContextI") or {}).get("NumberOfShares")
    return {
        "promoter": total("ShareholdingOfPromoterAndPromoterGroup_ContextI"),
        "public": total("PublicShareholding_ContextI"),
        "fii": total("InstitutionsForeign_ContextI"),
        "dii": total("InstitutionsDomestic_ContextI"),
        "total_shares": int(float(total_shares)) if total_shares else None,
        "holders": holders,
    }


def fetch_shareholding(symbol: str, filings: int = 2) -> Optional[dict]:
    """The latest `filings` quarter-end patterns: enough for a quarter-on-quarter change."""
    try:
        rows = _listing(SHP_MASTER, symbol)
    except Exception as exc:
        logger.debug("%s: shareholding listing failed: %s", symbol, exc)
        return None

    seen: set[date] = set()
    picked = []
    # Newest first. A later row for a date already seen is an older revision.
    for row in rows if isinstance(rows, list) else []:
        end = parse_date(row.get("date"))
        xbrl = row.get("xbrl") or ""
        if not end or not is_quarter_end(end) or end in seen or not xbrl.startswith("http"):
            continue
        seen.add(end)
        picked.append((end, xbrl))
        if len(picked) >= filings:
            break

    out = []
    for end, xbrl in picked:
        try:
            text = client().get(xbrl, timeout=90).decode("utf-8", errors="replace")
        except Exception as exc:
            logger.warning("  %s %s: shareholding XBRL unavailable (%s)", symbol, period_label(end), str(exc)[:80])
            continue
        parsed = parse_shareholding_xbrl(text)
        parsed["period"] = period_label(end)
        parsed["xbrl"] = xbrl
        out.append(parsed)

    if not out:
        return None
    return {
        "source": "NSE XBRL",
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "filings": out,
    }


# ── Universe and output ────────────────────────────────────────


def universe_symbols() -> list[str]:
    text = STOCKS_TS.read_text(encoding="utf-8")
    data = json.loads(text[text.index("= [") + 2 : text.rindex("]") + 1])
    return [s["symbol"] for s in data]


def tracked_symbols() -> list[str]:
    """
    Companies outside the Nifty 500 that super investors hold. Seeded by hand in
    the registry, and topped up with whatever the previous run actually matched,
    so a holding found once keeps being refreshed without editing the list.
    """
    out: list[str] = []
    if REGISTRY_FILE.exists():
        out.extend(json.loads(REGISTRY_FILE.read_text(encoding="utf-8")).get("tracked_symbols", []))
    if GENERATED_INVESTORS.exists():
        out.extend(json.loads(GENERATED_INVESTORS.read_text(encoding="utf-8")).get("companies", {}).keys())
    return out


def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=1, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8")
    os.replace(tmp, path)


def run(kind: str, symbols: list[str], limit: int = 0, max_quarters: int = DEFAULT_QUARTERS) -> int:
    path = QUARTERS_FILE if kind == "quarters" else SHAREHOLDING_FILE
    store = load_json(path)
    targets = symbols[:limit] if limit else symbols
    ok = failed = 0
    started = time.time()

    for i, symbol in enumerate(targets, 1):
        try:
            record = fetch_quarters(symbol, max_quarters) if kind == "quarters" else fetch_shareholding(symbol)
        except Exception as exc:
            logger.warning("  %s: %s", symbol, str(exc)[:120])
            record = None

        if record:
            store[symbol] = record
            ok += 1
        else:
            failed += 1
            # Keep what an earlier run fetched: a failed refresh is not evidence
            # the filing went away.

        if i % 25 == 0 or i == len(targets):
            write_json(path, store)
            rate = (time.time() - started) / i
            logger.info(
                "%s: %d/%d (%d ok, %d unavailable), ~%.0f min left",
                kind, i, len(targets), ok, failed, rate * (len(targets) - i) / 60,
            )

    write_json(path, store)
    logger.info("%s done: %d ok, %d unavailable -> %s", kind, ok, failed, path.relative_to(ROOT))
    return 0 if ok else 1


def main(argv: Optional[list[str]] = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    parser = argparse.ArgumentParser(description="Fetch filed results and shareholding from NSE XBRL")
    parser.add_argument("kind", choices=["quarters", "shareholding"])
    parser.add_argument("--symbols", nargs="+", help="Only these symbols")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--quarters", type=int, default=DEFAULT_QUARTERS, help="Quarters of history to keep")
    args = parser.parse_args(argv)

    if args.symbols:
        symbols = [s.upper() for s in args.symbols]
    else:
        symbols = universe_symbols()
        if args.kind == "shareholding":
            symbols += [s for s in dict.fromkeys(tracked_symbols()) if s not in set(symbols)]
    return run(args.kind, symbols, args.limit, args.quarters)


if __name__ == "__main__":
    raise SystemExit(main())
