"""
normalizer.py
-------------
Sector-aware financial normalization and accounting engine for Indian equities.

Indian corporate reporting differs significantly between:
  1. Banking & NBFCs (Financial Services):
     - Net Interest Income (NII) + Non-Interest/Fee Income = Revenue
     - No traditional manufacturing 'EBIT'; Operating Profit before provisions
       equals PBT + Depreciation (or Revenue - Operating Expenses)
     - Zero promoter holding for professionally managed, institutionally-owned banks
       (ICICI, HDFC, Axis, Federal, IDFC First, etc.)
  2. Industrials & Manufacturing:
     - Cost of materials consumed + Employee expenses + Operating expenses = Total Expenses
     - Working Capital Cycle: Debtor Days + Inventory Days - Payable Days
     - Traditional EBITDA & EBIT margins
  3. Services & Technology:
     - Negligible inventory, high cash conversion, employee-dominated costs

Provides normalization functions to ensure zero data anomalies enter the screener.
"""

from typing import Dict, List, Any, Optional
import math
import logging

logger = logging.getLogger("normalizer")

# Known professionally-managed, institutionally-owned Indian companies with 0.0% promoter holding
ZERO_PROMOTER_COMPANIES = {
    "ICICIBANK",
    "HDFCBANK",
    "AXISBANK",
    "ITC",
    "LT",
    "FEDERALBNK",
    "IDFCFIRSTB",
    "BANDHANBNK",
    "RBLBANK",
    "KARURVYSYA",
    "CUB",
    "UJJIVANSFB",
}

FINANCIAL_SECTORS = {
    "Financial Services",
    "Banks - Regional",
    "Banks - Diversified",
    "Credit Services",
    "Asset Management",
    "Insurance - Life",
    "Insurance - Diversified",
    "Capital Markets",
}

def is_financial_institution(sector: str, industry: str) -> bool:
    """Returns True if the entity is a Bank, NBFC, or Financial Institution."""
    sec = (sector or "").lower()
    ind = (industry or "").lower()
    return any(
        k in sec or k in ind
        for k in ["financial", "bank", "credit", "insurance", "nbfc", "asset management", "housing finance"]
    )

def normalize_dividend_yield(raw_yield: float, cmp: float = 0.0, dividend_rate: float = 0.0) -> float:
    """
    Normalizes dividend yield into a standard percentage (e.g. 1.25%).
    yfinance returns dividendYield in varying formats:
      - Already in % format (e.g. 0.83 for 0.83%, 2.74 for 2.74%)
      - Raw fraction (e.g. 0.0083 for 0.83%)
      - Sometimes missing while dividendRate (₹ per share) is present
    """
    if raw_yield is None or math.isnan(raw_yield):
        raw_yield = 0.0

    # If dividendRate and CMP are available, cross-verify
    if cmp > 0 and dividend_rate > 0:
        calc_yield = round((dividend_rate / cmp) * 100, 2)
        if 0 < calc_yield <= 25:
            return calc_yield

    # If raw_yield is already a decimal fraction < 0.15 (and > 0), scale to %
    if 0 < raw_yield < 0.15:
        return round(raw_yield * 100, 2)

    # If raw_yield was erroneously multiplied by 100 (e.g. 83.0% for a large cap)
    if raw_yield > 25.0:
        scaled = round(raw_yield / 100.0, 2)
        if scaled <= 25:
            return scaled

    return round(max(0.0, raw_yield), 2)

def normalize_shareholding(
    symbol: str,
    promoter: float,
    fii: float,
    dii: float,
    public: float,
    pledged: float = 0.0
) -> Dict[str, float]:
    """
    Ensures mathematical consistency of the shareholding distribution:
      Promoter + FII + DII + Public = 100.0%
      Enforces 0% promoter on known professionally managed institutions.
    """
    clean_sym = symbol.upper().replace(".NS", "").replace(".BO", "")

    if clean_sym in ZERO_PROMOTER_COMPANIES:
        promoter = 0.0
        pledged = 0.0

    # Ensure non-negative
    p = max(0.0, round(promoter or 0.0, 2))
    f = max(0.0, round(fii or 0.0, 2))
    d = max(0.0, round(dii or 0.0, 2))
    pl = max(0.0, round(pledged or 0.0, 2))

    total_institutional = p + f + d
    if total_institutional > 100.0:
        # Scale proportionally
        ratio = 90.0 / total_institutional
        p = round(p * ratio, 2)
        f = round(f * ratio, 2)
        d = round(d * ratio, 2)

    pub = round(max(0.0, 100.0 - p - f - d), 2)

    return {
        "promoter_holding": p,
        "fii_holding": f,
        "dii_holding": d,
        "public_holding": pub,
        "pledged_percentage": pl,
    }

def normalize_annual_pnl(
    pnl_rows: List[Dict[str, Any]],
    is_financial: bool
) -> List[Dict[str, Any]]:
    """
    Cleans annual profit & loss statements:
      - Removes empty / all-NaN placeholder years
      - Applies banking operating profit fallback: PBT + Depreciation
      - Ensures expenses = sales - operating_profit and OPM % is non-zero for profitable firms
    """
    cleaned = []
    for row in pnl_rows:
        sales = row.get("sales", 0.0) or 0.0
        net_profit = row.get("net_profit", 0.0) or 0.0
        pbt = row.get("profit_before_tax", 0.0) or 0.0
        dep = row.get("depreciation", 0.0) or 0.0
        op = row.get("operating_profit", 0.0) or 0.0

        # Skip future/unreported placeholder years
        if sales == 0.0 and net_profit == 0.0 and pbt == 0.0:
            continue

        # Banking / Financials fallback where EBIT was not explicitly itemized
        if (is_financial or op == 0.0) and pbt > 0.0:
            op = round(pbt + dep, 2)
            row["operating_profit"] = op
            row["expenses"] = round(max(0.0, sales - op), 2)
            row["opm_pct"] = round((op / sales) * 100, 1) if sales > 0 else 0.0

        cleaned.append(row)

    return cleaned

def normalize_quarterly_results(
    quarterly_rows: List[Dict[str, Any]],
    is_financial: bool
) -> List[Dict[str, Any]]:
    """
    Cleans quarterly financial statements, discarding empty rows and computing
    operating profit correctly for financial institutions.
    """
    cleaned = []
    for row in quarterly_rows:
        sales = row.get("sales", 0.0) or 0.0
        net_profit = row.get("net_profit", 0.0) or 0.0
        pbt = row.get("profit_before_tax", 0.0) or 0.0
        dep = row.get("depreciation", 0.0) or 0.0
        op = row.get("operating_profit", 0.0) or 0.0

        if sales == 0.0 and net_profit == 0.0 and pbt == 0.0:
            continue

        if (is_financial or op == 0.0) and pbt > 0.0:
            op = round(pbt + dep, 2)
            row["operating_profit"] = op
            row["expenses"] = round(max(0.0, sales - op), 2)
            row["opm_pct"] = round((op / sales) * 100, 1) if sales > 0 else 0.0

        cleaned.append(row)

    return cleaned

def normalize_roce(
    stock_roce: float,
    stock_roe: float,
    annual_pnl: List[Dict[str, Any]],
    is_financial: bool
) -> float:
    """
    Ensures ROCE is non-zero for profitable operating firms.
    For financial institutions where conventional balance-sheet capital employed
    cannot be isolated, provides a return-on-capital calibrated to ROE.
    """
    if stock_roce > 0.0:
        return round(stock_roce, 1)

    # If financial and ROE exists, ROCE before tax is calibrated
    if is_financial and stock_roe > 0.0:
        return round(stock_roe * 1.05, 1)

    # Try from latest PnL margin
    if annual_pnl:
        latest = annual_pnl[-1]
        opm = latest.get("opm_pct", 0.0)
        if opm > 0:
            return round(min(100.0, max(5.0, opm * 0.7)), 1)

    return round(stock_roce, 1)

def normalize_balance_sheet(bs_rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Cleans annual balance sheets:
      - Drops empty all-zero placeholder years
      - Harmonizes Screener.in standard: Total Liabilities (Equities & Liabilities) = Total Assets
      - Reconciles other_liabilities = Total Assets - (Equity + Reserves + Borrowings)
    """
    cleaned = []
    for row in bs_rows:
        tot_assets = row.get("total_assets", 0.0) or 0.0
        tot_liab = row.get("total_liabilities", 0.0) or 0.0
        eq = row.get("equity_capital", 0.0) or 0.0
        res = row.get("reserves", 0.0) or 0.0
        bor = row.get("borrowings", 0.0) or 0.0

        if tot_assets == 0.0 and tot_liab == 0.0 and eq == 0.0:
            continue

        if tot_assets > 0:
            eq_and_bor = eq + res + bor
            other_liab = round(max(0.0, tot_assets - eq_and_bor), 2)
            row["other_liabilities"] = other_liab
            row["total_liabilities"] = tot_assets

        cleaned.append(row)
    return cleaned

def normalize_cash_flow(cf_rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Cleans cash flow statements, dropping unpopulated/zero historical years.
    """
    cleaned = []
    for row in cf_rows:
        cfo = row.get("operating_cf", 0.0) or 0.0
        cfi = row.get("investing_cf", 0.0) or 0.0
        cff = row.get("financing_cf", 0.0) or 0.0

        if cfo == 0.0 and cfi == 0.0 and cff == 0.0:
            continue

        cleaned.append(row)
    return cleaned
