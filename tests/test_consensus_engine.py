"""
test_consensus_engine.py
------------------------
Unit tests for multi-source reconciliation and consensus engine.
"""

from data_pipeline.consensus_engine import (
    is_close,
    reconcile_promoter,
    reconcile_institutional,
    reconcile_shareholding,
    reconcile_ratios_history,
    extract_snapshot_metrics,
)


def test_is_close():
    assert is_close(50.1, 50.4, tolerance=0.5) is True
    assert is_close(50.1, 50.7, tolerance=0.5) is False
    assert is_close(None, 50.0) is False
    assert is_close(50.0, None) is False


def test_reconcile_promoter_3way():
    prom, src = reconcile_promoter(50.48, 50.48, 50.40)
    assert prom == 50.48
    assert "NSE + Screener" in src


def test_reconcile_promoter_fallback():
    prom, src = reconcile_promoter(None, 55.0, 55.2)
    assert prom == 55.1
    assert "Screener + Tickertape" in src


def test_reconcile_institutional():
    fii, src = reconcile_institutional(17.20, 17.10)
    assert fii == 17.15
    assert "Screener + Tickertape" in src

    # Only screener
    fii2, src2 = reconcile_institutional(15.0, None)
    assert fii2 == 15.0
    assert "Screener.in" in src2


def test_reconcile_shareholding_complete():
    nse = [{"period": "Jun 2026", "promoter": 50.48, "public": 49.52}]
    scr = [{"period": "Jun 2026", "promoter": 50.48, "fii": 17.19, "dii": 21.10, "public": 11.05, "others": 0.17}]
    tt = [{"period": "Jun 2026", "promoter": 50.40, "pledged": 0.0, "fii": 17.10, "dii": 21.05, "public": 11.45}]

    reconciled = reconcile_shareholding(nse, scr, tt)
    assert len(reconciled) == 1
    row = reconciled[0]
    assert row["period"] == "Jun 2026"
    assert row["promoter"] == 50.48
    assert row["pledged"] == 0.0
    assert row["fii"] == 17.15
    assert row["dii"] == 21.08
    assert row["total"] == 100.0


def test_extract_snapshot_metrics():
    shareholding = [
        {"period": "Mar 2026", "promoter": 50.0, "fii": 16.0, "dii": 20.0, "pledged": 0.0, "public": 14.0},
        {"period": "Jun 2026", "promoter": 50.48, "fii": 17.15, "dii": 21.08, "pledged": 0.0, "public": 11.29},
    ]
    ratios = [
        {"year": "Mar 2026", "debtor_days": 20, "inventory_days": 88, "days_payable": 84, "working_capital_days": -66, "cash_conversion_cycle": 25, "roce": 10.0}
    ]
    growth = {
        "sales_growth_3y": 6.0,
        "sales_growth_5y": 18.0,
        "sales_growth_10y": 15.0,
        "profit_growth_3y": 5.0,
        "profit_growth_5y": 12.0,
        "profit_growth_10y": 10.0,
        "roe_3y": 9.0,
        "roe_5y": 9.0,
        "roe_10y": 9.0,
    }
    snapshot = extract_snapshot_metrics(shareholding, ratios, growth, sector="Energy")
    assert snapshot["promoter_holding"] == 50.48
    assert snapshot["fii_holding"] == 17.15
    assert snapshot["dii_holding"] == 21.08
    assert snapshot["change_in_promoter_holding_quarter"] == 0.48
    assert snapshot["change_in_fii_holding_quarter"] == 1.15
    assert snapshot["debtor_days"] == 20
    assert snapshot["sales_growth_5y"] == 18.0
    assert snapshot["roe_3y"] == 9.0
