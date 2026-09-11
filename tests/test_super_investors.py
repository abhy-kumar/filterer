"""Tests for data_pipeline/super_investors.py. No network."""

from data_pipeline.super_investors import build, compile_registry, match_investor, normalize_name

REGISTRY = {
    "investors": [
        {
            "id": "radhakishan-damani",
            "name": "Radhakishan Damani",
            "type": "Individual HNI",
            "description": "Founder of DMart.",
            "patterns": ["^RADHAKISHAN S(HIVKISHAN)? DAMANI\\b", "^BRIGHT STAR INVESTMENTS PRIVATE LIMITED$"],
        },
        {
            "id": "rekha-jhunjhunwala",
            "name": "Rekha Jhunjhunwala",
            "type": "Individual HNI",
            "description": "Investor.",
            "patterns": ["^REKHA (RAKESH )?JHUNJHUNWALA$"],
        },
        {
            "id": "nobody",
            "name": "Matches Nothing",
            "type": "Individual HNI",
            "description": "Should not appear.",
            "patterns": ["^NO SUCH HOLDER$"],
        },
    ]
}

UNIVERSE = {
    "TITAN": {"name": "Titan Company Ltd.", "sector": "Consumer Cyclical", "price": 3500.0, "market_cap": 310000.0},
    "DMART": {"name": "Avenue Supermarts Ltd.", "sector": "Consumer Defensive", "price": 4000.0, "market_cap": 260000.0},
}


def holder(name, pct, shares=None, role="public", kind="individual"):
    return {"name": name, "pct": pct, "shares": shares, "role": role, "kind": kind, "category": "x"}


def test_normalisation_makes_filing_variants_comparable():
    assert normalize_name("Bright Star Investments Pvt. Ltd.") == "BRIGHT STAR INVESTMENTS PRIVATE LIMITED"
    assert normalize_name("Mr. Rekha  Jhunjhunwala") == "REKHA JHUNJHUNWALA"
    assert normalize_name("Sanjeev Bikhchandani &amp; Hitesh Oberoi") == "SANJEEV BIKHCHANDANI AND HITESH OBEROI"


def test_joint_holding_goes_to_the_first_named_holder_only():
    compiled = compile_registry(REGISTRY)
    joint = normalize_name("Gopikishan S. Damani And Radhakishan S. Damani (On behalf of Gulmohar Trust)")
    own = normalize_name("Radhakishan S. Damani And Shrikantadevi Damani (On behalf of Royal Palm Trust)")
    assert match_investor(joint, compiled) is None
    assert match_investor(own, compiled) == "radhakishan-damani"


def test_holdings_come_only_from_filings_and_are_summed_per_company():
    shareholding = {
        "TITAN": {
            "filings": [
                {"period": "Jun 2026", "holders": [holder("Rekha Jhunjhunwala", 4.24, 37_650_000), holder("Rekha Jhunjhunwala", 1.07, 9_500_000)]},
                {"period": "Mar 2026", "holders": [holder("Rekha Jhunjhunwala", 5.00, 44_400_000)]},
            ]
        },
        "DMART": {
            "filings": [
                {
                    "period": "Jun 2026",
                    "holders": [
                        holder("Radhakishan Shivkishan Damani", 22.97, 149_500_000, role="promoter"),
                        holder("Bright Star Investments Private Limited", 13.61, 88_600_000, role="promoter", kind="corporate"),
                    ],
                },
                {"period": "Mar 2026", "holders": [holder("Radhakishan Shivkishan Damani", 22.97, 149_500_000, role="promoter")]},
            ]
        },
    }

    result = build(shareholding, REGISTRY, UNIVERSE, with_discovery=False)
    by_id = {i["id"]: i for i in result["investors"]}

    assert "nobody" not in by_id, "A registry name that matches no filing must not produce an investor"

    titan = by_id["rekha-jhunjhunwala"]["holdings"][0]
    assert titan["holding_pct"] == 5.31
    assert titan["shares_count"] == 47_150_000
    assert titan["holding_value_cr"] == round(47_150_000 * 3500 / 1e7, 2)
    assert titan["delta"] == {"change": "increased", "delta_pct": 0.31, "previous_quarter_holding": 5.0}
    assert titan["quarter"] == "Jun 2026"

    dmart = by_id["radhakishan-damani"]["holdings"][0]
    assert dmart["holding_pct"] == 36.58
    assert dmart["role"] == "promoter"
    assert sorted(dmart["filed_names"]) == ["Bright Star Investments Private Limited", "Radhakishan Shivkishan Damani"]
    assert dmart["delta"]["change"] == "increased"


def test_a_stake_that_disappears_is_an_exit_not_a_zero_holding():
    shareholding = {
        "TITAN": {"filings": [{"period": "Jun 2026", "holders": []}, {"period": "Mar 2026", "holders": [holder("Rekha Jhunjhunwala", 1.2, 1)]}]},
        "DMART": {"filings": [{"period": "Jun 2026", "holders": [holder("Rekha Jhunjhunwala", 2.0, 5)]}, {"period": "Mar 2026", "holders": []}]},
    }
    rekha = next(i for i in build(shareholding, REGISTRY, UNIVERSE, with_discovery=False)["investors"] if i["id"] == "rekha-jhunjhunwala")
    assert [h["symbol"] for h in rekha["holdings"]] == ["DMART"]
    assert rekha["holdings"][0]["delta"]["change"] == "new"
    assert rekha["exits"] == [{"symbol": "TITAN", "companyName": "Titan Company Ltd.", "previous_quarter_holding": 1.2, "quarter": "Mar 2026"}]


def test_discovery_finds_individuals_only_and_counts_only_their_public_stakes():
    universe = {f"C{i}": {"name": f"Company {i}", "sector": "Industrials", "price": 100.0, "market_cap": 500_000.0} for i in range(4)}

    def filings(holders):
        return {"filings": [{"period": "Jun 2026", "holders": holders}]}

    shareholding = {
        # ₹100 crore a company at 10m shares and ₹100: ₹300 crore across three.
        "C0": filings([holder("Big Investor", 2.0, 10_000_000), holder("Group Holdco Private Limited", 9.0, 90_000_000, kind="corporate"), holder("SBI Mutual Fund", 5.0, 1, kind="institution")]),
        "C1": filings([holder("Big Investor", 1.5, 10_000_000), holder("Group Holdco Private Limited", 9.0, 90_000_000, kind="corporate"), holder("Small Investor", 1.1, 100_000)]),
        "C2": filings([holder("Big Investor", 1.1, 10_000_000), holder("Group Holdco Private Limited", 9.0, 90_000_000, kind="corporate"), holder("Small Investor", 1.1, 100_000)]),
        # The same name in a promoter table is not counted towards a discovered investor.
        "C3": filings([holder("Big Investor", 40.0, 400_000_000, role="promoter")]),
    }
    result = build(shareholding, {"investors": []}, universe)
    names = {i["name"]: i for i in result["investors"]}

    assert set(names) == {"Big Investor"}, "corporates and small stakes must not be discovered"
    big = names["Big Investor"]
    assert big["origin"] == "discovered" and big["type"] == "Individual HNI"
    assert sorted(h["symbol"] for h in big["holdings"]) == ["C0", "C1", "C2"]
