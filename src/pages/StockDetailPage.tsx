import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { STOCKS_DATA } from '../data/stocksData';
import { fetchStockDetail } from '../lib/firebase';
import { StockHeader } from '../components/StockDetail/StockHeader';
import { StockProsCons } from '../components/StockDetail/StockProsCons';
import { StockCharts } from '../components/StockDetail/StockCharts';
import { PeersTable } from '../components/StockDetail/PeersTable';
import { QuarterlyResultsTable } from '../components/StockDetail/QuarterlyResultsTable';
import { ProfitLossTable } from '../components/StockDetail/ProfitLossTable';
import { BalanceSheetTable } from '../components/StockDetail/BalanceSheetTable';
import { CashFlowTable } from '../components/StockDetail/CashFlowTable';
import { RatiosTable } from '../components/StockDetail/RatiosTable';
import { ShareholdingPatternTable } from '../components/StockDetail/ShareholdingPatternTable';
import { StockDocuments } from '../components/StockDetail/StockDocuments';
import { DataQualityPanel } from '../components/StockDetail/DataQualityPanel';
import { Footer } from '../components/Footer';
import type { Stock } from '../types/stock';

const SECTIONS = [
  { id: 'sec-analysis', label: 'Analysis' },
  { id: 'sec-charts', label: 'Charts' },
  { id: 'sec-peers', label: 'Peers' },
  { id: 'sec-quarters', label: 'Quarters' },
  { id: 'sec-pnl', label: 'P&L' },
  { id: 'sec-balancesheet', label: 'Balance sheet' },
  { id: 'sec-cashflows', label: 'Cash flow' },
  { id: 'sec-ratios', label: 'Ratios' },
  { id: 'sec-shareholding', label: 'Shareholding' },
  { id: 'sec-documents', label: 'Filings' },
];

export const StockDetailPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [remoteData, setRemoteData] = useState<Partial<Stock> | null>(null);
  // Statements live in the detail tier now, not the bundle, so the page has a
  // real loading state rather than silently rendering nothing.
  const [detailStatus, setDetailStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const navRef = useRef<HTMLDivElement>(null);

  const bundledStock = useMemo(
    () => STOCKS_DATA.find((s) => s.symbol.toUpperCase() === symbol?.toUpperCase()),
    [symbol]
  );

  useEffect(() => {
    if (!symbol || !bundledStock) return;
    let cancelled = false;

    setDetailStatus('loading');
    setRemoteData(null);
    fetchStockDetail(symbol)
      .then((data) => {
        if (cancelled) return;
        setRemoteData(data);
        setDetailStatus(data ? 'ready' : 'failed');
      })
      .catch(() => {
        if (cancelled) return;
        setRemoteData(null);
        setDetailStatus('failed');
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, bundledStock]);

  const stock = useMemo<Stock | null>(() => {
    if (!bundledStock) return null;
    if (!remoteData) return bundledStock;
    return {
      ...bundledStock,
      annual_pnl: remoteData.annual_pnl || bundledStock.annual_pnl,
      quarterly_results: remoteData.quarterly_results || bundledStock.quarterly_results,
      balance_sheet: remoteData.balance_sheet || bundledStock.balance_sheet,
      cash_flow: remoteData.cash_flow || bundledStock.cash_flow,
      ratios_history: remoteData.ratios_history || bundledStock.ratios_history,
      shareholding_history: remoteData.shareholding_history || bundledStock.shareholding_history,
      historical_prices: remoteData.historical_prices || bundledStock.historical_prices,
      peers: remoteData.peers || bundledStock.peers,
    };
  }, [bundledStock, remoteData]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveSection(SECTIONS[0].id);
  }, [symbol]);

  // Highlight the section the reader is actually looking at.
  useEffect(() => {
    if (!stock) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-140px 0px -60% 0px', threshold: 0 }
    );

    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [stock]);

  useEffect(() => {
    navRef.current
      ?.querySelector(`[data-section="${activeSection}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeSection]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  if (!bundledStock || !stock) {
    return (
      <>
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="apple-card p-8 max-w-md w-full text-center">
            <h1 className="text-base font-semibold text-apple-primary mb-1.5 font-display">
              No company by that ticker
            </h1>
            <p className="text-xs text-apple-muted mb-6 leading-relaxed">
              Nothing in this universe matches <code className="font-mono text-apple-secondary">{symbol}</code>.
              It covers {STOCKS_DATA.length} large-cap NSE listings, so smaller names will not be here yet.
            </p>
            <button onClick={() => navigate('/')} className="apple-btn apple-btn-primary">
              Back to the screener
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="flex-1 w-full">
        {/* Breadcrumb and section nav */}
        <div className="sticky top-[88px] z-30 apple-glass border-b border-apple-border">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs shrink-0">
              <Link to="/" className="flex items-center gap-1 text-apple-muted hover:text-apple-primary transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Screener</span>
              </Link>
              <ChevronRight className="w-3 h-3 text-apple-faint" />
              <span className="font-mono font-semibold text-apple-primary">{stock.symbol}</span>
            </div>

            <div ref={navRef} className="flex items-center gap-0.5 overflow-x-auto no-scrollbar ml-auto">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  data-section={section.id}
                  onClick={() => scrollTo(section.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-colors ${
                    activeSection === section.id
                      ? 'text-apple-primary font-semibold bg-apple-surface-active'
                      : 'text-apple-muted hover:text-apple-primary'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>

            {detailStatus === 'loading' && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-apple-faint shrink-0" aria-label="Loading statements" />
            )}
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 animate-fade-in">
          <StockHeader stock={stock} />
          <DataQualityPanel stock={stock} />

          <section id="sec-analysis" className="scroll-mt-32">
            <StockProsCons stock={stock} />
          </section>
          {detailStatus === 'loading' && (
            <div className="space-y-5" aria-busy="true" aria-label="Loading statements">
              {[320, 220, 380, 300].map((height, i) => (
                <div key={i} className="skeleton" style={{ height }} />
              ))}
            </div>
          )}

          {detailStatus === 'failed' && (
            <div className="apple-card p-6 text-center">
              <h2 className="text-sm font-semibold text-apple-primary font-display">
                Statements could not be loaded
              </h2>
              <p className="text-xs text-apple-muted mt-1.5 max-w-md mx-auto leading-relaxed">
                The headline figures above are bundled with the app, but the financial statements are fetched
                separately and that request did not come back.
              </p>
              <button onClick={() => navigate(0)} className="apple-btn apple-btn-secondary mt-4">
                Try again
              </button>
            </div>
          )}

          <section id="sec-charts" className="scroll-mt-32">
            <StockCharts stock={stock} />
          </section>
          <section id="sec-peers" className="scroll-mt-32">
            <PeersTable stock={stock} />
          </section>
          <section id="sec-quarters" className="scroll-mt-32">
            <QuarterlyResultsTable stock={stock} />
          </section>
          <section id="sec-pnl" className="scroll-mt-32">
            <ProfitLossTable stock={stock} />
          </section>
          <section id="sec-balancesheet" className="scroll-mt-32">
            <BalanceSheetTable stock={stock} />
          </section>
          <section id="sec-cashflows" className="scroll-mt-32">
            <CashFlowTable stock={stock} />
          </section>
          <section id="sec-ratios" className="scroll-mt-32">
            <RatiosTable stock={stock} />
          </section>
          <section id="sec-shareholding" className="scroll-mt-32">
            <ShareholdingPatternTable stock={stock} />
          </section>
          <section id="sec-documents" className="scroll-mt-32">
            <StockDocuments stock={stock} />
          </section>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default StockDetailPage;
