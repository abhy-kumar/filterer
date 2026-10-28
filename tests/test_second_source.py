"""
Tests for data_pipeline/second_source.py. No network: the statement rows are
cut down from Tickertape's responses for HCL Tech.
"""

from data_pipeline import second_source
from data_pipeline.second_source import merge_statements, resolve_sid, year_label


def test_financial_years_take_the_filed_label_and_ttm_is_dropped():
    assert year_label("FY 2026") == "Mar 2026"
    assert year_label("TTM") is None
    assert year_label("") is None


def test_statements_merge_by_year_and_ebit_is_not_ebitda():
    income = [
        {"displayPeriod": "FY 2026", "incTrev": 131674, "incPbi": 22971, "incEbi": 27326, "incNinc": 16642},
        {"displayPeriod": "TTM", "incTrev": 139354},
    ]
    balance = [{"displayPeriod": "FY 2026", "balTota": 115112, "balTcl": 31826, "balTca": 70542}]
    [row] = merge_statements(income, balance)
    assert row["year"] == "Mar 2026"
    assert row["ebit"] == 22971
    assert row["ebitda"] == 27326
    assert row["total_assets"] == 115112
    assert row["current_liabilities"] == 31826


def test_only_the_latest_years_are_kept():
    income = [{"displayPeriod": f"FY {y}", "incTrev": y} for y in range(2018, 2027)]
    rows = merge_statements(income, [], keep=3)
    assert [r["year"] for r in rows] == ["Mar 2024", "Mar 2025", "Mar 2026"]


def test_a_fuzzy_search_hit_is_not_taken_for_the_company(monkeypatch):
    monkeypatch.setattr(
        second_source,
        "_get",
        lambda path: {"data": {"stocks": [{"ticker": "HCLINFOSYS", "sid": "HCLI"}]}},
    )
    assert resolve_sid("HCLTECH", {}) is None
    assert resolve_sid("HCLTECH", {"HCLTECH": "HCLT"}) == "HCLT"
