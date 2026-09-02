import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Sliders,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Check,
  ChevronDown
} from 'lucide-react';
import { Stock } from '../types/stock';

interface ColumnConfig {
  key: keyof Stock | string;
  label: string;
  unit: string;
  visible: boolean;
  align?: 'left' | 'right' | 'center';
}

interface ScreenResultsTableProps {
  stocks: Stock[];
  onSelectStock: (stock: Stock) => void;
  onExportCSV: () => void;
}

export const ScreenResultsTable: React.FC<ScreenResultsTableProps> = ({
  stocks,
  onSelectStock,
  onExportCSV,
}) => {
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [sortKey, setSortKey] = useState<string>('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showColumnModal, setShowColumnModal] = useState(false);

  // Column definitions
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'current_price', label: 'Price (₹)', unit: 'Rs', visible: true, align: 'right' },
    { key: 'change_pct', label: 'Day %', unit: '%', visible: true, align: 'right' },
    { key: 'market_cap', label: 'Market Cap (₹ Cr)', unit: 'Cr', visible: true, align: 'right' },
    { key: 'pe_ratio', label: 'P/E', unit: 'x', visible: true, align: 'right' },
    { key: 'roce', label: 'ROCE %', unit: '%', visible: true, align: 'right' },
    { key: 'roe', label: 'ROE %', unit: '%', visible: true, align: 'right' },
    { key: 'debt_to_equity', label: 'Debt / Eq', unit: 'x', visible: true, align: 'right' },
    { key: 'sales_growth_3y', label: 'Sales 3Y %', unit: '%', visible: true, align: 'right' },
    { key: 'profit_growth_3y', label: 'Profit 3Y %', unit: '%', visible: true, align: 'right' },
    { key: 'dividend_yield', label: 'Div Yield %', unit: '%', visible: true, align: 'right' },
    { key: 'piotroski_score', label: 'Piotroski', unit: 'Score', visible: true, align: 'center' },
    { key: 'rsi_14', label: 'RSI (14)', unit: 'Score', visible: false, align: 'right' },
    { key: 'dma_50', label: '50 DMA', unit: 'Rs', visible: false, align: 'right' },
    { key: 'dma_200', label: '200 DMA', unit: 'Rs', visible: false, align: 'right' },
    { key: 'fcf_yield', label: 'FCF Yield %', unit: '%', visible: false, align: 'right' },
    { key: 'promoter_holding', label: 'Promoter %', unit: '%', visible: false, align: 'right' },
  ]);

  const sectors = useMemo(() => {
    const set = new Set(stocks.map((s) => s.sector));
    return ['All', ...Array.from(set).sort()];
  }, [stocks]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const processedStocks = useMemo(() => {
    let result = [...stocks];

    if (sectorFilter !== 'All') {
      result = result.filter((s) => s.sector === sectorFilter);
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal = (a as any)[sortKey];
      let bVal = (b as any)[sortKey];

      if (aVal === undefined || aVal === null) aVal = -Infinity;
      if (bVal === undefined || bVal === null) bVal = -Infinity;

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [stocks, sectorFilter, searchFilter, sortKey, sortOrder]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(processedStocks.length / pageSize);
  const paginatedStocks = useMemo(() => {
    if (pageSize === -1) return processedStocks;
    const start = (currentPage - 1) * pageSize;
    return processedStocks.slice(start, start + pageSize);
  }, [processedStocks, currentPage, pageSize]);

  const toggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, visible: !col.visible } : col))
    );
  };

  const visibleColumns = columns.filter((c) => c.visible);

  return (
    <div className="w-full apple-glass rounded-3xl border border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.06] overflow-hidden shadow-2xl">
      {/* Table Action Bar */}
      <div className="p-4 sm:p-5 border-b border-white/[0.06] dark:border-white/[0.06] light:border-black/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/[0.02]">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter matches..."
              className="w-full bg-white/[0.04] dark:bg-white/[0.04] light:bg-white text-xs pl-9 pr-3 py-2 rounded-xl border border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.08] focus:outline-hidden focus:border-[#2997ff] text-slate-200 placeholder-slate-500"
            />
          </div>

          {/* Sector Select */}
          <select
            value={sectorFilter}
            onChange={(e) => {
              setSectorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white/[0.04] dark:bg-white/[0.04] light:bg-white text-xs px-3 py-2 rounded-xl border border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.08] focus:outline-hidden focus:border-[#2997ff] text-slate-300"
          >
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Sectors' : s}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowColumnModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] dark:bg-white/[0.05] light:bg-black/[0.04] hover:bg-white/[0.1] text-xs font-medium text-slate-300 border border-white/[0.08] transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-[#2997ff]" />
            <span>Columns</span>
          </button>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.05] dark:bg-white/[0.05] light:bg-black/[0.04] hover:bg-white/[0.1] text-xs font-medium text-slate-300 border border-white/[0.08] transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#30d158]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse apple-table">
          <thead>
            <tr className="bg-black/30 text-slate-400 border-b border-white/[0.08]">
              <th className="py-3.5 px-4 font-mono text-[11px] uppercase tracking-wider text-slate-400 sticky left-0 z-20 bg-[#070b12] dark:bg-[#070b12] light:bg-slate-100 min-w-[200px]">
                Company / Stock
              </th>
              {visibleColumns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key as string}
                    onClick={() => handleSort(col.key as string)}
                    className={`py-3.5 px-3 text-[11px] uppercase tracking-wider cursor-pointer hover:text-white select-none whitespace-nowrap transition-colors ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${isSorted ? 'text-[#2997ff] font-bold' : 'text-slate-400'}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                      }`}
                    >
                      <span>{col.label}</span>
                      {isSorted ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-[#2997ff]" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-[#2997ff]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {paginatedStocks.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + 1}
                  className="py-12 text-center text-slate-500 text-sm"
                >
                  No stocks match the given criteria. Try relaxing your filter conditions.
                </td>
              </tr>
            ) : (
              paginatedStocks.map((stock) => (
                <tr
                  key={stock.symbol}
                  onClick={() => {
                    navigate(`/stock/${stock.symbol}`);
                    if (onSelectStock) onSelectStock(stock);
                  }}
                  className="group hover:bg-[#2997ff]/[0.05] transition-colors cursor-pointer"
                >
                  {/* Symbol & Name Column */}
                  <td className="py-3 px-4 sticky left-0 z-10 bg-[#0a0e17] group-hover:bg-[#0e1422] dark:bg-[#0a0e17] dark:group-hover:bg-[#0e1422] light:bg-white light:group-hover:bg-slate-50 border-r border-white/[0.04]">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-[#2997ff] font-mono group-hover:text-sky-300">
                            {stock.symbol}
                          </span>
                          {stock.debt_to_equity < 0.1 && (
                            <span title="Virtually Debt Free">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#30d158] inline" />
                            </span>
                          )}
                          {stock.piotroski_score >= 8 && (
                            <span title={`High Piotroski Score: ${stock.piotroski_score}/9`}>
                              <Sparkles className="w-3 h-3 text-[#ff9f0a] inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
                          {stock.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Dynamic Columns */}
                  {visibleColumns.map((col) => {
                    const rawVal = (stock as any)[col.key];
                    let displayVal: React.ReactNode = rawVal;

                    if (col.key === 'current_price') {
                      displayVal = `₹${rawVal.toLocaleString('en-IN')}`;
                    } else if (col.key === 'change_pct') {
                      const isUp = rawVal >= 0;
                      displayVal = (
                        <span
                          className={`font-mono font-medium ${
                            isUp ? 'text-[#30d158]' : 'text-[#ff453a]'
                          }`}
                        >
                          {isUp ? '+' : ''}
                          {rawVal.toFixed(2)}%
                        </span>
                      );
                    } else if (col.key === 'market_cap') {
                      displayVal = `₹${rawVal.toLocaleString('en-IN')}`;
                    } else if (['pe_ratio', 'pb_ratio', 'peg_ratio', 'debt_to_equity'].includes(col.key as string)) {
                      displayVal = typeof rawVal === 'number' ? rawVal.toFixed(2) : '-';
                    } else if (['roce', 'roe', 'sales_growth_3y', 'profit_growth_3y', 'dividend_yield', 'fcf_yield', 'promoter_holding'].includes(col.key as string)) {
                      displayVal = typeof rawVal === 'number' ? `${rawVal.toFixed(1)}%` : '-';
                    } else if (col.key === 'piotroski_score') {
                      displayVal = (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            rawVal >= 8
                              ? 'bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/25'
                              : rawVal >= 6
                              ? 'bg-[#2997ff]/15 text-[#2997ff] border border-[#2997ff]/25'
                              : 'bg-[#ff9f0a]/15 text-[#ff9f0a] border border-[#ff9f0a]/25'
                          }`}
                        >
                          {rawVal}/9
                        </span>
                      );
                    }

                    return (
                      <td
                        key={col.key as string}
                        className={`py-3 px-3 text-xs font-mono text-slate-300 ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <span>Displaying</span>
          <span className="font-semibold text-white font-mono">
            {paginatedStocks.length}
          </span>
          <span>of</span>
          <span className="font-semibold text-white font-mono">
            {processedStocks.length}
          </span>
          <span>companies</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white/[0.06] text-xs px-2 py-1 rounded-lg border border-white/[0.08] text-slate-300 focus:outline-hidden"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={-1}>All</option>
            </select>
          </div>

          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-30 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-30 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Column Customizer Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e141f] w-full max-w-md rounded-3xl border border-white/[0.1] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#2997ff]" />
                Configure Table Columns
              </h3>
              <button
                onClick={() => setShowColumnModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Done
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Select the financial metrics to show on your screen results table.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {columns.map((col) => (
                <div
                  key={col.key as string}
                  onClick={() => toggleColumn(col.key as string)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all ${
                    col.visible
                      ? 'bg-[#2997ff]/15 border-[#2997ff]/40 text-white'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                        col.visible
                          ? 'bg-[#2997ff] border-[#2997ff] text-white'
                          : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {col.visible && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-xs font-medium">{col.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {col.unit}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowColumnModal(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-b from-[#2997ff] to-[#0071e3] hover:brightness-110 text-white text-xs font-semibold shadow-lg shadow-[#0071e3]/30"
              >
                Apply Columns
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
