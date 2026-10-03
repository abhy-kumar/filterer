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
                                   (period=Quarterly and period=Annual)

Many companies moved over a quarter or two later than that, and NSE indexed
their Mar 2025 results in neither listing. Those quarters cannot be fetched
here; scripts/repair_dataset.mjs fills them, where it safely can, from the
full-year figures.

Annual results come from the same filings: the Annual listing carries
machine-readable XBRL from FY2018, and every March filing since carries the
full year alongside the quarter.

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

RESULTS_LEGACY_ANNUAL = NSE + "/api/corporates-financial-results?index=equities&symbol={symbol}&period=Annual"

CRORE = 1e7
DEFAULT_QUARTERS = 12
DEFAULT_YEARS = 10

# Context lengths, in days, for a quarter and a financial year.
QUARTER_DAYS = (80, 100)
YEAR_DAYS = (350, 380)

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


ADDITIVE = (
    "sales",
    "expenses",
    "operating_profit",
    "other_income",
    "interest",
    "depreciation",
    "profit_before_tax",
    "tax",
    "net_profit",
)


# The pre-2025 results format lays the filing out as the printed results
# table, one context per column, and dates every column with the quarter
# whatever it holds. The column is in the context id: One is the quarter just
# ended, Four the year to date, which in a March filing is the full year.
LEGACY_QUARTER_ID = "OneD"
LEGACY_YEAR_TO_DATE_ID = "FourD"


def extract_figures(
    text: str,
    start: Optional[date],
    end: date,
    ids: Optional[list[str]] = None,
    id_days: tuple[tuple[int, int], ...] = (QUARTER_DAYS,),
) -> Optional[dict]:
    """
    Raw figures, in rupees, for the undimensioned context running from
    `start` to `end`. With `start` None, any context of a quarter's length
    ending on `end` is taken. With `ids`, exactly those contexts are.

    The layout follows the convention a Screener.in reader expects:

        expenses          total expenses less finance costs and depreciation
        operating profit  sales less those expenses
        PBT               operating profit + other income - interest - depreciation

    Banks file a different schema (interest earned, interest expended,
    provisions), mapped onto the same rows: interest earned as revenue,
    operating expenses plus provisions as expenses, and no separate
    depreciation line.
    """
    contexts = xbrl_contexts(text)
    if ids is not None:
        # Filings from 2018 to 2022 often cite OneD and FourD without defining
        # them. The column convention still says what they hold, and the
        # listing says which period the filing is for, so an undefined id is
        # taken at its word.
        def fits(c: Context) -> bool:
            if c.end != end or not c.start:
                return False
            days = (c.end - c.start).days
            return any(lo <= days <= hi for lo, hi in id_days)

        chosen = [cid for cid in ids if cid not in contexts or fits(contexts[cid])]
    elif start is None:
        lo, hi = QUARTER_DAYS
        chosen = [
            cid
            for cid, c in contexts.items()
            if not c.dimensional and c.start and c.end == end and lo <= (c.end - c.start).days <= hi
        ]
        # In the column layout the year-to-date column carries quarter dates
        # too, and must not stand in for the quarter.
        if LEGACY_QUARTER_ID in chosen:
            chosen = [LEGACY_QUARTER_ID]
    else:
        chosen = [cid for cid, c in contexts.items() if not c.dimensional and c.start == start and c.end == end]
    if not chosen:
        return None
    facts = xbrl_facts(text)

    def val(*tags: str, nonzero: bool = False) -> Optional[float]:
        """
        The first tag that carries a figure. With nonzero, a filed 0 is
        passed over for the next tag: DIVISLAB's FY2018 and FY2019 filings
        put 0 under the owners-of-parent profit and the real figure under
        profit for the period.
        """
        zero_seen = False
        for tag in tags:
            by_context = facts.get(tag) or {}
            for cid in chosen:
                raw = by_context.get(cid)
                if raw in (None, ""):
                    continue
                try:
                    value = float(raw)
                except ValueError:
                    continue
                if nonzero and value == 0:
                    zero_seen = True
                    continue
                return value
        return 0.0 if zero_seen else None

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
            nonzero=True,
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
            nonzero=True,
        )
        eps = val(
            "BasicEarningsLossPerShareFromContinuingAndDiscontinuedOperations",
            "BasicEarningsLossPerShareFromContinuingOperations",
            "BasicEarningsPerShare",
        )

    if sales is None and net_profit is None:
        return None

    return {
        "sales": sales,
        "expenses": expenses,
        "operating_profit": operating_profit,
        "other_income": other_income,
        "interest": interest,
        "depreciation": depreciation,
        "profit_before_tax": pbt,
        "tax": val("TaxExpense", "CurrentTax"),
        "net_profit": net_profit,
        "eps": eps,
    }


def to_row(label_key: str, label: str, f: dict) -> dict:
    """Figures in rupees to a row in crore, in the app's layout."""
    sales, op, pbt, tax = f.get("sales"), f.get("operating_profit"), f.get("profit_before_tax"), f.get("tax")
    opm = op / sales * 100 if op is not None and sales else None
    tax_pct = tax / pbt * 100 if tax is not None and pbt and pbt > 0 else None
    return {
        label_key: label,
        "sales": _crore(sales),
        "expenses": _crore(f.get("expenses")),
        "operating_profit": _crore(op),
        "opm_pct": _round(opm),
        "other_income": _crore(f.get("other_income")),
        "interest": _crore(f.get("interest")),
        "depreciation": _crore(f.get("depreciation")),
        "profit_before_tax": _crore(pbt),
        "tax_pct": _round(tax_pct),
        "net_profit": _crore(f.get("net_profit")),
        "eps": _round(f.get("eps")),
    }


def quarter_figures(text: str, period_end: date) -> Optional[dict]:
    figures = extract_figures(text, None, period_end)
    if figures is None and f'contextRef="{LEGACY_QUARTER_ID}"' in text:
        figures = extract_figures(text, None, period_end, ids=[LEGACY_QUARTER_ID])
    return figures


def parse_results_xbrl(text: str, period_end: date) -> Optional[dict]:
    """One quarter's results, in the shape the app's quarterly table uses."""
    figures = quarter_figures(text, period_end)
    return to_row("period", period_label(period_end), figures) if figures else None


def fiscal_year_start(end: date) -> date:
    """
    The first day of the twelve months ending `end`. Most companies close
    their year in March, but not all: ABB and Schaeffler close in December,
    Siemens in September, P&G Hygiene in June.
    """
    month = end.month % 12 + 1
    return date(end.year - (month != 1), month, 1)


def stated_financial_year(text: str) -> tuple[Optional[date], Optional[date]]:
    """The financial year the filing says it belongs to, from its own facts."""
    facts = xbrl_facts(text)

    def first(tag: str) -> Optional[date]:
        values = list((facts.get(tag) or {}).values())
        return parse_date(values[0]) if values else None

    return first("DateOfStartOfFinancialYear"), first("DateOfEndOfFinancialYear")


def parse_annual_xbrl(text: str, year_end: date) -> Optional[dict]:
    """The full financial year ending `year_end`, from an annual or year-end filing."""
    figures = extract_figures(text, fiscal_year_start(year_end), year_end)
    if figures is None and f'contextRef="{LEGACY_YEAR_TO_DATE_ID}"' in text:
        # In the old layout the year-to-date column carries the quarter's
        # dates, so its length has to come from the financial year the filing
        # states. That keeps out a December filing's nine months, and the
        # fifteen-month year Ambuja filed when it moved its year end from
        # December to March.
        start, end = stated_financial_year(text)
        if start and end == year_end and YEAR_DAYS[0] <= (end - start).days <= YEAR_DAYS[1]:
            figures = extract_figures(
                text, None, year_end, ids=[LEGACY_YEAR_TO_DATE_ID], id_days=(YEAR_DAYS, QUARTER_DAYS)
            )
    return to_row("year", period_label(year_end), figures) if figures else None


def cumulative_spans(text: str, end: date) -> list[tuple[date, dict]]:
    """
    Every longer-than-a-quarter span ending on `end` that the filing reports,
    longest first, with its figures. A March filing carries the full year; a
    September or December one often carries the half or nine months.
    """
    out = []
    for c in sorted(
        {(c.start, c.end) for c in xbrl_contexts(text).values() if not c.dimensional and c.start and c.end == end},
        key=lambda span: span[0],
    ):
        start = c[0]
        if (end - start).days <= QUARTER_DAYS[1]:
            continue
        figures = extract_figures(text, start, end)
        if figures:
            out.append((start, figures))
    return out


def previous_quarter_end(d: date) -> date:
    month, year = d.month - 3, d.year
    if month <= 0:
        month, year = month + 12, year - 1
    return date(year, month, 31 if month in (3, 12) else 30)


def quarters_in_span(start: date, end: date) -> list[date]:
    """Quarter ends on or after `start` and before `end`, oldest first."""
    ends = []
    q = previous_quarter_end(end)
    while q >= start:
        ends.append(q)
        q = previous_quarter_end(q)
    return ends[::-1]


def derive_quarter(text: str, end: date, known: dict[date, dict]) -> Optional[dict]:
    """
    A quarter worked out from a longer span in its own filing, less the
    quarters before it that are already known: the full year less nine
    months, or the half year less the previous quarter.

    Used when no filing for the quarter carries a three-month column. Only
    the additive lines are derived; EPS is not, because the share count moves
    between quarters.
    """
    for start, cumulative in cumulative_spans(text, end):
        before = quarters_in_span(start, end)
        if not before or any(q not in known for q in before):
            continue
        figures: dict = {"eps": None}
        for key in ADDITIVE:
            total = cumulative.get(key)
            parts = [known[q].get(key) for q in before]
            figures[key] = None if total is None or any(v is None for v in parts) else total - sum(parts)
        if figures.get("sales") is None and figures.get("net_profit") is None:
            continue
        row = to_row("period", period_label(end), figures)
        row["derived"] = f"the {period_label(start)} to {period_label(end)} total less the quarters before it"
        return row
    return None


# ── Results listings ───────────────────────────────────────────


@dataclass(frozen=True)
class ResultFiling:
    period_end: date
    basis: str  # "consolidated" | "standalone"
    xbrl: str
    broadcast: Optional[datetime]
    # NSE's own sequence number, which rises with each filing.
    seq: int = 0
    revision: bool = False
    # 3 for a quarterly filing, 12 for an annual one.
    months: int = 3

    def recency(self) -> tuple:
        """
        Newest first sorts on this. A revision outranks the filing it
        corrects even when NSE leaves its broadcast date blank, which it often
        does: DIVISLAB's corrected Mar 2026 filing and AXISBANK's corrected
        Sep 2025 one both arrived with no date, and the originals they fixed
        carry no quarter column at all.
        """
        return (self.revision, self.broadcast or datetime.min, self.seq)


def _seq(raw: Any) -> int:
    try:
        return int(str(raw).strip())
    except (TypeError, ValueError):
        return 0


def _timestamp(*raws: Any) -> Optional[datetime]:
    stamps = [parse_timestamp(r) for r in raws]
    stamps = [t for t in stamps if t != datetime.min]
    return max(stamps) if stamps else None


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
        out.append(
            ResultFiling(
                end,
                basis,
                xbrl,
                _timestamp(row.get("broadcast_Date"), row.get("creation_Date"), row.get("revised_Date")),
                seq=_seq(row.get("seq_Id")),
                revision="revis" in str(row.get("type_Sub") or "").lower(),
            )
        )
    return out


def parse_legacy_listing(payload: Any, months: int = 3) -> list[ResultFiling]:
    """
    Rows of the older listing. With months=3 only quarters are kept, since a
    cumulative (year-to-date) filing is not a quarter; with months=12 only
    full financial years are.
    """
    lo, hi = QUARTER_DAYS if months == 3 else YEAR_DAYS
    out: list[ResultFiling] = []
    for row in payload if isinstance(payload, list) else []:
        xbrl = row.get("xbrl") or ""
        end, start = parse_date(row.get("toDate")), parse_date(row.get("fromDate"))
        if not is_xbrl_url(xbrl) or not end or not start or not is_quarter_end(end):
            continue
        if not lo <= (end - start).days <= hi:
            continue
        basis = "consolidated" if (row.get("consolidated") or "").strip().lower() == "consolidated" else "standalone"
        out.append(
            ResultFiling(
                end,
                basis,
                xbrl,
                _timestamp(row.get("broadCastDate"), row.get("filingDate")),
                seq=_seq(row.get("seqNumber")),
                revision=str(row.get("reInd") or "").strip().upper() == "R",
                months=months,
            )
        )
    return out


def parse_legacy_annual_listing(payload: Any) -> list[ResultFiling]:
    return parse_legacy_listing(payload, months=12)


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


def _download(symbol: str, filing: ResultFiling, label: str) -> Optional[str]:
    try:
        return client().get(filing.xbrl, timeout=60).decode("utf-8", errors="replace")
    except Exception as exc:
        logger.warning("  %s %s: XBRL unavailable (%s)", symbol, label, str(exc)[:80])
        return None


def _newest_first(filings: Iterable[ResultFiling]) -> dict[date, list[ResultFiling]]:
    by_period: dict[date, list[ResultFiling]] = {}
    for f in filings:
        by_period.setdefault(f.period_end, []).append(f)
    for group in by_period.values():
        group.sort(key=ResultFiling.recency, reverse=True)
    return by_period


def fetch_quarters(
    symbol: str, max_quarters: int = DEFAULT_QUARTERS, max_years: int = DEFAULT_YEARS
) -> Optional[dict]:
    listings = (
        (RESULTS_INTEGRATED, parse_integrated_listing),
        (RESULTS_LEGACY, parse_legacy_listing),
        (RESULTS_LEGACY_ANNUAL, parse_legacy_annual_listing),
    )
    filings: list[ResultFiling] = []
    for url, parse in listings:
        try:
            filings.extend(parse(_listing(url, symbol)))
        except Exception as exc:
            logger.debug("%s: listing %s failed: %s", symbol, url.split("/api/")[1][:30], exc)
    quarterly = [f for f in filings if f.months == 3]
    if not quarterly:
        return None

    basis = choose_basis(quarterly)
    chosen = [f for f in filings if f.basis == basis]
    by_period = _newest_first(f for f in chosen if f.months == 3)
    texts: dict[str, Optional[str]] = {}

    def text_of(filing: ResultFiling, label: str) -> Optional[str]:
        if filing.xbrl not in texts:
            texts[filing.xbrl] = _download(symbol, filing, label)
        return texts[filing.xbrl]

    # Quarters: newest filing first, falling back to older ones for the same
    # period. Any that still fail are derived afterwards, once the quarters
    # they depend on are known.
    rows: dict[date, dict] = {}
    raw: dict[date, dict] = {}
    unparsed: list[date] = []
    for end in sorted(by_period)[-max_quarters:]:
        for filing in by_period[end]:
            text = text_of(filing, period_label(end))
            figures = quarter_figures(text, end) if text else None
            if figures:
                raw[end] = figures
                rows[end] = to_row("period", period_label(end), figures)
                break
        else:
            unparsed.append(end)

    for end in unparsed:
        for filing in by_period[end]:
            text = text_of(filing, period_label(end))
            row = derive_quarter(text, end, raw) if text else None
            if row:
                rows[end] = row
                logger.info("  %s %s: derived (%s)", symbol, period_label(end), row["derived"])
                break
        else:
            logger.warning("  %s %s: no filing for this quarter could be read", symbol, period_label(end))

    # Years: the Annual listing up to FY2024, and the full-year column of each
    # year-end filing after that. The year end is the company's own, read from
    # its Annual listing. The quarterly filings were downloaded above, so most
    # of these cost nothing.
    # The latest year end, not the commonest: Ambuja closed in December until
    # 2022 and in March since.
    annual_filings = sorted((f for f in chosen if f.months == 12), key=lambda f: f.period_end)
    fy_month = annual_filings[-1].period_end.month if annual_filings else 3
    year_filings = _newest_first(
        [f for f in chosen if f.months == 12]
        + [f for f in chosen if f.months == 3 and f.period_end.month == fy_month]
    )
    annual: dict[date, dict] = {}
    for end in sorted(year_filings)[-max_years:]:
        for filing in year_filings[end]:
            text = text_of(filing, f"FY{end.year}")
            row = parse_annual_xbrl(text, end) if text else None
            if row:
                annual[end] = row
                break

    # Years are kept as filed, not checked against the sum of their quarters.
    # The two legitimately differ: COALINDIA's FY2024 profit was restated at
    # year end, and its revenue moved to a gross figure from Mar 2026, so
    # neither the year nor the quarters can be corrected from the other.

    if not rows:
        return None
    return {
        "basis": basis,
        "source": "NSE XBRL",
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "quarters": [rows[k] for k in sorted(rows)],
        "annual": [annual[k] for k in sorted(annual)],
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


def keep_known_periods(old: Optional[dict], new: dict) -> dict:
    """
    Carry forward any quarter or year the previous run had and this one could
    not read. A download that fails tonight, as nsearchives does with a 502
    under load, is not evidence that a filed quarter went away. Only rows on
    the same basis carry over, and a row read this run always wins.
    """
    if not old or old.get("basis") != new.get("basis"):
        return new
    merged = dict(new)
    # Quarters only. Years are re-read in full every run, so a year that
    # stops parsing has stopped for a reason, as Ambuja's nine-month and
    # fifteen-month columns did once they were recognised for what they are.
    for key, label in (("quarters", "period"),):
        rows = {r[label]: r for r in old.get(key) or []}
        rows.update({r[label]: r for r in new.get(key) or []})
        order = (lambda r: (int(r[label].split()[1]), _MONTHS.index(r[label].split()[0])))
        merged[key] = sorted(rows.values(), key=order)
    if len(merged["quarters"]) > len(new.get("quarters") or []):
        merged["quarters"] = merged["quarters"][-max(len(new.get("quarters") or []), DEFAULT_QUARTERS):]
    return merged


_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


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
            store[symbol] = keep_known_periods(store.get(symbol), record) if kind == "quarters" else record
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
