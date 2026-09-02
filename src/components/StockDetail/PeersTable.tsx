import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { Stock } from '../../types/stock';

interface PeersTableProps {
  stock: Stock;
  onSelectPeer?: (symbol: string) => void;
}

export const PeersTable: React.FC<PeersTableProps> = ({ stock, onSelectPeer }) => {
  const navigate = useNavigate();
  const peers = stock.peers || [];

  if (peers.length === 0) return null;

  return (
    <div className="w-full apple-card p-6 shadow-sm mb-8 overflow-hidden border border-apple">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-apple-border-subtle mb-4">
        <div>
          <h3 className="text-base font-bold text-apple-primary flex items-center gap-2 font-display">
            <Layers className="w-4 h-4 text-apple-blue" />
            Peer Comparison
          </h3>
          <p className="text-xs text-apple-muted mt-0.5">
            Sector: <strong className="text-apple-primary">{stock.sector}</strong> • Industry: <strong className="text-apple-primary">{stock.industry}</strong>
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse apple-table text-xs font-mono">
          <thead>
            <tr>
              <th className="py-3 px-4 sticky left-0 z-10 bg-apple-subtle min-w-[160px] border-b border-apple-border">
                Company
              </th>
              <th className="py-3 px-3 text-right border-b border-apple-border">CMP (₹)</th>
              <th className="py-3 px-3 text-right border-b border-apple-border">P/E</th>
              <th className="py-3 px-3 text-right border-b border-apple-border">Mar Cap (₹ Cr)</th>
              <th className="py-3 px-3 text-right border-b border-apple-border">Div Yld %</th>
              <th className="py-3 px-3 text-right border-b border-apple-border">NP Qtr (₹ Cr)</th>
              <th className="py-3 px-3 text-right border-b border-apple-border">Qtr Profit Var %</th>
              <th className="py-3 px-3 text-right border-b border-apple-border">Sales Qtr (₹ Cr)</th>
              <th className="py-3 px-3 text-right border-b border-apple-border">Qtr Sales Var %</th>
              <th className="py-3 px-3 text-right border-b border-apple-border">ROCE %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-apple-border-subtle">
            {/* Current Stock Row Highlighted */}
            <tr className="bg-apple-blue-subtle/50 font-semibold">
              <td className="py-3 px-4 sticky left-0 z-10 bg-apple-card border-r border-apple-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="text-apple-blue">{stock.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-apple-blue text-white font-sans font-bold">
                    Current
                  </span>
                </div>
              </td>
              <td className="py-3 px-3 text-right text-apple-primary">₹{stock.current_price.toLocaleString('en-IN')}</td>
              <td className="py-3 px-3 text-right text-apple-primary">{stock.pe_ratio > 0 ? stock.pe_ratio.toFixed(1) : '-'}</td>
              <td className="py-3 px-3 text-right text-apple-primary">₹{stock.market_cap.toLocaleString('en-IN')}</td>
              <td className="py-3 px-3 text-right text-apple-primary">{stock.dividend_yield.toFixed(2)}%</td>
              <td className="py-3 px-3 text-right text-apple-primary">-</td>
              <td className="py-3 px-3 text-right text-apple-primary">-</td>
              <td className="py-3 px-3 text-right text-apple-primary">-</td>
              <td className="py-3 px-3 text-right text-apple-primary">-</td>
              <td className="py-3 px-3 text-right text-apple-primary">{stock.roce.toFixed(1)}%</td>
            </tr>

            {/* Peer Rows */}
            {peers.map((peer, idx) => (
              <tr
                key={peer.symbol || idx}
                onClick={() => {
                  navigate(`/stock/${peer.symbol}`);
                  if (onSelectPeer) onSelectPeer(peer.symbol);
                }}
                className="hover:bg-apple-surface-hover transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4 sticky left-0 z-10 bg-apple-card group-hover:bg-apple-subtle border-r border-apple-border-subtle transition-colors">
                  <div className="text-apple-blue group-hover:underline">
                    {peer.name}
                  </div>
                </td>
                <td className="py-3 px-3 text-right text-apple-primary">₹{peer.current_price.toLocaleString('en-IN')}</td>
                <td className="py-3 px-3 text-right text-apple-primary">{peer.pe_ratio > 0 ? peer.pe_ratio.toFixed(1) : '-'}</td>
                <td className="py-3 px-3 text-right text-apple-primary">₹{peer.market_cap.toLocaleString('en-IN')}</td>
                <td className="py-3 px-3 text-right text-apple-primary">{peer.dividend_yield ? `${peer.dividend_yield.toFixed(2)}%` : '-'}</td>
                <td className="py-3 px-3 text-right text-apple-primary">{peer.net_profit_qtr ? `₹${peer.net_profit_qtr.toLocaleString('en-IN')}` : '-'}</td>
                <td className="py-3 px-3 text-right text-apple-primary">
                  {peer.qtr_profit_var_pct ? (
                    <span className={peer.qtr_profit_var_pct >= 0 ? 'text-apple-green' : 'text-apple-red'}>
                      {peer.qtr_profit_var_pct >= 0 ? '+' : ''}{peer.qtr_profit_var_pct.toFixed(1)}%
                    </span>
                  ) : '-'}
                </td>
                <td className="py-3 px-3 text-right text-apple-primary">{peer.sales_qtr ? `₹${peer.sales_qtr.toLocaleString('en-IN')}` : '-'}</td>
                <td className="py-3 px-3 text-right text-apple-primary">
                  {peer.qtr_sales_var_pct ? (
                    <span className={peer.qtr_sales_var_pct >= 0 ? 'text-apple-green' : 'text-apple-red'}>
                      {peer.qtr_sales_var_pct >= 0 ? '+' : ''}{peer.qtr_sales_var_pct.toFixed(1)}%
                    </span>
                  ) : '-'}
                </td>
                <td className="py-3 px-3 text-right text-apple-primary">{peer.roce ? `${peer.roce.toFixed(1)}%` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
