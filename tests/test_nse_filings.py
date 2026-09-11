"""
Parser tests for data_pipeline/nse_filings.py.

The fixtures are cut-down XBRL in the shape NSE files: the same contexts, tags
and rupee units, with only the facts a test needs. No network.
"""

from datetime import date

from data_pipeline.nse_filings import (
    ResultFiling,
    choose_basis,
    holder_role,
    parse_integrated_listing,
    parse_legacy_listing,
    parse_results_xbrl,
    parse_shareholding_xbrl,
)

CONTEXTS = """
<xbrli:context id="OneD"><xbrli:entity/><xbrli:period><xbrli:startDate>2025-07-01</xbrli:startDate><xbrli:endDate>2025-09-30</xbrli:endDate></xbrli:period></xbrli:context>
<xbrli:context id="FourD"><xbrli:entity/><xbrli:period><xbrli:startDate>2025-04-01</xbrli:startDate><xbrli:endDate>2025-09-30</xbrli:endDate></xbrli:period></xbrli:context>
<xbrli:context id="OneI"><xbrli:entity/><xbrli:period><xbrli:instant>2025-09-30</xbrli:instant></xbrli:period></xbrli:context>
<xbrli:context id="SegD"><xbrli:entity/><xbrli:period><xbrli:startDate>2025-07-01</xbrli:startDate><xbrli:endDate>2025-09-30</xbrli:endDate></xbrli:period><xbrli:scenario><xbrldi:typedMember dimension="x">y</xbrldi:typedMember></xbrli:scenario></xbrli:context>
"""


def fact(tag, ctx, value, ns="in-capmkt"):
    return f'<{ns}:{tag} contextRef="{ctx}" unitRef="INR" decimals="-5">{value}</{ns}:{tag}>'


def test_non_bank_quarter_is_the_quarter_not_the_half_year():
    xbrl = "<xbrli:xbrl>" + CONTEXTS + "".join(
        [
            fact("RevenueFromOperations", "OneD", "2588980000000"),
            fact("RevenueFromOperations", "FourD", "5075580000000"),
            # A segment figure on a dimensional context must not be picked up.
            fact("RevenueFromOperations", "SegD", "1"),
            fact("OtherIncome", "OneD", "44820000000"),
            fact("Expenses", "OneD", "2342560000000"),
            fact("FinanceCosts", "OneD", "68270000000"),
            fact("DepreciationDepletionAndAmortisationExpense", "OneD", "144160000000"),
            fact("ProfitBeforeTax", "OneD", "291240000000"),
            fact("TaxExpense", "OneD", "69780000000"),
            fact("ProfitLossForPeriod", "OneD", "220920000000"),
            fact("ProfitOrLossAttributableToOwnersOfParent", "OneD", "181650000000"),
            fact("BasicEarningsLossPerShareFromContinuingAndDiscontinuedOperations", "OneD", "13.42"),
        ]
    ) + "</xbrli:xbrl>"

    row = parse_results_xbrl(xbrl, date(2025, 9, 30))

    assert row["period"] == "Sep 2025"
    assert row["sales"] == 258898.0  # crore, not rupees, and not the half year
    assert row["interest"] == 6827.0
    assert row["depreciation"] == 14416.0
    # Expenses exclude finance costs and depreciation.
    assert row["expenses"] == round((2342560000000 - 68270000000 - 144160000000) / 1e7, 2)
    assert row["operating_profit"] == round(row["sales"] - row["expenses"], 2)
    # Attributable to owners, not including minority interest.
    assert row["net_profit"] == 18165.0
    assert row["eps"] == 13.42
    assert row["tax_pct"] == round(69780000000 / 291240000000 * 100, 2)
    # The rows reconcile: OP + other income - interest - depreciation = PBT.
    assert abs(row["operating_profit"] + row["other_income"] - row["interest"] - row["depreciation"] - row["profit_before_tax"]) < 1


def test_bank_schema_maps_onto_the_same_rows():
    xbrl = "<xbrli:xbrl>" + CONTEXTS + "".join(
        [
            fact("InterestEarned", "OneD", "905753300000"),
            fact("OtherIncome", "OneD", "425350300000"),
            fact("InterestExpended", "OneD", "476256300000"),
            fact("OperatingExpenses", "OneD", "544887300000"),
            fact("ProvisionsOtherThanTaxAndContingencies", "OneD", "38028400000"),
            fact("ProfitLossFromOrdinaryActivitiesBeforeTax", "OneD", "271931600000"),
            fact("ProfitLossForThePeriod", "OneD", "203826900000"),
            fact("BasicEarningsPerShareBeforeExtraordinaryItems", "OneD", "12.5"),
        ]
    ) + "</xbrli:xbrl>"

    row = parse_results_xbrl(xbrl, date(2025, 9, 30))

    assert row["sales"] == 90575.33
    assert row["interest"] == 47625.63
    assert row["expenses"] == round((544887300000 + 38028400000) / 1e7, 2)
    assert row["depreciation"] is None
    assert row["net_profit"] == 20382.69
    # Financing profit is already after interest expended, so for a bank the
    # identity is OP + other income = PBT. Subtracting interest again, as a
    # non-bank row would, double counts it.
    assert abs(row["operating_profit"] + row["other_income"] - row["profit_before_tax"]) < 1


def test_no_quarter_context_means_no_row():
    xbrl = "<xbrli:xbrl>" + CONTEXTS + fact("RevenueFromOperations", "OneD", "100") + "</xbrli:xbrl>"
    assert parse_results_xbrl(xbrl, date(2025, 6, 30)) is None


def test_integrated_listing_skips_governance_and_non_quarter_rows():
    payload = {
        "data": [
            {"qe_Date": "30-JUN-2026", "consolidated": None, "xbrl": "https://x/INTEGRATED_FILING_GOVERNANCE_1.xml"},
            {"qe_Date": "30-JUN-2026", "consolidated": "Consolidated", "xbrl": "https://x/INTEGRATED_FILING_INDAS_2.xml", "broadcast_Date": "17-Jul-2026 07:50:04"},
            {"qe_Date": "30-JUN-2026", "consolidated": "Standalone", "xbrl": "https://x/INTEGRATED_FILING_INDAS_3.xml"},
            {"qe_Date": "15-JUN-2026", "consolidated": "Standalone", "xbrl": "https://x/4.xml"},
        ]
    }
    filings = parse_integrated_listing(payload)
    assert [(f.basis, f.period_end) for f in filings] == [
        ("consolidated", date(2026, 6, 30)),
        ("standalone", date(2026, 6, 30)),
    ]


def test_legacy_listing_rejects_cumulative_filings():
    payload = [
        {"fromDate": "01-Oct-2024", "toDate": "31-Dec-2024", "consolidated": "Consolidated", "xbrl": "https://x/a.xml"},
        {"fromDate": "01-Apr-2024", "toDate": "31-Dec-2024", "consolidated": "Consolidated", "xbrl": "https://x/b.xml"},
        {"fromDate": "01-Oct-2024", "toDate": "31-Dec-2024", "consolidated": "Non-Consolidated", "xbrl": "-"},
    ]
    filings = parse_legacy_listing(payload)
    assert len(filings) == 1 and filings[0].xbrl.endswith("a.xml")


def test_basis_is_consolidated_only_when_it_covers_the_series():
    d = lambda m: date(2025, m, 30 if m in (6, 9) else 31)
    standalone_only = [ResultFiling(d(m), "standalone", "u", None) for m in (3, 6, 9, 12)]
    assert choose_basis(standalone_only) == "standalone"
    both = standalone_only + [ResultFiling(d(m), "consolidated", "u", None) for m in (3, 6, 9, 12)]
    assert choose_basis(both) == "consolidated"
    patchy = standalone_only + [ResultFiling(d(12), "consolidated", "u", None)]
    assert choose_basis(patchy) == "standalone"


def test_basis_ignores_standalone_history_older_than_the_window():
    # Twenty years of standalone quarters and consolidated only recently:
    # counting all of history is what made Reliance come out standalone.
    quarter_ends = [date(y, m, 30 if m in (6, 9) else 31) for y in range(2005, 2027) for m in (3, 6, 9, 12)]
    recent = quarter_ends[-12:]
    filings = [ResultFiling(p, "standalone", "u", None) for p in quarter_ends]
    filings += [ResultFiling(p, "consolidated", "u", None) for p in recent]
    assert choose_basis(filings) == "consolidated"


SHP = """<xbrli:xbrl>
<in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares contextRef="ShareholdingOfPromoterAndPromoterGroup_ContextI" decimals="4">0.5048</in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares>
<in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares contextRef="PublicShareholding_ContextI" decimals="4">0.4952</in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares>
<in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares contextRef="InstitutionsForeign_ContextI" decimals="4">0.172</in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares>
<in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares contextRef="InstitutionsDomestic_ContextI" decimals="4">0.2119</in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares>
<in-bse-shp:NameOfTheShareholder contextRef="D_DetailsOfSharesHeldByResidentIndividualShareholdersHoldingNominalShareCapitalInExcessOfRsTwoLakh_Context3">Rekha  Jhunjhunwala</in-bse-shp:NameOfTheShareholder>
<in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares contextRef="DetailsOfSharesHeldByResidentIndividualShareholdersHoldingNominalShareCapitalInExcessOfRsTwoLakh_Context3" decimals="4">0.0424</in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares>
<in-bse-shp:NumberOfShares contextRef="DetailsOfSharesHeldByResidentIndividualShareholdersHoldingNominalShareCapitalInExcessOfRsTwoLakh_Context3" decimals="0">37650000</in-bse-shp:NumberOfShares>
<in-bse-shp:NameOfTheShareholder contextRef="D_OthersIndianShareholders_Context1">Tata Sons Private Limited</in-bse-shp:NameOfTheShareholder>
<in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares contextRef="OthersIndianShareholders_Context1" decimals="4">0.2084</in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares>
<in-bse-shp:NameOfTheShareholder contextRef="D_IndividualsOrHUF_Context9">Small Holder</in-bse-shp:NameOfTheShareholder>
<in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares contextRef="IndividualsOrHUF_Context9" decimals="4">0.004</in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares>
<in-bse-shp:NameOfTheShareholder contextRef="D_MutualFundsOrUTI_Context2">SBI Nifty 50 ETF &amp; Co</in-bse-shp:NameOfTheShareholder>
<in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares contextRef="MutualFundsOrUTI_Context2" decimals="4">0.018</in-bse-shp:ShareholdingAsAPercentageOfTotalNumberOfShares>
</xbrli:xbrl>"""


def test_shareholding_totals_are_percentages_not_fractions():
    parsed = parse_shareholding_xbrl(SHP)
    assert parsed["promoter"] == 50.48
    assert parsed["public"] == 49.52
    assert parsed["fii"] == 17.2
    assert parsed["dii"] == 21.19


def test_named_holders_link_name_to_figures_and_drop_sub_one_percent():
    holders = {h["name"]: h for h in parse_shareholding_xbrl(SHP)["holders"]}
    assert set(holders) == {"Tata Sons Private Limited", "Rekha Jhunjhunwala", "SBI Nifty 50 ETF & Co"}

    rekha = holders["Rekha Jhunjhunwala"]
    assert rekha["pct"] == 4.24 and rekha["shares"] == 37650000
    assert (rekha["role"], rekha["kind"]) == ("public", "individual")
    assert holders["Tata Sons Private Limited"]["role"] == "promoter"
    assert holders["SBI Nifty 50 ETF & Co"]["kind"] == "institution"


def test_insiders_are_not_public_investors():
    assert holder_role("DetailsOfSharesHeldByKeyManagerialPersonnel") == "insider"
    assert holder_role("DetailsOfSharesHeldByBodiesCorporate") == "public"
