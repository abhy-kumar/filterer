"""
test_zero_poisoning_consensus.py
---------------------------------
Unit tests ensuring that:
1. Zero-poisoning is strictly prevented: a working source reporting genuine data
   is never zeroed out or averaged down by failed/defaulted sources reporting 0 or None.
2. Multi-source agreement within tolerance forms a robust consensus.
3. Corroborated zeros are accepted only when all reporting sources confirm zero.
4. Sector constraints (BFSI) and distressed balance sheet constraints (negative BV)
   properly govern leverage calculations.
"""

import pytest
from data_pipeline.consensus_engine import (
    reconcile_scalar_metric,
    reconcile_fundamentals,
)


def test_zero_poisoning_prevented_on_debt():
    sources = {
        "Screener.in": 192528.0,
        "Yahoo Finance": 0.0,
        "Tickertape": None,
    }
    val, src = reconcile_scalar_metric("debt", sources, tolerance_pct=0.08, zero_is_sentinel=True)
    assert val == 192528.0
    assert "Single Source (Screener.in)" in src


def test_multi_source_consensus_with_poisoned_zero():
    sources = {
        "Screener.in": 192528.0,
        "Tickertape": 192528.0,
        "Yahoo Finance": 0.0,
    }
    val, src = reconcile_scalar_metric("debt", sources, tolerance_pct=0.05, zero_is_sentinel=True)
    assert val == 192528.0
    assert "Consensus (Screener.in + Tickertape)" in src


def test_corroborated_zero_accepted():
    sources = {
        "Screener.in": 0.0,
        "Yahoo Finance": 0.0,
    }
    val, src = reconcile_scalar_metric("debt", sources, tolerance_pct=0.05, zero_is_sentinel=True)
    assert val == 0.0
    assert "Corroborated Zero" in src


def test_all_none_returns_none():
    sources = {
        "Screener.in": None,
        "Yahoo Finance": None,
        "Tickertape": None,
    }
    val, src = reconcile_scalar_metric("pe_ratio", sources)
    assert val is None
    assert src == "None"


def test_tolerance_clustering():
    sources = {
        "Screener.in": 100.0,
        "Tickertape": 102.0,
        "Yahoo Finance": 150.0,
    }
    val, src = reconcile_scalar_metric("market_cap", sources, tolerance_pct=0.05)
    assert val == 101.0
    assert "Consensus (Screener.in + Tickertape)" in src


def test_reconcile_fundamentals_distressed_negative_bv():
    sources_dict = {
        "Screener.in": {
            "debt": 192528.0,
            "book_value": -3.30,
            "market_cap": 157422.0,
            "roce": -1.72,
        },
        "Yahoo Finance": {
            "debt": 0.0,
            "book_value": -3.30,
            "market_cap": 157422.0,
            "roce": 35.8,
        },
        "Tickertape": {
            "debt": 192528.0,
        },
    }
    result = reconcile_fundamentals(
        symbol="IDEA",
        sources_dict=sources_dict,
        sector="Telecommunication",
        current_price=14.5,
        market_cap=157422.0,
    )
    assert result["debt"] == 192528.0
    assert "Consensus" in result["debt_source"]
    assert result["book_value"] == -3.30
    assert result["debt_to_equity"] is None


def test_reconcile_fundamentals_financial_services():
    sources_dict = {
        "Yahoo Finance": {
            "debt": 726892.0,
            "book_value": 673.78,
            "market_cap": 942354.0,
            "pe_ratio": 11.2,
        },
        "Screener.in": {
            "debt": 726892.0,
            "book_value": 673.78,
            "market_cap": 942354.0,
            "pe_ratio": 11.2,
        },
    }
    result = reconcile_fundamentals(
        symbol="SBIN",
        sources_dict=sources_dict,
        sector="Financial Services",
        current_price=800.0,
        market_cap=942354.0,
    )
    assert result["debt"] == 726892.0
    assert result["debt_to_equity"] is None


def test_reconcile_fundamentals_commercial_derivation():
    sources_dict = {
        "Screener.in": {
            "debt": 1141.9,
            "book_value": 748.92,
            "market_cap": 11905.0,
        },
        "Yahoo Finance": {
            "debt": 0.0,
            "book_value": 748.92,
            "market_cap": 11905.0,
        },
    }
    result = reconcile_fundamentals(
        symbol="BLUEDART",
        sources_dict=sources_dict,
        sector="Logistics",
        current_price=5022.0,
        market_cap=11905.0,
    )
    assert result["debt"] == 1141.9
    assert result["debt_to_equity"] == 0.64
