import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { STOCKS_DATA } from '../data/stocksData';
import { fetchStockDetail } from '../lib/firebase';
import { Header } from '../components/Header';
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
import { Footer } from '../components/Footer';
import type { Stock } from '../types/stock';

export const StockDetailPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [remoteData, setRemoteData] = useState<Partial<Stock> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Find the stock in the client-side bundle (instant, has screening metrics)
  const bundledStock = STOCKS_DATA.find((s) => s.symbol.toUpperCase() === symbol?.toUpperCase());

  // Fetch full detail data from Firestore/JSON (has financial statements, price history)
  useEffect(() => {
    if (!symbol) return;
    setIsLoading(true);
    fetchStockDetail(symbol)
      .then((data) => setRemoteData(data))
      .catch(() => setRemoteData(null))
      .finally(() => setIsLoading(false));
  }, [symbol]);

  // Merge bundled data with remote detail data
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
  }, [symbol]);

  if (!bundledStock) {
    return (
      <div className="min-h-screen flex flex-col bg-apple-bg text-apple-primary">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="apple-card p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-apple-primary mb-2 font-display">Stock Not Found</h2>
            <p className="text-xs text-apple-muted mb-6">
              No matching equity records for symbol "{symbol}". Please verify the NSE ticker.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-xl bg-apple-blue hover:opacity-90 text-white font-semibold text-xs transition-all shadow-sm"
            >
              Return to Screener
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!stock) return null;

  const scrollTo = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-apple-bg text-apple-primary transition-colors duration-200">
      <Header />

      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col flex-1">
        {/* Top Sticky Control Bar */}
        <div className="sticky top-16 z-30 apple-glass py-2.5 px-4 rounded-2xl border border-apple flex items-center justify-between gap-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-apple-muted">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 font-medium hover:text-apple-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Screener</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <span className="font-semibold text-apple-blue font-mono">{stock.symbol}</span>
            <span className="hidden sm:inline text-apple-muted">•</span>
            <span className="hidden sm:inline text-apple-secondary font-medium truncate max-w-[200px]">
              {stock.name}
            </span>
          </div>

          {/* Quick Sub-navigation Anchors */}
          <div className="hidden lg:flex items-center apple-segmented p-0.5 text-[11px]">
            <button onClick={() => scrollTo('sec-pros')} className="apple-segmented-item py-1 px-2.5">Insights</button>
            <button onClick={() => scrollTo('sec-charts')} className="apple-segmented-item py-1 px-2.5">Charts</button>
            <button onClick={() => scrollTo('sec-peers')} className="apple-segmented-item py-1 px-2.5">Peers</button>
            <button onClick={() => scrollTo('sec-quarters')} className="apple-segmented-item py-1 px-2.5">Quarters</button>
            <button onClick={() => scrollTo('sec-pnl')} className="apple-segmented-item py-1 px-2.5">P&L</button>
            <button onClick={() => scrollTo('sec-balancesheet')} className="apple-segmented-item py-1 px-2.5">Balance Sheet</button>
            <button onClick={() => scrollTo('sec-cashflows')} className="apple-segmented-item py-1 px-2.5">Cash Flows</button>
            <button onClick={() => scrollTo('sec-ratios')} className="apple-segmented-item py-1 px-2.5">Ratios</button>
            <button onClick={() => scrollTo('sec-shareholding')} className="apple-segmented-item py-1 px-2.5">Shareholding</button>
          </div>

          {isLoading && (
            <div className="flex items-center gap-1.5 text-[11px] text-apple-muted font-mono">
              <Loader2 className="w-3 h-3 animate-spin text-apple-blue" />
              <span className="hidden sm:inline">Syncing statements...</span>
            </div>
          )}
        </div>

        {/* Detailed Financial Sections */}
        <div className="space-y-6">
          <StockHeader stock={stock} />

          <div id="sec-pros">
            <StockProsCons stock={stock} />
          </div>

          <div id="sec-charts">
            <StockCharts stock={stock} />
          </div>

          <div id="sec-peers">
            <PeersTable stock={stock} />
          </div>

          <div id="sec-quarters">
            <QuarterlyResultsTable stock={stock} />
          </div>

          <div id="sec-pnl">
            <ProfitLossTable stock={stock} />
          </div>

          <div id="sec-balancesheet">
            <BalanceSheetTable stock={stock} />
          </div>

          <div id="sec-cashflows">
            <CashFlowTable stock={stock} />
          </div>

          <div id="sec-ratios">
            <RatiosTable stock={stock} />
          </div>

          <div id="sec-shareholding">
            <ShareholdingPatternTable stock={stock} />
          </div>

          <div id="sec-documents">
            <StockDocuments stock={stock} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StockDetailPage;
