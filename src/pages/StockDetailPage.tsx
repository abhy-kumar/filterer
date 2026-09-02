import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
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

  // Merge bundled data with remote detail data (remote takes priority for financial statements)
  const stock = useMemo<Stock | null>(() => {
    if (!bundledStock) return null;
    if (!remoteData) return bundledStock;
    return {
      ...bundledStock,
      // Override with remote data for detail fields (financial statements, etc.)
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
      <div className="min-h-screen flex flex-col bg-[#06090e] dark:bg-[#06090e] light:bg-[#f8fafc]">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-white mb-4">Stock not found</h2>
          <p className="text-sm text-slate-400 mb-6">No data available for symbol "{symbol}"</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold"
          >
            Go Home
          </button>
        </div>
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
    <div className="min-h-screen flex flex-col bg-[#05070a] text-white">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Top Control Bar */}
        <div className="sticky top-0 z-40 apple-glass py-3 px-4 rounded-2xl border border-white/[0.08] flex items-center justify-between gap-4 mb-6 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 font-medium hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            <span className="font-semibold text-[#2997ff] font-mono">{stock.symbol}</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-300 font-medium">{stock.name}</span>
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
