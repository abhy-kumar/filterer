"""
consensus_engine.py
-------------------
Reconciles financial, shareholding, and efficiency metrics across
multiple independent sources (NSE, Screener.in, Tickertape, statements)
using tolerance-based consensus logic.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

DEFAULT_TOLERANCE_PCT = 0.75  # 0.75% tolerance for shareholding percentages
DEFAULT_TOLERANCE_DAYS = 3    # 3 days tolerance for working capital days


def is_close(
    val1: Optional[float],
    val2: Optional[float],
    tolerance: float = DEFAULT_TOLERANCE_PCT,
) -> bool:
    """True if both values are valid numbers within the allowed tolerance."""
    if val1 is None or val2 is None:
        return False
    return abs(val1 - val2) <= tolerance


def reconcile_promoter(
    nse_prom: Optional[float],
    scr_prom: Optional[float],
    tt_prom: Optional[float],
) -> Tuple[Optional[float], str]:
    """
    Reconcile promoter percentage.
    Statutory NSE regulatory filing is top authority if supported by peers.
    """
    # 3-way consensus
    if nse_prom is not None and scr_prom is not None and tt_prom is not None:
        if is_close(nse_prom, scr_prom) and is_close(nse_prom, tt_prom):
            return nse_prom, "NSE + Screener + Tickertape"
        if is_close(nse_prom, scr_prom):
            return nse_prom, "NSE + Screener"
        if is_close(scr_prom, tt_prom):
            return round((scr_prom + tt_prom) / 2.0, 2), "Screener + Tickertape"

    # 2-way consensus
    if nse_prom is not None and scr_prom is not None:
        if is_close(nse_prom, scr_prom, tolerance=1.0):
            return nse_prom, "NSE + Screener"
        return nse_prom, "NSE filings"

    if scr_prom is not None and tt_prom is not None:
        if is_close(scr_prom, tt_prom, tolerance=1.0):
            return round((scr_prom + tt_prom) / 2.0, 2), "Screener + Tickertape"
        return scr_prom, "Screener.in"

    if nse_prom is not None:
        return nse_prom, "NSE filings"
    if scr_prom is not None:
        return scr_prom, "Screener.in"
    if tt_prom is not None:
        return tt_prom, "Tickertape"

    return None, "None"


def reconcile_institutional(
    scr_val: Optional[float],
    tt_val: Optional[float],
) -> Tuple[Optional[float], str]:
    """Reconcile FII or DII percentage between Screener and Tickertape."""
    if scr_val is not None and tt_val is not None:
        if is_close(scr_val, tt_val, tolerance=1.0):
            return round((scr_val + tt_val) / 2.0, 2), "Screener + Tickertape"
        return scr_val, "Screener.in"

    if scr_val is not None:
        return scr_val, "Screener.in"
    if tt_val is not None:
        return tt_val, "Tickertape"

    return None, "None"


def reconcile_shareholding(
    nse_history: List[Dict[str, Any]],
    scr_history: List[Dict[str, Any]],
    tt_history: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Produce a unified, cross-validated quarterly shareholding history.
    """
    nse_by_period = {r["period"]: r for r in nse_history if r.get("period")}
    scr_by_period = {r["period"]: r for r in scr_history if r.get("period")}
    tt_by_period = {r["period"]: r for r in tt_history if r.get("period")}

    # All unique periods
    all_periods = sorted(
        set(nse_by_period.keys()) | set(scr_by_period.keys()) | set(tt_by_period.keys()),
        key=_period_sort_key,
    )

    reconciled_records: List[Dict[str, Any]] = []

    for period in all_periods:
        nse_rec = nse_by_period.get(period, {})
        scr_rec = scr_by_period.get(period, {})
        tt_rec = tt_by_period.get(period, {})

        prom, prom_src = reconcile_promoter(
            nse_rec.get("promoter"),
            scr_rec.get("promoter"),
            tt_rec.get("promoter"),
        )
        fii, fii_src = reconcile_institutional(
            scr_rec.get("fii"),
            tt_rec.get("fii"),
        )
        dii, dii_src = reconcile_institutional(
            scr_rec.get("dii"),
            tt_rec.get("dii"),
        )

        pledged = tt_rec.get("pledged")
        if pledged is None:
            pledged = scr_rec.get("pledged")

        others = scr_rec.get("others") or nse_rec.get("others") or tt_rec.get("others")

        public = scr_rec.get("public")
        if public is None and prom is not None and fii is not None and dii is not None:
            calc_pub = 100.0 - prom - fii - dii - (others or 0.0)
            if calc_pub >= 0:
                public = round(calc_pub, 2)

        total_sum = sum(v for v in (prom, fii, dii, public, others) if v is not None)
        total = 100.0 if (99.0 <= total_sum <= 101.0) else round(total_sum, 2)

        reconciled_records.append({
            "period": period,
            "promoter": prom,
            "fii": fii,
            "dii": dii,
            "public": public,
            "others": others,
            "total": total,
            "pledged": pledged,
            "source": f"Consensus ({prom_src})",
        })

    return reconciled_records


def _period_sort_key(label: str) -> Tuple[int, int]:
    order = {"Mar": 0, "Jun": 1, "Sep": 2, "Dec": 3}
    try:
        parts = label.strip().split(" ")
        if len(parts) == 2:
            return int(parts[1]), order.get(parts[0], 0)
    except Exception:
        pass
    return 0, 0


def reconcile_ratios_history(
    scr_ratios: List[Dict[str, Any]],
    current_roce: Optional[float] = None,
    current_roe: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """
    Build real ratio history using verified values from Screener.in,
    replacing synthetic flat ROCE.
    """
    records: List[Dict[str, Any]] = []
    for r in scr_ratios:
        year = r.get("year")
        if not year:
            continue
        roce = r.get("roce")
        roe = r.get("roe")
        debtor_days = r.get("debtor_days")
        inventory_days = r.get("inventory_days")
        days_payable = r.get("days_payable")
        working_capital_days = r.get("working_capital_days")
        cash_conversion_cycle = r.get("cash_conversion_cycle")

        records.append({
            "year": year,
            "roce": roce,
            "roe": roe,
            "debtor_days": debtor_days,
            "inventory_days": inventory_days,
            "days_payable": days_payable,
            "working_capital_days": working_capital_days,
            "cash_conversion_cycle": cash_conversion_cycle,
        })

    return records


def extract_snapshot_metrics(
    reconciled_shareholding: List[Dict[str, Any]],
    reconciled_ratios: List[Dict[str, Any]],
    growth_data: Dict[str, Optional[float]],
    sector: str = "",
) -> Dict[str, Any]:
    """
    Extract latest scalar metrics for the screening tier (stocksData.ts / DB).
    """
    snapshot: Dict[str, Any] = {}

    # Shareholding snapshot
    if reconciled_shareholding:
        latest = reconciled_shareholding[-1]
        snapshot["promoter_holding"] = latest.get("promoter")
        snapshot["fii_holding"] = latest.get("fii")
        snapshot["dii_holding"] = latest.get("dii")
        snapshot["public_holding"] = latest.get("public")
        snapshot["pledged_percentage"] = latest.get("pledged")

        if len(reconciled_shareholding) >= 2:
            prev = reconciled_shareholding[-2]
            if latest.get("promoter") is not None and prev.get("promoter") is not None:
                snapshot["change_in_promoter_holding_quarter"] = round(latest["promoter"] - prev["promoter"], 2)
            if latest.get("fii") is not None and prev.get("fii") is not None:
                snapshot["change_in_fii_holding_quarter"] = round(latest["fii"] - prev["fii"], 2)
            if latest.get("dii") is not None and prev.get("dii") is not None:
                snapshot["change_in_dii_holding_quarter"] = round(latest["dii"] - prev["dii"], 2)

    # Ratios snapshot (skip working capital for Financials/Banks/NBFCs)
    is_financial = "financial" in sector.lower() or "bank" in sector.lower()
    if reconciled_ratios and not is_financial:
        # Find latest entry with reported working capital
        for r in reversed(reconciled_ratios):
            if r.get("debtor_days") is not None or r.get("cash_conversion_cycle") is not None:
                snapshot["debtor_days"] = r.get("debtor_days")
                snapshot["inventory_days"] = r.get("inventory_days")
                snapshot["days_payable"] = r.get("days_payable")
                snapshot["working_capital_days"] = r.get("working_capital_days")
                snapshot["cash_conversion_cycle"] = r.get("cash_conversion_cycle")
                break

    # Growth & multi-year CAGRs
    for k in (
        "sales_growth_3y", "sales_growth_5y", "sales_growth_10y",
        "profit_growth_3y", "profit_growth_5y", "profit_growth_10y",
        "roe_3y", "roe_5y", "roe_10y",
    ):
        val = growth_data.get(k)
        if val is not None:
            snapshot[k] = val

    return snapshot


def reconcile_scalar_metric(
    metric_name: str,
    values_by_source: Dict[str, Optional[float]],
    tolerance_pct: float = 0.05,
    zero_is_sentinel: bool = True,
    priority_order: Optional[List[str]] = None,
) -> Tuple[Optional[float], str]:
    """
    Reconciles a numeric metric across multiple independent sources with
    strict Zero-Poisoning Immunity:

    1. Missing (None/NaN) is cleanly separated from real 0.
    2. Zero-Poisoning Immunity: If any source reports a valid positive number,
       uncorroborated zeros from failed/defaulted sources are rejected and NEVER
       allowed to pull down the average or win by default.
    3. Tolerance Clustering: Values within tolerance_pct are averaged to form a consensus.
    4. Single Source: If only one source succeeded, its value is safely retained.
    """
    if priority_order is None:
        priority_order = ["Screener.in", "Tickertape", "Yahoo Finance", "NSE/BSE"]

    # 1. Clean valid inputs (ignore None, NaN)
    valid_entries: Dict[str, float] = {}
    for src, val in values_by_source.items():
        if val is not None:
            try:
                f_val = float(val)
                if not (f_val != f_val):  # not NaN
                    valid_entries[src] = f_val
            except (ValueError, TypeError):
                continue

    if not valid_entries:
        return None, "None"

    positive_entries = {k: v for k, v in valid_entries.items() if v > 0}

    # 2. Zero-Poisoning Immunity Guard
    # If any source has a positive reading and zero is a common failure sentinel,
    # discard uncorroborated zeroes!
    if positive_entries and zero_is_sentinel:
        working_entries = positive_entries
    else:
        working_entries = valid_entries

    # Check if all sources reported 0
    if not positive_entries and all(v == 0 for v in working_entries.values()):
        sources_str = " + ".join(sorted(working_entries.keys()))
        return 0.0, f"Corroborated Zero ({sources_str})"

    # Single source case
    if len(working_entries) == 1:
        src, val = next(iter(working_entries.items()))
        return round(val, 2), f"Single Source ({src})"

    # 3. Multi-source tolerance clustering
    items = list(working_entries.items())
    best_cluster: List[Tuple[str, float]] = []

    for i in range(len(items)):
        cluster = [items[i]]
        val_i = items[i][1]
        for j in range(len(items)):
            if i == j:
                continue
            val_j = items[j][1]
            denom = max(abs(val_i), abs(val_j), 1.0)
            diff_pct = abs(val_i - val_j) / denom
            if diff_pct <= tolerance_pct:
                cluster.append(items[j])
        if len(cluster) > len(best_cluster):
            best_cluster = cluster

    if len(best_cluster) >= 2:
        avg_val = sum(v for _, v in best_cluster) / len(best_cluster)
        sources_str = " + ".join(src for src, _ in best_cluster)
        return round(avg_val, 2), f"Consensus ({sources_str})"

    # Disagreement fallback: follow priority order
    for preferred in priority_order:
        if preferred in working_entries:
            return round(working_entries[preferred], 2), f"{preferred} (Disagreement fallback)"

    # Fallback to first available working entry
    src, val = next(iter(working_entries.items()))
    return round(val, 2), f"{src} (Fallback)"


def reconcile_fundamentals(
    symbol: str,
    sources_dict: Dict[str, Dict[str, Any]],
    sector: str = "",
    current_price: Optional[float] = None,
    market_cap: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Cross-validates debt, book value, ROCE, and P/E across sources,
    applying zero-poisoning immunity and domain constraints.
    """
    is_financial = "financial" in sector.lower() or "bank" in sector.lower()

    debt_sources: Dict[str, Optional[float]] = {}
    bv_sources: Dict[str, Optional[float]] = {}
    roce_sources: Dict[str, Optional[float]] = {}
    pe_sources: Dict[str, Optional[float]] = {}
    mcap_sources: Dict[str, Optional[float]] = {}

    for src_name, payload in sources_dict.items():
        if not payload:
            continue
        d = payload.get("debt") if payload.get("debt") is not None else payload.get("borrowings")
        if d is not None:
            debt_sources[src_name] = d
        if payload.get("book_value") is not None:
            bv_sources[src_name] = payload["book_value"]
        if payload.get("roce") is not None:
            roce_sources[src_name] = payload["roce"]
        if payload.get("pe_ratio") is not None:
            pe_sources[src_name] = payload["pe_ratio"]
        if payload.get("market_cap") is not None:
            mcap_sources[src_name] = payload["market_cap"]

    reconciled_debt, debt_src = reconcile_scalar_metric(
        "debt", debt_sources, tolerance_pct=0.08, zero_is_sentinel=True
    )
    reconciled_bv, bv_src = reconcile_scalar_metric(
        "book_value", bv_sources, tolerance_pct=0.05, zero_is_sentinel=False
    )
    reconciled_roce, roce_src = reconcile_scalar_metric(
        "roce", roce_sources, tolerance_pct=0.10, zero_is_sentinel=False
    )
    reconciled_pe, pe_src = reconcile_scalar_metric(
        "pe_ratio", pe_sources, tolerance_pct=0.05, zero_is_sentinel=False
    )
    reconciled_mcap, mcap_src = reconcile_scalar_metric(
        "market_cap", mcap_sources, tolerance_pct=0.05, zero_is_sentinel=True
    )

    cmp = current_price
    mcap = reconciled_mcap if reconciled_mcap is not None else market_cap

    de_ratio = None
    if is_financial:
        de_ratio = None
    elif reconciled_bv is not None and reconciled_bv <= 0:
        de_ratio = None
    elif reconciled_debt is not None:
        if reconciled_debt == 0:
            de_ratio = 0.0
        elif reconciled_bv is not None and reconciled_bv > 0 and cmp and mcap and cmp > 0:
            shares = (mcap * 10000000) / cmp
            equity = (reconciled_bv * shares) / 10000000
            if equity > 0:
                de_ratio = round(reconciled_debt / equity, 2)

    return {
        "debt": reconciled_debt,
        "debt_source": debt_src,
        "debt_to_equity": de_ratio,
        "book_value": reconciled_bv,
        "book_value_source": bv_src,
        "roce": reconciled_roce,
        "roce_source": roce_src,
        "pe_ratio": reconciled_pe,
        "pe_source": pe_src,
        "market_cap": reconciled_mcap,
        "market_cap_source": mcap_src,
    }

