import pytest
from data_pipeline.qc_engine import FinancialQCEngine

@pytest.fixture
def qc():
    return FinancialQCEngine()

@pytest.fixture
def sample_clean_stock():
    return {
        "symbol": "ICICIBANK",
        "name": "ICICI Bank Ltd.",
        "sector": "Financial Services",
        "current_price": 1426.5,
        "market_cap": 1005000.0,
        "high_52w": 1450.0,
        "low_52w": 980.0,
        "dividend_yield": 0.83,
        "pe_ratio": 18.5,
        "roce": 15.4,
        "opm": 36.0,
        "promoter_holding": 0.0,
        "fii_holding": 44.8,
        "dii_holding": 45.2,
        "public_holding": 10.0,
        "pledged_percentage": 0.0,
        "bse_code": "532174",
        "face_value": 2.0,
        "website": "https://www.icicibank.com",
        "annual_pnl": [
            {"year": "Mar 2024", "sales": 161210.0, "net_profit": 44256.0, "operating_profit": 63504.0}
        ],
        "balance_sheet": [
            {"year": "Mar 2024", "total_assets": 2000000.0, "total_liabilities": 2000000.0}
        ],
        "quarterly_results": [
            {"period": "Dec 2024", "sales": 35292.0, "net_profit": 12537.0}
        ]
    }

def test_clean_stock_passes_qc(qc, sample_clean_stock):
    result = qc.audit_stock(sample_clean_stock)
    assert result.passed is True
    assert len(result.errors) == 0
    assert result.score >= 90.0

def test_detects_abnormal_dividend_yield(qc, sample_clean_stock):
    # Simulates the 100x multiplication bug (83.0% yield)
    sample_clean_stock["dividend_yield"] = 83.0
    result = qc.audit_stock(sample_clean_stock)
    assert result.passed is False
    assert any(e.rule == "CHECK_DIVIDEND_YIELD" for e in result.errors)

def test_detects_shareholding_sum_mismatch(qc, sample_clean_stock):
    # Promoter + FII + DII + Public != 100
    sample_clean_stock["public_holding"] = 35.0  # Sum becomes 125%
    result = qc.audit_stock(sample_clean_stock)
    assert result.passed is False
    assert any(e.rule == "CHECK_OWNERSHIP_INTEGRITY" for e in result.errors)

def test_detects_empty_annual_pnl_rows(qc, sample_clean_stock):
    sample_clean_stock["annual_pnl"].append({"year": "Mar 2022", "sales": 0.0, "net_profit": 0.0})
    result = qc.audit_stock(sample_clean_stock)
    assert result.passed is False
    assert any(e.rule == "CHECK_ANNUAL_CONTINUITY" for e in result.errors)

def test_detects_zero_current_price(qc, sample_clean_stock):
    sample_clean_stock["current_price"] = 0.0
    result = qc.audit_stock(sample_clean_stock)
    assert result.passed is False
    assert any(e.rule == "CHECK_POSITIVE_PRICE" for e in result.errors)
