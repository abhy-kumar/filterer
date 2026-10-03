"""
Parser tests for data_pipeline/nse_filings.py.

The fixtures are cut-down XBRL in the shape NSE files: the same contexts, tags
and rupee units, with only the facts a test needs. No network.
"""

from datetime import date

from data_pipeline.nse_filings import (
    ResultFiling,
    choose_basis,
    derive_quarter,
    extract_figures,
    holder_role,
    parse_annual_xbrl,
    parse_integrated_listing,
    parse_legacy_annual_listing,
    parse_legacy_listing,
    parse_results_xbrl,
    parse_shareholding_xbrl,
    quarters_in_span,
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


def ctx(cid, start, end):
    return (
        f'<xbrli:context id="{cid}"><xbrli:entity/><xbrli:period>'
        f"<xbrli:startDate>{start}</xbrli:startDate><xbrli:endDate>{end}</xbrli:endDate>"
        "</xbrli:period></xbrli:context>"
    )


def test_a_revision_outranks_the_original_even_without_a_date():
    # DIVISLAB's corrected Mar 2026 filing arrives with no broadcast date; the
    # original it corrects has only a half-year column.
    payload = {
        "data": [
            {"qe_Date": "31-MAR-2026", "consolidated": "Consolidated", "xbrl": "https://x/revised.xml",
             "broadcast_Date": None, "type_Sub": "Revision", "seq_Id": "1674093"},
            {"qe_Date": "31-MAR-2026", "consolidated": "Consolidated", "xbrl": "https://x/original.xml",
             "broadcast_Date": "23-May-2026 18:14:10", "type_Sub": "Original", "seq_Id": "1672045"},
        ]
    }
    filings = sorted(parse_integrated_listing(payload), key=ResultFiling.recency, reverse=True)
    assert filings[0].xbrl.endswith("revised.xml")


def test_old_layout_reads_columns_by_id_not_by_date():
    # Pre-2025 filings date every column with the quarter; FourD holds the year.
    xbrl = "<xbrli:xbrl>" + stated_year("2022-04-01", "2023-03-31") + ctx("OneD", "2023-01-01", "2023-03-31") + ctx("FourD", "2023-01-01", "2023-03-31") + "".join(
        [
            fact("RevenueFromOperations", "FourD", "77675100000"),
            fact("RevenueFromOperations", "OneD", "19507700000"),
            fact("ProfitLossForPeriod", "OneD", "3209700000"),
            fact("ProfitLossForPeriod", "FourD", "18233800000"),
        ]
    ) + "</xbrli:xbrl>"
    assert parse_results_xbrl(xbrl, date(2023, 3, 31))["sales"] == 1950.77
    assert parse_annual_xbrl(xbrl, date(2023, 3, 31))["sales"] == 7767.51


def stated_year(start, end):
    return (
        f'<in-bse-fin:DateOfStartOfFinancialYear contextRef="OneD">{start}</in-bse-fin:DateOfStartOfFinancialYear>'
        f'<in-bse-fin:DateOfEndOfFinancialYear contextRef="OneD">{end}</in-bse-fin:DateOfEndOfFinancialYear>'
    )


def test_undefined_column_contexts_are_taken_at_their_word():
    # 2018 to 2022 filings cite OneD and FourD without defining them.
    xbrl = "<xbrli:xbrl>" + stated_year("2021-04-01", "2022-03-31") + fact("RevenueFromOperations", "OneD", "25184400000") + fact(
        "RevenueFromOperations", "FourD", "89598300000"
    ) + "</xbrli:xbrl>"
    assert parse_results_xbrl(xbrl, date(2022, 3, 31))["sales"] == 2518.44
    assert parse_annual_xbrl(xbrl, date(2022, 3, 31))["sales"] == 8959.83


def test_a_half_year_is_never_read_as_the_year():
    xbrl = "<xbrli:xbrl>" + ctx("FourD", "2025-10-01", "2026-03-31") + fact(
        "RevenueFromOperations", "FourD", "100000000"
    ) + "</xbrli:xbrl>"
    assert parse_annual_xbrl(xbrl, date(2026, 3, 31)) is None


def test_a_filed_zero_profit_gives_way_to_the_next_tag():
    xbrl = "<xbrli:xbrl>" + CONTEXTS + "".join(
        [
            fact("RevenueFromOperations", "OneD", "100000000000"),
            fact("ProfitOrLossAttributableToOwnersOfParent", "OneD", "0.00"),
            fact("ProfitLossForPeriod", "OneD", "13527400000"),
        ]
    ) + "</xbrli:xbrl>"
    assert parse_results_xbrl(xbrl, date(2025, 9, 30))["net_profit"] == 1352.74


def test_legacy_annual_listing_keeps_only_full_years():
    payload = [
        {"fromDate": "01-Apr-2022", "toDate": "31-Mar-2023", "consolidated": "Consolidated", "xbrl": "https://x/y.xml"},
        {"fromDate": "01-Jan-2023", "toDate": "31-Mar-2023", "consolidated": "Consolidated", "xbrl": "https://x/q.xml"},
    ]
    filings = parse_legacy_annual_listing(payload)
    assert [(f.xbrl, f.months) for f in filings] == [("https://x/y.xml", 12)]


def test_quarters_in_span():
    assert quarters_in_span(date(2025, 4, 1), date(2026, 3, 31)) == [
        date(2025, 6, 30),
        date(2025, 9, 30),
        date(2025, 12, 31),
    ]
    assert quarters_in_span(date(2025, 10, 1), date(2026, 3, 31)) == [date(2025, 12, 31)]


def test_a_quarter_with_no_column_of_its_own_is_derived_from_the_year():
    xbrl = "<xbrli:xbrl>" + ctx("Y", "2025-04-01", "2026-03-31") + "".join(
        [
            fact("RevenueFromOperations", "Y", "1000000000000"),
            fact("ProfitLossForPeriod", "Y", "100000000000"),
        ]
    ) + "</xbrli:xbrl>"
    known = {
        q: {"sales": 2000000000.0 * 100, "net_profit": 2000000000.0 * 10, "eps": 1.0}
        for q in (date(2025, 6, 30), date(2025, 9, 30), date(2025, 12, 31))
    }
    row = derive_quarter(xbrl, date(2026, 3, 31), known)
    assert row["sales"] == 40000.0  # a lakh crore less three quarters of 20,000
    assert row["net_profit"] == 4000.0
    assert row["eps"] is None
    assert row["derived"]

    # Without all three earlier quarters, nothing is derived.
    del known[date(2025, 9, 30)]
    assert derive_quarter(xbrl, date(2026, 3, 31), known) is None


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


def test_a_quarter_that_failed_to_download_is_kept_from_the_last_run():
    from data_pipeline.nse_filings import keep_known_periods

    old = {"basis": "consolidated", "quarters": [{"period": "Dec 2024", "sales": 1}, {"period": "Mar 2025", "sales": 2}], "annual": []}
    new = {"basis": "consolidated", "quarters": [{"period": "Mar 2025", "sales": 3}, {"period": "Jun 2025", "sales": 4}], "annual": []}
    merged = keep_known_periods(old, new)
    assert [(q["period"], q["sales"]) for q in merged["quarters"]] == [("Dec 2024", 1), ("Mar 2025", 3), ("Jun 2025", 4)]

    # Years are never carried forward.
    assert keep_known_periods({**old, "annual": [{"year": "Dec 2024"}]}, new)["annual"] == []

    # A change of basis starts afresh rather than mixing the two.
    assert keep_known_periods({**old, "basis": "standalone"}, new) == new


def test_a_financial_year_need_not_end_in_march():
    from data_pipeline.nse_filings import fiscal_year_start

    assert fiscal_year_start(date(2026, 3, 31)) == date(2025, 4, 1)
    assert fiscal_year_start(date(2025, 12, 31)) == date(2025, 1, 1)  # ABB
    assert fiscal_year_start(date(2025, 9, 30)) == date(2024, 10, 1)  # Siemens
    assert fiscal_year_start(date(2025, 6, 30)) == date(2024, 7, 1)  # P&G Hygiene


def test_year_to_date_is_a_year_only_when_the_filing_says_its_year_is_twelve_months():
    columns = ctx("OneD", "2024-10-01", "2024-12-31") + ctx("FourD", "2024-10-01", "2024-12-31") + fact(
        "RevenueFromOperations", "FourD", "251561500000"
    )
    # A December filing in a March year: FourD is nine months.
    nine_months = "<xbrli:xbrl>" + stated_year("2024-04-01", "2025-03-31") + columns + "</xbrli:xbrl>"
    assert parse_annual_xbrl(nine_months, date(2024, 12, 31)) is None
    # Ambuja's change of year end: fifteen months, January 2022 to March 2023.
    fifteen = "<xbrli:xbrl>" + stated_year("2022-01-01", "2023-03-31") + columns.replace("2024-10-01", "2023-01-01").replace(
        "2024-12-31", "2023-03-31"
    ) + "</xbrli:xbrl>"
    assert parse_annual_xbrl(fifteen, date(2023, 3, 31)) is None
