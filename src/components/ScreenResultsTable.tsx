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
  Check
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
  onSelectStock?: (stock: Stock) => void;
  onExportCSV?: () => void;
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
    const set = new Set(stocks.map((s) => s.sector).filter(Boolean));
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

  const toggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, visible: !col.visible } : col))
    );
  };

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const matchSearch =
        !searchFilter ||
        stock.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        stock.symbol.toLowerCase().includes(searchFilter.toLowerCase());

      const matchSector = sectorFilter === 'All' || stock.sector === sectorFilter;

      return matchSearch && matchSector;
    });
  }, [stocks, searchFilter, sectorFilter]);

  const sortedStocks = useMemo(() => {
    return [...filteredStocks].sort((a: any, b: any) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (aVal === undefined || aVal === null) aVal = -Infinity;
      if (bVal === undefined || bVal === null) bVal = -Infinity;

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredStocks, sortKey, sortOrder]);

  const totalPages = Math.ceil(sortedStocks.length / pageSize) || 1;
  const paginatedStocks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStocks.slice(start, start + pageSize);
  }, [sortedStocks, currentPage, pageSize]);

  const visibleColumns = columns.filter((c) => c.visible);

  return (
    <div className="w-full apple-card overflow-hidden border border-apple">
      {/* Top Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-apple-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-apple-subtle">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-apple-muted" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter matches..."
              className="w-full bg-apple-card text-xs pl-9 pr-3 py-2 rounded-xl border border-apple-border focus:outline-hidden focus:border-apple-blue text-apple-primary placeholder-apple-muted transition-colors shadow-xs"
            />
          </div>

          {/* Sector Select */}
          <select
            value={sectorFilter}
            onChange={(e) => {
              setSectorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-apple-card text-xs px-3 py-2 rounded-xl border border-apple-border focus:outline-hidden focus:border-apple-blue text-apple-secondary transition-colors shadow-xs"
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-apple-card hover:bg-apple-surface-active text-xs font-medium text-apple-secondary hover:text-apple-primary border border-apple-border transition-all shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-apple-blue" />
            <span>Columns</span>
          </button>

          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-apple-card hover:bg-apple-surface-active text-xs font-medium text-apple-secondary hover:text-apple-primary border border-apple-border transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-apple-green" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse apple-table">
          <thead>
            <tr>
              <th className="py-3.5 px-4 font-mono text-[11px] uppercase tracking-wider text-apple-muted sticky left-0 z-20 bg-apple-subtle min-w-[200px] border-b border-apple-border">
                Company / Stock
              </th>
              {visibleColumns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key as string}
                    onClick={() => handleSort(col.key as string)}
                    className={`py-3.5 px-3 text-[11px] uppercase tracking-wider cursor-pointer hover:text-apple-primary select-none whitespace-nowrap transition-colors border-b border-apple-border ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${isSorted ? 'text-apple-blue font-bold' : 'text-apple-muted'}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                      }`}
                    >
                      <span>{col.label}</span>
                      {isSorted ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-apple-blue" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-apple-blue" />
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
          <tbody className="divide-y divide-apple-border-subtle">
            {paginatedStocks.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + 1}
                  className="py-12 text-center text-apple-muted text-sm"
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
                  className="group hover:bg-apple-surface-hover transition-colors cursor-pointer"
                >
                  {/* Symbol & Name Column */}
                  <td className="py-3 px-4 sticky left-0 z-10 bg-apple-card group-hover:bg-apple-subtle border-r border-apple-border-subtle transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-apple-blue font-mono group-hover:underline">
                            {stock.symbol}
                          </span>
                          {stock.debt_to_equity < 0.1 && (
                            <span title="Virtually Debt Free">
                              <ShieldCheck className="w-3.5 h-3.5 text-apple-green inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-apple-muted truncate max-w-[170px]">
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
                    } else if (col.key === 'market_cap') {
                      displayVal = `₹${rawVal.toLocaleString('en-IN')}`;
                    } else if (col.key === 'change_pct') {
                      const isUp = rawVal >= 0;
                      displayVal = (
                        <span
                          className={`font-semibold ${
                            isUp ? 'text-apple-green' : 'text-apple-red'
                          }`}
                        >
                          {isUp ? '+' : ''}
                          {rawVal.toFixed(2)}%
                        </span>
                      );
                    } else if (col.key === 'pe_ratio') {
                      displayVal = rawVal > 0 ? rawVal.toFixed(1) : '-';
                    } else if (['roce', 'roe', 'dividend_yield', 'fcf_yield', 'promoter_holding'].includes(col.key as string)) {
                      displayVal = `${rawVal.toFixed(1)}%`;
                    } else if (col.key === 'debt_to_equity') {
                      displayVal = rawVal.toFixed(2);
                    } else if (col.key === 'piotroski_score') {
                      displayVal = (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                            rawVal >= 8
                              ? 'bg-apple-green-subtle text-apple-green'
                              : rawVal <= 3
                              ? 'bg-apple-red-subtle text-apple-red'
                              : 'bg-apple-subtle text-apple-muted'
                          }`}
                        >
                          {rawVal}/9
                        </span>
                      );
                    }

                    return (
                      <td
                        key={col.key as string}
                        className={`py-3 px-3 text-xs font-mono text-apple-primary ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
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
      <div className="p-4 border-t border-apple-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-apple-muted bg-apple-subtle">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-apple-card text-xs px-2 py-1 rounded-lg border border-apple-border text-apple-primary"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>rows per page</span>
          <span>•</span>
          <span>
            Showing {sortedStocks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedStocks.length)} of {sortedStocks.length} results
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono">
            Page {currentPage} of {totalPages}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg bg-apple-card hover:bg-apple-surface-active disabled:opacity-30 text-apple-secondary border border-apple-border"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg bg-apple-card hover:bg-apple-surface-active disabled:opacity-30 text-apple-secondary border border-apple-border"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Column Customizer Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-apple-card w-full max-w-md rounded-3xl border border-apple shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-apple-primary flex items-center gap-2 font-display">
                <Sliders className="w-4 h-4 text-apple-blue" />
                Configure Table Columns
              </h3>
              <button
                onClick={() => setShowColumnModal(false)}
                className="text-apple-muted hover:text-apple-primary text-xs"
              >
                Done
              </button>
            </div>

            <p className="text-xs text-apple-muted mb-4">
              Select the financial metrics to show on your screen results table.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {columns.map((col) => (
                <div
                  key={col.key as string}
                  onClick={() => toggleColumn(col.key as string)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all ${
                    col.visible
                      ? 'bg-apple-blue-subtle border-apple-blue/30 text-apple-primary'
                      : 'bg-apple-subtle border-apple-border text-apple-muted hover:border-apple-border-strong'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                        col.visible
                          ? 'bg-apple-blue border-apple-blue text-white'
                          : 'border-apple-border bg-transparent'
                      }`}
                    >
                      {col.visible && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-xs font-medium">{col.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-apple-muted uppercase">
                    {col.unit}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowColumnModal(false)}
                className="px-5 py-2 rounded-xl bg-apple-blue hover:opacity-90 text-white text-xs font-semibold shadow-sm transition-all"
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
