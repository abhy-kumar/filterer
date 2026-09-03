import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
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
  { label: 'NP Qtr', value: (p) => (isReported(p.net_profit_qtr) ? statement(p.net_profit_qtr) : null) },
  {
    label: 'Qtr Profit Var',
    value: (p) =>
      isReported(p.qtr_profit_var_pct) ? (
        <span className={signClass(p.qtr_profit_var_pct)}>{p.qtr_profit_var_pct.toFixed(1)}%</span>
      ) : null,
  },
  { label: 'Sales Qtr', value: (p) => (isReported(p.sales_qtr) ? statement(p.sales_qtr) : null) },
  {
    label: 'Qtr Sales Var',
    value: (p) =>
      isReported(p.qtr_sales_var_pct) ? (
        <span className={signClass(p.qtr_sales_var_pct)}>{p.qtr_sales_var_pct.toFixed(1)}%</span>
      ) : null,
  },
  { label: 'ROCE', value: (p) => pct(p.roce) },
  { label: 'P/B', value: (p) => multiple(p.pb_ratio) },
  { label: 'OPM', value: (p) => pct(p.opm) },
  {
    label: 'D/E',
    value: (p) =>
      p.debt_to_equity !== undefined && p.debt_to_equity !== null ? p.debt_to_equity.toFixed(2) : null,
  },
];

export const PeersTable: React.FC<{ stock: Stock }> = ({ stock }) => {
  const navigate = useNavigate();

  // The company itself, shaped like a peer row
  const self: PeerInfo = useMemo(
    () => ({
      symbol: stock.symbol,
      name: stock.name,
      current_price: stock.current_price,
      pe_ratio: stock.pe_ratio as number,
      market_cap: stock.market_cap,
      dividend_yield: stock.dividend_yield,
      net_profit_qtr: stock.quarterly_results?.[stock.quarterly_results.length - 1]?.net_profit ?? (null as never),
      qtr_profit_var_pct: stock.profit_growth_ttm ?? (null as never),
      sales_qtr: stock.quarterly_results?.[stock.quarterly_results.length - 1]?.sales ?? (null as never),
      qtr_sales_var_pct: stock.sales_growth_ttm ?? (null as never),
      roce: stock.roce as number,
      pb_ratio: stock.pb_ratio,
      opm: stock.opm,
      debt_to_equity: stock.debt_to_equity,
    }),
    [stock]
  );

  const { rows, peerCount, filterContext } = useMemo(() => {
    let peerCandidates: PeerInfo[] = [];
    let context = '';

    // 1. If stock explicitly has populated peers from detail tier, prefer them
    if (stock.peers && stock.peers.length > 0) {
      peerCandidates = stock.peers;
      context = stock.industry ? `${stock.industry} · ${stock.sector}` : stock.sector || 'Peers';
    } else {
      // 2. Dynamically find peers from STOCKS_DATA
      const targetIndustry = stock.industry?.trim().toLowerCase();
      const targetSector = stock.sector?.trim().toLowerCase();

      const industryMatches = STOCKS_DATA.filter(
        (s) =>
          s.symbol !== stock.symbol &&
          s.industry &&
          targetIndustry &&
          s.industry.trim().toLowerCase() === targetIndustry
      );

      if (industryMatches.length >= 2) {
        context = `${stock.industry} · ${stock.sector}`;
        peerCandidates = industryMatches.map((p) => ({
          symbol: p.symbol,
          name: p.name,
          current_price: p.current_price,
          pe_ratio: p.pe_ratio,
          market_cap: p.market_cap,
          dividend_yield: p.dividend_yield,
          net_profit_qtr: null as never,
          qtr_profit_var_pct: p.profit_growth_ttm ?? (null as never),
          sales_qtr: null as never,
          qtr_sales_var_pct: p.sales_growth_ttm ?? (null as never),
          roce: p.roce,
          pb_ratio: p.pb_ratio,
          opm: p.opm,
          debt_to_equity: p.debt_to_equity,
        }));
      } else if (targetSector) {
        context = `${stock.sector} (Sector Benchmarking)`;
        const sectorMatches = STOCKS_DATA.filter(
          (s) =>
            s.symbol !== stock.symbol &&
            s.sector &&
            targetSector &&
            s.sector.trim().toLowerCase() === targetSector
        );
        peerCandidates = sectorMatches.map((p) => ({
          symbol: p.symbol,
          name: p.name,
          current_price: p.current_price,
          pe_ratio: p.pe_ratio,
          market_cap: p.market_cap,
          dividend_yield: p.dividend_yield,
          net_profit_qtr: null as never,
          qtr_profit_var_pct: p.profit_growth_ttm ?? (null as never),
          sales_qtr: null as never,
          qtr_sales_var_pct: p.sales_growth_ttm ?? (null as never),
          roce: p.roce,
          pb_ratio: p.pb_ratio,
          opm: p.opm,
          debt_to_equity: p.debt_to_equity,
        }));
      }
    }

    // Sort peers by market cap descending and take top 7
    peerCandidates.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
    const topPeers = peerCandidates.slice(0, 7);

    // Combine self + top peers, then sort all by market cap descending so rank is truthful
    const allRows = [
      { peer: self, isSelf: true },
      ...topPeers.map((peer) => ({ peer, isSelf: false })),
    ];
    allRows.sort((a, b) => (b.peer.market_cap || 0) - (a.peer.market_cap || 0));

    return {
      rows: allRows,
      peerCount: peerCandidates.length,
      filterContext: context || `${stock.industry} · ${stock.sector}`,
    };
  }, [stock, self]);

  const known = useMemo(() => new Set(STOCKS_DATA.map((s) => s.symbol)), []);

  return (
    <div className="apple-card overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-apple-border flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-apple-blue" />
            <h2 className="text-sm font-semibold text-apple-primary font-display">Peer Comparison</h2>
          </div>
          <p className="text-xs text-apple-muted mt-0.5">{filterContext}</p>
        </div>
        <div className="text-xs text-apple-muted font-mono">
          {peerCount > 0 ? `${peerCount} peers in universe` : 'Sole constituent in universe'}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="apple-table">
          <thead>
            <tr>
              <th className="text-center w-10 text-apple-faint text-[11px]">#</th>
              <th className="apple-sticky-col text-left min-w-[180px]">Company</th>
              {COLUMNS.map((col) => (
                <th key={col.label} className="text-right">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ peer, isSelf }, idx) => {
              const clickable = !isSelf && known.has(peer.symbol);
              return (
                <tr
                  key={peer.symbol}
                  onClick={clickable ? () => navigate(stockPath(peer.symbol)) : undefined}
                  className={clickable ? 'cursor-pointer hover:bg-apple-surface-hover transition-colors' : ''}
                  style={isSelf ? { background: 'var(--apple-blue-subtle)' } : undefined}
                >
                  <td className="text-center font-mono text-xs text-apple-faint">{idx + 1}</td>
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
                      {isSelf && (
                        <span className="text-[10px] font-semibold text-apple-blue bg-apple-blue/10 px-1.5 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                  </td>
                  {COLUMNS.map((col) => (
                    <td key={col.label} className="text-right font-mono whitespace-nowrap">
                      {col.value(peer) ?? <span className="num-nil">-</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="px-4 sm:px-5 py-2.5 border-t border-apple-border-subtle text-[11px] text-apple-muted">
        Peers are selected from the Nifty 500 universe sharing the same industry and sector, ordered by market
        capitalization. Click on any peer to view its complete financial statement profile.
      </p>
    </div>
  );
};
