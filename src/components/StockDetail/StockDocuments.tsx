import React from 'react';
import { ExternalLink, Search } from 'lucide-react';
import type { Stock } from '../../types/stock';

/**
 * Where to read the filings.
 *
 * This app does not host documents, and the previous version papered over that
 * by presenting Google searches as "FY 2023-24 Annual Report — Official Filing
 * PDF". Those titles named documents nobody had checked existed, and the BSE
 * links fell back to scrip code 532174 whenever a company had none, sending
 * the reader to a completely different company's filings.
 *
 * Every link below goes to a real index page for this specific company, and
 * the ones that run a web search say so.
 */

interface DocLink {
  title: string;
  source: string;
  url: string;
  isSearch?: boolean;
}

function searchUrl(terms: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(terms)}`;
}

export const StockDocuments: React.FC<{ stock: Stock }> = ({ stock }) => {
  const { bse_code: bseCode, symbol, name, website } = stock;

  const exchange: DocLink[] = [
    ...(bseCode
      ? [
          {
            title: 'Annual reports',
            source: `BSE archive for scrip ${bseCode}`,
            url: `https://www.bseindia.com/corporates/AnnualReport_New.aspx?expandable=0&scrip_cd=${bseCode}`,
          },
          {
            title: 'Corporate announcements',
            source: 'BSE, filed as they happen',
            url: `https://www.bseindia.com/corporates/ann.html?scrip=${bseCode}`,
          },
          {
            title: 'Results and board outcomes',
            source: 'BSE financial results',
            url: `https://www.bseindia.com/corporates/Comp_Resultsnew.aspx?scripcode=${bseCode}`,
          },
        ]
      : []),
    {
      title: 'Quote and filings',
      source: 'NSE India',
      url: `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`,
    },
  ];

  const research: DocLink[] = [
    {
      title: 'Screener.in page',
      source: 'The same company, fuller history',
      url: `https://www.screener.in/company/${encodeURIComponent(symbol)}/consolidated/`,
    },
    ...(website
      ? [
          {
            title: 'Investor relations',
            source: new URL(website).hostname.replace(/^www\./, ''),
            url: website,
          },
        ]
      : []),
    {
      title: 'SEBI intermediaries and orders',
      source: 'SEBI',
      url: 'https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=3&ssid=15&smid=0',
    },
  ];

  const searches: DocLink[] = [
    {
      title: 'Latest annual report',
      source: 'Web search',
      url: searchUrl(`${name} annual report filetype:pdf`),
      isSearch: true,
    },
    {
      title: 'Earnings call transcript',
      source: 'Web search',
      url: searchUrl(`${name} earnings call transcript filetype:pdf`),
      isSearch: true,
    },
    {
      title: 'Investor presentation',
      source: 'Web search',
      url: searchUrl(`${name} investor presentation filetype:pdf`),
      isSearch: true,
    },
    {
      title: 'Credit rating rationale',
      source: 'Web search',
      url: searchUrl(`${name} CRISIL ICRA credit rating rationale`),
      isSearch: true,
    },
  ];

  const group = (heading: string, note: string, links: DocLink[]) => (
    <div className="apple-card p-4 flex flex-col">
      <h3 className="text-xs font-semibold text-apple-primary font-display">{heading}</h3>
      <p className="text-[11px] text-apple-muted mt-0.5 mb-3 leading-relaxed">{note}</p>

      <ul className="space-y-0.5 -mx-2">
        {links.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2.5 px-2 py-1.5 rounded-lg hover:bg-apple-surface-hover transition-colors group"
            >
              {link.isSearch ? (
                <Search className="w-3.5 h-3.5 shrink-0 mt-0.5 text-apple-faint" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 text-apple-faint group-hover:text-apple-blue transition-colors" />
              )}
              <span className="min-w-0">
                <span className="block text-xs text-apple-primary group-hover:text-apple-blue transition-colors">
                  {link.title}
                </span>
                <span className="block text-[11px] text-apple-faint truncate">{link.source}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {group('Exchange filings', 'Primary sources, straight from the exchange.', exchange)}
        {group('Elsewhere', 'Other places this company is covered in depth.', research)}
        {group(
          'Documents',
          'Filterer does not host PDFs. These open a web search for the document.',
          searches
        )}
      </div>

      <p className="text-[11px] text-apple-muted leading-relaxed">
        Exchange pages are indexes rather than direct document links — BSE and NSE both render their archives in
        the browser, so the specific report opens one click further in.
      </p>
    </div>
  );
};
