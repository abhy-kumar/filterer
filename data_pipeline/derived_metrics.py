"""
Derived Metrics Calculator for Filterer.

Pure calculation functions for financial metrics that are computed from
raw data (financial statements, price history, balance sheet, etc.)
rather than directly available from data sources.
"""

import math
from typing import Optional


def safe_div(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Safe division that returns default on zero/None denominator."""
    if denominator is None or denominator == 0:
        return default
    return numerator / denominator


def cagr(beginning: float, ending: float, years: int) -> Optional[float]:
    """
    Calculate Compound Annual Growth Rate.
    Returns percentage (e.g., 15.5 for 15.5%).
    Returns None if inputs are invalid.
    """
    if years <= 0 or beginning is None or ending is None:
        return None
    if beginning <= 0 or ending <= 0:
        return None
    try:
        rate = (ending / beginning) ** (1.0 / years) - 1.0
        return round(rate * 100, 2)
    except (ValueError, ZeroDivisionError, OverflowError):
        return None


def compute_graham_number(eps: float, book_value: float) -> float:
    """
    Graham Number = sqrt(22.5 * EPS * Book Value)
    Represents the maximum price a defensive investor should pay.
    """
    if eps is None or book_value is None or eps <= 0 or book_value <= 0:
        return 0.0
    try:
        return round(math.sqrt(22.5 * eps * book_value), 2)
    except (ValueError, OverflowError):
        return 0.0


def compute_piotroski_score(
    net_income: float,
    prev_net_income: float,
    operating_cf: float,
    prev_operating_cf: float,
    total_assets: float,
    prev_total_assets: float,
    roa: float,
    prev_roa: float,
    long_term_debt: float,
    prev_long_term_debt: float,
    current_ratio: float,
    prev_current_ratio: float,
    shares_outstanding: float,
    prev_shares_outstanding: float,
    gross_margin: float,
    prev_gross_margin: float,
    asset_turnover: float,
    prev_asset_turnover: float,
) -> int:
    """
    Calculate Piotroski F-Score (0-9).
    
    9 binary signals across profitability, leverage/liquidity, and operating efficiency.
    Higher scores indicate stronger financial health.
    """
    score = 0

    # ─── Profitability (4 points) ───
    # 1. Positive Net Income
    if net_income is not None and net_income > 0:
        score += 1
    # 2. Positive Operating Cash Flow
    if operating_cf is not None and operating_cf > 0:
        score += 1
    # 3. Higher ROA than prior year
    if roa is not None and prev_roa is not None and roa > prev_roa:
        score += 1
    # 4. Operating CF > Net Income (quality of earnings)
    if operating_cf is not None and net_income is not None and operating_cf > net_income:
        score += 1

    # ─── Leverage / Liquidity (3 points) ───
    # 5. Lower long-term debt ratio
    if long_term_debt is not None and prev_long_term_debt is not None:
        if total_assets and prev_total_assets:
            curr_lev = safe_div(long_term_debt, total_assets)
            prev_lev = safe_div(prev_long_term_debt, prev_total_assets)
            if curr_lev < prev_lev:
                score += 1
    # 6. Higher current ratio
    if current_ratio is not None and prev_current_ratio is not None:
        if current_ratio > prev_current_ratio:
            score += 1
    # 7. No new shares issued (dilution check)
    if shares_outstanding is not None and prev_shares_outstanding is not None:
        if shares_outstanding <= prev_shares_outstanding:
            score += 1

    # ─── Operating Efficiency (2 points) ───
    # 8. Higher gross margin
    if gross_margin is not None and prev_gross_margin is not None:
        if gross_margin > prev_gross_margin:
            score += 1
    # 9. Higher asset turnover
    if asset_turnover is not None and prev_asset_turnover is not None:
        if asset_turnover > prev_asset_turnover:
            score += 1

    return score


def compute_altman_z_score(
    working_capital: float,
    retained_earnings: float,
    ebit: float,
    market_cap: float,
    total_liabilities: float,
    sales: float,
    total_assets: float,
) -> float:
    """
    Altman Z-Score for predicting bankruptcy risk.
    
    Z = 1.2*A + 1.4*B + 3.3*C + 0.6*D + 1.0*E
    where:
      A = Working Capital / Total Assets
      B = Retained Earnings / Total Assets
      C = EBIT / Total Assets
      D = Market Cap / Total Liabilities
      E = Sales / Total Assets
      
    Interpretation: >2.99 Safe, 1.81-2.99 Grey Zone, <1.81 Distress
    """
    if total_assets is None or total_assets <= 0:
        return 0.0

    a = safe_div(working_capital, total_assets)
    b = safe_div(retained_earnings, total_assets)
    c = safe_div(ebit, total_assets)
    d = safe_div(market_cap, total_liabilities) if total_liabilities else 10.0
    e = safe_div(sales, total_assets)

    z = 1.2 * a + 1.4 * b + 3.3 * c + 0.6 * d + 1.0 * e
    return round(z, 2)


def compute_rsi(prices: list[float], period: int = 14) -> float:
    """
    Calculate Relative Strength Index (RSI) from a list of closing prices.
    
    RSI = 100 - (100 / (1 + RS))
    where RS = Average Gain / Average Loss over the period.
    
    Args:
        prices: List of closing prices (oldest first)
        period: RSI lookback period (default 14)
    
    Returns:
        RSI value (0-100), or 50.0 if insufficient data
    """
    if len(prices) < period + 1:
        return 50.0

    changes = [prices[i] - prices[i - 1] for i in range(1, len(prices))]

    gains = [max(c, 0) for c in changes[-period:]]
    losses = [abs(min(c, 0)) for c in changes[-period:]]

    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period

    if avg_loss == 0:
        return 100.0
    if avg_gain == 0:
        return 0.0

    rs = avg_gain / avg_loss
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return round(rsi, 2)


def compute_moving_average(prices: list[float], window: int) -> Optional[float]:
    """
    Calculate Simple Moving Average for the given window.
    
    Args:
        prices: List of closing prices (oldest first)
        window: Number of periods for the average
    
    Returns:
        SMA value, or None if insufficient data
    """
    if len(prices) < window:
        return None
    return round(sum(prices[-window:]) / window, 2)


def compute_working_capital_days(
    debtors: float, inventory: float, creditors: float, sales: float
) -> dict:
    """
    Calculate working capital efficiency ratios.
    
    Returns dict with:
        debtor_days: (Debtors / Sales) * 365
        inventory_days: (Inventory / Sales) * 365  
        days_payable: (Creditors / Sales) * 365
        cash_conversion_cycle: Debtor Days + Inventory Days - Days Payable
        working_capital_days: Same as cash conversion cycle
    """
    daily_sales = safe_div(sales, 365)

    debtor_days = round(safe_div(debtors, daily_sales)) if debtors else 0
    inventory_days = round(safe_div(inventory, daily_sales)) if inventory else 0
    days_payable = round(safe_div(creditors, daily_sales)) if creditors else 0
    ccc = debtor_days + inventory_days - days_payable

    return {
        "debtor_days": debtor_days,
        "inventory_days": inventory_days,
        "days_payable": days_payable,
        "cash_conversion_cycle": ccc,
        "working_capital_days": ccc,
    }


def compute_interest_coverage(ebit: float, interest_expense: float) -> float:
    """
    Interest Coverage Ratio = EBIT / Interest Expense.
    Higher is better. Returns 999.0 if no interest (debt-free).
    """
    if interest_expense is None or interest_expense <= 0:
        return 999.0
    return round(safe_div(ebit, interest_expense), 2)


def compute_peg_ratio(pe_ratio: float, earnings_growth: float) -> float:
    """
    PEG Ratio = P/E Ratio / Earnings Growth Rate.
    Lower PEG suggests better value relative to growth.
    """
    if pe_ratio is None or pe_ratio <= 0:
        return 0.0
    if earnings_growth is None or earnings_growth <= 0:
        return 99.0  # Extremely overvalued if no growth
    return round(pe_ratio / earnings_growth, 2)


def compute_ev_ebitda(
    market_cap: float,
    total_debt: float,
    cash: float,
    ebitda: float,
) -> float:
    """
    Enterprise Value / EBITDA.
    EV = Market Cap + Total Debt - Cash
    """
    if ebitda is None or ebitda <= 0:
        return 0.0
    ev = (market_cap or 0) + (total_debt or 0) - (cash or 0)
    return round(safe_div(ev, ebitda), 2)


def compute_distance_from_52w(current_price: float, high_52w: float, low_52w: float) -> dict:
    """
    Calculate percentage distance from 52-week high and low.
    
    Returns:
        distance_52w_high: negative % (how far below the high)
        distance_52w_low: positive % (how far above the low)
    """
    dist_high = round(safe_div(current_price - high_52w, high_52w) * 100, 2) if high_52w else 0.0
    dist_low = round(safe_div(current_price - low_52w, low_52w) * 100, 2) if low_52w else 0.0
    return {
        "distance_52w_high": dist_high,
        "distance_52w_low": dist_low,
    }


def compute_fcf_yield(fcf: float, market_cap: float) -> float:
    """Free Cash Flow Yield = (FCF / Market Cap) * 100."""
    if market_cap is None or market_cap <= 0:
        return 0.0
    return round(safe_div(fcf, market_cap) * 100, 2)
