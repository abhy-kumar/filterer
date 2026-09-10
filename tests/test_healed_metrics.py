"""
test_healed_metrics.py
----------------------
Unit tests verifying the authentic data layers:
1. 100% BSE scrip code coverage
2. Rolling dynamic moving averages in historical prices
3. Authentic 9-criteria Piotroski F-score
4. Zero balance sheet footing errors
"""

import glob
import json
from pathlib import Path
import pytest

from data_pipeline.bse_mapper import BSEMapper
from data_pipeline.derived_metrics import compute_piotroski_score, compute_altman_z_score


# BSE Ltd is listed on the NSE alone: an exchange cannot list on itself. The
# name-matching mapper used to hand it 543066, which belongs to SBI Cards, and
# the company page then linked to the wrong company's filings.
NSE_ONLY = {"BSE"}


def test_bse_code_coverage():
    """Every company that has a BSE listing carries its authentic scrip code."""
    with open("src/data/stocksData.ts", encoding="utf-8") as f:
        text = f.read()
    eq = text.find("= [")
    stocks = json.loads(text[eq + 2 : text.rfind("]") + 1])
    assert len(stocks) == 500

    missing = [
        s["symbol"]
        for s in stocks
        if not s.get("bse_code") and s["symbol"] not in NSE_ONLY
    ]
    assert not missing, f"{len(missing)} stocks have no BSE code: {missing[:10]}"

    # An NSE-only listing must not borrow another company's scrip code.
    for s in stocks:
        if s["symbol"] in NSE_ONLY:
            assert not s.get("bse_code"), (
                f"{s['symbol']} trades only on the NSE but carries BSE code {s['bse_code']}"
            )

    # Codes are six digits, and no two companies share one.
    codes = [s["bse_code"] for s in stocks if s.get("bse_code")]
    assert all(c.isdigit() and len(c) == 6 for c in codes), "Malformed BSE code"
    assert len(set(codes)) == len(codes), "Two companies share a BSE scrip code"

    # Known BSE codes
    mapper = BSEMapper()
    assert mapper.get_code("RELIANCE") == "500325"
    assert mapper.get_code("TCS") == "532540"
    assert mapper.get_code("INFY") == "500209"
    assert mapper.get_code("CDSL") == "540608"


def test_rolling_moving_averages_not_flat():
    """Verify that historical prices have dynamic rolling DMAs rather than flat constants."""
    with open("public/data/stocks/RELIANCE.json", encoding="utf-8") as f:
        d = json.load(f)
    prices = d.get("historical_prices", [])
    assert len(prices) > 100

    last_20_dma50 = [p.get("dma_50") for p in prices[-20:]]
    assert len(set(last_20_dma50)) > 5, "DMA 50 appears to be flat and static"

    last_20_dma200 = [p.get("dma_200") for p in prices[-20:]]
    assert len(set(last_20_dma200)) > 5, "DMA 200 appears to be flat and static"


def test_authentic_piotroski_score_logic():
    """Verify standard 9-criteria scoring across all accounting dimensions."""
    # Perfect 9-point company
    perfect = compute_piotroski_score(
        net_income=100,
        prev_net_income=80,
        operating_cf=120,
        prev_operating_cf=90,
        total_assets=1000,
        prev_total_assets=1000,
        roa=0.10,
        prev_roa=0.08,
        long_term_debt=50,
        prev_long_term_debt=80,
        current_ratio=2.0,
        prev_current_ratio=1.5,
        shares_outstanding=100,
        prev_shares_outstanding=100,
        gross_margin=0.40,
        prev_gross_margin=0.35,
        asset_turnover=1.2,
        prev_asset_turnover=1.0,
    )
    assert perfect == 9

    # Distressed 0-point company
    distressed = compute_piotroski_score(
        net_income=-20,
        prev_net_income=10,
        operating_cf=-50,
        prev_operating_cf=30,
        total_assets=1000,
        prev_total_assets=1000,
        roa=-0.05,
        prev_roa=0.01,
        long_term_debt=300,
        prev_long_term_debt=100,
        current_ratio=0.8,
        prev_current_ratio=1.2,
        shares_outstanding=150,
        prev_shares_outstanding=100,
        gross_margin=0.20,
        prev_gross_margin=0.30,
        asset_turnover=0.5,
        prev_asset_turnover=0.8,
    )
    assert distressed == 0


def test_zero_balance_sheet_footing_errors():
    """
    Both sides of every balance sheet foot to total assets.

    This used to compare equity capital + reserves + borrowings + other
    liabilities against `total_liabilities`, which cannot hold: the pipeline
    stores Yahoo's "total liabilities net minority interest" there, meaning
    liabilities *excluding* equity. On all 1,979 sheets it equals borrowings +
    other liabilities exactly, so the left side always overshot it by the whole
    of shareholders' funds and the test reported 1,672 failures that were an
    artefact of the assertion rather than the data.

    The identity that does hold is the accounting one: assets equal equity plus
    liabilities.
    """
    files = glob.glob("public/data/stocks/*.json")
    assert len(files) == 500

    liability_errors = []
    asset_errors = []
    checked = 0

    for f in files:
        with open(f, encoding="utf-8") as fp:
            d = json.load(fp)
        for sheet in d.get("balance_sheet", []):
            total_assets = sheet.get("total_assets") or 0
            if not total_assets:
                continue
            checked += 1

            equity_and_liabilities = (
                (sheet.get("equity_capital") or 0)
                + (sheet.get("reserves") or 0)
                + (sheet.get("borrowings") or 0)
                + (sheet.get("other_liabilities") or 0)
            )
            assets = (
                (sheet.get("fixed_assets") or 0)
                + (sheet.get("cwip") or 0)
                + (sheet.get("investments") or 0)
                + (sheet.get("other_assets") or 0)
            )

            where = f"{d['symbol']} {sheet.get('year')}"
            if abs(equity_and_liabilities - total_assets) / abs(total_assets) > 0.01:
                liability_errors.append(where)
            if abs(assets - total_assets) / abs(total_assets) > 0.01:
                asset_errors.append(where)

    assert checked > 1500, f"Only {checked} balance sheets carried a total"
    assert not liability_errors, (
        f"{len(liability_errors)} sheets where equity + liabilities does not "
        f"foot to total assets: {liability_errors[:5]}"
    )
    assert not asset_errors, (
        f"{len(asset_errors)} sheets where the asset rows do not foot to total "
        f"assets: {asset_errors[:5]}"
    )


def test_total_liabilities_excludes_equity():
    """
    Pin down what `total_liabilities` means, since the field name invites the
    wrong reading and a test was written against that wrong reading once.
    """
    files = glob.glob("public/data/stocks/*.json")
    mismatches = []

    for f in files:
        with open(f, encoding="utf-8") as fp:
            d = json.load(fp)
        for sheet in d.get("balance_sheet", []):
            total = sheet.get("total_liabilities") or 0
            if not total:
                continue
            named = (sheet.get("borrowings") or 0) + (sheet.get("other_liabilities") or 0)
            if abs(named - total) / abs(total) > 0.01:
                mismatches.append(f"{d['symbol']} {sheet.get('year')}")

    assert not mismatches, (
        "total_liabilities should equal borrowings + other liabilities "
        f"(equity excluded); {len(mismatches)} sheets disagree: {mismatches[:5]}"
    )


def test_piotroski_is_not_fabricated():
    """
    The score must come from filed statements, not from invented prior years.

    The pipeline used to pass the previous year in as a fixed haircut on the
    current one — operating cash flow at 90%, long-term debt at 110%, current
    ratio and gross margin at 95%, the share count as 1 on both sides — so five
    of the nine tests passed for every company alive. The distribution is the
    tell: no company scored below 3, 37% landed on exactly 8, and 363 of 500
    passed a "seven or more of nine" screen.
    """
    with open("src/data/stocksData.ts", encoding="utf-8") as f:
        text = f.read()
    eq = text.find("= [")
    stocks = json.loads(text[eq + 2 : text.rfind("]") + 1])

    scores = [s["piotroski_score"] for s in stocks if s.get("piotroski_score") is not None]
    assert len(scores) > 450, "Piotroski score is missing for too much of the universe"

    # A real F-score distribution has a weak tail. A fabricated floor does not.
    assert min(scores) <= 2, (
        f"No company scores below {min(scores)}; the prior-year inputs are "
        "probably still synthetic"
    )
    high = sum(1 for s in scores if s >= 7)
    assert high < len(scores) * 0.35, (
        f"{high}/{len(scores)} companies score 7 or more, which is far too many "
        "for a genuine F-score"
    )

    # Every score must say how many of the nine signals it was drawn from.
    assessed = [s.get("piotroski_assessed") for s in stocks if s.get("piotroski_score") is not None]
    assert all(isinstance(a, int) and a >= 6 for a in assessed), (
        "Scores must record how many signals were assessable"
    )


def test_altman_not_scored_for_financials():
    """
    The Z-score's coefficients are calibrated on manufacturers. A bank's
    balance sheet is deposits, so the leverage terms read as distress for
    institutions that are not distressed; the pipeline also fed the market
    capitalisation in as total assets, which put four of the five ratios on the
    wrong denominator.
    """
    with open("src/data/stocksData.ts", encoding="utf-8") as f:
        text = f.read()
    eq = text.find("= [")
    stocks = json.loads(text[eq + 2 : text.rfind("]") + 1])

    scored_banks = [
        s["symbol"]
        for s in stocks
        if s.get("sector") == "Financial Services" and s.get("altman_z_score") is not None
    ]
    assert not scored_banks, f"Financial companies carry a Z-score: {scored_banks[:5]}"

    scored = [s for s in stocks if s.get("altman_z_score") is not None]
    assert len(scored) > 300, "Z-score is missing for too much of the universe"
