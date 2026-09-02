import React from 'react';
import { Layers, ExternalLink } from 'lucide-react';
import { Stock, PeerInfo } from '../../types/stock';

interface PeersTableProps {
  stock: Stock;
  onSelectPeer?: (symbol: string) => void;
}

export const PeersTable: React.FC<PeersTableProps> = ({ stock, onSelectPeer }) => {
  const peers = stock.peers || [];

  if (peers.length === 0) return null;

  return (
    <div className="w-full bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 p-6 shadow-xl mb-8 overflow-hidden">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/5 dark:border-white/5 light:border-slate-100 mb-4">
        <div>
          <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Peer Comparison
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Sector: <strong className="text-white dark:text-white light:text-slate-900">{stock.sector}</strong> • Industry: <strong className="text-white dark:text-white light:text-slate-900">{stock.industry}</strong>
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse financial-table text-xs font-mono">
          <thead>
            <tr className="bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100 text-slate-400">
              <th className="py-3 px-4 sticky left-0 z-10 bg-[#080c13] dark:bg-[#080c13] light:bg-slate-100 min-w-[160px]">
                Company
              </th>
              <th className="py-3 px-3 text-right">CMP (₹)</th>
              <th className="py-3 px-3 text-right">P/E</th>
              <th className="py-3 px-3 text-right">Mar Cap (₹ Cr)</th>
              <th className="py-3 px-3 text-right">Div Yld %</th>
              <th className="py-3 px-3 text-right">NP Qtr (₹ Cr)</th>
              <th className="py-3 px-3 text-right">Qtr Profit Var %</th>
              <th className="py-3 px-3 text-right">Sales Qtr (₹ Cr)</th>
              <th className="py-3 px-3 text-right">Qtr Sales Var %</th>
              <th className="py-3 px-3 text-right">ROCE %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 dark:divide-white/5 light:divide-slate-200">
            {/* Current Stock Row Highlighted */}
            <tr className="bg-sky-500/10 dark:bg-sky-500/10 light:bg-sky-50 font-semibold border-l-2 border-sky-400">
              <td className="py-2.5 px-4 sticky left-0 z-10 bg-[#101726] dark:bg-[#101726] light:bg-sky-50 text-sky-400 font-bold">
                {stock.name} ({stock.symbol})
              </td>
              <td className="py-2.5 px-3 text-right text-white dark:text-white light:text-slate-900">
                ₹{stock.current_price.toLocaleString('en-IN')}
              </td>
              <td className="py-2.5 px-3 text-right text-sky-300">
                {stock.pe_ratio.toFixed(2)}
              </td>
              <td className="py-2.5 px-3 text-right text-white dark:text-white light:text-slate-900">
                ₹{stock.market_cap.toLocaleString('en-IN')}
              </td>
              <td className="py-2.5 px-3 text-right text-slate-300">
                {stock.dividend_yield.toFixed(2)}%
              </td>
              <td className="py-2.5 px-3 text-right text-slate-300">
                ₹{Math.round(stock.market_cap * 0.012).toLocaleString('en-IN')}
              </td>
              <td className={`py-2.5 px-3 text-right ${stock.profit_growth_3y >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stock.profit_growth_3y.toFixed(1)}%
              </td>
              <td className="py-2.5 px-3 text-right text-slate-300">
                ₹{Math.round(stock.market_cap * 0.08).toLocaleString('en-IN')}
              </td>
              <td className={`py-2.5 px-3 text-right ${stock.sales_growth_3y >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stock.sales_growth_3y.toFixed(1)}%
              </td>
              <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                {stock.roce.toFixed(1)}%
              </td>
            </tr>

            {/* Peers Rows */}
            {peers.map((peer) => (
              <tr
                key={peer.symbol}
                onClick={() => onSelectPeer && onSelectPeer(peer.symbol)}
                className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <td className="py-2.5 px-4 sticky left-0 z-10 bg-[#0c1017] dark:bg-[#0c1017] light:bg-white text-slate-200 dark:text-slate-200 light:text-slate-800 group-hover:text-sky-400 font-medium">
                  <div className="flex items-center justify-between">
                    <span>{peer.name}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-sky-400" />
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300 dark:text-slate-300 light:text-slate-700">
                  ₹{peer.current_price.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300 dark:text-slate-300 light:text-slate-700">
                  {peer.pe_ratio.toFixed(2)}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300 dark:text-slate-300 light:text-slate-700">
                  ₹{peer.market_cap.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300 dark:text-slate-300 light:text-slate-700">
                  {peer.dividend_yield.toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300 dark:text-slate-300 light:text-slate-700">
                  ₹{peer.net_profit_qtr.toLocaleString('en-IN')}
                </td>
                <td className={`py-2.5 px-3 text-right ${peer.qtr_profit_var_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {peer.qtr_profit_var_pct.toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300 dark:text-slate-300 light:text-slate-700">
                  ₹{peer.sales_qtr.toLocaleString('en-IN')}
                </td>
                <td className={`py-2.5 px-3 text-right ${peer.qtr_sales_var_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {peer.qtr_sales_var_pct.toFixed(1)}%
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                  {peer.roce.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
