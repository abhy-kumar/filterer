import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, Download, Columns3, Search, ChevronLeft, ChevronRight, Check, X, LayoutGrid, TableProperties } from 'lucide-react';
import { Stock } from '../types/stock';
import { stockPath } from '../lib/routes';
import { getMetric } from '../engine/metricsDictionary';
import { NOT_REPORTED, crore, isReported, price, signClass, compactNumber } from '../lib/format';

interface ColumnConfig {
  key: string;
  label: string;
  /** Right for figures, centre for scores, left for text. */
  align: 'left' | 'right' | 'center';
  render: (stock: Stock) => React.ReactNode;
  /** Low is better, so the first click sorts ascending. */
  ascendingFirst?: boolean;
}

const COLUMNS: ColumnConfig[] = [
  { key: 'current_price', label: 'Price', align: 'right', render: (s) => price(s.current_price) },
  {
    key: 'change_pct',
    label: 'Day',
    align: 'right',
    render: (s) =>
      isReported(s.change_pct) ? (
        <span className={signClass(s.change_pct)}>
          {s.change_pct >= 0 ? '+' : ''}
          {s.change_pct.toFixed(2)}%
        </span>
      ) : (
        NOT_REPORTED
      ),
  },
  { key: 'market_cap', label: 'Mkt cap', align: 'right', render: (s) => crore(s.market_cap) },
  { key: 'pe_ratio', label: 'P/E', align: 'right', ascendingFirst: true, render: (s) => (isReported(s.pe_ratio) ? s.pe_ratio.toFixed(1) : NOT_REPORTED) },
  { key: 'roce', label: 'ROCE', align: 'right', render: (s) => (isReported(s.roce) ? `${s.roce.toFixed(1)}%` : NOT_REPORTED) },
  { key: 'roe', label: 'ROE', align: 'right', render: (s) => (isReported(s.roe) ? `${s.roe.toFixed(1)}%` : NOT_REPORTED) },
  { key: 'debt_to_equity', label: 'D/E', align: 'right', ascendingFirst: true, render: (s) => (isReported(s.debt_to_equity) ? s.debt_to_equity.toFixed(2) : NOT_REPORTED) },
  {
    key: 'sales_growth_3y',
    label: 'Sales 3Y',
    align: 'right',
    render: (s) =>
      isReported(s.sales_growth_3y) ? (
        <span className={signClass(s.sales_growth_3y)}>{s.sales_growth_3y.toFixed(1)}%</span>
      ) : (
        NOT_REPORTED
      ),
  },
  {
    key: 'profit_growth_3y',
    label: 'Profit 3Y',
    align: 'right',
    render: (s) =>
      isReported(s.profit_growth_3y) ? (
        <span className={signClass(s.profit_growth_3y)}>{s.profit_growth_3y.toFixed(1)}%</span>
      ) : (
        NOT_REPORTED
      ),
  },
  { key: 'dividend_yield', label: 'Div yld', align: 'right', render: (s) => (isReported(s.dividend_yield) ? `${s.dividend_yield.toFixed(2)}%` : NOT_REPORTED) },
  {
    key: 'piotroski_score',
    label: 'F-score',
    align: 'center',
    render: (s) =>
      isReported(s.piotroski_score) ? (
        <span className={s.piotroski_score >= 8 ? 'num-pos' : s.piotroski_score <= 3 ? 'num-neg' : ''}>
          {s.piotroski_score}
          <span className="text-apple-faint">/9</span>
        </span>
      ) : (
        NOT_REPORTED
      ),
  },
  { key: 'opm', label: 'OPM', align: 'right', render: (s) => (isReported(s.opm) ? `${s.opm.toFixed(1)}%` : NOT_REPORTED) },
  { key: 'rsi_14', label: 'RSI', align: 'right', render: (s) => (isReported(s.rsi_14) ? s.rsi_14.toFixed(0) : NOT_REPORTED) },
  { key: 'pb_ratio', label: 'P/B', align: 'right', ascendingFirst: true, render: (s) => (isReported(s.pb_ratio) ? s.pb_ratio.toFixed(2) : NOT_REPORTED) },
  { key: 'peg_ratio', label: 'PEG', align: 'right', ascendingFirst: true, render: (s) => (isReported(s.peg_ratio) ? s.peg_ratio.toFixed(2) : NOT_REPORTED) },
  { key: 'fcf_yield', label: 'FCF yld', align: 'right', render: (s) => (isReported(s.fcf_yield) ? <span className={signClass(s.fcf_yield)}>{s.fcf_yield.toFixed(1)}%</span> : NOT_REPORTED) },
  { key: 'promoter_holding', label: 'Promoter', align: 'right', render: (s) => (isReported(s.promoter_holding) ? `${s.promoter_holding.toFixed(1)}%` : NOT_REPORTED) },
  { key: 'volume', label: 'Volume', align: 'right', render: (s) => compactNumber(s.volume) },
  { key: 'distance_52w_high', label: 'From high', align: 'right', render: (s) => (isReported(s.distance_52w_high) ? <span className={signClass(s.distance_52w_high)}>{s.distance_52w_high.toFixed(1)}%</span> : NOT_REPORTED) },
];

const DEFAULT_VISIBLE = [
  'current_price', 'change_pct', 'market_cap', 'pe_ratio', 'roce', 'roe',
  'debt_to_equity', 'sales_growth_3y', 'profit_growth_3y', 'dividend_yield', 'piotroski_score',
];

const VISIBLE_KEY = 'filterer_visible_columns';
const PAGE_SIZE_KEY = 'filterer_page_size';
const VIEW_MODE_KEY = 'filterer_view_mode';

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

interface ScreenResultsTableProps {
  stocks: Stock[];
  onExportCSV?: () => void;
  /** Columns to pin on, so a screen shows what it filtered on. */
  emphasise?: string[];
}

export const ScreenResultsTable: React.FC<ScreenResultsTableProps> = ({ stocks, onExportCSV, emphasise = [] }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    const stored = readStored<'cards' | 'table' | null>(VIEW_MODE_KEY, null);
    if (stored) return stored;
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'cards';
    return 'table';
  });
  const [searchFilter, setSearchFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [sortKey, setSortKey] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => readStored(PAGE_SIZE_KEY, 25));
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => readStored(VISIBLE_KEY, DEFAULT_VISIBLE));
  const [isScrolled, setIsScrolled] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(VIEW_MODE_KEY, JSON.stringify(viewMode)); } catch { /* private mode */ }
  }, [viewMode]);


  // Columns the active query filtered on are worth seeing without hunting for
  // them in the picker.
  useEffect(() => {
    if (!emphasise.length) return;
    setVisibleKeys((prev) => {
      const additions = emphasise.filter((k) => COLUMNS.some((c) => c.key === k) && !prev.includes(k));
      return additions.length ? [...prev, ...additions] : prev;
    });
  }, [emphasise.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try { localStorage.setItem(VISIBLE_KEY, JSON.stringify(visibleKeys)); } catch { /* private mode */ }
  }, [visibleKeys]);

  useEffect(() => {
    try { localStorage.setItem(PAGE_SIZE_KEY, JSON.stringify(pageSize)); } catch { /* private mode */ }
  }, [pageSize]);

  const sectors = useMemo(() => {
    const set = new Set(stocks.map((s) => s.sector).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [stocks]);

  const industries = useMemo(() => {
    const pool = sectorFilter === 'All' ? stocks : stocks.filter((s) => s.sector === sectorFilter);
    const set = new Set(pool.map((s) => s.industry).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [stocks, sectorFilter]);

  // A new result set has to reset the page, or a screen that matches five
  // companies while the reader sits on page three renders an empty table.
  useEffect(() => {
    setCurrentPage(1);
  }, [stocks, searchFilter, sectorFilter, industryFilter, sortKey, sortOrder, pageSize]);

  useEffect(() => {
    if (sectorFilter !== 'All' && !sectors.includes(sectorFilter)) setSectorFilter('All');
  }, [sectors, sectorFilter]);

  useEffect(() => {
    if (industryFilter !== 'All' && !industries.includes(industryFilter)) setIndustryFilter('All');
  }, [industries, industryFilter]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder(COLUMNS.find((c) => c.key === key)?.ascendingFirst ? 'asc' : 'desc');
    }
  };

  const filteredStocks = useMemo(() => {
    const needle = searchFilter.trim().toLowerCase();
    return stocks.filter((stock) => {
      const matchSearch =
        !needle ||
        stock.name.toLowerCase().includes(needle) ||
        stock.symbol.toLowerCase().includes(needle);
      const matchSector = sectorFilter === 'All' || stock.sector === sectorFilter;
      const matchIndustry = industryFilter === 'All' || stock.industry === industryFilter;
      return matchSearch && matchSector && matchIndustry;
    });
  }, [stocks, searchFilter, sectorFilter, industryFilter]);

  const sortedStocks = useMemo(() => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    return [...filteredStocks].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey];
      const bv = (b as unknown as Record<string, unknown>)[sortKey];

      if (typeof av === 'string' || typeof bv === 'string') {
        return dir * String(av ?? '').localeCompare(String(bv ?? ''));
      }

      // Unreported figures sort to the bottom in both directions, rather than
      // being treated as negative infinity and topping the ascending sort.
      const an = typeof av === 'number' && Number.isFinite(av) ? av : null;
      const bn = typeof bv === 'number' && Number.isFinite(bv) ? bv : null;
      if (an === null && bn === null) return 0;
      if (an === null) return 1;
      if (bn === null) return -1;
      return dir * (an - bn);
    });
  }, [filteredStocks, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedStocks.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const paginatedStocks = useMemo(
    () => sortedStocks.slice((page - 1) * pageSize, page * pageSize),
    [sortedStocks, page, pageSize]
  );

  const visibleColumns = useMemo(
    () => COLUMNS.filter((c) => visibleKeys.includes(c.key)),
    [visibleKeys]
  );

  useEffect(() => {
    if (!showColumnPicker) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [showColumnPicker]);

  const onScroll = useCallback(() => {
    setIsScrolled((scrollRef.current?.scrollLeft ?? 0) > 2);
  }, []);

  const toggleColumn = (key: string) =>
    setVisibleKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <div className="apple-card overflow-hidden">
      {/* Filter bar */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-apple-border flex flex-wrap items-center gap-2 sm:gap-2.5">
        <div className="relative flex-1 min-w-[150px] sm:min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-apple-faint pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter results"
            className="apple-input w-full text-caption1 pl-8 pr-7 h-8"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-apple-faint hover:text-apple-primary"
              aria-label="Clear filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile sort selector */}
        <select
          value={`${sortKey}-${sortOrder}`}
          onChange={(e) => {
            const [k, o] = e.target.value.split('-');
            setSortKey(k);
            setSortOrder(o as 'asc' | 'desc');
          }}
          className="apple-input text-caption1 px-2 h-8 text-apple-secondary sm:hidden"
          title="Sort results"
        >
          <option value="market_cap-desc">Mkt Cap: High → Low</option>
          <option value="market_cap-asc">Mkt Cap: Low → High</option>
          <option value="current_price-desc">Price: High → Low</option>
          <option value="current_price-asc">Price: Low → High</option>
          <option value="change_pct-desc">Day Gainers</option>
          <option value="change_pct-asc">Day Losers</option>
          <option value="pe_ratio-asc">P/E: Low → High</option>
          <option value="pe_ratio-desc">P/E: High → Low</option>
          <option value="roce-desc">ROCE: High → Low</option>
          <option value="roe-desc">ROE: High → Low</option>
        </select>

        <select
          value={sectorFilter}
          onChange={(e) => {
            setSectorFilter(e.target.value);
            setIndustryFilter('All');
          }}
          className="apple-input text-caption1 px-2.5 h-8 text-apple-secondary hidden sm:inline-block"
          title="Filter by sector"
        >
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'All sectors' : s}
            </option>
          ))}
        </select>

        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="apple-input text-caption1 px-2.5 h-8 text-apple-secondary max-w-[200px] hidden md:inline-block"
          title="Filter by industry"
        >
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind === 'All' ? 'All industries' : ind}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* View mode toggle */}
          <div className="apple-segmented">
            <button
              onClick={() => setViewMode('cards')}
              className={`apple-segmented-item flex items-center gap-1 text-caption1 py-1 px-2 sm:px-2.5 ${
                viewMode === 'cards' ? 'active' : ''
              }`}
              title="Cards view"
              aria-label="Cards view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`apple-segmented-item flex items-center gap-1 text-caption1 py-1 px-2 sm:px-2.5 ${
                viewMode === 'table' ? 'active' : ''
              }`}
              title="Table view"
              aria-label="Table view"
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button onClick={() => setShowColumnPicker(true)} className="apple-btn apple-btn-secondary h-8 px-2 sm:px-3">
            <Columns3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Columns</span>
            <span className="text-apple-faint num text-caption2 sm:text-caption1">{visibleColumns.length}</span>
          </button>
          {onExportCSV && (
            <button onClick={onExportCSV} className="apple-btn apple-btn-secondary h-8 px-2 sm:px-3" disabled={!sortedStocks.length}>
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' ? (
        <div className="p-3 sm:p-4">
          {paginatedStocks.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-subheadline text-apple-secondary">
                {stocks.length === 0
                  ? 'No companies match your query conditions.'
                  : 'No companies match the current search, sector, or industry filter.'}
              </p>
              {stocks.length > 0 && (
                <button
                  onClick={() => {
                    setSearchFilter('');
                    setSectorFilter('All');
                    setIndustryFilter('All');
                  }}
                  className="mt-3 text-caption1 font-semibold text-apple-blue hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedStocks.map((stock) => {
                const isPositive = (stock.change_pct ?? 0) >= 0;
                return (
                  <div
                    key={stock.symbol}
                    onClick={() => navigate(stockPath(stock.symbol))}
                    className="apple-card p-3.5 sm:p-4 hover:border-apple-border-strong hover:bg-apple-surface transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-subheadline font-bold text-apple-blue group-hover:underline">
                              {stock.symbol}
                            </span>
                            <span className="text-caption1 text-apple-muted truncate max-w-[150px]">
                              {stock.name}
                            </span>
                          </div>
                          <div className="text-caption2 text-apple-faint truncate mt-0.5">
                            {stock.sector} {stock.industry ? `· ${stock.industry}` : ''}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="num text-subheadline font-bold text-apple-primary">
                            {price(stock.current_price)}
                          </div>
                          <div className={`num text-caption2 font-semibold ${signClass(stock.change_pct)}`}>
                            {isPositive ? '+' : ''}{stock.change_pct?.toFixed(2) ?? '0.00'}%
                          </div>
                        </div>
                      </div>

                      {/* Key metrics grid */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-apple-border-subtle text-caption1">
                        <div>
                          <span className="text-caption2 text-apple-muted block">Mkt Cap</span>
                          <span className="num font-semibold text-apple-primary">{crore(stock.market_cap)}</span>
                        </div>
                        <div>
                          <span className="text-caption2 text-apple-muted block">P/E</span>
                          <span className="num font-semibold text-apple-primary">
                            {isReported(stock.pe_ratio) ? stock.pe_ratio.toFixed(1) : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-caption2 text-apple-muted block">ROCE</span>
                          <span className="num font-semibold text-apple-primary">
                            {isReported(stock.roce) ? `${stock.roce.toFixed(1)}%` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-caption2 text-apple-muted block">ROE</span>
                          <span className="num font-semibold text-apple-primary">
                            {isReported(stock.roe) ? `${stock.roe.toFixed(1)}%` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-caption2 text-apple-muted block">D/E</span>
                          <span className="num font-semibold text-apple-primary">
                            {isReported(stock.debt_to_equity) ? stock.debt_to_equity.toFixed(2) : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-caption2 text-apple-muted block">Sales 3Y</span>
                          <span className={`num font-semibold ${signClass(stock.sales_growth_3y)}`}>
                            {isReported(stock.sales_growth_3y) ? `${stock.sales_growth_3y.toFixed(1)}%` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div ref={scrollRef} onScroll={onScroll} className={`overflow-x-auto ${isScrolled ? 'is-scrolled' : ''}`}>
          <table className="apple-table">
            <thead>
              <tr>
                <th className="apple-sticky-col text-left min-w-[125px] sm:min-w-[210px]">Company</th>
                {visibleColumns.map((col) => {
                  const isSorted = sortKey === col.key;
                  const metric = getMetric(col.key);
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      title={metric?.description}
                      className={`cursor-pointer transition-colors hover:text-apple-primary ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      } ${isSorted ? 'text-apple-primary' : ''}`}
                    >
                      <span
                        className={`inline-flex items-center gap-1 ${
                          col.align === 'right' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        {isSorted &&
                          (sortOrder === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-apple-blue" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-apple-blue" />
                          ))}
                        {col.label}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedStocks.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="py-14 text-center">
                    <p className="text-subheadline text-apple-secondary">
                      {stocks.length === 0
                        ? 'No companies match your query conditions.'
                        : 'No companies match the current search, sector, or industry filter.'}
                    </p>
                    {stocks.length > 0 && (
                      <button
                        onClick={() => {
                          setSearchFilter('');
                          setSectorFilter('All');
                          setIndustryFilter('All');
                        }}
                        className="mt-3 text-caption1 font-semibold text-apple-blue hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedStocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    onClick={() => navigate(stockPath(stock.symbol))}
                    className="cursor-pointer"
                  >
                    <td className="apple-sticky-col">
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
                        <span className="font-mono text-caption1 font-semibold text-apple-blue">{stock.symbol}</span>
                        <span className="text-caption2 sm:text-caption1 text-apple-muted truncate max-w-[105px] sm:max-w-[140px]">
                          {stock.name}
                        </span>
                      </div>
                    </td>
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className={`num ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {col.render(stock)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}


      {/* Pagination */}
      <div className="px-4 py-2.5 border-t border-apple-border flex flex-wrap items-center justify-between gap-3 text-caption1 text-apple-muted">
        <span>
          {sortedStocks.length === 0
            ? 'No rows'
            : `${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, sortedStocks.length)} of ${sortedStocks.length}`}
        </span>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5">
            <span className="hidden sm:inline">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="apple-input text-caption1 px-1.5 py-0.5"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="apple-btn apple-btn-quiet p-1"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="num px-1">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="apple-btn apple-btn-quiet p-1"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {showColumnPicker &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowColumnPicker(false)}
          >
            <div
              className="apple-card w-full max-w-sm p-5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-subheadline font-semibold text-apple-primary font-display">Columns</h3>
                <button
                  onClick={() => setVisibleKeys(DEFAULT_VISIBLE)}
                  className="text-caption1 text-apple-blue hover:underline"
                >
                  Reset
                </button>
              </div>
              <p className="text-caption1 text-apple-muted mb-4">Your selection is remembered on this device.</p>

              <div className="grid grid-cols-2 gap-1 max-h-72 overflow-y-auto -mr-2 pr-2">
                {COLUMNS.map((col) => {
                  const on = visibleKeys.includes(col.key);
                  return (
                    <button
                      key={col.key}
                      onClick={() => toggleColumn(col.key)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-caption1 text-left transition-colors ${
                        on ? 'text-apple-primary bg-apple-blue-subtle' : 'text-apple-muted hover:bg-apple-surface-hover'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                          on ? 'bg-apple-blue border-apple-blue text-white' : 'border-apple-border'
                        }`}
                      >
                        {on && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                      </span>
                      {col.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex justify-end">
                <button onClick={() => setShowColumnPicker(false)} className="apple-btn apple-btn-primary">
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
