import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpRight, Bookmark, Search, Users } from 'lucide-react';
import {
  SUPER_INVESTORS_DATA,
  SUPER_INVESTORS_META,
  getConsensusPicks,
  holdingValueCr,
  investorValueCr,
  INVESTOR_COMPANIES,
  type InvestorHolding,
  type SuperInvestor,
} from '../data/superInvestorsData';
import { STOCKS_DATA } from '../data/stocksData';
import { price, signClass } from '../lib/format';
import { stockPath } from '../lib/routes';
import { WatchlistModal } from '../components/WatchlistModal';
import { Footer } from '../components/Footer';
import { LiveBadge } from '../components/LiveBadge';
import { useLiveQuotes } from '../context/LiveQuotesContext';

const FILTERS: Array<{ key: string; label: string; match: (i: SuperInvestor) => boolean }> = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'individual', label: 'Individuals', match: (i) => i.type === 'Individual HNI' || i.type === 'Family Office' },
  { key: 'fund', label: 'Funds and PMS', match: (i) => i.type === 'Institutional / PMS' },
  { key: 'discovered', label: 'Found in filings', match: (i) => i.origin === 'discovered' },
];

const STOCK_BY_SYMBOL = new Map(STOCKS_DATA.map((s) => [s.symbol.toUpperCase(), s]));

const croreLabel = (v: number | null) => (v === null ? '-' : `₹${Math.round(v).toLocaleString('en-IN')}`);

const DeltaCell: React.FC<{ holding: InvestorHolding }> = ({ holding }) => {
  const { delta } = holding;
  if (delta.change === 'new') return <span className="apple-tag num-pos">New</span>;
  if (delta.change === 'increased' || delta.change === 'decreased') {
    const Icon = delta.change === 'increased' ? ArrowUp : ArrowDown;
    return (
      <span
        className={`inline-flex items-center gap-0.5 num text-caption2 font-semibold ${delta.change === 'increased' ? 'num-pos' : 'num-neg'}`}
        title={`From ${delta.previous_quarter_holding?.toFixed(2)}% the quarter before`}
      >
        <Icon className="w-3 h-3" aria-hidden="true" />
        {Math.abs(delta.delta_pct ?? 0).toFixed(2)} pts
      </span>
    );
  }
  return <span className="text-caption2 text-apple-faint">Unchanged</span>;
};

export const SuperInvestorsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKey, setFilterKey] = useState('all');
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | undefined>(SUPER_INVESTORS_DATA[0]?.id);
  const [mobileTab, setMobileTab] = useState<'portfolio' | 'list'>('portfolio');
  const [watchlistModalStock, setWatchlistModalStock] = useState<{ symbol: string; name: string } | null>(null);

  // Ranked at the last bundled prices, so the list does not reshuffle on every tick.
  const investors = useMemo(
    () => SUPER_INVESTORS_DATA.map((inv) => ({ ...inv, valueNowCr: investorValueCr(inv) })).sort((a, b) => b.valueNowCr - a.valueNowCr),
    []
  );

  const filteredInvestors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];
    return investors.filter(
      (inv) =>
        filter.match(inv) &&
        (!q ||
          inv.name.toLowerCase().includes(q) ||
          (inv.alias ?? '').toLowerCase().includes(q) ||
          inv.holdings.some((h) => h.symbol.toLowerCase().includes(q) || h.companyName.toLowerCase().includes(q)))
    );
  }, [investors, searchQuery, filterKey]);

  const selectedInvestor = filteredInvestors.find((inv) => inv.id === selectedInvestorId) ?? filteredInvestors[0];

  const aggregate = useMemo(
    () => ({
      investors: investors.length,
      valueCr: investors.reduce((sum, inv) => sum + inv.valueNowCr, 0),
      companies: new Set(investors.flatMap((i) => i.holdings.map((h) => h.symbol))).size,
    }),
    [investors]
  );

  const consensusPicks = useMemo(() => getConsensusPicks(), []);

  // Live prices only for the portfolio on screen.
  const liveSymbols = useMemo(
    () => (selectedInvestor ? selectedInvestor.holdings.filter((h) => h.in_universe).map((h) => h.symbol) : []),
    [selectedInvestor]
  );
  const liveQuotes = useLiveQuotes(liveSymbols);

  const holdings = useMemo(() => {
    if (!selectedInvestor) return [];
    return selectedInvestor.holdings
      .map((h) => {
        const quote = liveQuotes[h.symbol.toUpperCase()];
        const stock = STOCK_BY_SYMBOL.get(h.symbol.toUpperCase());
        const closing = INVESTOR_COMPANIES[h.symbol]?.price ?? null;
        return {
          ...h,
          quote,
          priceNow: quote?.price ?? stock?.current_price ?? closing,
          priceIsClose: !quote && !stock && closing !== null,
          changePct: quote?.changePct ?? stock?.change_pct ?? null,
          valueCr: holdingValueCr(h, quote?.price),
        };
      })
      .sort((a, b) => (b.valueCr ?? 0) - (a.valueCr ?? 0));
  }, [selectedInvestor, liveQuotes]);

  const portfolioValue = holdings.reduce((sum, h) => sum + (h.valueCr ?? 0), 0);
  const newestQuote = holdings.map((h) => h.quote).filter(Boolean).sort((a, b) => b!.time - a!.time)[0];

  const deltaSummary = useMemo(() => {
    const counts = { new: 0, increased: 0, decreased: 0, unchanged: 0 };
    for (const h of selectedInvestor?.holdings ?? []) {
      if (h.delta.change in counts) counts[h.delta.change as keyof typeof counts]++;
    }
    return counts;
  }, [selectedInvestor]);

  if (!investors.length) {
    return (
      <>
        <main className="flex-1 w-full flex items-center justify-center p-8">
          <div className="apple-card p-8 max-w-md text-center">
            <h1 className="text-headline text-apple-primary font-display">No filings processed yet</h1>
            <p className="text-caption1 text-apple-muted mt-2 leading-relaxed">
              Portfolios are built from exchange shareholding filings. Run{' '}
              <code className="font-mono text-apple-secondary">python -m data_pipeline.nse_filings shareholding</code> and then{' '}
              <code className="font-mono text-apple-secondary">python -m data_pipeline.super_investors</code>.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main className="flex-1 w-full apple-canvas animate-fade-in">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-apple-border pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-apple-blue shrink-0" aria-hidden="true" />
                <h1 className="text-title2 sm:text-title1 text-apple-primary font-display">Super-Investors</h1>
              </div>
              <p className="text-caption1 text-apple-muted mt-1 leading-normal max-w-2xl">
                Stakes of 1% or more, read from the shareholding patterns companies file with NSE
                {SUPER_INVESTORS_META.latestPeriod ? `. Most recent filings: ${SUPER_INVESTORS_META.latestPeriod}.` : '.'}
              </p>
            </div>

            <div className="apple-segmented self-start sm:self-auto overflow-x-auto no-scrollbar max-w-full">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterKey(f.key)}
                  className={`apple-segmented-item text-caption1 whitespace-nowrap ${filterKey === f.key ? 'active' : ''}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <dl className="flex items-center gap-4 sm:gap-6 text-caption1 text-apple-muted flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <dd className="font-semibold text-apple-primary num text-subheadline">{aggregate.investors}</dd>
              <dt>investors</dt>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dd className="font-semibold text-apple-primary num text-subheadline">₹{Math.round(aggregate.valueCr).toLocaleString('en-IN')} Cr</dd>
              <dt>in disclosed stakes</dt>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dd className="font-semibold text-apple-primary num text-subheadline">{aggregate.companies}</dd>
              <dt>companies</dt>
            </div>
          </dl>

          {consensusPicks.length > 0 && (
            <section className="apple-card p-4" aria-labelledby="consensus-heading">
              <h2 id="consensus-heading" className="text-caption1 font-semibold text-apple-primary">
                Held by more than one tracked investor
              </h2>
              <ul className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2.5">
                {consensusPicks.map((pick) => {
                  const body = (
                    <>
                      <span className="font-mono font-semibold text-apple-blue">{pick.symbol}</span>
                      <span className="text-caption2 text-apple-muted num">{pick.investorCount}</span>
                    </>
                  );
                  return (
                    <li key={pick.symbol} className="shrink-0" title={pick.investors.join(', ')}>
                      {pick.inUniverse ? (
                        <Link to={stockPath(pick.symbol)} className="apple-tag text-caption1 hover:border-apple-blue">
                          {body}
                        </Link>
                      ) : (
                        <span className="apple-tag text-caption1">{body}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-apple-faint pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search investors, companies or symbols"
              aria-label="Search investors, companies or symbols"
              className="apple-input text-caption1 pl-9 pr-4 h-9 w-full"
            />
          </div>

          <div className="lg:hidden">
            <div className="apple-segmented w-full">
              <button
                type="button"
                onClick={() => setMobileTab('portfolio')}
                className={`apple-segmented-item flex-1 justify-center text-caption1 ${mobileTab === 'portfolio' ? 'active' : ''}`}
              >
                Portfolio
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('list')}
                className={`apple-segmented-item flex-1 justify-center text-caption1 ${mobileTab === 'list' ? 'active' : ''}`}
              >
                Investors ({filteredInvestors.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <ul
              className={`lg:col-span-4 space-y-2 lg:max-h-[860px] lg:overflow-y-auto no-scrollbar pr-1 ${mobileTab === 'list' ? 'block' : 'hidden lg:block'}`}
              aria-label="Investors"
            >
              {filteredInvestors.length === 0 && (
                <li className="text-caption1 text-apple-muted px-1">No investors match.</li>
              )}
              {filteredInvestors.map((inv) => {
                const isSelected = inv.id === selectedInvestor?.id;
                return (
                  <li key={inv.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvestorId(inv.id);
                        setMobileTab('portfolio');
                      }}
                      aria-current={isSelected}
                      className={`apple-card w-full text-left p-3.5 transition-colors ${isSelected ? 'border-apple-blue ring-1 ring-apple-blue/25' : 'hover:border-apple-border-strong'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-caption1 shrink-0 ${isSelected ? 'bg-apple-blue text-white' : 'bg-apple-surface-active text-apple-primary'}`}
                            aria-hidden="true"
                          >
                            {inv.avatar_initials}
                          </span>
                          <div className="min-w-0">
                            <div className="text-footnote font-semibold text-apple-primary truncate">{inv.name}</div>
                            <div className="text-caption2 text-apple-muted truncate">
                              {inv.origin === 'discovered' ? 'Found in filings' : inv.alias || inv.type}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-caption1 font-semibold num text-apple-primary">₹{inv.valueNowCr.toLocaleString('en-IN')} Cr</div>
                          <div className="text-caption2 text-apple-faint num">
                            {inv.holdings.length} {inv.holdings.length === 1 ? 'stake' : 'stakes'}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className={`lg:col-span-8 ${mobileTab === 'portfolio' ? 'block' : 'hidden lg:block'}`}>
              {selectedInvestor && (
                <article className="apple-card p-4 sm:p-6 space-y-5">
                  <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-apple-border pb-5">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-title2 sm:text-title1 text-apple-primary font-display">{selectedInvestor.name}</h2>
                        <span className="apple-tag">{selectedInvestor.origin === 'discovered' ? 'Found in filings' : selectedInvestor.type}</span>
                      </div>
                      {selectedInvestor.alias && <p className="text-caption1 text-apple-muted">{selectedInvestor.alias}</p>}
                      <p className="text-caption1 text-apple-secondary max-w-2xl leading-relaxed">{selectedInvestor.description}</p>
                      {selectedInvestor.top_sectors.length > 0 && (
                        <p className="text-caption2 text-apple-muted pt-0.5">
                          Largest sectors by value: {selectedInvestor.top_sectors.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="apple-well p-3.5 shrink-0 sm:text-right">
                      <div className="text-caption2 text-apple-muted">Value of disclosed stakes</div>
                      <div className="text-title3 font-display tabular-nums text-apple-primary mt-0.5">
                        ₹{Math.round(portfolioValue).toLocaleString('en-IN')} Cr
                      </div>
                      <LiveBadge quote={newestQuote} className="mt-1" />
                    </div>
                  </header>

                  <div className="flex items-center gap-2 flex-wrap text-caption2">
                    <span className="text-apple-muted font-semibold">Since the previous filing:</span>
                    {deltaSummary.new > 0 && <span className="apple-tag num-pos">{deltaSummary.new} new</span>}
                    {deltaSummary.increased > 0 && <span className="apple-tag num-pos">{deltaSummary.increased} raised</span>}
                    {deltaSummary.decreased > 0 && <span className="apple-tag num-neg">{deltaSummary.decreased} trimmed</span>}
                    {deltaSummary.unchanged > 0 && <span className="apple-tag">{deltaSummary.unchanged} unchanged</span>}
                    {selectedInvestor.exits.length > 0 && (
                      <span className="apple-tag num-neg">{selectedInvestor.exits.length} no longer disclosed</span>
                    )}
                  </div>

                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="apple-table">
                      <thead>
                        <tr>
                          <th className="apple-sticky-col text-left min-w-[140px] sm:min-w-[220px]">Company</th>
                          <th className="text-right">Price</th>
                          <th className="text-right">Day</th>
                          <th className="text-right">Stake</th>
                          <th className="text-right">Value (₹ Cr)</th>
                          <th className="text-right">Filed</th>
                          <th className="text-right">Change</th>
                          <th className="text-right">
                            <span className="sr-only">Watchlist</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((h) => (
                          <tr key={h.symbol}>
                            <td className="apple-sticky-col">
                              <div className="flex items-center gap-1.5">
                                {h.in_universe ? (
                                  <Link
                                    to={stockPath(h.symbol)}
                                    className="font-mono text-caption1 font-semibold text-apple-blue hover:underline inline-flex items-center gap-0.5"
                                  >
                                    {h.symbol}
                                    <ArrowUpRight className="w-3 h-3 text-apple-faint" aria-hidden="true" />
                                  </Link>
                                ) : (
                                  <span className="font-mono text-caption1 font-semibold text-apple-secondary" title="Outside the Nifty 500, so there is no company page">
                                    {h.symbol}
                                  </span>
                                )}
                                {h.role === 'promoter' && <span className="apple-tag">Promoter</span>}
                              </div>
                              <div className="text-caption2 text-apple-muted truncate max-w-[130px] sm:max-w-[220px]" title={`Filed as: ${h.filed_names.join('; ')}`}>
                                {h.companyName}
                              </div>
                            </td>
                            <td className="text-right num text-caption1">
                              {h.priceNow ? price(h.priceNow) : '-'}
                              {h.priceIsClose && SUPER_INVESTORS_META.priceDate && (
                                <div className="text-caption2 text-apple-faint">close, {SUPER_INVESTORS_META.priceDate}</div>
                              )}
                            </td>
                            <td className={`text-right num text-caption1 ${h.changePct === null ? 'num-nil' : signClass(h.changePct)}`}>
                              {h.changePct === null ? '-' : `${h.changePct >= 0 ? '+' : ''}${h.changePct.toFixed(2)}%`}
                            </td>
                            <td className="text-right num text-caption1 font-semibold text-apple-primary">{h.holding_pct.toFixed(2)}%</td>
                            <td className="text-right num text-caption1 font-semibold text-apple-primary">{croreLabel(h.valueCr)}</td>
                            <td className="text-right num text-caption2 text-apple-muted">{h.quarter}</td>
                            <td className="text-right">
                              <DeltaCell holding={h} />
                            </td>
                            <td className="text-right">
                              {h.in_universe && (
                                <button
                                  type="button"
                                  onClick={() => setWatchlistModalStock({ symbol: h.symbol, name: h.companyName })}
                                  className="apple-btn apple-btn-quiet apple-btn-sm"
                                  aria-label={`Add ${h.symbol} to a watchlist`}
                                >
                                  <Bookmark className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedInvestor.exits.length > 0 && (
                    <section aria-labelledby="exits-heading" className="pt-1">
                      <h3 id="exits-heading" className="text-eyebrow">No longer disclosed</h3>
                      <p className="text-caption2 text-apple-faint mt-1">
                        Named in the previous filing but not the latest: sold, or cut below the 1% disclosure threshold.
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {selectedInvestor.exits.map((e) => (
                          <li key={e.symbol} className="apple-tag" title={e.companyName}>
                            <span className="font-mono">{e.symbol}</span>
                            <span className="num text-apple-muted">
                              {e.previous_quarter_holding.toFixed(2)}% in {e.quarter}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <p className="text-caption2 text-apple-faint border-t border-apple-border-subtle pt-3 leading-relaxed">
                    Companies only have to name holders of 1% or more, and stakes are matched to{' '}
                    {selectedInvestor.origin === 'discovered' ? 'this exact filed name' : 'the names this investor is known to file under'}, so
                    holdings through other entities are not counted. Treat the value as a floor, not a total. Source:{' '}
                    {SUPER_INVESTORS_META.source}.
                  </p>
                </article>
              )}
            </div>
          </div>
        </div>
      </main>

      {watchlistModalStock && (
        <WatchlistModal
          isOpen={true}
          onClose={() => setWatchlistModalStock(null)}
          symbol={watchlistModalStock.symbol}
          stockName={watchlistModalStock.name}
        />
      )}

      <Footer />
    </>
  );
};

export default SuperInvestorsPage;
