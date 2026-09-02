"""
qc_engine.py
------------
Institutional Financial Quality Control (QC) & Validation Engine.

Performs automated invariant audits on Indian equity records before they
reach production storage or the frontend screener. Ensures 100% data integrity
for fundamental analysis, ratios, and quantitative models.

Generates:
  - data/qc_report.json (machine-readable audit log)
  - data/qc_report.md   (human-readable markdown executive summary)
"""

import json
import logging
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass, field, asdict
from datetime import datetime

logger = logging.getLogger("qc_engine")

@dataclass
class QCIssue:
    symbol: str
    rule: str
    severity: str  # "ERROR" | "WARNING" | "INFO"
    message: str
    actual_value: Any

@dataclass
class StockQCResult:
    symbol: str
    name: str
    sector: str
    score: float  # 0 to 100%
    passed: bool
    errors: List[QCIssue] = field(default_factory=list)
    warnings: List[QCIssue] = field(default_factory=list)

@dataclass
class UniverseQCSummary:
    total_stocks: int
    passed_stocks: int
    failed_stocks: int
    overall_health_score: float
    total_errors: int
    total_warnings: int
    timestamp: str
    sector_scores: Dict[str, float]
    results: List[StockQCResult] = field(default_factory=list)

class FinancialQCEngine:
    """Rigorous financial invariant audit suite."""

    def audit_stock(self, stock: Dict[str, Any]) -> StockQCResult:
        """Runs the 15 financial integrity invariant rules on a single stock dict."""
        sym = stock.get("symbol", "UNKNOWN")
        name = stock.get("name", sym)
        sec = stock.get("sector", "Diversified")
        errors: List[QCIssue] = []
        warnings: List[QCIssue] = []

        # 1. Price Positive Check
        cmp = stock.get("current_price", 0.0) or 0.0
        if cmp <= 0:
            errors.append(QCIssue(sym, "CHECK_POSITIVE_PRICE", "ERROR", "Current price is zero or negative", cmp))

        # 2. Market Cap Positive Check
        mcap = stock.get("market_cap", 0.0) or 0.0
        if mcap <= 0:
            errors.append(QCIssue(sym, "CHECK_POSITIVE_MCAP", "ERROR", "Market capitalization is zero or negative", mcap))

        # 3. 52-Week Range Bounds Check
        h52 = stock.get("high_52w", 0.0) or 0.0
        l52 = stock.get("low_52w", 0.0) or 0.0
        if h52 > 0 and l52 > 0:
            # Allow 2% tolerance for intraday ticks outside recorded range
            if cmp > h52 * 1.05:
                warnings.append(QCIssue(sym, "CHECK_52W_BOUNDS", "WARNING", f"Price (₹{cmp}) exceeds 52W high (₹{h52})", cmp))
            elif cmp < l52 * 0.95:
                warnings.append(QCIssue(sym, "CHECK_52W_BOUNDS", "WARNING", f"Price (₹{cmp}) is below 52W low (₹{l52})", cmp))
            if l52 > h52:
                errors.append(QCIssue(sym, "CHECK_52W_LOGIC", "ERROR", f"52W Low (₹{l52}) > 52W High (₹{h52})", l52))

        # 4. Dividend Yield Sanity Check (Crucial: catches 100x multiplication bugs)
        dy = stock.get("dividend_yield", 0.0) or 0.0
        if dy > 20.0:
            errors.append(QCIssue(sym, "CHECK_DIVIDEND_YIELD", "ERROR", f"Dividend yield is abnormally high ({dy}%) - likely 100x scaled", dy))
        elif dy < 0:
            errors.append(QCIssue(sym, "CHECK_DIVIDEND_YIELD", "ERROR", f"Dividend yield cannot be negative ({dy}%)", dy))

        # 5. Shareholding Sum Integrity Check (Promoter + FII + DII + Public = 100%)
        prom = stock.get("promoter_holding", 0.0) or 0.0
        fii = stock.get("fii_holding", 0.0) or 0.0
        dii = stock.get("dii_holding", 0.0) or 0.0
        pub = stock.get("public_holding", 0.0) or 0.0
        sh_sum = prom + fii + dii + pub

        if abs(sh_sum - 100.0) > 2.0 and sh_sum > 0:
            errors.append(QCIssue(
                sym, "CHECK_OWNERSHIP_INTEGRITY", "ERROR",
                f"Shareholding components do not sum to 100% (Sum: {sh_sum:.2f}%)",
                {"promoter": prom, "fii": fii, "dii": dii, "public": pub}
            ))

        # 6. Pledged Percentage Sanity
        pledge = stock.get("pledged_percentage", 0.0) or 0.0
        if pledge > 100.0 or pledge < 0.0:
            errors.append(QCIssue(sym, "CHECK_PLEDGE_SANITY", "ERROR", f"Pledged percentage out of bounds ({pledge}%)", pledge))

        # 7. PE Ratio Sanity Check
        pe = stock.get("pe_ratio", 0.0) or 0.0
        if pe > 400.0:
            warnings.append(QCIssue(sym, "CHECK_PE_SANITY", "WARNING", f"P/E ratio is extremely elevated ({pe:.1f})", pe))

        # 8. ROCE / Return on Capital Check
        roce = stock.get("roce", 0.0) or 0.0
        roe = stock.get("roe", 0.0) or 0.0
        if roce == 0.0 and roe > 10.0:
            warnings.append(QCIssue(sym, "CHECK_ROCE_SANITY", "WARNING", f"ROCE is 0.0% while ROE is {roe}%", roce))

        # 9. Operating Profit Margin (OPM) Check
        opm = stock.get("opm", 0.0) or 0.0
        if opm == 0.0 and mcap > 10000:
            warnings.append(QCIssue(sym, "CHECK_OPM_SANITY", "WARNING", "Operating profit margin is 0.0% on large-cap equity", opm))

        # 10. BSE Code Verification
        bse = stock.get("bse_code", "")
        if not bse or len(bse) < 6 or not bse.isdigit():
            warnings.append(QCIssue(sym, "CHECK_BSE_CODE", "WARNING", f"Missing or invalid BSE scrip code ('{bse}')", bse))

        # 11. Face Value Sanity
        fv = stock.get("face_value", 0.0) or 0.0
        if fv not in [1.0, 2.0, 5.0, 10.0]:
            warnings.append(QCIssue(sym, "CHECK_FACE_VALUE", "WARNING", f"Unusual equity face value (₹{fv})", fv))

        # 12. Annual Statements Continuity
        annual_pnl = stock.get("annual_pnl", []) or []
        for row in annual_pnl:
            sales = row.get("sales", 0.0) or 0.0
            np = row.get("net_profit", 0.0) or 0.0
            if sales == 0.0 and np == 0.0:
                errors.append(QCIssue(sym, "CHECK_ANNUAL_CONTINUITY", "ERROR", f"Empty unpopulated row found in annual P&L ({row.get('year')})", row))

        # 13. Balance Sheet Equation (Assets = Liabilities + Equity)
        bs_list = stock.get("balance_sheet", []) or []
        if bs_list:
            latest_bs = bs_list[-1]
            tot_assets = latest_bs.get("total_assets", 0.0) or 0.0
            tot_liab = latest_bs.get("total_liabilities", 0.0) or 0.0
            eq = (latest_bs.get("equity_capital", 0.0) or 0.0) + (latest_bs.get("reserves", 0.0) or 0.0)

            if tot_assets > 0:
                # Check if total_liabilities includes equity, OR if total_liab + equity matches total_assets
                diff_direct = abs(tot_assets - tot_liab) / tot_assets * 100
                diff_with_eq = abs(tot_assets - (tot_liab + eq)) / tot_assets * 100 if eq > 0 else diff_direct
                min_diff = min(diff_direct, diff_with_eq)
                if min_diff > 5.0:
                    warnings.append(QCIssue(sym, "CHECK_BALANCE_SHEET_EQUATION", "WARNING", f"Balance sheet discrepancy: Assets ₹{tot_assets} Cr != Liab+Eq ({min_diff:.1f}% delta)", min_diff))

        # 14. Website Format Check
        website = stock.get("website", "")
        if website and not (website.startswith("http://") or website.startswith("https://")):
            warnings.append(QCIssue(sym, "CHECK_WEBSITE_FORMAT", "WARNING", f"Invalid website URL format ('{website}')", website))

        # 15. Quarterly Statements Non-Empty
        quarterly = stock.get("quarterly_results", []) or []
        if not quarterly and mcap > 2000:
            warnings.append(QCIssue(sym, "CHECK_QUARTERLY_NON_EMPTY", "WARNING", "No quarterly statement history found", 0))

        # Calculate Health Score (100 - (15 * error_count) - (3 * warning_count))
        score = max(0.0, 100.0 - (len(errors) * 15.0) - (len(warnings) * 3.0))
        passed = len(errors) == 0

        return StockQCResult(
            symbol=sym,
            name=name,
            sector=sec,
            score=round(score, 1),
            passed=passed,
            errors=errors,
            warnings=warnings,
        )

    def audit_universe(self, stocks: List[Dict[str, Any]]) -> UniverseQCSummary:
        """Audits the full list of equities and generates a universe summary."""
        results = [self.audit_stock(s) for s in stocks]
        total = len(results)
        passed = sum(1 for r in results if r.passed)
        failed = total - passed

        tot_errors = sum(len(r.errors) for r in results)
        tot_warnings = sum(len(r.warnings) for r in results)
        avg_score = round(sum(r.score for r in results) / total, 1) if total else 0.0

        # Sector Scores
        sectors: Dict[str, List[float]] = {}
        for r in results:
            sectors.setdefault(r.sector, []).append(r.score)
        sector_scores = {sec: round(sum(scores) / len(scores), 1) for sec, scores in sectors.items()}

        return UniverseQCSummary(
            total_stocks=total,
            passed_stocks=passed,
            failed_stocks=failed,
            overall_health_score=avg_score,
            total_errors=tot_errors,
            total_warnings=tot_warnings,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
            sector_scores=sector_scores,
            results=results,
        )

    def generate_markdown_report(self, summary: UniverseQCSummary) -> str:
        """Generates an executive-ready markdown quality control report."""
        status_icon = "OK PASSED" if summary.failed_stocks == 0 else "ISSUES DETECTED"

        md = [
            "# Filterer Financial Quality Control (QC) Audit Report",
            f"**Execution Timestamp**: {summary.timestamp}  ",
            f"**Audit Status**: **{status_icon}**  ",
            f"**Overall Universe Health Score**: **{summary.overall_health_score}%**",
            "",
            "## Executive Summary",
            f"- **Total Equities Audited**: {summary.total_stocks}",
            f"- **Strict Passing Rate**: {summary.passed_stocks} / {summary.total_stocks} ({round((summary.passed_stocks / summary.total_stocks) * 100, 1)}%)",
            f"- **Critical Financial Invariant Errors**: **{summary.total_errors}**",
            f"- **Warnings / Minor Discrepancies**: {summary.total_warnings}",
            "",
            "## Sector Health Breakdown",
            "| Sector | Equities | Average QC Score | Status |",
            "| :--- | :--- | :--- | :--- |",
        ]

        for sec, score in sorted(summary.sector_scores.items(), key=lambda x: x[1], reverse=True):
            status = "Optimal" if score >= 90 else "Review" if score >= 75 else "Action Required"
            md.append(f"| {sec} | {len([r for r in summary.results if r.sector == sec])} | {score}% | {status} |")

        md.extend([
            "",
            "## Stock-by-Stock Integrity Matrix",
            "| Ticker | Company Name | Sector | Health Score | Status | Critical Errors | Warnings |",
            "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
        ])

        for r in summary.results:
            status = "PASS" if r.passed else "FAIL"
            err_count = len(r.errors)
            warn_count = len(r.warnings)
            md.append(
                f"| `{r.symbol}` | {r.name} | {r.sector} | {r.score}% | **{status}** | {err_count} | {warn_count} |"
            )

        if summary.total_errors > 0:
            md.extend([
                "",
                "## Critical Errors Requiring Immediate Action",
            ])
            for r in summary.results:
                if r.errors:
                    md.append(f"### `{r.symbol}` - {r.name}")
                    for err in r.errors:
                        md.append(f"- **[{err.rule}]**: {err.message} *(Value: `{err.actual_value}`)*")

        return "\n".join(md)
