import React, { useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  Bookmark,
  ExternalLink,
  ChevronRight
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex justify-center animate-fade-in">
      <div className="relative w-full max-w-7xl min-h-screen bg-[#06090e] dark:bg-[#06090e] light:bg-[#f8fafc] text-white p-4 sm:p-6 lg:p-8 flex flex-col shadow-2xl">
        {/* Modal Top Control Bar */}
        <div className="sticky top-0 z-40 bg-[#06090e]/90 dark:bg-[#06090e]/90 light:bg-white/90 backdrop-blur-md py-3 border-b border-white/10 flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="cursor-pointer hover:text-white" onClick={onClose}>
              Stocks
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-bold text-sky-400 font-mono">{stock.symbol}</span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-300 font-medium">{stock.name}</span>
          </div>

          {/* Quick Sub-navigation Anchor Bar */}
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto text-[11px] font-medium text-slate-400">
            <button onClick={() => scrollTo('sec-pros')} className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition-colors">Pros/Cons</button>
            <button onClick={() => scrollTo('sec-charts')} className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition-colors">Charts</button>
            <button onClick={() => scrollTo('sec-peers')} className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition-colors">Peers</button>
            <button onClick={() => scrollTo('sec-quarters')} className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition-colors">Quarters</button>
            <button onClick={() => scrollTo('sec-pnl')} className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition-colors">P&L</button>
            <button onClick={() => scrollTo('sec-balancesheet')} className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition-colors">Balance Sheet</button>
            <button onClick={() => scrollTo('sec-cashflows')} className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition-colors">Cash Flows</button>
            <button onClick={() => scrollTo('sec-ratios')} className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition-colors">Ratios</button>
            <button onClick={() => scrollTo('sec-shareholding')} className="px-2.5 py-1 rounded-md hover:bg-slate-800 hover:text-white transition-colors">Shareholding</button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-all"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Detailed Sections */}
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
