import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Stock, PeerInfo } from '../../types/stock';
import { STOCKS_DATA } from '../../data/stocksData';
import { stockPath } from '../../lib/routes';
import { crore, isReported, multiple, pct, price, signClass, statement } from '../../lib/format';

const COLUMNS: Array<{
  label: string;
  value: (p: PeerInfo) => React.ReactNode;
}> = [
  { label: 'Price', value: (p) => price(p.current_price) },
  { label: 'P/E', value: (p) => multiple(p.pe_ratio) },
  { label: 'Mkt cap', value: (p) => crore(p.market_cap) },
  { label: 'Div yld', value: (p) => pct(p.dividend_yield, 2) },
  { label: 'Qtr profit', value: (p) => (isReported(p.net_profit_qtr) ? statement(p.net_profit_qtr) : null) },
  {
    label: 'Profit var',
    value: (p) =>
      isReported(p.qtr_profit_var_pct) ? (
        <span className={signClass(p.qtr_profit_var_pct)}>{p.qtr_profit_var_pct.toFixed(1)}%</span>
      ) : null,
  },
  { label: 'Qtr sales', value: (p) => (isReported(p.sales_qtr) ? statement(p.sales_qtr) : null) },
  {
    label: 'Sales var',
    value: (p) =>
      isReported(p.qtr_sales_var_pct) ? (
        <span className={signClass(p.qtr_sales_var_pct)}>{p.qtr_sales_var_pct.toFixed(1)}%</span>
      ) : null,
  },
  { label: 'ROCE', value: (p) => pct(p.roce) },
];

export const PeersTable: React.FC<{ stock: Stock }> = ({ stock }) => {
  const navigate = useNavigate();
  const peers = stock.peers || [];
  if (!peers.length) return null;

  const known = new Set(STOCKS_DATA.map((s) => s.symbol));

  // The company itself, shaped like a peer row so it sits in the comparison.
  const self: PeerInfo = {
    symbol: stock.symbol,
    name: stock.name,
    current_price: stock.current_price,
    pe_ratio: stock.pe_ratio as number,
    market_cap: stock.market_cap,
    dividend_yield: stock.dividend_yield,
    net_profit_qtr: stock.quarterly_results?.[stock.quarterly_results.length - 1]?.net_profit ?? (null as never),
    qtr_profit_var_pct: null as never,
    sales_qtr: stock.quarterly_results?.[stock.quarterly_results.length - 1]?.sales ?? (null as never),
    qtr_sales_var_pct: null as never,
    roce: stock.roce as number,
  };

  const rows = [{ peer: self, isSelf: true }, ...peers.map((peer) => ({ peer, isSelf: false }))];

  return (
    <div className="apple-card overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-apple-border">
        <h2 className="text-sm font-semibold text-apple-primary font-display">Peers</h2>
        <p className="text-xs text-apple-muted mt-0.5">
          {stock.industry} · {stock.sector}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="apple-table">
          <thead>
            <tr>
              <th className="apple-sticky-col text-left min-w-[180px]">Company</th>
              {COLUMNS.map((col) => (
                <th key={col.label} className="text-right">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ peer, isSelf }) => {
              const clickable = !isSelf && known.has(peer.symbol);
              return (
                <tr
                  key={peer.symbol}
                  onClick={clickable ? () => navigate(stockPath(peer.symbol)) : undefined}
                  className={clickable ? 'cursor-pointer' : ''}
                  style={isSelf ? { background: 'var(--apple-blue-subtle)' } : undefined}
                >
                  <td
                    className="apple-sticky-col"
                    style={isSelf ? { background: 'var(--apple-blue-subtle)' } : undefined}
                  >
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`font-mono text-xs font-semibold ${
                          isSelf ? 'text-apple-primary' : 'text-apple-blue'
                        }`}
                      >
                        {peer.symbol}
                      </span>
                      <span className="text-xs text-apple-muted truncate max-w-[130px]">{peer.name}</span>
                      {isSelf && <span className="text-[10px] text-apple-faint">this page</span>}
                    </div>
                  </td>
                  {COLUMNS.map((col) => (
                    <td key={col.label} className="text-right font-mono whitespace-nowrap">
                      {col.value(peer) ?? <span className="num-nil">—</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="px-4 sm:px-5 py-2.5 border-t border-apple-border-subtle text-[11px] text-apple-muted">
        Peer figures are kept in step with each company&rsquo;s own page. Rows without a page here are outside
        this universe and are not clickable.
      </p>
    </div>
  );
};
