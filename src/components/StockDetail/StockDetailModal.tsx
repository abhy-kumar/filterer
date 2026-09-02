import React, { useEffect } from 'react';
import {
  X,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { Stock } from '../../types/stock';
import { StockHeader } from './StockHeader';
import { StockProsCons } from './StockProsCons';
import { StockCharts } from './StockCharts';
import { PeersTable } from './PeersTable';
import { QuarterlyResultsTable } from './QuarterlyResultsTable';
import { ProfitLossTable } from './ProfitLossTable';
import { BalanceSheetTable } from './BalanceSheetTable';
import { CashFlowTable } from './CashFlowTable';
import { RatiosTable } from './RatiosTable';
import { ShareholdingPatternTable } from './ShareholdingPatternTable';
import { StockDocuments } from './StockDocuments';

interface StockDetailModalProps {
  stock: Stock | null;
  onClose: () => void;
  onSelectPeer?: (symbol: string) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  onClose,
  onSelectPeer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!stock) return null;

  const scrollTo = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-2xl flex justify-center animate-fade-in">
      <div className="relative w-full max-w-7xl min-h-screen bg-[#05070a] text-white p-4 sm:p-6 lg:p-8 flex flex-col shadow-2xl">
        {/* Top Control Bar */}
        <div className="sticky top-0 z-40 apple-glass py-3 px-4 rounded-2xl border border-white/[0.08] flex items-center justify-between gap-4 mb-6 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 font-medium hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Screener</span>
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

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/[0.08] transition-all"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
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
            <PeersTable stock={stock} onSelectPeer={onSelectPeer} />
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
    </div>
  );
};
