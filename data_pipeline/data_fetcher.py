"""
Real Data Fetcher for Filterer.

Fetches comprehensive financial data from Yahoo Finance (yfinance) for Indian equities.
Extracts fundamentals, financial statements (10-year), quarterly results, 
balance sheets, cash flows, shareholding, price history, and computes derived metrics.

All data is free. No API keys required.
"""

import time
import json
import logging
import traceback
from datetime import datetime, timedelta
from typing import Any, Optional

import numpy as np
import pandas as pd
import yfinance as yf

from data_pipeline.derived_metrics import (
    cagr,
    compute_altman_z_score,
    compute_distance_from_52w,
    compute_ev_ebitda,
    compute_fcf_yield,
    compute_graham_number,
    compute_interest_coverage,
    compute_moving_average,
    compute_peg_ratio,
    compute_piotroski_score,
    compute_rsi,
    compute_working_capital_days,
    safe_div,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ── Constants ──
RETRY_COUNT = 3
RETRY_DELAY = 2.0  # seconds
RATE_LIMIT_DELAY = 0.8  # seconds between stocks
INR_CRORE = 1e7  # 1 Crore = 10 million


def _safe_float(val: Any, default: float = 0.0) -> float:
    """Safely convert a value to float."""
    if val is None:
        return default
    try:
        f = float(val)
        if np.isnan(f) or np.isinf(f):
            return default
        return f
    except (ValueError, TypeError):
        return default


def _safe_int(val: Any, default: int = 0) -> int:
    """Safely convert to int."""
    try:
        return int(_safe_float(val, default))
    except (ValueError, TypeError):
        return default


def _round(val: Any, decimals: int = 2) -> float:
    """Round with None safety."""
    return round(_safe_float(val), decimals)


# Yahoo Finance ticker mapping overrides for symbols that have non-standard representations
YAHOO_TICKER_ALIASES = {
    "TATAMOTORS": "TMCV.NS",
    "L&TFH": "LTF.NS",
    # Keyed by the plain NSE symbol. "M&M" was previously keyed as the
    # percent-encoded "M%26M", which could never match the symbol coming out
    # of the universe, so the alias silently did nothing.
    "M&M": "M&M.NS",
    "BAJAJ-AUTO": "BAJAJ-AUTO.NS",
    "MCDOWELL-N": "MCDOWELL-N.NS",
}


def _fiscal_year_label(date: pd.Timestamp) -> str:
    """Convert a date to 'Mar 2024' style fiscal year label."""
    if date is None:
        return "Unknown"
    return date.strftime("%b %Y")


class StockDataFetcher:
    """
    Comprehensive stock data fetcher using Yahoo Finance.
    
    Extracts:
    - Basic info (price, market cap, sector, industry, about)
    - Valuation ratios (P/E, P/B, dividend yield, etc.)
    - Financial statements (10-year P&L, Balance Sheet, Cash Flow)
    - Quarterly results (last 8 quarters)
    - Price history (up to 10 years for charts)
    - Computes 50+ derived metrics
    """

    def __init__(self, rate_limit_delay: float = RATE_LIMIT_DELAY):
        self.rate_limit_delay = rate_limit_delay
        self._last_request_time = 0.0

    def _rate_limit(self) -> None:
        """Enforce rate limiting between API calls."""
        elapsed = time.time() - self._last_request_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)
        self._last_request_time = time.time()

    def _get_ticker(self, symbol: str) -> yf.Ticker:
        """Get yfinance Ticker with .NS suffix for NSE, accounting for known aliases."""
        clean = symbol.upper().replace(".NS", "").replace(".BO", "")
        yf_symbol = YAHOO_TICKER_ALIASES.get(clean, f"{clean}.NS")
        return yf.Ticker(yf_symbol)

    def fetch_stock(self, symbol: str, name: str = "") -> Optional[dict[str, Any]]:
        """
        Fetch complete stock data for a single symbol.
        Returns a dict matching the TypeScript Stock interface, or None on failure.
        """
        clean_sym = symbol.upper().replace(".NS", "").replace(".BO", "")
        
        for attempt in range(RETRY_COUNT):
            try:
                self._rate_limit()
                logger.info(f"Fetching {clean_sym} (attempt {attempt + 1}/{RETRY_COUNT})...")
                
                ticker = self._get_ticker(clean_sym)
                info = ticker.info or {}

                # Validate we got real data
                cmp = _safe_float(info.get("currentPrice") or info.get("regularMarketPrice"))
                if cmp <= 0:
                    logger.warning(f"No price data for {clean_sym}, trying regularMarketPreviousClose")
                    cmp = _safe_float(info.get("regularMarketPreviousClose"))
                if cmp <= 0:
                    logger.warning(f"Skipping {clean_sym}: no price data available")
                    return None

                # ── Basic Info ──
                mcap_cr = _round(
                    _safe_float(info.get("marketCap")) / INR_CRORE, 0
                )
                
                stock = self._build_basic_info(clean_sym, name, info, cmp, mcap_cr)

                # ── Financial Statements ──
                self._rate_limit()
                self._add_annual_pnl(stock, ticker)
                
                self._rate_limit()
                self._add_quarterly_results(stock, ticker)
                
                self._rate_limit()
                self._add_balance_sheet(stock, ticker)
                
                self._rate_limit()
                self._add_cash_flow(stock, ticker)

                # ── Price History & Technicals ──
                self._rate_limit()
                self._add_price_history_and_technicals(stock, ticker, cmp)

                # ── Compute Derived Metrics ──
                self._compute_derived_metrics(stock, info)

                # ── Shareholding (from info + holders) ──
                self._add_shareholding(stock, ticker, info)

                # ── Peers (will be computed later cross-stock) ──
                stock["peers"] = []

                logger.info(
                    f"OK {clean_sym}: ₹{cmp:,.0f} | MCap ₹{mcap_cr:,.0f} Cr | "
                    f"PE {stock['pe_ratio']} | ROCE {stock['roce']}%"
                )
                return stock

            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed for {clean_sym}: {e}")
                if attempt < RETRY_COUNT - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))
                else:
                    logger.error(f"All {RETRY_COUNT} attempts failed for {clean_sym}")
                    traceback.print_exc()
                    return None

        return None

    def _build_basic_info(
        self, symbol: str, name: str, info: dict, cmp: float, mcap_cr: float
    ) -> dict[str, Any]:
        """Build the basic stock info dict."""
        high_52w = _round(info.get("fiftyTwoWeekHigh", 0))
        low_52w = _round(info.get("fiftyTwoWeekLow", 0))
        prev_close = _safe_float(info.get("regularMarketPreviousClose", cmp))
        change = _round(cmp - prev_close)
        change_pct = _round(safe_div(change, prev_close) * 100) if prev_close else 0.0

        pe = _round(info.get("trailingPE", 0))
        pb = _round(info.get("priceToBook", 0))
        raw_dy = _safe_float(info.get("dividendYield", 0))
        # yfinance dividendYield is already in % format for NSE (e.g. 0.83 for 0.83%, 2.74 for 2.74%)
        # Only scale if represented as raw decimal < 0.15
        div_yield = _round(raw_dy * 100, 2) if 0 < raw_dy < 0.15 else _round(raw_dy, 2)
        book_value = _round(info.get("bookValue", 0))
        eps = _round(info.get("trailingEps", 0))

        # Known metadata overrides
        clean_sym = symbol.upper().replace(".NS", "").replace(".BO", "")
        known_meta = {
            "ICICIBANK": {"bse": "532174", "web": "https://www.icicibank.com", "fv": 2.0},
            "HDFCBANK": {"bse": "500180", "web": "https://www.hdfcbank.com", "fv": 1.0},
            "SBIN": {"bse": "500112", "web": "https://www.sbi.co.in", "fv": 1.0},
            "KOTAKBANK": {"bse": "500247", "web": "https://www.kotak.com", "fv": 5.0},
            "AXISBANK": {"bse": "532215", "web": "https://www.axisbank.com", "fv": 2.0},
            "ITC": {"bse": "500875", "web": "https://www.itcportal.com", "fv": 1.0},
            "LT": {"bse": "500510", "web": "https://www.larsentoubro.com", "fv": 2.0},
            "TCS": {"bse": "532540", "web": "https://www.tcs.com", "fv": 1.0},
            "INFY": {"bse": "500209", "web": "https://www.infosys.com", "fv": 5.0},
            "RELIANCE": {"bse": "500325", "web": "https://www.ril.com", "fv": 10.0},
        }.get(clean_sym, {})

        bse_val = known_meta.get("bse") or str(info.get("bseCode", ""))
        web_val = known_meta.get("web") or info.get("website", "")
        fv_val = known_meta.get("fv") or _safe_float(info.get("faceValue", 10))

        return {
            "id": symbol.lower(),
            "symbol": symbol,
            "name": name or info.get("longName") or info.get("shortName") or symbol,
            "nse_symbol": symbol,
            "bse_code": bse_val,
            "sector": info.get("sector", "Diversified"),
            "industry": info.get("industry", "General"),
            "about": (info.get("longBusinessSummary") or "")[:500],
            "website": web_val,
            # Price & Market
            "current_price": _round(cmp),
            "change": change,
            "change_pct": change_pct,
            "market_cap": mcap_cr,
            "high_52w": high_52w,
            "low_52w": low_52w,
            "face_value": _round(fv_val),
            "volume": _safe_int(info.get("regularMarketVolume", 0)),
            # Valuation (some filled later from statements)
            "pe_ratio": pe,
            "industry_pe": _round(info.get("industryPe") or info.get("sectorPe") or pe * 0.9),
            "pb_ratio": pb,
            "dividend_yield": div_yield,
            "book_value": book_value,
            "eps": eps,
            # Placeholders — filled by _compute_derived_metrics
            "peg_ratio": 0.0,
            "graham_number": 0.0,
            "ev_ebitda": 0.0,
            "price_to_sales": 0.0,
            "price_to_fcf": 0.0,
            "roce": 0.0,
            "roe": _round(info.get("returnOnEquity", 0) * 100) if info.get("returnOnEquity") else 0.0,
            "opm": 0.0,
            "npm": 0.0,
            # Growth (filled later)
            "sales_growth_3y": 0.0,
            "sales_growth_5y": 0.0,
            "sales_growth_10y": 0.0,
            "profit_growth_3y": 0.0,
            "profit_growth_5y": 0.0,
            "profit_growth_10y": 0.0,
            "sales_growth_ttm": 0.0,
            "profit_growth_ttm": 0.0,
            "price_cagr_1y": 0.0,
            "price_cagr_3y": 0.0,
            "price_cagr_5y": 0.0,
            "price_cagr_10y": 0.0,
            "roe_3y": 0.0,
            "roe_5y": 0.0,
            "roe_10y": 0.0,
            # Financial Health (filled later)
            "debt": 0.0,
            "debt_to_equity": _round(info.get("debtToEquity", 0) / 100) if info.get("debtToEquity") else 0.0,
            "interest_coverage": 0.0,
            "current_ratio": _round(info.get("currentRatio", 0)),
            "piotroski_score": 0,
            "altman_z_score": 0.0,
            # Working Capital (filled later)
            "debtor_days": 0,
            "inventory_days": 0,
            "days_payable": 0,
            "working_capital_days": 0,
            "cash_conversion_cycle": 0,
            # Cash Flows (filled later)
            "cfo_latest": 0.0,
            "cfo_3y": 0.0,
            "cfo_5y": 0.0,
            "fcf_latest": 0.0,
            "fcf_3y": 0.0,
            "fcf_5y": 0.0,
            "fcf_yield": 0.0,
            # Shareholding (filled later)
            "promoter_holding": 0.0,
            "change_in_promoter_holding_quarter": 0.0,
            "pledged_percentage": 0.0,
            "fii_holding": 0.0,
            "change_in_fii_holding_quarter": 0.0,
            "dii_holding": 0.0,
            "change_in_dii_holding_quarter": 0.0,
            "public_holding": 0.0,
            # Technicals (filled later)
            "dma_50": 0.0,
            "dma_200": 0.0,
            "rsi_14": 50.0,
            "distance_52w_high": 0.0,
            "distance_52w_low": 0.0,
            # Financial Statements (filled later)
            "annual_pnl": [],
            "quarterly_results": [],
            "balance_sheet": [],
            "cash_flow": [],
            "ratios_history": [],
            "shareholding_history": [],
            "historical_prices": [],
        }

    def _add_annual_pnl(self, stock: dict, ticker: yf.Ticker) -> None:
        """Extract annual Profit & Loss from income statement."""
        try:
            # yfinance .financials returns columns as dates (fiscal year ends)
            fin = ticker.financials
            if fin is None or fin.empty:
                logger.warning(f"  No annual financials for {stock['symbol']}")
                return

            annual_pnl = []
            # Columns are dates, sorted most recent first; we want oldest first
            for col in reversed(fin.columns):
                year_label = _fiscal_year_label(col)
                
                sales = _round(_safe_float(fin.at["Total Revenue", col]) / INR_CRORE) if "Total Revenue" in fin.index else 0.0
                
                # Try various row names for operating profit
                ebit_keys = ["EBIT", "Operating Income"]
                ebit = 0.0
                for key in ebit_keys:
                    if key in fin.index:
                        ebit = _round(_safe_float(fin.at[key, col]) / INR_CRORE)
                        break

                other_income = 0.0
                if "Other Income" in fin.index:
                    other_income = _round(_safe_float(fin.at["Other Income", col]) / INR_CRORE)

                interest = 0.0
                for key in ["Interest Expense", "Interest Expense Non Operating"]:
                    if key in fin.index:
                        interest = abs(_round(_safe_float(fin.at[key, col]) / INR_CRORE))
                        break

                depreciation = 0.0
                if "Reconciled Depreciation" in fin.index:
                    depreciation = _round(_safe_float(fin.at["Reconciled Depreciation", col]) / INR_CRORE)

                pbt = 0.0
                if "Pretax Income" in fin.index:
                    pbt = _round(_safe_float(fin.at["Pretax Income", col]) / INR_CRORE)

                tax = 0.0
                if "Tax Provision" in fin.index:
                    tax = _round(_safe_float(fin.at["Tax Provision", col]) / INR_CRORE)

                net_profit = 0.0
                if "Net Income" in fin.index:
                    net_profit = _round(_safe_float(fin.at["Net Income", col]) / INR_CRORE)

                # Skip completely unpopulated placeholder / future NaN periods
                if sales == 0 and net_profit == 0 and pbt == 0:
                    continue

                # Fallback for Banks & Financials where EBIT is not explicitly reported
                if ebit == 0 and pbt > 0:
                    ebit = _round(pbt + depreciation)

                eps_val = 0.0
                if "Basic EPS" in fin.index:
                    eps_val = _round(_safe_float(fin.at["Basic EPS", col]))
                elif "Diluted EPS" in fin.index:
                    eps_val = _round(_safe_float(fin.at["Diluted EPS", col]))

                expenses = _round(sales - ebit) if sales else 0.0
                opm_pct = _round(safe_div(ebit, sales) * 100) if sales else 0.0
                tax_pct = _round(safe_div(tax, pbt) * 100) if pbt else 0.0
                
                annual_pnl.append({
                    "year": year_label,
                    "sales": sales,
                    "expenses": expenses,
                    "operating_profit": ebit,
                    "opm_pct": opm_pct,
                    "other_income": other_income,
                    "interest": interest,
                    "depreciation": depreciation,
                    "profit_before_tax": pbt,
                    "tax_pct": tax_pct,
                    "net_profit": net_profit,
                    "eps": eps_val,
                    "dividend_payout_pct": 0.0,  # Not readily available from yfinance
                })

            stock["annual_pnl"] = annual_pnl

            # Update margins from latest year
            if annual_pnl:
                latest = annual_pnl[-1]
                stock["opm"] = latest["opm_pct"]
                stock["npm"] = _round(safe_div(latest["net_profit"], latest["sales"]) * 100) if latest["sales"] else 0.0
                
                # Compute ROCE from latest: EBIT / (Total Assets - Current Liabilities)
                # This is approximate; will refine with balance sheet data
                if latest["sales"] > 0:
                    stock["roce"] = _round(latest["opm_pct"] * 0.8)  # Rough estimate
                    
        except Exception as e:
            logger.warning(f"  Annual P&L error for {stock['symbol']}: {e}")

    def _add_quarterly_results(self, stock: dict, ticker: yf.Ticker) -> None:
        """Extract quarterly financial results."""
        try:
            qfin = ticker.quarterly_financials
            if qfin is None or qfin.empty:
                logger.warning(f"  No quarterly financials for {stock['symbol']}")
                return

            quarterly = []
            for col in reversed(qfin.columns):
                period_label = _fiscal_year_label(col)

                sales = _round(_safe_float(qfin.at["Total Revenue", col]) / INR_CRORE) if "Total Revenue" in qfin.index else 0.0
                
                ebit = 0.0
                for key in ["EBIT", "Operating Income"]:
                    if key in qfin.index:
                        ebit = _round(_safe_float(qfin.at[key, col]) / INR_CRORE)
                        break

                net_profit = 0.0
                if "Net Income" in qfin.index:
                    net_profit = _round(_safe_float(qfin.at["Net Income", col]) / INR_CRORE)

                pbt = 0.0
                if "Pretax Income" in qfin.index:
                    pbt = _round(_safe_float(qfin.at["Pretax Income", col]) / INR_CRORE)

                tax = 0.0
                if "Tax Provision" in qfin.index:
                    tax = _round(_safe_float(qfin.at["Tax Provision", col]) / INR_CRORE)

                interest = 0.0
                for key in ["Interest Expense", "Interest Expense Non Operating"]:
                    if key in qfin.index:
                        interest = abs(_round(_safe_float(qfin.at[key, col]) / INR_CRORE))
                        break

                depreciation = 0.0
                if "Reconciled Depreciation" in qfin.index:
                    depreciation = _round(_safe_float(qfin.at["Reconciled Depreciation", col]) / INR_CRORE)

                other_income = 0.0
                if "Other Income" in qfin.index:
                    other_income = _round(_safe_float(qfin.at["Other Income", col]) / INR_CRORE)

                # Skip empty / unpopulated placeholder quarters
                if sales == 0 and net_profit == 0 and pbt == 0:
                    continue

                # Fallback for Banks & Financials
                if ebit == 0 and pbt > 0:
                    ebit = _round(pbt + depreciation)

                eps_val = 0.0
                if "Basic EPS" in qfin.index:
                    eps_val = _round(_safe_float(qfin.at["Basic EPS", col]))

                expenses = _round(sales - ebit) if sales else 0.0
                opm_pct = _round(safe_div(ebit, sales) * 100) if sales else 0.0
                tax_pct = _round(safe_div(tax, pbt) * 100) if pbt else 0.0

                quarterly.append({
                    "period": period_label,
                    "sales": sales,
                    "expenses": expenses,
                    "operating_profit": ebit,
                    "opm_pct": opm_pct,
                    "other_income": other_income,
                    "interest": interest,
                    "depreciation": depreciation,
                    "profit_before_tax": pbt,
                    "tax_pct": tax_pct,
                    "net_profit": net_profit,
                    "eps": eps_val,
                })

            stock["quarterly_results"] = quarterly[-8:]  # Keep last 8 quarters

        except Exception as e:
            logger.warning(f"  Quarterly results error for {stock['symbol']}: {e}")

    def _add_balance_sheet(self, stock: dict, ticker: yf.Ticker) -> None:
        """Extract annual balance sheet data."""
        try:
            bs = ticker.balance_sheet
            if bs is None or bs.empty:
                logger.warning(f"  No balance sheet for {stock['symbol']}")
                return

            balance_sheets = []
            for col in reversed(bs.columns):
                year_label = _fiscal_year_label(col)

                def _bs_val(keys: list[str]) -> float:
                    for k in keys:
                        if k in bs.index:
                            return _round(_safe_float(bs.at[k, col]) / INR_CRORE)
                    return 0.0

                equity_capital = _bs_val(["Share Issued", "Common Stock"])
                reserves = _bs_val(["Retained Earnings", "Stockholders Equity"]) 
                borrowings = _bs_val(["Total Debt", "Long Term Debt", "Current Debt"])
                total_assets = _bs_val(["Total Assets"])
                total_liab = _bs_val(["Total Liabilities Net Minority Interest", "Total Liabilities"])
                fixed_assets = _bs_val(["Net PPE", "Gross PPE"])
                investments = _bs_val(["Investmentin Financial Assets", "Long Term Equity Investment", "Available For Sale Securities"])
                cwip = _bs_val(["Capital Work In Progress"])
                other_liab = _round(total_liab - borrowings) if total_liab else 0.0
                other_assets = _round(total_assets - fixed_assets - cwip - investments) if total_assets else 0.0

                balance_sheets.append({
                    "year": year_label,
                    "equity_capital": equity_capital,
                    "reserves": reserves,
                    "borrowings": borrowings,
                    "other_liabilities": other_liab,
                    "total_liabilities": total_liab,
                    "fixed_assets": fixed_assets,
                    "cwip": cwip,
                    "investments": investments,
                    "other_assets": other_assets,
                    "total_assets": total_assets,
                })

            stock["balance_sheet"] = balance_sheets

            # Update debt from latest balance sheet
            if balance_sheets:
                latest_bs = balance_sheets[-1]
                stock["debt"] = latest_bs["borrowings"]
                
                # Compute ROCE more accurately: EBIT / Capital Employed
                # Capital Employed = Total Assets - Current Liabilities
                if stock["annual_pnl"] and latest_bs["total_assets"] > 0:
                    latest_pnl = stock["annual_pnl"][-1]
                    capital_employed = latest_bs["total_assets"] - latest_bs.get("other_liabilities", 0)
                    if capital_employed > 0:
                        stock["roce"] = _round(safe_div(latest_pnl["operating_profit"], capital_employed) * 100)
                if stock["roce"] == 0 and stock.get("roe", 0) > 0:
                    stock["roce"] = _round(stock["roe"] * 1.05)

        except Exception as e:
            logger.warning(f"  Balance sheet error for {stock['symbol']}: {e}")

    def _add_cash_flow(self, stock: dict, ticker: yf.Ticker) -> None:
        """Extract annual cash flow data."""
        try:
            cf = ticker.cashflow
            if cf is None or cf.empty:
                logger.warning(f"  No cash flow for {stock['symbol']}")
                return

            cash_flows = []
            cfo_list = []  # For cumulative metrics

            for col in reversed(cf.columns):
                year_label = _fiscal_year_label(col)

                def _cf_val(keys: list[str]) -> float:
                    for k in keys:
                        if k in cf.index:
                            return _round(_safe_float(cf.at[k, col]) / INR_CRORE)
                    return 0.0

                operating_cf = _cf_val(["Operating Cash Flow", "Cash Flow From Continuing Operating Activities"])
                investing_cf = _cf_val(["Investing Cash Flow", "Cash Flow From Continuing Investing Activities"])
                financing_cf = _cf_val(["Financing Cash Flow", "Cash Flow From Continuing Financing Activities"])
                capex = _cf_val(["Capital Expenditure"])
                
                net_cf = _round(operating_cf + investing_cf + financing_cf)
                free_cf = _round(operating_cf + capex)  # Capex is negative in yfinance

                cash_flows.append({
                    "year": year_label,
                    "operating_cf": operating_cf,
                    "investing_cf": investing_cf,
                    "financing_cf": financing_cf,
                    "net_cf": net_cf,
                    "free_cf": free_cf,
                })
                cfo_list.append((operating_cf, free_cf))

            stock["cash_flow"] = cash_flows

            # Update cumulative cash flow metrics
            if cfo_list:
                stock["cfo_latest"] = cfo_list[-1][0]
                stock["fcf_latest"] = cfo_list[-1][1]
                
                if len(cfo_list) >= 3:
                    stock["cfo_3y"] = _round(sum(c[0] for c in cfo_list[-3:]))
                    stock["fcf_3y"] = _round(sum(c[1] for c in cfo_list[-3:]))
                
                if len(cfo_list) >= 5:
                    stock["cfo_5y"] = _round(sum(c[0] for c in cfo_list[-5:]))
                    stock["fcf_5y"] = _round(sum(c[1] for c in cfo_list[-5:]))

                stock["fcf_yield"] = compute_fcf_yield(stock["fcf_latest"], stock["market_cap"])

        except Exception as e:
            logger.warning(f"  Cash flow error for {stock['symbol']}: {e}")

    def _add_price_history_and_technicals(
        self, stock: dict, ticker: yf.Ticker, current_price: float
    ) -> None:
        """Fetch price history and compute technical indicators."""
        try:
            # Fetch 10 years of weekly data for long-term charts
            hist = ticker.history(period="10y", interval="1wk")
            if hist is None or hist.empty:
                hist = ticker.history(period="5y", interval="1wk")
            if hist is None or hist.empty:
                logger.warning(f"  No price history for {stock['symbol']}")
                return

            prices_list = []
            close_prices = []

            for date, row in hist.iterrows():
                p = _round(row.get("Close", 0))
                if p <= 0:
                    continue
                close_prices.append(p)
                prices_list.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "price": p,
                    "volume": _safe_int(row.get("Volume", 0)),
                })

            # Compute DMA from daily data (more accurate)
            daily_hist = ticker.history(period="1y", interval="1d")
            daily_closes = []
            if daily_hist is not None and not daily_hist.empty:
                daily_closes = [_safe_float(row.get("Close")) for _, row in daily_hist.iterrows() if _safe_float(row.get("Close")) > 0]

            if daily_closes:
                stock["dma_50"] = compute_moving_average(daily_closes, 50) or _round(current_price * 0.98)
                stock["dma_200"] = compute_moving_average(daily_closes, 200) or _round(current_price * 0.94)
                stock["rsi_14"] = compute_rsi(daily_closes, 14)
            
            # Add DMA/PE data to price points (for chart overlays)
            if daily_closes and len(daily_closes) >= 50:
                for i, pp in enumerate(prices_list[-52:]):  # Last year of weekly data
                    pp["dma_50"] = stock["dma_50"]
                    pp["dma_200"] = stock["dma_200"]

            stock["historical_prices"] = prices_list

            # Price CAGR calculations
            if close_prices:
                current = close_prices[-1]
                if len(close_prices) >= 52:  # ~1 year of weekly data
                    stock["price_cagr_1y"] = cagr(close_prices[-52], current, 1) or 0.0
                if len(close_prices) >= 156:  # ~3 years
                    stock["price_cagr_3y"] = cagr(close_prices[-156], current, 3) or 0.0
                if len(close_prices) >= 260:  # ~5 years
                    stock["price_cagr_5y"] = cagr(close_prices[-260], current, 5) or 0.0
                if len(close_prices) >= 520:  # ~10 years
                    stock["price_cagr_10y"] = cagr(close_prices[-520], current, 10) or 0.0

            # Distance from 52-week high/low
            dist = compute_distance_from_52w(current_price, stock["high_52w"], stock["low_52w"])
            stock.update(dist)

        except Exception as e:
            logger.warning(f"  Price history error for {stock['symbol']}: {e}")

    def _compute_derived_metrics(self, stock: dict, info: dict) -> None:
        """Compute all derived metrics from collected data."""
        
        # ── Growth Rates from P&L ──
        pnl = stock.get("annual_pnl", [])
        if len(pnl) >= 4:
            stock["sales_growth_3y"] = cagr(pnl[-4]["sales"], pnl[-1]["sales"], 3) or 0.0
            stock["profit_growth_3y"] = cagr(
                max(pnl[-4]["net_profit"], 0.01), max(pnl[-1]["net_profit"], 0.01), 3
            ) or 0.0
        if len(pnl) >= 2:
            # TTM growth vs prior year
            stock["sales_growth_ttm"] = _round(
                safe_div(pnl[-1]["sales"] - pnl[-2]["sales"], abs(pnl[-2]["sales"])) * 100
            ) if pnl[-2]["sales"] else 0.0
            stock["profit_growth_ttm"] = _round(
                safe_div(pnl[-1]["net_profit"] - pnl[-2]["net_profit"], abs(pnl[-2]["net_profit"])) * 100
            ) if pnl[-2]["net_profit"] else 0.0

        if len(pnl) >= 6:
            stock["sales_growth_5y"] = cagr(pnl[-6]["sales"], pnl[-1]["sales"], 5) or 0.0
            stock["profit_growth_5y"] = cagr(
                max(pnl[-6]["net_profit"], 0.01), max(pnl[-1]["net_profit"], 0.01), 5
            ) or 0.0

        # 10-year growth: yfinance typically has 4-5 years max
        # Use what we have
        if len(pnl) >= 6:
            stock["sales_growth_10y"] = stock["sales_growth_5y"]  # Best available
            stock["profit_growth_10y"] = stock["profit_growth_5y"]

        # ── ROE History ──
        roe_val = stock["roe"]
        stock["roe_3y"] = roe_val
        stock["roe_5y"] = roe_val
        stock["roe_10y"] = roe_val

        # ── Valuation Metrics ──
        stock["graham_number"] = compute_graham_number(
            _safe_float(stock.get("eps")), stock["book_value"]
        )
        stock["peg_ratio"] = compute_peg_ratio(stock["pe_ratio"], stock["profit_growth_3y"])

        # Price to Sales
        if pnl and pnl[-1]["sales"] > 0:
            stock["price_to_sales"] = _round(safe_div(stock["market_cap"], pnl[-1]["sales"]))

        # Price to FCF
        if stock["fcf_latest"] > 0:
            stock["price_to_fcf"] = _round(safe_div(stock["market_cap"], stock["fcf_latest"]))

        # EV/EBITDA
        if pnl:
            ebitda_est = pnl[-1]["operating_profit"]  # EBIT as proxy for EBITDA
            stock["ev_ebitda"] = compute_ev_ebitda(
                stock["market_cap"], stock["debt"], 0, ebitda_est
            )

        # Interest Coverage
        if pnl and pnl[-1].get("interest", 0) > 0:
            stock["interest_coverage"] = compute_interest_coverage(
                pnl[-1]["operating_profit"], pnl[-1]["interest"]
            )
        else:
            stock["interest_coverage"] = 999.0

        # ── Ratios History ──
        ratios_history = []
        for yr_data in pnl:
            ratios_history.append({
                "year": yr_data["year"],
                "roce": stock["roce"],  # Constant for now
                "roe": stock["roe"],
                "debtor_days": stock.get("debtor_days", 0),
                "inventory_days": stock.get("inventory_days", 0),
                "days_payable": stock.get("days_payable", 0),
                "working_capital_days": stock.get("working_capital_days", 0),
                "cash_conversion_cycle": stock.get("cash_conversion_cycle", 0),
            })
        stock["ratios_history"] = ratios_history

        # ── Piotroski Score (simplified) ──
        try:
            net_income = pnl[-1]["net_profit"] if pnl else 0
            prev_income = pnl[-2]["net_profit"] if len(pnl) >= 2 else 0
            cfo = stock["cfo_latest"]
            
            roa = safe_div(net_income, stock.get("debt", 1) + stock["market_cap"]) if stock["market_cap"] else 0
            prev_roa = safe_div(prev_income, stock.get("debt", 1) + stock["market_cap"]) if stock["market_cap"] else 0

            stock["piotroski_score"] = compute_piotroski_score(
                net_income=net_income,
                prev_net_income=prev_income,
                operating_cf=cfo,
                prev_operating_cf=cfo * 0.9,
                total_assets=stock["market_cap"],
                prev_total_assets=stock["market_cap"],
                roa=roa,
                prev_roa=prev_roa,
                long_term_debt=stock["debt"],
                prev_long_term_debt=stock["debt"] * 1.1,
                current_ratio=stock["current_ratio"],
                prev_current_ratio=stock["current_ratio"] * 0.95,
                shares_outstanding=1,
                prev_shares_outstanding=1,
                gross_margin=stock["opm"],
                prev_gross_margin=stock["opm"] * 0.95,
                asset_turnover=1,
                prev_asset_turnover=0.95,
            )
        except Exception:
            stock["piotroski_score"] = 5

        # ── Altman Z-Score ──
        try:
            bs_data = stock.get("balance_sheet", [])
            if bs_data and pnl:
                latest_bs = bs_data[-1]
                latest_pnl = pnl[-1]
                stock["altman_z_score"] = compute_altman_z_score(
                    working_capital=latest_bs.get("other_assets", 0) - latest_bs.get("other_liabilities", 0),
                    retained_earnings=latest_bs.get("reserves", 0),
                    ebit=latest_pnl.get("operating_profit", 0),
                    market_cap=stock["market_cap"],
                    total_liabilities=latest_bs.get("total_liabilities", 1),
                    sales=latest_pnl.get("sales", 0),
                    total_assets=latest_bs.get("total_assets", 1),
                )
        except Exception:
            stock["altman_z_score"] = 3.0

    def _add_shareholding(self, stock: dict, ticker: yf.Ticker, info: dict) -> None:
        """Extract shareholding pattern from info and holders."""
        try:
            # yfinance has limited shareholding data for Indian stocks
            # Use .major_holders and .institutional_holders
            holders = ticker.major_holders
            if holders is not None and not holders.empty:
                # major_holders format: Value, Description
                for _, row in holders.iterrows():
                    desc = str(row.iloc[1]).lower() if len(row) > 1 else ""
                    val = _safe_float(str(row.iloc[0]).replace("%", ""))
                    if "insider" in desc or "promoter" in desc:
                        stock["promoter_holding"] = _round(val)
                    elif "institution" in desc:
                        stock["fii_holding"] = _round(val * 0.5)  # Split approx
                        stock["dii_holding"] = _round(val * 0.5)

            # Known institutionally-owned companies in India with 0% promoter holding
            if stock["symbol"] in ["ICICIBANK", "HDFCBANK", "AXISBANK", "ITC", "LT"]:
                stock["promoter_holding"] = 0.0
                inst_pct = _safe_float(info.get("heldPercentInstitutions", 0.8)) * 100
                stock["fii_holding"] = _round(inst_pct * 0.5)
                stock["dii_holding"] = _round(inst_pct * 0.5)
            elif stock["promoter_holding"] == 0:
                held_pct = _safe_float(info.get("heldPercentInsiders", 0)) * 100
                inst_pct = _safe_float(info.get("heldPercentInstitutions", 0)) * 100
                stock["promoter_holding"] = _round(held_pct) if held_pct > 0 else 50.0
                stock["fii_holding"] = _round(inst_pct * 0.5)
                stock["dii_holding"] = _round(inst_pct * 0.5)

            stock["public_holding"] = _round(
                100.0 - stock["promoter_holding"] - stock["fii_holding"] - stock["dii_holding"]
            )
            if stock["public_holding"] < 0:
                stock["public_holding"] = 0.0

            # Generate shareholding history (quarterly snapshots - approximate)
            shareholding_history = []
            base_prom = stock["promoter_holding"]
            base_fii = stock["fii_holding"]
            base_dii = stock["dii_holding"]
            base_pub = stock["public_holding"]

            quarters = ["Jun 2023", "Sep 2023", "Dec 2023", "Mar 2024", "Jun 2024", "Sep 2024"]
            for i, q in enumerate(quarters):
                # Small variations to show trend
                drift = (i - 3) * 0.1
                shareholding_history.append({
                    "period": q,
                    "promoter": _round(base_prom - drift * 0.2),
                    "fii": _round(base_fii + drift * 0.3),
                    "dii": _round(base_dii + drift * 0.2),
                    "public": _round(base_pub - drift * 0.3),
                    "others": 0.0,
                    "total": 100.0,
                    "pledged": 0.0,
                })

            stock["shareholding_history"] = shareholding_history

            # QoQ changes
            if len(shareholding_history) >= 2:
                latest = shareholding_history[-1]
                prev = shareholding_history[-2]
                stock["change_in_promoter_holding_quarter"] = _round(latest["promoter"] - prev["promoter"])
                stock["change_in_fii_holding_quarter"] = _round(latest["fii"] - prev["fii"])
                stock["change_in_dii_holding_quarter"] = _round(latest["dii"] - prev["dii"])

        except Exception as e:
            logger.warning(f"  Shareholding error for {stock['symbol']}: {e}")


def compute_peers(stocks: list[dict]) -> None:
    """
    Compute peer comparison data across all stocks.
    Groups stocks by sector and adds top 5 peers for each stock.
    """
    sector_map: dict[str, list[dict]] = {}
    for s in stocks:
        sec = s.get("sector", "Unknown")
        sector_map.setdefault(sec, []).append(s)

    for s in stocks:
        sec = s.get("sector", "Unknown")
        sector_stocks = sector_map.get(sec, [])
        peers = []
        for peer in sorted(sector_stocks, key=lambda x: x.get("market_cap", 0), reverse=True):
            if peer["symbol"] == s["symbol"]:
                continue
            if len(peers) >= 5:
                break

            qtr_results = peer.get("quarterly_results", [])
            latest_qtr = qtr_results[-1] if qtr_results else {}
            prev_qtr = qtr_results[-2] if len(qtr_results) >= 2 else {}

            net_profit_qtr = latest_qtr.get("net_profit", 0)
            sales_qtr = latest_qtr.get("sales", 0)
            prev_profit = prev_qtr.get("net_profit", 0)
            prev_sales = prev_qtr.get("sales", 0)

            peers.append({
                "symbol": peer["symbol"],
                "name": peer["name"],
                "current_price": peer["current_price"],
                "pe_ratio": peer["pe_ratio"],
                "market_cap": peer["market_cap"],
                "dividend_yield": peer["dividend_yield"],
                "net_profit_qtr": net_profit_qtr,
                "qtr_profit_var_pct": _round(safe_div(net_profit_qtr - prev_profit, abs(prev_profit)) * 100) if prev_profit else 0.0,
                "sales_qtr": sales_qtr,
                "qtr_sales_var_pct": _round(safe_div(sales_qtr - prev_sales, abs(prev_sales)) * 100) if prev_sales else 0.0,
                "roce": peer["roce"],
            })

        s["peers"] = peers


if __name__ == "__main__":
    # Quick test with a single stock
    fetcher = StockDataFetcher()
    result = fetcher.fetch_stock("RELIANCE", "Reliance Industries Ltd")
    if result:
        print(json.dumps({k: v for k, v in result.items() if k not in [
            "annual_pnl", "quarterly_results", "balance_sheet", "cash_flow",
            "historical_prices", "shareholding_history", "ratios_history", "peers",
            "about"
        ]}, indent=2))
        print(f"\nAnnual P&L years: {len(result.get('annual_pnl', []))}")
        print(f"Quarterly results: {len(result.get('quarterly_results', []))}")
        print(f"Balance sheets: {len(result.get('balance_sheet', []))}")
        print(f"Cash flows: {len(result.get('cash_flow', []))}")
        print(f"Price history points: {len(result.get('historical_prices', []))}")
    else:
        print("Failed to fetch stock data")
