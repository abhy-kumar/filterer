import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Sliders,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  Check
} from 'lucide-react';
import { Stock } from '../types/stock';
import { METRICS_DICTIONARY } from '../engine/metricsDictionary';

interface ColumnConfig {
  key: keyof Stock | string;
  label: string;
  unit: string;
  visible: boolean;
  align?: 'left' | 'right' | 'center';
  format?: (val: any, stock: Stock) => React.ReactNode;
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
  const [searchFilter, setSearchFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [sortKey, setSortKey] = useState<string>('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showColumnModal, setShowColumnModal] = useState(false);

  // Default active columns
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'current_price', label: 'Price (₹)', unit: 'Rs', visible: true, align: 'right' },
    { key: 'change_pct', label: 'Day %', unit: '%', visible: true, align: 'right' },
    { key: 'market_cap', label: 'Market Cap (₹ Cr)', unit: 'Cr', visible: true, align: 'right' },
    { key: 'pe_ratio', label: 'P/E', unit: 'x', visible: true, align: 'right' },
    { key: 'roce', label: 'ROCE %', unit: '%', visible: true, align: 'right' },
    { key: 'roe', label: 'ROE %', unit: '%', visible: true, align: 'right' },
    { key: 'debt_to_equity', label: 'Debt / Eq', unit: 'x', visible: true, align: 'right' },
    { key: 'sales_growth_3y', label: 'Sales Gr 3Y %', unit: '%', visible: true, align: 'right' },
    { key: 'profit_growth_3y', label: 'Profit Gr 3Y %', unit: '%', visible: true, align: 'right' },
    { key: 'dividend_yield', label: 'Div Yield %', unit: '%', visible: true, align: 'right' },
    { key: 'piotroski_score', label: 'Piotroski', unit: 'Score', visible: true, align: 'center' },
    { key: 'rsi_14', label: 'RSI', unit: 'Score', visible: false, align: 'right' },
    { key: 'dma_50', label: '50 DMA', unit: 'Rs', visible: false, align: 'right' },
    { key: 'dma_200', label: '200 DMA', unit: 'Rs', visible: false, align: 'right' },
    { key: 'fcf_yield', label: 'FCF Yield %', unit: '%', visible: false, align: 'right' },
    { key: 'promoter_holding', label: 'Promoter %', unit: '%', visible: false, align: 'right' },
  ]);

  // Unique sectors
  const sectors = useMemo(() => {
    const set = new Set(stocks.map((s) => s.sector));
    return ['All', ...Array.from(set).sort()];
  }, [stocks]);

  // Handle Sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // Filter & Sort
  const processedStocks = useMemo(() => {
    let result = [...stocks];

    // Sector Filter
    if (sectorFilter !== 'All') {
      result = result.filter((s) => s.sector === sectorFilter);
    }

    // Text Search
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q)
      );
    }

    // Sorting
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

  // Pagination
  const totalPages = pageSize === -1 ? 1 : Math.ceil(processedStocks.length / pageSize);
  const paginatedStocks = useMemo(() => {
    if (pageSize === -1) return processedStocks;
    const start = (currentPage - 1) * pageSize;
    return processedStocks.slice(start, start + pageSize);
  }, [processedStocks, currentPage, pageSize]);

  // Toggle Column Visibility
  const toggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, visible: !col.visible } : col))
    );
  };

  const visibleColumns = columns.filter((c) => c.visible);

  return (
    <div className="w-full bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 shadow-xl overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-white/5 dark:border-white/5 light:border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-50/50">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Quick Filter Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter results..."
              className="w-full bg-slate-950/80 dark:bg-slate-950/80 light:bg-white text-xs pl-9 pr-3 py-2 rounded-xl border border-white/10 dark:border-white/10 light:border-slate-300 focus:outline-hidden focus:border-sky-500 text-slate-200 placeholder-slate-500"
            />
          </div>

          {/* Sector Filter */}
          <select
            value={sectorFilter}
            onChange={(e) => {
              setSectorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950/80 dark:bg-slate-950/80 light:bg-white text-xs px-3 py-2 rounded-xl border border-white/10 dark:border-white/10 light:border-slate-300 focus:outline-hidden focus:border-sky-500 text-slate-300"
          >
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Sectors' : s}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons: Column Picker & Export */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowColumnModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-100 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-white/5 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>Edit Columns</span>
          </button>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 dark:bg-slate-800/80 light:bg-slate-100 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-white/5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse financial-table">
          <thead>
            <tr className="bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100/80 text-slate-400 border-b border-white/10">
              <th className="py-3.5 px-4 font-mono text-[11px] uppercase tracking-wider text-slate-400 sticky left-0 z-20 bg-[#080c13] dark:bg-[#080c13] light:bg-slate-100 min-w-[200px]">
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
                    } ${isSorted ? 'text-sky-400 font-bold' : 'text-slate-400'}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                      }`}
                    >
                      <span>{col.label}</span>
                      {isSorted ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-sky-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-sky-400" />
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
          <tbody className="divide-y divide-white/5 dark:divide-white/5 light:divide-slate-200">
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
              paginatedStocks.map((stock, idx) => (
                <tr
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock)}
                  className="group hover:bg-sky-500/[0.04] dark:hover:bg-sky-500/[0.04] light:hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {/* Symbol & Name Sticky Column */}
                  <td className="py-3 px-4 sticky left-0 z-10 bg-[#0c1017] group-hover:bg-[#0e141f] dark:bg-[#0c1017] dark:group-hover:bg-[#0e141f] light:bg-white light:group-hover:bg-slate-50 border-r border-white/5 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-sky-400 font-mono group-hover:text-sky-300">
                            {stock.symbol}
                          </span>
                          {stock.debt_to_equity < 0.1 && (
                            <span title="Virtually Debt Free">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                            </span>
                          )}
                          {stock.piotroski_score >= 8 && (
                            <span title={`High Piotroski Score: ${stock.piotroski_score}/9`}>
                              <Sparkles className="w-3 h-3 text-amber-400 inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {stock.name}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>

                  {/* Dynamic Visible Columns */}
                  {visibleColumns.map((col) => {
                    const rawVal = (stock as any)[col.key];
                    let displayVal: React.ReactNode = rawVal;

                    if (col.key === 'current_price') {
                      displayVal = `₹${rawVal.toLocaleString('en-IN')}`;
                    } else if (col.key === 'change_pct') {
                      const isUp = rawVal >= 0;
                      displayVal = (
                        <span
                          className={`font-mono font-medium inline-flex items-center ${
                            isUp ? 'text-emerald-400' : 'text-rose-400'
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
                          className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                            rawVal >= 8
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : rawVal >= 6
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {rawVal}/9
                        </span>
                      );
                    }

                    return (
                      <td
                        key={col.key as string}
                        className={`py-3 px-3 text-xs font-mono text-slate-300 dark:text-slate-300 light:text-slate-800 ${
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
      <div className="p-4 border-t border-white/5 dark:border-white/5 light:border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <span>Showing</span>
          <span className="font-bold text-white dark:text-white light:text-slate-900 font-mono">
            {paginatedStocks.length}
          </span>
          <span>of</span>
          <span className="font-bold text-white dark:text-white light:text-slate-900 font-mono">
            {processedStocks.length}
          </span>
          <span>matching stocks</span>
        </div>

        {/* Page Size and Pagination Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 text-xs px-2 py-1 rounded-lg border border-white/10 text-slate-300 focus:outline-hidden"
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
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Column Customizer Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0e141f] dark:bg-[#0e141f] light:bg-white w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                Customize Table Columns
              </h3>
              <button
                onClick={() => setShowColumnModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Done
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Choose the financial metrics and ratios to display on your screen results table.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {columns.map((col) => (
                <div
                  key={col.key as string}
                  onClick={() => toggleColumn(col.key as string)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    col.visible
                      ? 'bg-sky-500/10 border-sky-500/30 text-white'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        col.visible
                          ? 'bg-sky-500 border-sky-500 text-white'
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
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20"
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
