"""
The ingest ledger decides what a weekly run fetches and what it exports.
These pin down the two ways it went wrong in September 2026.
"""

from datetime import datetime, timedelta, timezone

from data_pipeline.ingest import STATUS_INACTIVE, STATUS_OK, STATUS_PENDING, Ledger
from data_pipeline.universe_source import Constituent, _parse_csv


def company(symbol):
    return Constituent(symbol=symbol, name=symbol, industry="", isin="")


def ledger_with(tmp_path, symbols):
    ledger = Ledger(tmp_path / "ingest.db")
    ledger.sync_universe([company(s) for s in symbols])
    for s in symbols:
        ledger.record_success(s, {"symbol": s})
    return ledger


def status_of(ledger, symbol):
    return ledger.conn.execute("SELECT status FROM companies WHERE symbol=?", (symbol,)).fetchone()[0]


def test_a_company_that_leaves_the_index_is_not_exported(tmp_path):
    ledger = ledger_with(tmp_path, ["OLD", "STAYS"])
    ledger.sync_universe([company("STAYS"), company("NEW")])

    assert status_of(ledger, "OLD") == STATUS_INACTIVE
    assert status_of(ledger, "NEW") == STATUS_PENDING
    assert [p["symbol"] for p in ledger.payloads()] == ["STAYS"]

    # Rejoining queues it again.
    ledger.sync_universe([company("STAYS"), company("NEW"), company("OLD")])
    assert status_of(ledger, "OLD") == STATUS_PENDING


def test_a_weekly_run_refetches_what_it_already_has(tmp_path):
    ledger = ledger_with(tmp_path, ["FRESH", "STALE"])
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(timespec="seconds")
    ledger.conn.execute("UPDATE payloads SET fetched_at=? WHERE symbol='STALE'", (week_ago,))

    assert ledger.mark_stale(6) == 1
    assert status_of(ledger, "STALE") == STATUS_PENDING
    assert status_of(ledger, "FRESH") == STATUS_OK


def test_a_failed_refresh_keeps_the_last_good_figures(tmp_path):
    ledger = ledger_with(tmp_path, ["A"])
    ledger.record_failure("A", "throttled")
    assert [p["symbol"] for p in ledger.payloads()] == ["A"]


def test_index_placeholders_are_not_companies():
    body = b"Company Name,Industry,Symbol,Series,ISIN Code\nHEG Ltd.,Capital Goods,HEGAM,EQ,INE545A01024\nDummy HEG,,DUMMYHEG,EQ,\n"
    assert [c.symbol for c in _parse_csv(body)] == ["HEGAM"]
